# Repo Sweep Phase 0 — Baseline Audit

Date: 2026-05-07  
Mode: repo / build / rendering / QA  
Scope: inventory and cleanup planning only. No renderer rewrites, deletions, schema changes, or template expansion.

---

## Phase 0 Goal

Create a repo-state map before cleanup work starts.

Phase 0 should answer:

1. What is live and worth protecting?
2. What is transitional but still purposeful?
3. What is compatibility residue and should be retired only after guards pass?
4. What is stale, misleading, or misnamed?
5. What should be phased into small cleanup PRs?

---

## Current Confirmed Main Checkpoint

Recently merged:

- #205 — first student-facing schema-level `assessment` / `quiz` render slice
- #206 — docs reconciliation after #205
- #207 — nine-task repo hygiene pass
- #208 — explicit teacher-only marking guides through `answer_key`

Current important open work:

- #209 is a draft unit fixture/render workflow for the Kamloops Growth Project. It is content/unit work and should not be mixed into the repo cleanup sweep.

External/handoff note:

- The uploaded `Repo Contract Drift Resolution.txt` describes a role-detection patch for a branch named `rendering/multipage-classifier-page-roles`, but that branch was not found through the GitHub connector branch search during Phase 0. Treat it as unavailable until the branch/ref is supplied or recovered.

---

## Live Surfaces to Protect

These are the accepted repo surfaces and should not be removed during cleanup:

- `pnpm run schema:check`
- `pnpm run route:plan`
- `pnpm run render:package`
- `pnpm run qa:bundle`
- `pnpm test`
- `.github/workflows/ci.yml`
- `.github/workflows/stable-core.yml`
- focused proof workflows for active render surfaces
- `engine/schema/`
- `engine/planner/`
- `engine/render/`
- `engine/pdf-html/`
- `engine/pdf/` until fallback surfaces are consolidated
- `engine/pptx/` until PPTX consolidation is finished
- `engine/assignment-family/`

---

## Phase 0 Findings

### 1. `SETUP_STATUS.md` is already slightly stale after #208

It still says `assessment` and `quiz` do not yet auto-generate a teacher-facing marking guide or answer-key PDF. That is still true for auto-generation, but #208 added explicit teacher-only `answer_key` marking-guide routes.

Cleanup implication:

- Update wording to say teacher marking guides exist through explicit `answer_key` routes.
- Keep note that auto-generated companion PDFs are not implemented.

Recommended phase: Phase 1 docs-truth cleanup.

---

### 2. A1 proof fixture name is stale

`fixtures/tests/a1-assessment-quiz.blocked-proof.json` is no longer blocked. It now proves student assessment/quiz plus explicit teacher marking-guide routes.

Cleanup implication:

- Rename or duplicate to a clearer name such as `a1-assessment-quiz.proof.json`.
- Update focused workflow and docs references.

Recommended phase: Phase 1 fixture naming cleanup.

---

### 3. `qa:coverage-report` likely uses stale package shape assumptions

`scripts/qa-coverage-report.mjs` checks `json.architecture` and `out.type`. Current packages use fields like `primary_architecture` and output routes use `output_type`.

Cleanup implication:

- Fix script to read `primary_architecture ?? architecture`.
- Fix output scanning to read `output.output_type ?? output.type`.
- Expand declared output list to include current implemented/partial types such as `assessment`, `quiz`, `answer_key`, `rubric_sheet`, `station_cards`, `pacing_guide`, `sub_plan`, and `makeup_packet` if missing.

Recommended phase: Phase 1 audit-script correctness.

---

### 4. `engine/contracts/output-type-inventory.json` still needs generated refresh

Previous docs cleanup intentionally did not hand-edit the machine-readable inventory. After #205 and #208, the human docs are ahead of the generated inventory.

Cleanup implication:

- Run/repair `scripts/audit-output-contracts.mjs` if necessary.
- Refresh `engine/contracts/output-type-inventory.json` through the script rather than manual JSON edits.

Recommended phase: Phase 1 contract inventory refresh.

---

### 5. `engine/family/*` compatibility shims still have a purpose, but need a retirement gate

`engine/family/selection.mjs`, `canonical.mjs`, and `validation.mjs` are explicit compatibility wrappers around `engine/assignment-family/*`.

Cleanup implication:

- Do not delete them during Phase 0.
- Use `pnpm run audit:family-residue` as the retirement gate.
- Decide whether tests that intentionally verify compatibility should remain until a planned removal PR.

Recommended phase: Phase 2 compatibility residue retirement decision.

---

### 6. Legacy direct-builder scripts remain deprecated but purposefully guarded

`scripts/build-all.mjs`, `scripts/build-pptx.mjs`, and `scripts/build-pdf.mjs` now contain DEPRECATED headers and runtime warnings. Tests also protect the legacy surface.

Cleanup implication:

- Do not remove immediately.
- Decide whether to keep as debug stubs, remove from docs, or schedule deletion after a release checkpoint.

Recommended phase: Phase 2 legacy surface retirement decision.

---

### 7. README still reflects older post-cutover language

README correctly explains the stable-core acceptance path and assignment-family authority, but it does not yet fully reflect #205/#208 assessment/quiz progress or the current `engine/pdf-html/` document renderer status.

Cleanup implication:

- Update README after Phase 1 doc-truth cleanup so it matches `SETUP_STATUS.md` and `CONTRIBUTING.md`.

Recommended phase: Phase 1 docs-truth cleanup.

---

### 8. Draft content/unit PR #209 should stay separate

PR #209 adds a Kamloops Growth Project package and render workflow. It is relevant to the teacher's actual classroom work, but it is not repo infrastructure cleanup.

Cleanup implication:

- Do not mix PR #209 with the repo sweep.
- Keep it draft until the repo sweep stabilizes or until the user explicitly resumes the unit.

Recommended phase: outside repo cleanup sweep.

---

## Proposed Cleanup Phases

### Phase 1 — Low-risk repo-truth and audit-script cleanup

Small, safe, high-value PRs:

1. Update `SETUP_STATUS.md`, `README.md`, and relevant docs after #208.
2. Rename A1 proof fixture away from `blocked-proof` and update workflow/docs references.
3. Fix `qa:coverage-report` field detection.
4. Refresh `engine/contracts/output-type-inventory.json` through the audit script.
5. Add a short `docs/repo-sweep-index.md` or update this file as the running cleanup tracker.

Acceptance:

```bash
pnpm test
pnpm run qa:coverage-report
pnpm run audit:family-residue || true
pnpm run schema:check -- --package fixtures/tests/a1-assessment-quiz.proof.json
pnpm run route:plan -- --package fixtures/tests/a1-assessment-quiz.proof.json --print-routes
pnpm run render:package -- --package fixtures/tests/a1-assessment-quiz.proof.json --out output
```

### Phase 2 — Compatibility residue decisions

Only after Phase 1 is green:

1. Decide fate of `engine/family/*` wrappers.
2. Decide fate of legacy direct-builder scripts.
3. Decide whether `engine/pdf/` fallback surfaces are still needed for each output type.
4. Decide whether old docs like historical handoffs should be archived, renamed, or deleted.

Acceptance:

- No removal without a guard proving no live callers remain.
- Do not delete compatibility wrappers while tests still intentionally import them unless tests are updated by design.

### Phase 3 — Render-path consolidation planning

Only after Phase 1/2 clarity:

1. Map each output type to `pdf-html`, Python fallback, or PPTX.
2. Decide which fallback PDF types move to HTML next.
3. Decide whether test/assessment formatting gets a refinement pass before expanding question types.

Acceptance:

- A renderer ownership table exists and agrees with `SETUP_STATUS.md`.

### Phase 4 — Assessment expansion, not cleanup

This is feature work and should happen after the sweep:

1. A1.4 question-type coverage proof fixture.
2. Optional BC proficiency descriptors in teacher marking guides/rubrics.
3. Grade 10–12 assessment samples.
4. Answer-leak text-scan QA.

---

## Phase 0 Recommendation

Start with Phase 1. It is small, safe, and will immediately reduce drift:

1. Rename the A1 fixture and update the workflow.
2. Fix `qa:coverage-report` so it reads real package fields.
3. Update repo-truth docs for #208.
4. Refresh output-type inventory if the audit script supports it cleanly.

Do not start deleting compatibility code yet.
