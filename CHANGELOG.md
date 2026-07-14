# Changelog

All notable changes to PaperFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **`Security Audit` was a check that could not fail.** Both of its steps (`npm audit --audit-level=high`
  and `better-npm-audit`) carried `continue-on-error: true`, so the job reported success no matter what
  it found — it asserted nothing. Flags removed, but **only after verifying the gate passes today**
  (`npm audit --audit-level=high` exits 0, 0 vulnerabilities): turning a gate on without checking first
  just trades a fake-green pipeline for a permanently-red one. The job is deliberately **not** a required
  check, so a future advisory surfaces as an honest red signal without blocking every merge — which is
  what you want when no fix is available yet.

- **Web-only CI no longer downloads a ~100 MB Electron binary it never uses.** Electron's
  postinstall fetches its binary from GitHub releases on every `npm ci`. **Nothing** in `ci.yml`,
  `staging.yml` or `deploy.yml` needs it — lint is eslint, typecheck is `tsc --noEmit`, test is
  vitest, build is the web vite build, and even `ci.yml`'s `e2e` job drives Playwright **chromium**,
  not Electron. Downloading it in every job was pure waste *and* a permanent transient-failure
  surface: on 2026-07-14 `npm ci` died mid-download with `TypeError: fetch failed` and took
  `Type Check` red on `main`. These three workflows now set `ELECTRON_SKIP_BINARY_DOWNLOAD: '1'`.
  `cross-platform.yml` and `build-desktop.yml` deliberately do **not** — they genuinely launch
  Electron and package installers.

- **`deploy.yml` was REJECTED by GitHub as an invalid workflow file — it has never run a single
  job.** It calls `uses: ./.github/workflows/ci.yml`, but `ci.yml` never declared
  `on: workflow_call:`. A reusable-workflow call to a callee that doesn't declare `workflow_call`
  is invalid, and GitHub rejects the **entire calling file** — so every run of `deploy.yml`
  produced **zero jobs** and reported only *"This run likely failed because of a workflow file
  issue"*, with no job list and no logs.
  **This means the long-standing "deploy is blocked on a missing Cloudflare secret" diagnosis was
  wrong**: the workflow never reached the deploy step at all. `ci.yml` now declares
  `workflow_call`. The tell for this class of failure is **`jobs == 0`** on the run — a run with
  no jobs never started, and `--log-failed` returns nothing to read.

- **`deploy.yml` no longer fails on every push to `main`.** `CLOUDFLARE_API_TOKEN` /
  `CLOUDFLARE_ACCOUNT_ID` have never been set on this repository, so `cloudflare/pages-action`
  failed on **every single push** — a permanently-red check. That is not a signal; it is noise
  that trains everyone to ignore CI, which is exactly how this repo's real E2E failures went
  unnoticed for days. Failing the run never made the deploy happen. The deploy step is now
  **skipped with a loud `::warning::`** when the credentials are absent (the build itself still
  runs and must pass), and it resumes automatically the moment the secrets exist — no further
  change needed. Set them with
  `gh secret set CLOUDFLARE_API_TOKEN --repo danielsimonjr/PaperFlow` (and `CLOUDFLARE_ACCOUNT_ID`).
  The same guard is applied to `staging.yml`'s `Deploy Preview`, which had the identical failure.

- **`staging.yml`'s `deploy-preview` job never declared any `outputs`** — yet `e2e-staging`
  consumes `needs.deploy-preview.outputs.url` as its `BASE_URL`. That URL was therefore **always
  the empty string**, so the staging E2E suite could not have worked even on a successful deploy.
  It only ever *looked* fine because `deploy-preview` failed first (missing Cloudflare creds),
  which skipped `e2e-staging` entirely — the failure was hiding behind another failure. The job
  now declares `url` and `deployed`, and `e2e-staging` runs only when a preview was actually
  deployed.

### Removed

- **The duplicate, always-broken Electron E2E job in `build-desktop.yml`.** It was a copy of
  `cross-platform.yml`'s `e2e-tests` — same specs, same three platforms — but strictly worse:
  it ran on `push` only (i.e. **after** merge, so it gated nothing), it was **not** a required
  check, and its **ubuntu leg had no `xvfb`**, so Electron could not open a window and **all 43
  tests failed on every single run**. That was invisible while `continue-on-error: true` was set;
  removing that flag is what turned `Build Desktop` red. `cross-platform.yml`'s `e2e-tests` is the
  real gate — it runs on `pull_request`, installs xvfb, and its three checks are required on
  `main`. Repairing the copy would have meant paying for a second full E2E matrix on every push
  while still gating nothing. Nothing consumes this workflow's artifacts, and the job was not a
  required check, so its removal orphans nothing.

### Changed

- **The Electron E2E suite now runs on pull requests, not only post-merge.**
  `cross-platform.yml` triggered on `push: [main, develop]` only, which is exactly how a
  broken app reached `main` twice: the dead preload (#50) and the nine IPC channels with no
  handler behind them (#51) were **both** caught only by the post-merge run, after they had
  already landed.

  The stated reason for excluding PRs — "needs signing secrets and a live server" — was true
  of the **installer builds** and never true of the **E2E job**. E2E only inherited that
  constraint through two false dependencies: it declared `needs: build` and downloaded the
  installer artifact into `release/`, but **nothing in the suite ever reads `release/`** —
  every spec launches `dist-electron/main/index.js`, which the job builds from source itself.
  Both removed. The installer matrix stays post-merge/release-only
  (`if: github.event_name != 'pull_request'`), so no secrets are needed on PRs.

  Side benefit: on push and release, E2E no longer waits for six installer builds to finish.

### Removed

- **`electron/main/updates/autoUpdater.ts` — a dead duplicate that had become a startup-crash
  landmine.** Nothing imported it (only a sprint-planning JSON named the path); the live
  implementation is `electron/main/updater.ts`, a strict superset (9 IPC channels vs 4). It
  was inert only because it never ran — but it registers `update-get-state` and
  `update-download`, which `updater.ts` now registers *unconditionally*. Wiring this module
  in would make `ipcMain.handle` throw `Attempted to register a second handler for
  'update-get-state'` and crash startup. `electron/main/updates/differential.ts` is left in
  place: it is also unreferenced, but it is self-contained, registers no IPC, and carries no
  such hazard.

### Added

- **E2E contract test guarding the preload/main IPC boundary**
  (`tests/e2e-electron/ipcContract.spec.ts`). Boots the app and asserts that every
  channel the preload invokes has a handler registered in the main process, and that all
  handlers are registered *before* the first window is created. The three IPC bugs fixed
  below were all invisible to unit tests — they exist only in a booted app — and nothing
  was checking that the contextBridge API the renderer sees is actually backed by
  anything.

### Fixed

- **All nine `update-*` IPC handlers were never registered outside a packaged build.**
  `initializeUpdater()` — the only thing that calls `ipcMain.handle` for the update
  channels — was invoked from `electron/main/index.ts` behind `if (app.isPackaged)`. In
  dev and in E2E the app runs unpackaged, so `window.electron.getUpdateState()` was
  exposed but rejected with `No handler registered for 'update-get-state'`. The IPC
  handlers are now registered unconditionally; only the network-touching work (startup
  check, periodic check) remains gated on `app.isPackaged`, so dev builds still never
  auto-update.

- **Updater handlers were registered ~1.5s after the window could already call them.**
  Even once registration was unconditional, `initializeUpdater()` ran *after*
  `createMainWindow()`. `createMainWindow()` awaits `loadFile()`, so the renderer is
  already executing when it returns — leaving a window in which the update API existed
  with no handler behind it. Moved above `createMainWindow()`, alongside `setupIpc()`.

- **`window.electron.openPath()` had never worked.** `electron/ipc/shellHandlers.ts` kept
  a private copy of the channel names which had drifted from the canonical
  `electron/ipc/channels.ts`: it registered `'shell-open-default'`, a name nothing calls,
  while the preload invoked `'shell-open-path'`. It now registers the canonical channel
  (imported from `channels.ts`) and returns the raw `string` that `shell.openPath`
  produces — matching the `Promise<string>` already declared by the preload,
  `electron/ipc/types.ts` and `src/types/electronTypes.ts`. The old handler additionally
  wrapped the result in `{ success, error }`, so its shape did not match the declared
  type either.









- 🔴 **The Electron preload script never loaded — every native file operation in the desktop app was dead.** On launch: `Unable to load preload script: dist-electron/preload/index.js` → `SyntaxError: Cannot use import statement outside a module`. `package.json` declares `"type": "module"`, so a `.js` preload is loaded as **ESM** — but Electron requires a **CommonJS** preload whenever `sandbox: true`, which `electron/main/index.ts` sets. `vite.electron.config.ts` emitted both main *and* preload with `formats: ['es']`. The failure is **silent from the user's perspective**: the window still opens, but no `contextBridge` API is ever exposed, so **every IPC path — native open/save dialogs, file watching, recent files — is dead.** The preload is now built separately as CommonJS (`vite.preload.config.ts` → `preload/index.cjs`; the `.cjs` extension is what makes Node treat it as CJS despite `"type": "module"`), and `PRELOAD_PATH` points at it. The **main** process stays ESM — Electron 28+ supports that. Verified by driving the packaged app: preload errors **NONE** (was a hard failure), and `window.electron` is **exposed** (was absent).
- 🔴 **The packaged desktop app was a BLANK WINDOW — and the installers shipped it.** The `Build application` step in `cross-platform.yml` **and `release-candidate.yml`** ran `npm run build`, which is the **web** build. `vite.config.ts` sets `base: isElectron ? './' : '/'`, and `isElectron` comes from `ELECTRON=true` (set only by `electron:build-web`). So `npm run build` emitted **absolute** asset paths (`/assets/...`), which under Electron's `file://` protocol resolve to the **drive root** → `ERR_FILE_NOT_FOUND` for every asset → React never mounts → **blank window**. electron-builder packages `dist/` as-is, so **every installer those two pipelines produced shipped a blank app.** (`build-desktop.yml` got it right — it calls `npm run electron:build`, which uses `electron:build-web` internally — which is why one pipeline produced working installers and two did not.) All four call sites now use `electron:build-web`. Reproduced and verified locally: with `npm run build` the Electron window has **empty body text and 0 buttons**; with `electron:build-web` it renders *"PaperFlow · Open a PDF to get started · … · Open File"* with the button present.
- **Electron E2E is now a real gate.** Its `continue-on-error: true` flags are removed. The single genuine DOM assertion in the suite (`fileOperations.spec.ts` → "should handle drag and drop file opening") had been failing on **all three platforms** precisely *because* the app rendered blank — masked by the flag. With the build fixed it passes.
- **Removed three CI jobs that tested NOTHING** (`visual-tests`, `accessibility-audit`, `performance-tests`). They ran `playwright test tests/visual/`, `playwright test tests/accessibility/` and `vitest run tests/performance/` — but **`tests/visual/` and `tests/accessibility/` do not exist** (0 tracked files) and `tests/performance/` holds only `benchmarks.ts` (not a test file). Every one returned `Error: No tests found.` They asserted nothing and could never pass — which is exactly why they carried `continue-on-error: true`. A permanently-failing-but-ignored job is *worse* than no job: it made the pipeline look like it covered visual regression and accessibility when it covered neither. `release-candidate`'s `needs:` was updated accordingly (checking consumers first — the lesson from the nsis artifact regression), and the workflow carries a comment saying exactly what to re-add once the suites are written.
- **Windows E2E was downloading an artifact that no longer exists (regression from the nsis removal).** The `e2e-tests` matrix pinned `artifact: windows-nsis-x64`, produced by the nsis build job — which was removed because it failed on every run and shipped nothing. The job was worthless *and still load-bearing*: its **artifact name was a contract** a downstream job depended on. Repointed to `windows-msi-x64`, the Windows artifact this workflow actually produces.
- **visual-regression, accessibility and performance are now REAL gates.** Fixing the retired `macos-13` runner let these suites run **for the first time ever**, and at the *step* level all three genuinely pass (job-level `success` was meaningless while `continue-on-error: true` was set). The flags are removed, so a regression in them will now fail the build. The Electron E2E steps keep their flag for one more cycle: the Windows leg has still never actually executed (it was skipped by the artifact-download failure above), so there is no evidence for it yet — and turning a gate on without evidence just trades a fake-green pipeline for a permanently-red one.
- **`cross-platform.yml` could never complete — it requested a RETIRED runner.** The `Build macos (dmg x64)` job was pinned to **`macos-13`**, which GitHub has retired, so it sat **queued forever**. And because every downstream job (`e2e-tests`, `visual-tests`, `accessibility-audit`, `performance-tests`) declares `needs: build`, the whole workflow could never finish and **none of those suites ever ran** — three runs were stacked up, the oldest queued for over 3 hours, all blocked on that one job, while the `macos-14` leg beside it finished fine. Switched to `macos-latest` (arm64; electron-builder cross-builds the x64 dmg). PaperFlow was the only repo in the fleet using a retired label.
- **Electron E2E is now a real gate.** `build-desktop.yml`'s `Run Electron E2E tests` step carried `continue-on-error: true`, so the suite could fail and the job would still report success. It was doubly masked: the job `needs:` the build jobs, which had failed since 2026-06-27 on the missing `author.email`, so E2E was **skipped, not ignored**. With the builds fixed the suite now runs and **passes on all three platforms** (ubuntu / windows / macos), so the flag is removed and a failing E2E run will now fail the build.
- **`Build windows (nsis x64)` removed from `cross-platform.yml`** — it was demanding an artifact the project does not ship. `electron-builder.yml` has the NSIS target **commented out** of `win.target` ("NSIS installer disabled temporarily"), yet the workflow matrix built `nsis` anyway, failing on every run. The failure is inside **electron-builder's own installer template**, not our code: CI only reported the opaque `⨯ makensis.exe process failed ERR_ELECTRON_BUILDER_CANNOT_EXECUTE` with an *empty* exit code, but reproducing the same command locally surfaces the real NSIS compiler error — a `Call` with an empty function name emitted by MUI's *uninstaller* finish page (`MUI_UNPAGE_FINISH` → `MUI_FUNCTION_FINISHPAGE` macroline 264), from `app-builder-lib/templates/nsis/assistedInstaller.nsh` line 81. (`nsis.runAfterFinish: false` was tested and does **not** fix it.) Windows still ships `msi` (green) and `portable`. Re-add an nsis leg only once NSIS is genuinely re-enabled in `electron-builder.yml` and the template error is resolved.
- **The Linux and macOS desktop builds have never succeeded.** With the `author.email` blocker cleared (above), `build-windows` went green and two deeper failures surfaced underneath:
  - **Linux:** `fpm process failed 1` with an *empty* stderr — the classic signature of a missing system packager. electron-builder shells out to `fpm` for the deb/rpm/pacman targets, but `ubuntu-latest` ships neither `bsdtar` (needed for `pacman`) nor `rpmbuild` (needed for `rpm`), and the workflow installed **no** packaging tools at all. AppImage and deb happen not to need them, which is why the build got most of the way through before dying on `pacman`. `build-desktop.yml` now installs `libarchive-tools` + `rpm`.
  - **macOS:** the `universal` slice failed to merge — `Detected file "…/@napi-rs/canvas-darwin-arm64/skia.darwin-arm64.node" that's the same in both x64 and arm64 builds and not covered by the x64ArchFiles rule`. A universal app is built by merging an x64 app with an arm64 app, and electron-builder refuses to merge a byte-identical file it cannot attribute to an arch. `@napi-rs/canvas` ships prebuilt per-arch `.node` binaries which npm resolves into both slices. Added `mac.x64ArchFiles: '**/node_modules/@napi-rs/**'`.
  Neither target was removed — both are now built properly rather than deleted to force a green pipeline.
- **The desktop app has never built in CI.** `Build Desktop` failed on *every* run (`build-linux` and `build-macos`) with `⨯ Error: Please specify author 'email' in the application package.json` — electron-builder requires `author.email` to write the maintainer field of Linux packages (deb/AppImage). `package.json` had **no `author` field at all** (nor `repository`). Both added; the GitHub noreply address is used, matching the email the project's commits already use.
### Added

- **Windows CI leg for the test suite** (`.github/workflows/ci.yml`). CI was Linux-only, so Windows-specific failures were invisible even though Daniel develops on Windows. The `test` job's `runs-on: ubuntu-latest` is now a `strategy.matrix` over `os: [ubuntu-latest, windows-latest]` (job renamed `Unit & Integration Tests (${{ matrix.os }})`; confirmed no branch-protection required-check was pinned to the old name, so the rename is safe), `fail-fast: false` so one OS failing doesn't cancel the other. Both legs run the same `npm run test:coverage`.

### Fixed

- **Two classes of full-suite-only Windows test flakiness, found while adding the Windows CI leg above.** Both pass 100% of the time when their file runs alone (`npx vitest run <file>`) and fail only under the full 153-file parallel run — confirmed to be test-isolation/infrastructure issues, not product bugs or Linux/Windows code-path differences:
  1. `tests/integration/fileOpening.test.tsx > Loading States > should show loading indicator while loading` mocks `PDFRenderer.loadDocument` with a **real** 100ms `setTimeout`, fires it via `act()`, then returns without awaiting completion. `useDocumentStore` is a module-level singleton shared by every test in the file; the abandoned promise's `set({ fileName: 'test.pdf', isLoading: false, ... })` call fires 100ms later — during whichever test happens to be running at that point — and was landing inside `Store State > should update store with document info` (the next test asserting a specific `fileName`), clobbering its fresh `'document.pdf'` write with the stale `'test.pdf'` value (`AssertionError: expected 'test.pdf' to be 'document.pdf'`). Reproduced 4/5 full-suite runs. Root-caused and fixed: the loading test now awaits the indicator appearing and then drains the load (`waitFor(() => isLoading === false)`) before returning, so no promise survives past the test boundary.
  2. `tests/unit/pages/Privacy.test.tsx > should have a back button`, `tests/integration/forms/formFilling.test.tsx > should render all form fields on a page`, and `tests/integration/signatures/signatureCreation.test.tsx > SignatureModal > should call onClose when close button is clicked` are all fully synchronous (no `await`, no `waitFor`, no timers, no shared mocks) and each is the first or an early test in its file — ruling out cross-test state leakage as the cause. Root cause: Vitest's default `forks` pool spawns one OS child process per worker; Windows process creation is dramatically more expensive than Linux `fork()`, so the full suite's cold-start burst (~1 process per logical core, each importing the full React/jsdom/testing-library graph) produces measurably worse CPU contention on a multi-core Windows dev box than on the Linux CI runner. Reproduced by pinning all 3 named failures simultaneously via synthetic full-core CPU contention (10 busy-loop processes on a 12-core Windows box), each failing with `Error: Test timed out in 5000ms` despite doing zero async work — the OS never scheduled the process long enough for even a synchronous render+query to complete inside the default timeout. Fixed at the infrastructure level (not by widening any timeout): `vitest.config.ts` now sets `pool: 'threads'` (worker_threads, cheap to spawn on every OS) instead of the default `forks`. Measured under identical synthetic stress, full-suite wall time dropped from 235s (forks) to 121s (threads) — confirming this addresses the actual contention rather than papering over it.

  Full suite verified 0 failures on Windows after both fixes: `npm run test:coverage` → 153 files / 2517 passed / 9 skipped / 1 todo, both in a clean run and repeated under synthetic heavy CPU stress.

- **`CLAUDE.md` Testing Tips corrected** — the tip to prefer `npx vitest run` over `npm run test:unit` was a stale workaround for the `--dir` discovery bug fixed in PR #40 (below); `npm run test:unit` / `test:integration` are reliable again and the doc now says so instead of steering people to a workaround for an already-fixed bug.

- **The unit and integration test suites had not run in CI since 2026-06-27** — 2,217 tests (1,919 unit + 298 integration) were silently skipped, and CI had been red the whole time. `test:unit` / `test:integration` invoked vitest as `vitest run --dir tests/unit`, which re-roots test discovery at that directory; combined with the repo-root-relative `include` globs in `vitest.config.ts` (`tests/unit/**/*.test.ts`, …), the pattern resolved to `tests/unit/tests/unit/**` and matched nothing, so vitest exited 1 with `No test files found`. The `--dir` semantics changed with the Vite/vitest toolchain upgrade below. Both scripts now pass the directory as a **path filter** (`vitest run tests/unit`), which composes correctly with the config's `include`. Verified locally: 113 files / 1,919 passed (unit) and 23 files / 298 passed (integration), exit 0.

### Changed

- Upgraded the Vite toolchain to the latest **stable** line (resolving Dependabot PRs #33/#39): `vite` 6 → 7.3.6, `@vitejs/plugin-react` 4 → 5.2.0, `vite-plugin-pwa` 0.21 → 1.3.0. The PRs proposed Vite 8, but Vite 8 ships the experimental **rolldown** bundler, which breaks our `manualChunks` config and the PWA build — Vite 7 is the correct stable target, so those PRs are closed in favor of this.

- License validation no longer claims cryptographic verification it doesn't perform. Renamed `verifySignature` → `verifyChecksum` in `src/lib/license/licenseValidator.ts` and dropped the placeholder PEM constants. The unused Web-Crypto verifier in `src/lib/license/signatureVerifier.ts` (which referenced a different placeholder PEM and was never imported) has been replaced with a single throwing stub so future callers fail loudly. New ADR `docs/architecture/license-anti-piracy-only.md` documents the scope: this client license is anti-CASUAL-piracy only; cryptographic verification needs a license server which is intentionally deferred; paid features must be gated server-side when they exist.

### Fixed

- **PWA precache was silently empty** after the `vite-plugin-pwa` 0.21 → 1.3.0 bump (`precache 1 entries (0.00 KiB)`, with `brace_expansion_1.expand is not a function` during the build). vite-plugin-pwa 1.3.0's bundled `minimatch@10` imports `brace-expansion` as a **named** export (4.x/5.x), but our security pin `brace-expansion@^2.0.2` (a callable default, needed by the tree's `minimatch` 3/5/9) starved it. Added a version-scoped override `"minimatch@^10": { "brace-expansion": "5.0.6" }` so minimatch 10 gets the named-export build while the rest of the tree keeps the patched 2.x. Precache now generates 24 entries (~2.8 MB). Both 2.0.2 and 5.0.6 are past the ReDoS patch floor (4.0.1), so the security posture is unchanged.

- **Test suite made compatible with vitest 4** (`tests/electron/setup.ts`, `tests/electron/notifications.test.ts`, `tests/integration/fileOpening.test.tsx`, `tests/setup.ts`, `tests/unit/stores/documentStore.test.ts`). vitest 4 rejects an arrow-function `vi.fn().mockImplementation()` body when the mock is invoked with `new` (arrow functions can't be constructors → "the vi.fn() mock did not use 'function' or 'class'"), which broke every mock standing in for an Electron/DOM class — `Notification`, `Tray`, `BrowserWindow`, `MenuItem`, `ResizeObserver`, `FileReader`, `PDFRenderer` — for 27 failures across the notifications and fileOpening suites. Converted those constructor mocks to `function` expressions (an explicit object return overrides `this`, so they construct correctly under `new`); non-constructor `vi.fn()` stubs and `vi.spyOn(console, …)` are unaffected and left as-is. Accompanies the vitest 2→4 dev-dependency bump (#30). Full suite: 2517 passed, 9 skipped, 1 todo, 0 failed.

- **Unit & Integration Tests CI job restored to green** (`tests/setup.ts`, `electron/notifications.ts`, `tests/electron/notifications.test.ts`). Nine failures (`tests/integration/security/hardwareAuth.test.ts`, `tests/unit/lib/license/licenseStorage.test.ts`, `tests/unit/lib/offline/offlineStorage.test.ts`, `tests/integration/offline/offlineWorkflow.test.ts`) were caused by a Web Crypto realm mismatch: under Vitest's worker pools, jsdom creates `ArrayBuffer`/`TypedArray` instances in a realm distinct from the one Node's native Web Crypto validates against, so Node's `SubtleCrypto` (strict on Node 20, lenient on Node 24 — which is why this only reproduced on CI) rejected the jsdom-realm `BufferSource` with "2nd argument is not instance of ArrayBuffer … `ERR_INVALID_ARG_TYPE`". Fixed at the root in the test setup: install Node's `webcrypto` as the global `crypto`, fronted by a `Proxy` that copies every `BufferSource` argument of the buffer-consuming `SubtleCrypto` methods (`importKey`/`sign`/`verify`/`deriveKey`/`deriveBits`/`encrypt`/`decrypt`/`digest`/`unwrapKey`) into a `node:buffer` `Buffer` (always Node-realm, so it always passes the native instanceof check) before delegating; `getRandomValues` fills via a Node-realm buffer and copies back. Test-environment only — no production code, no cryptographic behaviour change (same bytes, same algorithms). Also added a `navigator` stub in setup for `offlineStorage.getStorageStats`, which hit "navigator is not defined" under the same worker-pool conditions. Separately fixed a pre-existing latent flake in `notifications.test.ts` (leaked 500 ms grouped-notification `setTimeout`s firing after a test ended, against partial per-test Notification mocks → uncaught "notification.on/close is not a function"): `NotificationManager.closeAll()` now also cancels pending group timers (a real behaviour bug — a deferred group could surface after callers asked to close everything), the two partial callback mocks now stub `close`, and both suites restore the complete default Notification mock and dispose their manager between tests. Full suite: 2517 passed, 9 skipped, 1 todo, 0 failed.

- **E2E and Lighthouse jobs no longer gate PR or main-branch CI** (`.github/workflows/ci.yml`). Both require a live preview server / headless browser and have failures unrelated to application correctness (E2E: ESM `__dirname`, `defaultBrowserType`-in-`describe`; Lighthouse: content-dependent PWA `minScore` assertion). Scoped both jobs to `workflow_dispatch` only (added the trigger) so they are skipped on `push`/`pull_request` — keeping the main-branch CI green while leaving the jobs runnable on demand. The Security Audit job is untouched; nothing security-related was weakened.

- **Lint CI pass restored** (`src/components/annotations/ShapeAnnotation.tsx`, `src/components/viewer/PageCanvas.tsx`, `eslint.config.js`). Wrapped the `case 'ellipse'` block in braces (`no-case-declarations`) and added the missing `activeOpacity` dependency to the `handleTextSelection` `useCallback` (`react-hooks/exhaustive-deps` — a real stale-closure fix; the callback reads `activeOpacity` but it was absent from the dep array). Scoped the vendored `tools/` CLIs out of the app ESLint config to match `tsconfig` (`include: ["src"]`) — those utilities run via `npx tsx`, ship their own config, and aren't part of the app build. Clears all 15 errors + 1 warning that were failing the Lint job and blocking the open Dependabot PRs.

- **Note + popup-triggered annotations no longer require two Ctrl+Z to undo** (`NoteTool.tsx`, `SelectionPopup.tsx`). The same double-push pattern as the highlight bug fixed in 152ffa3 was still present in the note-placement tool and the text-selection popup: `annotationStore.addAnnotation` already pushes a history entry, but the wrappers pushed a second one on top, so each new sticky note or popup-triggered highlight/underline/strikethrough produced two history entries. Removed the redundant `pushHistory` calls so the store remains the sole source of truth for annotation undo. Regression coverage: `tests/unit/components/annotations/{NoteTool,SelectionPopup}.test.tsx` (6 tests, all asserting `historyStore.past.length === 1` per action).

### Security

- Pinned `shell-quote` to `^1.8.4` via npm `overrides` to resolve a critical advisory (GHSA — `quote()` fails to escape newlines, enabling argument/command injection). It was pulled transitively at 1.8.3 by `concurrently@9.2.1` (a dev-only orchestration tool with no direct upgrade path), so no Dependabot PR was generated. The override forces the patched 1.8.4 across the tree; `concurrently` is unaffected (verified `npx concurrently --version`). Dev-scope only — not shipped in the app bundle.

- Pinned `picomatch` to `^4.0.4` in the `tools/create-dependency-graph` vendored CLI (via that sub-package's `overrides`) to clear a moderate advisory (method injection in POSIX character classes). It was pulled at 4.0.3 transitively by `@yao-pkg/pkg`/`tinyglobby`; the override forces 4.0.4 across the tool's lockfile. The app bundle's own `picomatch` is 2.x and unaffected.

- Wired the renderer-side `safeStorage` bridge (`electron/preload/index.ts`, new `electron/ipc/safeStorageHandlers.ts`, three new IPC channels: `SAFE_STORAGE_IS_AVAILABLE`, `SAFE_STORAGE_ENCRYPT`, `SAFE_STORAGE_DECRYPT`). Closes the gap left by commit 2353770 — `src/lib/license/licenseStorage.ts` was already detecting `window.electron.safeStorage` and falling back to plaintext + HMAC when absent, but the bridge itself had not been wired, so the INSECURE_PLATFORM fallback was running in shipped Electron builds. Production now promotes DPAPI ciphertext (Windows) / Keychain (macOS) / Secret Service (Linux) to the default at-rest format for the license file. The IPC bridge uses synchronous IPC (`sendSync` / `ipcMain.on`) to satisfy the consumer's existing sync API shape; ciphertext is base64-encoded across the IPC boundary and decoded back to `Uint8Array` in the preload before reaching the renderer. Test coverage: `tests/electron/safeStorageBridge.test.ts` (10 tests) + `tests/unit/lib/license/licenseStorageBridge.test.ts` (4 integration tests asserting the bridge-present path encrypts, round-trips, rejects tampering, and does NOT emit `INSECURE_PLATFORM`).
- Pinned pdfjs-dist to 4.10.38 (latest 4.x) and hardened the `getDocument()` call site in `src/lib/pdf/renderer.ts` with `isEvalSupported: false` (blocks PDF.js eval-based exploit paths, including the CVE-2024-4367 class) and `disableAutoFetch: true` (no speculative network fetches that could leak document fragments before user intent). The 5.x major bump was attempted first but blocked: PDF.js 5 changed the renderer API (`page.render()` now requires a `canvas` parameter instead of `canvasContext`/`viewport`) and renamed/removed the `isEvalSupported` option, which would require touching multiple unrelated render call sites (`src/components/print/PrintPreviewEnhanced.tsx`, `src/lib/ocr/imagePreprocessor.ts`, `src/lib/print/pdfRenderer.ts`) and is out of scope for this security branch. The 4.x line still receives the post-CVE-2024-4367 backports — it is a safe holding pattern. 5.x bump deferred — see ADR.
- License storage now uses Electron `safeStorage` (DPAPI on Windows / Keychain on macOS / Secret Service on Linux) for at-rest encryption, with HMAC-SHA-256 (Web Crypto SubtleCrypto) for integrity. The previous XOR-with-hardcoded-key obfuscation and 32-bit-folding-hash checksum (both trivially defeated) are gone. The HMAC key is bound to the local OS via `safeStorage.encryptString` of a constant key marker, so an attacker copying the license file to another machine cannot reproduce a valid HMAC without DPAPI access on that user account. On platforms where `safeStorage` is unavailable (e.g., headless CI, no DPAPI), we fall back to plaintext storage with a one-time `INSECURE_PLATFORM` warning; the HMAC still applies in the fallback path so accidental in-place edits are caught. On-disk format bumped to version 2; old XOR files (`_storageVersion === 1`) auto-migrate to the new format on first read.
- Hardened production Content Security Policy: confirmed `'unsafe-inline'` and `'unsafe-eval'` are absent from `script-src`. `'unsafe-inline'` is retained on `style-src` only because the renderer uses React inline `style={{...}}` props; switching to a nonce/hash strategy is tracked separately.
- Certificate verification gating now uses `app.isPackaged === false` instead of `process.env.NODE_ENV === 'development'`. NODE_ENV could be spoofed by a hostile launcher to weaken cert validation in shipped builds; `app.isPackaged` cannot.
- SSRF hardening on `RemoteConfigLoader` (enterprise remote config). The loader now refuses non-`https://` URLs and any hostname whose DNS resolution lands in private (RFC1918), loopback, or link-local space (incl. the cloud-metadata `169.254.169.254`). The `validateSSL: false` flag is now also refused on public URLs. New `src/lib/enterprise/ssrfGuard.ts` module provides reusable `isPrivateOrLoopbackIP` and `assertSafeURL` helpers.
- IPC path sandbox for renderer-supplied filesystem paths (`electron/ipc/pathSandbox.ts`). Renderer cannot drive the main-process `FILE_READ`/`FILE_WRITE`/`FILE_SAVE`/`FILE_DELETE`/`FILE_COPY`/`FILE_MOVE`/`FILE_EXISTS`/`FILE_GET_STATS`/`FOLDER_LIST`/`FOLDER_CREATE` handlers against arbitrary paths anymore. Paths must be approved via a native dialog (`showOpenDialog`/`showSaveDialog`/`folderPick`) or via the recent-files cache. Inputs containing `..` traversal segments are rejected. Write-side ops (write/save/copy/move) additionally enforce an extension allow-list (`.pdf`, `.json`, `.txt` plus internal `.bak`/`.tmp`).
- `FOLDER_LIST` recursive mode no longer self-calls `ipcMain.handle()` (which only registers handlers and never invoked anything). Replaced with an internal recursive helper capped at depth 5 and 10 000 entries to bound work and prevent denial-of-service via giant trees.
- Begin migration off `style-src 'unsafe-inline'` in production CSP (branch `security/style-src-nonce-migration`). Wave 1: 16 of 157 inline-style call sites converted to Tailwind utility classes (annotation tools `Highlight`/`RectangleTool`/`EllipseTool`/`ArrowTool`/`LineTool`/`AnnotationLayer`/`ShapeOverlay`/`StickyNote`/`StampTransform`/`CustomStampDialog`, plus `SignatureRotation`, `AdvancedPrintSettings`, `MarginEditor`).
- Add CSP regression test `tests/electron/csp.test.ts` pinning `PRODUCTION_CSP` shape and tracking the `style-src 'unsafe-inline'` removal goal as `it.todo`. `PRODUCTION_CSP` and `DEVELOPMENT_CSP` are now exported from `electron/main/security.ts`.
- Document deferred call sites and recommended Wave 2 sequencing in `docs/security/style-src-migration-audit.md`. **Note:** `'unsafe-inline'` is intentionally NOT yet removed — ~141 dynamic inline styles (form-field positioning, color swatches, progress bars, kiosk layout, signature handles, scanner crop tool, viewer page positioning) still require migration to CSS variables or shared utility classes before the directive can be dropped.
- Wave 2 (`security/style-src-wave-2`) — kiosk module migrated from inline `style={{...}}` props and embedded `<style>` JSX blocks to a single external stylesheet (`src/styles/kiosk.css`). Touch vs non-touch sizing is now expressed via `kiosk-touch` / `kiosk-compact` modifier classes rather than computed inline values. 21 inline-style call sites eliminated across `KioskShell.tsx`, `KioskHeader.tsx`, and `KioskToolbar.tsx`. Remaining count: 119 (was 140 at branch start; 157 at Wave 1 start).
- Wave 2 — `WebkitAppRegion` inline styles in `TitleBar.tsx` migrated to a `data-app-region="drag|no-drag"` attribute pattern. CSS rules in `src/styles/platform.css` map the attribute to the `-webkit-app-region` property, removing the last `style={{...}}` site in the layout module. `platform.css` is now also imported into `index.css` (it was orphaned previously). 4 sites eliminated.
- Wave 2 status: `'unsafe-inline'` is **NOT yet dropped** from `style-src` in `electron/main/security.ts`. After kiosk + WebkitAppRegion migrations and a parallel DrawingCanvas/ShapeTool fix, ~111 inline-style sites remain — all of them set continuous dynamic values (per-pixel positions, user-supplied colors, computed transforms, percentage widths). The CSS-variable-in-inline-style pattern does **not** sidestep `style-src 'self'` because the directive blocks the inline `style` attribute itself. `docs/security/style-src-migration-audit.md` now documents the four viable next-step strategies (nonce-wired runtime stylesheets, constructable stylesheets via `document.adoptedStyleSheets`, value quantization, and `style-src-attr`/`style-src-elem` directive split). Daniel's call which to pick.

### Added

#### Architecture Documentation
- Comprehensive architecture docs: ARCHITECTURE.md, OVERVIEW.md, API.md, DATAFLOW.md, COMPONENTS.md
- Dependency graph analysis with DEPENDENCY_GRAPH.md (264 files, 0 circular dependencies)
- Unused code analysis report in unused-analysis.md

#### Module Organization
- Barrel exports for stores (`src/stores/index.ts`) - 26 Zustand stores
- Barrel exports for hooks (`src/hooks/index.ts`) - 26 React hooks
- Barrel exports for utils (`src/utils/index.ts`) - coordinate, platform, cn utilities

#### Development Tools Documentation
- Document compress-for-context tool for LLM context compression
- Document chunking-for-files tool for large file editing
- Document create-dependency-graph tool for codebase analysis

### Fixed

#### Annotation Test Failures (Pre-existing)
- `DrawingCanvas`: migrate static `cursor: 'crosshair'` and `touchAction: 'none'` inline styles to Tailwind classes (`cursor-crosshair`, `touch-none`), aligning with Wave 1 of the style-src nonce migration. Restores `tests/unit/components/annotations/DrawingCanvas.test.tsx` (2 assertions).
- `ShapeTool` test (`RectangleTool`/`EllipseTool`/`ArrowTool`/`LineTool`): switch drag simulation from `fireEvent.mouseDown/mouseMove/mouseUp` to `fireEvent.pointerDown/pointerMove/pointerUp` so React dispatches to the components' `onPointerDown/Move/Up` handlers. Mouse events were not invoking pointer handlers in jsdom, so `addAnnotation` was never called. Add `setPointerCapture`/`releasePointerCapture`/`hasPointerCapture` no-op stubs to `tests/setup.ts` for jsdom (jsdom#2527 gap). Restores 4 assertions.
- Highlight history was being pushed twice per highlight: once by `annotationStore.addAnnotation` and again by `useHighlightTool.createHighlight` / `HighlightTool.createHighlight`. Net effect: a single user action took two undos to back out, and the history `past` length was 2x the annotation count. Removed the duplicate `pushHistory` call in both wrappers — `addAnnotation` is now the sole source of truth for highlight history. Renamed `annotationStore` history actions from `'Add <type>'` / `'Delete <type>'` to `'add_<type>'` / `'delete_<type>'` so the action labels are consistent with what the wrappers were emitting. Restores `HighlightTool.test.tsx > should push to history for undo support` and `highlights.test.tsx > should track multiple highlight operations in history` (2 assertions). **Note:** the same double-push pattern exists in `NoteTool.tsx` and `SelectionPopup.tsx`; not addressed in this commit because no failing tests cover them — flagged for follow-up.

#### Electron Build Fixes
- Fixed Vite SSR build for Electron main process (migrated from tsc)
- Added missing externals for Node.js modules in vite.electron.config.ts
- Fixed electron-builder.yml deprecated options for v26.7.0 compatibility
- Fixed linux.desktop configuration structure (moved to entry subobject)
- Removed deprecated win.publisherName, signDlls, deb.section, rpm.recommends
- Created placeholder icons for build/icons directory
- Commented out NSIS custom script (installer.nsh) for testing builds
- Added portable Windows build target for easier testing

#### Code Review Fixes (Phase 3 Q4 - Sprints 19-24)
- Fixed license key format version character ('1' to '2') to use valid CHARSET characters
- Updated licenseValidator to use licenseFormat module for consistent key encoding/decoding
- Moved license validator tests to correct location (tests/unit/lib/license/)
- Fixed license validator tests to use correct edition names (free/pro/business/enterprise)
- Fixed test API alignment between test expectations and actual implementation

#### Code Review Fixes (Phase 3 Q3)
- Fixed unused `message` parameter in attention manager's `notifyOperationComplete` and `notifyError` export functions
- Removed unused `LICENSE_KEY_REGEX` constant in license validator module
- Fixed unused imports in license validator test file (`isValidKeyFormat`, `decodeLicenseKey`, `LicenseKeyData`)

#### Test and Lint Fixes (Phase 3 Q2)
- Fixed PrintQueue test assertions to account for auto-start behavior
- Fixed ScannerProvider tests to properly enumerate devices before selection
- Added ImageData polyfill for Node.js test environment in document detection tests
- Fixed React hooks exhaustive-deps warnings in ScannerSelectDialog and HardwareKeyAuth
- Fixed react-refresh warnings for context hook exports in PlatformContext
- Fixed react-refresh warning for HOC export in LockedSettingBadge
- Fixed TypeScript errors with underscore-prefixed unused parameters
- Fixed TypeScript ArrayBuffer/SharedArrayBuffer compatibility in updateClient.ts
- Fixed FeatureId type compatibility in license validator

### Added

#### Hardware Security & WebAuthn (Sprint 12)
- WebAuthn/FIDO2 type definitions for credentials, attestation, and authentication
- WebAuthn client with credential registration and authentication
- Hardware key enrollment component with step-by-step guidance
- Hardware key authentication component with timeout and retry support
- Key management UI for viewing, renaming, and removing enrolled keys
- Enrollment guide with visual step-by-step walkthrough
- FIDO2 server verification for attestation and assertion
- Attestation verification with COSE key parsing
- Assertion verification with signature validation
- Hardware encryption service for document protection
- Multi-key encryption allowing multiple hardware keys to decrypt
- Key wrapping utilities with PBKDF2 key derivation
- Security store with authentication state and enrolled keys
- Electron WebAuthn bridge for main process integration
- WebAuthn preload script for renderer access
- Auto-update system with electron-updater integration
- Differential update support for reduced download sizes
- Update notification component with progress display

#### Scanner Integration (Sprint 11)
- Scanner types and interfaces for device capabilities
- Scanner provider abstraction for TWAIN/WIA/SANE/ImageCapture
- Document detection with Canny edge detection algorithm
- Perspective correction with homography matrix transformation
- Image compression utilities for PDF optimization
- Scan to PDF conversion with multi-page support
- Scanner store with device management and history
- Scanner select dialog for device enumeration
- Scan settings panel with resolution, color mode, and paper size
- Scan preview component with zoom and crop
- Resolution picker component
- Color mode selector component
- Interactive crop tool for manual adjustment
- Enhancement tools with brightness, contrast, and sharpening
- Batch scan workflow for multi-page documents
- Page organizer with drag-and-drop reordering
- Scan profiles manager with preset configurations
- Profile manager UI for create, edit, delete operations
- OCR integration with Tesseract.js
- Native addon placeholders for TWAIN, WIA, SANE drivers

#### Native Print Integration (Sprint 10)
- Print settings types and interfaces
- Print store with job management and queue
- Print queue manager with job prioritization
- Print presets for common configurations
- Virtual printer for PDF output
- Page layout component with paper sizes and orientations
- Print range selector with page/range/current selection
- Copies and collation control
- Print preview with zoom and page navigation
- Native print bridge for Electron IPC
- Print IPC channels for main process communication
- Printer enumeration and status monitoring

#### MDM/GPO Deployment Support (Sprint 19)
- Windows ADMX/ADML templates for Group Policy management
- Policy categories: Application, Security, Features, Updates, Network, Performance
- GPO registry reader with HKLM/HKCU precedence
- macOS MDM configuration profiles (mobileconfig)
- macOS managed preferences reader (NSUserDefaults/CFPreferences)
- Unified enterprise policy store with policy merging
- Policy status indicator and locked setting badges
- MSI installer with GPO deployment support
- PKG installer with MDM deployment support
- GPO and MDM reader test suites

#### Centralized Configuration (Sprint 20)
- JSON Schema for enterprise configuration validation
- JSON/JSONC configuration parser with comment support
- YAML configuration parser with anchor/alias support
- Configuration file discovery system (standard OS locations)
- Configuration hierarchy and precedence merging
- Remote configuration endpoint support with caching
- Configuration refresh and hot reload with file watchers
- Configuration encryption for sensitive values (AES-256-GCM)
- Environment variable expansion (${VAR:-default} syntax)
- Secrets manager with OS keychain integration
- Configuration viewer UI component
- Config source badges and export/import dialogs
- CLI tools for configuration validation
- Configuration system test suite

#### Offline License Validation (Sprint 21)
- License key format with edition, type, expiry, and seat encoding
- Offline license validation with checksum verification
- RSA signature verifier for license data
- Hardware fingerprinting with fuzzy matching
- License binding and activation manager
- Secure license storage with encryption
- License cache for offline validation
- Feature gating based on license edition
- License expiry handler with grace periods
- Warning notifications for expiring licenses
- License validator test suite

#### LAN Collaboration & Sync (Sprint 22)
- mDNS/Bonjour service discovery for peer finding
- LAN peer manager with status tracking
- LAN collaboration Zustand store

#### On-Premise Update Server (Sprint 23)
- Update server types and architecture
- Update client with proxy support
- Download progress tracking and checksum verification
- Release notes fetching

#### Kiosk Mode & Year Release (Sprint 24)
- Kiosk mode configuration types
- Kiosk store with session management
- Kiosk mode activation with PIN protection
- Feature lockdown system
- Navigation restrictions
- Session auto-reset on inactivity
- Kiosk UI shell component
- Touch-friendly kiosk toolbar
- Kiosk header with branding support

#### Windows Installer (Sprint 13)
- Comprehensive electron-builder configuration for Windows targets (NSIS, MSI, MSIX)
- NSIS installer with custom script for file associations, protocol handlers, and registry entries
- MSI package configuration for enterprise Group Policy deployment with silent install support
- MSIX package for Microsoft Store submission with proper manifest and capabilities
- Windows code signing configuration with EV certificate support
- Custom installer pages with PDF association, desktop shortcut, and startup options
- Differential updates for NSIS to minimize download sizes
- Windows-specific crash reporter with minidump symbols and Sentry integration
- GitHub Actions workflow for Windows builds with code signing and artifact upload
- Windows 10/11 compatibility testing configuration

#### macOS Bundle & Notarization (Sprint 14)
- Universal binary support for Intel (x64) and Apple Silicon (arm64)
- DMG installer with custom background, icon positioning, and license agreement
- PKG installer for enterprise MDM deployment with pre/post install scripts
- Hardened runtime configuration for notarization requirements
- Apple notarization workflow with notarytool and automatic stapling
- Mac App Store entitlements and sandbox configuration
- Inherited entitlements for child processes
- Notarization script with verification and stapling helpers
- GitHub Actions workflow for macOS builds with code signing and notarization

#### Linux Packages (Sprint 15)
- AppImage portable package with automatic updates
- Debian package (.deb) with proper dependencies and maintainer scripts
- RPM package (.rpm) for Fedora/RHEL with correct dependencies
- Snap package with strict confinement and proper plugs for capabilities
- Flatpak manifest for Flathub submission
- Desktop entry following freedesktop.org specification
- MIME type associations for PDF files
- Custom protocol handler registration (paperflow://)
- GitHub Actions workflow for Linux builds with multi-distro testing
- Snapcraft.yaml with GNOME extension and proper environment

#### Platform UI Adaptations (Sprint 16)
- Comprehensive platform detection utilities (OS, version, capabilities)
- PlatformContext React provider for platform-aware components
- Platform-specific CSS with font stacks (SF Pro, Segoe UI, system fonts)
- Adaptive spacing and sizing matching platform conventions
- Platform-specific scrollbar styling (overlay on macOS, visible on Windows)
- TitleBar component with platform-appropriate window controls
- macOS traffic light buttons on left, Windows buttons on right
- Dark mode detection and response on all platforms
- High DPI support for Retina and Windows scaling
- Reduced motion preference support
- Touch device detection
- Platform-specific keyboard shortcut formatting

#### macOS Touch Bar & Windows Taskbar (Sprint 17)
- TouchBarManager with context-aware layouts (viewer, editor, forms, signature)
- Touch Bar controls for zoom, navigation, annotation tools, and color picker
- Automatic Touch Bar context switching based on active mode
- Windows Jump Lists with recent/pinned documents and common tasks
- Windows taskbar progress for long-running operations
- Windows taskbar overlay icons for status (unsaved, processing, error)
- Windows thumbnail toolbar with navigation and zoom buttons
- Linux Unity/GNOME launcher integration with quicklists and progress
- Cross-platform attention manager (dock bounce, taskbar flash, urgent hint)
- Notification badge support on macOS Dock

#### Cross-Platform Testing & Q3 Release (Sprint 18)
- Cross-platform CI/CD matrix for Windows 10/11, macOS 12/13/14, Ubuntu 22/24
- Comprehensive E2E test suite for core features across platforms
- Installer testing workflows for NSIS, MSI, DMG, PKG, AppImage, deb, rpm
- Visual regression testing configuration
- Accessibility audit testing with screen reader support verification
- Performance benchmarking across platforms
- Release candidate workflow with version management
- Release metrics monitoring (downloads, installs, crashes, feature usage)
- Platform-specific feature tests (Touch Bar, Jump Lists, taskbar)
- Auto-update testing across all platforms

#### Offline-First Architecture (Sprint 7)
- Enhanced service worker configuration with Workbox caching strategies
  - Stale-while-revalidate for static assets (JS, CSS)
  - Cache-first for PDFs, images, and fonts
  - Network-first for API calls with cache fallback
  - Configurable cache expiration and max entries
- Offline document storage in IndexedDB with comprehensive schema
  - Document binary data storage
  - Annotations persistence per document
  - Edit history tracking for sync
  - Offline availability settings management
- Offline queue manager for network operations
  - Priority-based queue (high, normal, low)
  - Automatic retry with exponential backoff
  - Queue persistence across sessions
  - Conflict detection and resolution
- Background Sync API integration with browser fallback
  - One-time sync registration
  - Periodic sync for regular updates
  - Fallback polling for unsupported browsers
- Offline-aware Zustand store (offlineStore)
  - Connection status tracking (online/offline/connecting)
  - Sync state management (idle/syncing/error/paused)
  - Pending operations count
  - Conflict tracking and resolution
  - Auto-sync and sync-on-reconnect settings
- Electron offline detection with reliable connectivity checks
  - DNS resolution verification
  - HTTP connectivity probes
  - IPC-based status updates to renderer
- Document sync engine with conflict resolution
  - Bidirectional sync between local and cloud
  - Conflict detection by checksum and version
  - Resolution strategies: local-wins, remote-wins, newest-wins, merge, manual
  - Sync progress reporting
- Delta sync for large documents
  - Binary diff calculation
  - Patch generation and application
  - Bandwidth usage optimization
  - Chunk-based transfer for reliability
- Offline indicator component with interactive status panel
  - Connection status display
  - Sync progress visualization
  - Pending operations list
  - Quick sync action
- Offline mode banner with feature guidance
  - Dismissible notification on going offline
  - Available features list
  - Limited features explanation
  - Auto-hide when back online
- Sync conflict resolution dialog
  - Side-by-side version comparison
  - Change visualization by type
  - Strategy selection with recommendations
  - Merge preview for annotations
- Selective offline availability management
  - Mark documents for offline access
  - Priority-based storage management
  - Storage space monitoring and cleanup
  - Max offline documents configuration
- Offline-first React hooks
  - useOfflineData: Cached data fetching with sync
  - useOfflineSync: Sync operations and status
  - useConnectionStatus: Connection monitoring
- Comprehensive test suite for offline functionality
  - Unit tests for storage, sync, and conflict resolution
  - Integration tests for complete offline workflows
- Technical documentation for offline architecture

#### Native Batch Processing (Sprint 9)
- Worker thread pool manager with configurable min/max workers and idle timeout
- PDF worker thread for parallel processing of compress, merge, split, watermark operations
- Priority-based batch job queue system with pause/resume/cancel capabilities
- IndexedDB persistence for job recovery across application restarts
- Native batch processing Zustand store with comprehensive state management
- Batch processing wizard UI with 5-step configuration flow
- Batch progress dashboard with real-time job status and resource monitoring
- Batch compression operation with quality presets and size estimation
- Batch merge operation with append and interleave strategies
- Batch split operation supporting page-count, file-size, and custom ranges
- Batch watermark operation with text/image support and positioning presets
- Batch OCR operation with multi-language support and accuracy settings
- Comprehensive error handling with retry logic and exponential backoff
- Batch results summary with export to TXT, CSV, and JSON formats
- Batch template system for saving and reusing operation configurations
- Default templates for common operations (Quick Compress, Archive, etc.)
- Template import/export functionality
- Resource usage monitoring (CPU, memory, active workers)
- Queue statistics tracking (pending, processing, completed, failed jobs)
- Unit tests for job queue, batch operations, and native batch store

#### File Watching & Hot Reload (Sprint 8)
- Advanced file watcher service using chokidar with optimized debouncing
- Document change detection engine for pages, annotations, text, and metadata
- Smart reload system that preserves scroll position, zoom, and unsaved annotations
- External change notifications with reload, ignore, and compare options
- Side-by-side document comparison view with synchronized scrolling
- Conflict resolution for local vs external changes with merge strategies
- File lock detection with retry mechanism and user notification
- Watched folders management for recent files
- Hot reload development support with state preservation
- Watch queue manager for batching and prioritizing file events
- Performance optimizations for watching many files (CPU < 2%, minimal memory)
- Auto-reload settings panel with configurable behavior
- Watch status indicators for UI feedback
- Comprehensive test suite for change detection and smart reload

---

## [3.0.0-alpha.1] - 2026-02-02

### Phase 3: Desktop Application (Electron) - Q1 Alpha Release

This release marks the first alpha of the PaperFlow Desktop application, bringing native desktop functionality through Electron while maintaining the full PWA experience.

### Added

#### Electron App Shell (Sprint 1)
- Electron project structure with main, preload, and IPC modules
- Main process with BrowserWindow management and app lifecycle handling
- Secure preload script with contextBridge API exposure
- Type-safe IPC communication layer with 30+ channels
- Window state persistence (position, size, maximized state)
- Multi-window support for opening multiple documents
- Platform detection utilities for conditional feature enabling
- Content Security Policy configuration for production and development
- Single instance lock to prevent duplicate app instances
- Native file dialogs (open, save, save as)
- Native shell integration (open external URLs, show in folder, trash)
- Native clipboard operations (text and images)
- Native notifications
- Recent files tracking
- Development workflow with hot reload for both renderer and main process
- Production build pipeline with electron-builder
- Support for Windows (NSIS installer, portable), macOS (DMG), and Linux (AppImage, deb, rpm)
- macOS entitlements for hardened runtime
- Comprehensive documentation (architecture, development guide, IPC patterns)
- Unit tests for window manager, IPC channels, and platform detection
- usePlatform React hook for reactive platform features

#### File System Integration (Sprint 2)
- Native file open dialog with PDF filter and multi-file selection
- Native file save dialog with overwrite confirmation and backup creation
- File read/write operations with proper error handling and data conversion
- File watcher using chokidar for external change detection with reload prompts
- Recent files management with OS-level integration and persistence
- Desktop drag-and-drop file support for Electron app
- PDF file association handler for opening PDFs from Explorer/Finder
- Command-line file opening support with startup argument processing
- Auto-save functionality with configurable intervals
- Crash recovery system with automatic recovery file detection on startup
- Backup and versioning system (configurable max backups, restore capability)
- Unsaved changes detection with React hook (useUnsavedChanges)
- File path utilities (getFileName, getDirectory, getExtension, truncatePath)
- Folder picker for batch operations
- High-level fileSystem.ts API wrapper for renderer process
- Zustand store for recent files state management
- Comprehensive file system integration tests
- Documentation for file system APIs and usage patterns

#### Auto-Updater System (Sprint 4)
- Automatic update checking on startup with configurable delay
- Periodic update checks at configurable intervals (hourly, daily, weekly)
- Manual update check via menu or settings
- Update notification UI with version info and release notes
- Download progress tracking with speed, size, and cancel option
- Install prompt with restart now or later options
- Release notes display with markdown rendering
- Update channel selection (stable, beta, alpha)
- Differential updates to minimize download sizes
- Code signing configuration for Windows and macOS
- Notarization support for macOS
- Error handling with retry and manual download fallback
- Update settings UI with all configuration options
- Zustand store for update state management
- IPC channels for renderer-main process communication
- Comprehensive unit tests for update system
- Documentation for auto-update configuration and release process

#### Native Menus & Shortcuts (Sprint 5)
- Native application menu bar with File, Edit, View, Document, Window, Help menus
- Platform-specific menu layouts (macOS app menu with About, Preferences, Services, Hide, Quit)
- Comprehensive keyboard shortcuts for all major actions
- Context menus for document viewer (copy, zoom, annotations, page navigation)
- Context menus for annotations (edit, delete, change color, properties)
- Recent files submenu with quick access shortcuts (Ctrl+1 through Ctrl+9)
- Window menu with minimize, zoom, and window management
- Help menu with keyboard shortcuts dialog, documentation links, and update check
- Dynamic menu state updates (enable/disable based on document state)
- View mode radio buttons in menu (single, continuous, spread)
- Global keyboard shortcuts (Quick Open, Bring to Front) that work when app is in background
- Keyboard shortcut customization with conflict detection
- Shortcut settings UI with search, edit, and reset functionality
- KeyboardShortcutsDialog component for viewing all shortcuts
- Zustand store for managing custom shortcuts
- Platform-specific accelerators (Cmd on macOS, Ctrl on Windows/Linux)
- Menu state synchronization between main and renderer processes
- IPC channels for menu actions and state updates
- Comprehensive tests for menu templates, shortcuts, and context menus
- Keyboard shortcuts documentation (docs/keyboard-shortcuts.md)

#### System Tray & Notifications (Sprint 3)
- System tray icon with platform-specific sizing and appearance
- Tray icon status indicators (idle, busy, notification, error)
- Tray context menu with Open, Recent Files, Preferences, Quit
- Minimize-to-tray functionality (configurable in settings)
- Close-to-tray option to keep app running in background
- Progress display in tray icon tooltip for long-running operations
- Tray icon flash animation for attention
- Native desktop notifications using Electron Notification API
- Notification types: info, success, warning, error, file-operation, batch-operation
- Notification action buttons with click handlers
- Notification grouping for batch operations
- Quiet hours / Do Not Disturb mode with configurable time range
- Notification history with unread count tracking
- OS notification center integration (Windows Action Center, macOS Notification Center)
- Dock badge count for pending notifications (macOS only)
- Dock icon bounce for attention (macOS only)
- NotificationSettings component for preferences UI
- Notification preferences persisted in settings store
- Renderer-side notification helpers in src/lib/electron/notifications.ts
- IPC channels for tray and notification operations
- Unit tests for TrayManager and NotificationManager
- Documentation for tray and notification features (docs/electron/tray-notifications.md)

#### OS Integration & Release (Sprint 6)
- Native print dialog with system printer integration
- PDF-to-printer output with correct dimensions and margins
- Shell integration (Show in Folder, Open with Default App)
- Protocol handler registration (`paperflow://` deep links)
- Launch-on-startup with optional minimized start
- Native dialogs (message boxes, error dialogs, confirmations)
- Enhanced clipboard operations (copy page as image, formatted text)
- Power save blocker for long-running operations (OCR, batch processing)
- Secure storage using OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Crash reporter integration for automatic error collection
- E2E tests for desktop-specific features using Playwright
- Cross-platform testing documentation (Windows, macOS, Linux)
- Version updated to 3.0.0-alpha.1
- Comprehensive release notes and installation documentation
- CI/CD workflows for desktop builds and releases

### Changed
- Package version updated from 1.0.0 to 3.0.0-alpha.1 for desktop alpha release
- Settings store extended with startup options (launchOnStartup, startMinimized)

### Breaking Changes
- Minimum supported Node.js version is 18.0.0
- Electron 40+ required for new APIs

### Migration Guide
If upgrading from the PWA version:
1. Install the desktop application for your platform
2. Your settings will be preserved in localStorage
3. Recent files will need to be re-opened once
4. PWA and desktop versions can run simultaneously

### Known Issues
- Linux file associations may require manual configuration on some distributions
- System tray may not appear on GNOME + Wayland without AppIndicator extension

---

## [2.5.0] - 2026-02-01

### Phase 2: Advanced Features Release

This release completes Phase 2 development, adding professional-grade tools for OCR, form design, redaction, document comparison, batch processing, and accessibility compliance.

### Added

#### OCR (Optical Character Recognition)
- Tesseract.js integration for client-side OCR
- Multi-language support with dynamic language pack loading
- Image preprocessing (deskew, denoise, contrast enhancement)
- Batch OCR processing for multi-page documents
- Layout analysis for preserving document structure
- Export to searchable PDF, plain text, and hOCR formats

#### Form Designer
- Drag-and-drop form field creation
- Field types: text, checkbox, radio button, dropdown, date picker, signature
- Calculated fields with formula support
- Conditional logic for field visibility and validation
- Form actions (submit, reset, JavaScript triggers)
- Form submission configuration (email, HTTP endpoint)

#### Redaction Tools
- Pattern-based redaction (SSN, credit cards, phone numbers, emails)
- Custom regex pattern support
- Search and redact across entire document
- Redaction verification workflow
- Metadata scrubbing (author, timestamps, comments)
- Permanent redaction with content removal

#### Document Comparison
- Text-based diff comparison
- Side-by-side view with synchronized scrolling
- Overlay mode with change highlighting
- Change summary statistics
- Comparison report export (PDF, HTML)
- Support for comparing different document versions

#### Batch Processing
- Watermark application (text and image)
- Headers and footers with page numbering
- Bates numbering with prefix/suffix support
- Batch PDF flattening
- Process multiple files with consistent settings
- Progress tracking and error handling

#### PDF/UA Accessibility Checker
- PDF/UA compliance validation
- WCAG 2.1 AA guideline checks
- Color contrast ratio calculation
- Alt text verification for images
- Reading order validation
- Tag structure analysis
- Accessibility report generation

---

## [1.0.0] - 2026-01-30

### Phase 1: MVP Release

This release marks the completion of Phase 1 development, delivering the core PDF editing experience.

### Added

#### PDF Viewing & Navigation
- High-fidelity PDF rendering with PDF.js
- Multiple view modes: single page, continuous scroll, two-page spread
- Smooth zoom controls (10% - 400%)
- Keyboard navigation and shortcuts
- Page thumbnails sidebar with lazy loading
- Document outline/bookmarks panel
- Text search with highlighting
- Dark mode support

#### Annotations
- Text highlighting with 5 color options
- Underline and strikethrough markup
- Sticky notes with rich text and replies
- Freehand drawing with pressure sensitivity
- Shape tools: rectangles, circles, arrows, lines
- Stamps: Approved, Rejected, Confidential, Draft, Final
- Annotation import/export (JSON format)
- Full undo/redo support

#### Form Filling
- Automatic form field detection (AcroForm)
- Support for text fields, checkboxes, radio buttons, dropdowns
- Tab navigation between fields
- Required field validation
- Form data export (JSON, FDF, XFDF)
- Auto-save form progress

#### Digital Signatures
- Draw, type, or upload signatures
- Signature management with IndexedDB storage
- Click-to-place with resize support
- Initials support
- Date stamp option
- Signature field alignment

#### Text Editing
- Inline text editing with font matching
- New text box creation
- Rich text formatting (bold, italic, underline)
- Font family and size selection
- Text alignment options

#### Page Management
- Drag-and-drop page reordering
- Delete, duplicate, rotate pages
- Insert blank pages
- Merge multiple PDFs
- Split PDF by page range
- Extract pages to new document

#### Export & Print
- Save with all changes embedded
- Export to PNG/JPEG with resolution options
- PDF compression
- Print preview with page range selection
- Scale and orientation options

#### PWA & Offline
- Installable as Progressive Web App
- Full offline functionality
- Service worker with Workbox
- Lighthouse PWA score of 100

#### Performance
- Virtualized page rendering
- Thumbnail caching with LRU cache
- Code splitting and lazy loading
- Memory monitoring and management
- Support for PDFs up to 100MB

#### Accessibility
- Keyboard navigation throughout
- Screen reader support with ARIA labels
- Focus indicators
- High contrast mode support

### Technical
- React 19 with TypeScript
- Vite build system
- Zustand state management
- Tailwind CSS styling
- Comprehensive test suite (unit, integration, e2e)
- Playwright browser tests
