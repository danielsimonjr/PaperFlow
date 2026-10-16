# TODO

Open work for this repository. Completed work is recorded in `CHANGELOG.md`, not here.
Sprint-level planning lives in `docs/planning/sprints/PHASE_X_SPRINT_Y_TODO.json`.

## Open

- [ ] **The web E2E suite is not green: 6 of 141 chromium tests fail and 43 skip.**
  Measured with `npx playwright test --project=chromium` (`playwright.config.ts`, `tests/e2e`):
  92 pass. A full run takes about a minute. The 6 failures, by cause:
  - **Spec geometry** (`cross-platform/editing`, "should add highlight annotation" and "should
    draw freehand annotation"). The specs offset from `pdf-viewer` (the `<main>` region, which
    starts left of the page) and then move the mouse in viewport coordinates, so the drag never
    reaches the page. The product handles both gestures when the drag is aimed at the page.
  - **UI that no route mounts** (3 signature tests in `cross-platform/editing`). `SignatureModal`
    is hosted only by `AnnotationToolbar`, and no route renders `AnnotationToolbar`. The
    `tool-signature`, `signature-modal`, `signature-pad`, `apply-signature-btn` and
    `signature-annotation` hooks have no element.
  - **No such feature** (`cross-platform/core-features`, "should fit to width"). The spec expects
    a `zoom-mode` element. "Fit width" only sets the zoom to 100.

  The 43 skips are explicit `test.skip` placeholders in `workflows/` (`annotate-share` 22,
  `form-fill` 14, `open-edit-save` 7). A sample document exists (`tests/fixtures/sample.pdf`),
  so they can be enabled one at a time. Their hooks `undo`, `share`, `export`, `export-pdf`,
  `flatten`, `reset-form`, `export-form` and `skip-nav` have no element yet (`FormActions` and
  `SkipNav` exist, but no route mounts them). Most of the 33 `mobile/` tests pass without testing
  anything: they assert `count >= 0` or swallow a failed expectation with `.catch`. Their hooks
  `mobile-toolbar`, `menu-button` and `more-tools` have no element (`MobileToolbar` is unmounted).

  The `E2E Tests` job in `ci.yml` stays `workflow_dispatch`-only. The Electron suite
  (`test:e2e-electron`, `tests/e2e-electron`) is separate and does run in CI -- 72 tests. Do not
  read its green checks as this suite's health.

- [ ] **`e2e-staging` has never actually run.** It consumes `needs.deploy-preview.outputs.url` as
  its `BASE_URL`. That output is declared now -- an earlier fix added it, and left a comment in
  `staging.yml` recording that it had been missing and the value was therefore the empty string --
  but the job has still never executed, because `deploy-preview` has always skipped or failed
  first. Expect it to need work the first time a preview deploy succeeds.

- [ ] **No Cloudflare credentials are configured at any scope.** `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` are absent from repository secrets and from both the `production` and
  `staging` environments, so every Pages deploy step skips via its own guard and emits a warning.
  The deploy path is therefore untested end to end. Setting the secrets is the prerequisite for
  verifying it.

- [ ] **Two moderate advisories remain in `vitest`**
  ([GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)). Fixed in 4.1.11,
  inside the declared `^4.1.8`, so the next resolution clears them with no manifest change. Below
  the `--audit-level=high` gate.

- [ ] **`CHANGELOG.md` does not pass `prettier --check`,** and has not for some time. CI does not
  run Prettier on Markdown, so nothing fails. Reformatting the whole file would bury future diffs;
  do it as its own commit, or add Markdown to a formatting gate and accept the one-time churn.

## Five-axis assessment

Per the workspace standing mandate: every repository touched gets a dated line naming what was
assessed and what was deliberately left.

- **2026-10-02** -- *Security:* all 20 high advisories cleared at the dependency level; ten
  obsolete `brace-expansion` overrides deleted rather than re-pinned; the dead
  `--ignore=GHSA-qwww-vcr4-c8h2` removed so the gate asserts the real tree; third-party action
  SHA-pinned on the two deploy workflows. *Reliability:* both Cloudflare deploy jobs were failing
  at setup against a deleted action and now resolve. *Maintainability:* three copies of a header
  comment naming the wrong linter corrected; the deploy step's output rename applied to all five
  consumers. **Deliberately left:** the web E2E harness, the `e2e-staging` BASE_URL, the Prettier
  drift in `CHANGELOG.md`, and the two `vitest` moderates -- all filed above. **Not assessable
  here:** whether a Pages deploy actually succeeds, which needs credentials this environment does
  not have.
