# TODO

Open work for this repository. Completed work is recorded in `CHANGELOG.md`, not here.
Sprint-level planning lives in `docs/planning/sprints/PHASE_X_SPRINT_Y_TODO.json`.

## Open

- [ ] **The web E2E suite collects (775 tests) but is red: 52 of 155 chromium tests fail, 50 skip.**
  Measured with `npx playwright test --project=chromium` (`playwright.config.ts`, `tests/e2e`). The
  causes, by weight:
  - **`src/` renders no `data-testid`.** 8 specs select on `data-testid` values (`pdf-viewer`,
    `next-page-btn`, `zoom-level`, ...) and `src/` has none (0 matches in 480 files). This is 29
    failures in `cross-platform/core-features` and `cross-platform/editing`, plus the drop-zone check
    in `workflows/open-edit-save`. The fix is a decision: add the attributes to the components, or
    rewrite the selectors to roles and labels.
  - **A developer-machine path.** `browser-test`, `full-feature-test` and `pdf-editor-test` read a PDF
    from an absolute path under a developer's home directory (20 failures, ENOENT). No PDF is tracked
    in the repository. The fix needs a small committed fixture and a relative path.
  - **`platform-integration` launches Electron** from the web suite (`electron.launch: Target page,
    context or browser has been closed`). It belongs with `tests/e2e-electron`.
  - **Running the suite dirties the tree.** `full-feature-test` writes screenshots into the tracked
    `tests/e2e/screenshots/`.

  The `E2E Tests` job in `ci.yml` stays `workflow_dispatch`-only. The Electron suite
  (`test:e2e-electron`, `tests/e2e-electron`) is separate and does run in CI -- 57 tests. Do not
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
