# Repo Sweep Phase 2 — Compatibility Retirement Map

Date: 2026-05-07  
Mode: repo / build / rendering / QA  
Scope: compatibility-residue decision map only. No deletions, no renderer rewrites, no schema changes, and no template expansion.

---

## Phase 2 Goal

Decide what old surfaces still add value, what should be retired later, and what guard must pass before any deletion happens.

Phase 2 does **not** remove compatibility code. It creates the retirement map so future deletion PRs are deliberate rather than emotional cleanup.

---

## Current Confirmed Checkpoint

Merged before this phase:

- #210 — Phase 0 baseline audit
- #211 — Phase 1 repo-truth and QA cleanup

Current draft PR to keep separate:

- #209 — Kamloops Growth Project content/unit package. This is not repo infrastructure cleanup.

---

## Retirement Candidate 1 — `engine/family/*`

### Current status

`engine/family/*` is compatibility-only residue. The live assignment-family authority is `engine/assignment-family/*`.

Files currently present:

- `engine/family/selection.mjs`
- `engine/family/canonical.mjs`
- `engine/family/validation.mjs`

These files are not independent authority. They wrap or mirror `engine/assignment-family/*`.

### Current value

They protect older callers and preserve compatibility while the repo completes the assignment-family cutover.

Current compatibility tests intentionally import them:

- `tests/node/family-canonical-compat.test.mjs`
- `tests/node/family-validation-compat.test.mjs`

Those tests are not accidental. They are enforcing the current compatibility promise.

### Retirement gate

Do not delete `engine/family/*` until all are true:

1. `pnpm run audit:family-residue` reports no live code callers outside compatibility tests/docs.
2. Any compatibility tests are deliberately removed or rewritten to test the new authority directly.
3. README, SETUP_STATUS, CONTRIBUTING, and workflow docs no longer describe `engine/family/*` as a supported compatibility surface.
4. One PR exists whose only purpose is retiring `engine/family/*` and its tests/docs references.

### Phase 2 decision

Keep for now.

### Recommended future action

Create a later **Phase 2A** PR:

- run/fix `audit:family-residue`
- decide whether external callers matter
- if no external callers matter, remove the compatibility tests and `engine/family/*` in one narrow PR

---

## Retirement Candidate 2 — Legacy direct-builder scripts

### Current status

Legacy direct builders remain callable as Node scripts, but they are explicitly deprecated/debug-only.

Files:

- `scripts/build-all.mjs`
- `scripts/build-pptx.mjs`
- `scripts/build-pdf.mjs`
- `docs/legacy-direct-builders.md`
- `tests/node/legacy-direct-builder-surface.test.mjs`

### Current value

They offer a small direct-lesson inspection surface and preserve older operator muscle memory, but they do not prove stable-core package correctness.

The accepted path remains:

1. `schema:check`
2. `route:plan`
3. `render:package`
4. `qa:bundle`
5. optional `qa:report`

### Current protection

`tests/node/legacy-direct-builder-surface.test.mjs` explicitly verifies that these files exist, that docs call them non-acceptance surfaces, and that they do not depend on missing `build:*` package scripts.

### Retirement gate

Do not delete direct builders until all are true:

1. The test file is intentionally removed or rewritten.
2. `docs/legacy-direct-builders.md` is replaced with a short removal note or removed in the same PR.
3. README/CONTRIBUTING no longer mention direct `node scripts/build-*.mjs` usage except as historical removal notes.
4. No workflows or docs refer to these scripts as useful operator surfaces.

### Phase 2 decision

Keep for now, but keep them outside `package.json` scripts.

### Recommended future action

Create a later **Phase 2B** decision PR:

- either formally keep them as debug utilities and add a short sunset condition
- or remove the files, tests, and docs together

---

## Retirement Candidate 3 — Python PDF fallback path

### Current status

`engine/pdf/` remains necessary for several implemented-but-not-HTML-consolidated output types.

The package renderer still sends these through the Python fallback path when they are not supported by `engine/pdf-html`:

- `teacher_guide`
- `lesson_overview`
- `checkpoint_sheet`

The renderer also still includes transitional document output types in `DOC_OUTPUT_TYPES`.

### Current value

This path keeps proof-backed package rendering functional while HTML consolidation proceeds in smaller slices.

### Retirement gate

Do not remove or bypass `engine/pdf/` until all are true:

1. `teacher_guide` has an HTML template and proof fixture.
2. `lesson_overview` has an HTML template and proof fixture.
3. `checkpoint_sheet` has an HTML template and proof fixture.
4. Stable-core and focused workflows render those types through `engine/pdf-html`.
5. `DOC_OUTPUT_TYPES` no longer needs those fallback entries.
6. Python tests and dependencies are updated deliberately.

### Phase 2 decision

Keep.

### Recommended future action

This belongs in A5 render hardening, not immediate cleanup.

---

## Retirement Candidate 4 — PPTX archive/delegation residue

### Current status

`engine/pptx/renderer.py` is the public PPTX entrypoint. Current slide rendering uses HTML/Playwright screenshots before PPTX assembly.

A consolidation note already states the target: finish PPTX consolidation before adding any new slide layout type.

### Current value

The current entrypoint is stable enough for package rendering and workflows.

### Retirement gate

Do not remove PPTX archive/delegation residue until all are true:

1. `engine/pptx/renderer.py` no longer delegates to archived implementation details.
2. `engine/pptx/render-cli.mjs` remains the accepted operator path or is replaced deliberately.
3. All slide workflows pass after consolidation.
4. Existing PPTX QA still sees semantic text and nonblank decks.

### Phase 2 decision

Keep until slide-layout expansion resumes.

### Recommended future action

Do not touch in Phase 2 unless a slide renderer bug appears.

---

## Retirement Candidate 5 — Stale roadmap/docs surfaces

### Current status

Some docs are intentionally historical. Some are active. Some are now likely stale enough to confuse future work.

High-value active docs:

- `README.md`
- `CONTRIBUTING.md`
- `SETUP_STATUS.md`
- `DECISIONS.md`
- `docs/WORKLOAD.md`
- `docs/CONTRACT_DRIFT_INVENTORY.md`
- `docs/repo-sweep-phase-0.md`
- this document

Likely stale or historical docs should be reviewed later, not deleted blindly.

### Retirement gate

For any stale doc deletion or archive:

1. Confirm it is not linked from README/CONTRIBUTING/SETUP_STATUS/WORKLOAD.
2. Confirm it is not referenced by workflow docs or tests.
3. Move to an archive path first if it contains useful history.
4. Delete only if it adds no operational value.

### Phase 2 decision

Do not delete docs in this PR.

### Recommended future action

Create a **Phase 2C docs archive map**.

---

## Recommended Phase 2A Work Order

After this retirement map merges:

1. Run/repair `pnpm run audit:family-residue` so it distinguishes live callers from docs/tests.
2. Add a small report mode if needed, instead of making it fail on known compatibility tests.
3. Decide whether `engine/family/*` compatibility will be kept for one more stabilization cycle or removed immediately.
4. If removal is chosen, remove `engine/family/*` and its compatibility tests in one narrow PR.

---

## Recommended Phase 2B Work Order

For legacy direct builders:

1. Decide whether direct builders still help debugging.
2. If yes, keep them and make docs state a sunset condition.
3. If no, delete:
   - `scripts/build-all.mjs`
   - `scripts/build-pptx.mjs`
   - `scripts/build-pdf.mjs`
   - `docs/legacy-direct-builders.md`
   - `tests/node/legacy-direct-builder-surface.test.mjs`
4. Confirm README/CONTRIBUTING still point only to the stable-core package path.

---

## Recommended Phase 3 Work Order

Only after Phase 2 decisions:

1. Create a renderer ownership table:
   - output type
   - renderer path
   - proof fixture
   - workflow coverage
   - consolidation target
2. Decide the next HTML-consolidation target:
   - `teacher_guide`
   - `lesson_overview`
   - `checkpoint_sheet`
3. Keep assessment question-type expansion separate from renderer cleanup.

---

## Bottom Line

Do not delete compatibility code yet.

The highest-value next action is to make `audit:family-residue` more precise, then use it to decide whether `engine/family/*` can be retired safely.
