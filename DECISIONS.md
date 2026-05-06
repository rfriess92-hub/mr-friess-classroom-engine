# Decisions Log

Running record of architectural and structural decisions for repo operation.

---

## 2026-05-06 - Assessment and quiz use the existing pdf-html renderer path

**Decision:** Schema-level `assessment` and `quiz` output types render through the existing `engine/pdf-html/render.mjs` Playwright/Chromium path.

**Decision:** Do not add a parallel `engine/html/renderer.js` or `--format html` acceptance path unless the project deliberately chooses a future renderer refactor.

**Decision:** Student-facing `assessment` and `quiz` PDFs must not render `answer_key`, `marking_notes`, model answers, or teacher-only scoring notes.

**Decision:** Traditional test formatting is the default direction for `assessment` and `quiz`: plain title, name/date/score lines, simple instructions, numbered questions, inline marks, and minimal decoration.

**Reason:** PR #205 implemented the first A1.2 renderer slice by following the repo's existing HTML/PDF architecture: register the output types in `engine/pdf-html/render.mjs`, remove only those types from `KNOWN_UNIMPLEMENTED_TYPES`, and prove rendering through the normal `render:package` path. This avoided creating a second renderer system and reduced contract drift.

**Implementation note:** The current implementation is a first student-facing slice. Future work should improve test formatting and add a teacher-only marking guide / answer-key route without leaking answer fields into student PDFs.

---

## 2026-04-19 - Assignment-family cutover is complete in the live render-plan path

**Decision:** `engine/assignment-family/*` is now the live family-selection authority for the stable-core render-plan path.

**Decision:** `engine/family/*` remains compatibility-only residue and should be documented that way.

**Reason:** `engine/schema/render-plan.mjs` imports `engine/assignment-family/package-selector.mjs` directly, so repo-truth docs should no longer describe `engine/family/*` as the live path.

**Implementation note:** Keep the compatibility shims until remaining explicit callers are retired deliberately. Do not reopen broad family cleanup in this doc-truth slice.

---

## 2026-04-12 - Stable-core render contract and assignment-family authority were temporarily split during cutover

**Decision:** The stable-core package remained the live render contract during cutover.

**Decision:** The assignment-family layer was the authoritative upstream pedagogy/authoring contract during cutover.

**Decision:** `engine/assignment-family/` was the intended long-term source of truth for family definitions, routing rules, chain recommendations, required upstream assignment metadata, and family integrity expectations.

**Decision:** During cutover, `engine/family/` served as transitional compatibility code on the live render-plan path rather than the architectural end-state.

**Decision:** During cutover, docs needed to distinguish clearly between:

- what was live at that point
- what was compatibility-only
- what was the intended authoritative path after cleanup

**Reason:** At the time of this entry, the repo contained two overlapping family systems and the live-path cutover was still underway. Recording that temporary split reduced rule drift and operator confusion while the direct `engine/assignment-family/*` path was being finished.

**Implementation note:** The safe migration order was:

1. document the contract split
2. add an authoritative package-facing selector under `engine/assignment-family/`
3. switch `engine/schema/render-plan.mjs` to that authoritative path
4. demote `engine/family/*` to explicit compatibility shims
5. only then remove dead duplicate logic

**Validation note:** `schema:check` remained the live stable-core gate during the cutover. Assignment-family validation was expected to enter the acceptance path only after generation and package metadata were aligned enough to support it cleanly.

---

## 2026-04-11 - Workflow docs aligned to the live solo operating model

**Decision:** `README.md`, `DECISIONS.md`, and `docs/stable-core-workflow-policy.md` should describe the same live workflow: lightweight solo operation, local command gates, and the stable-core package path as the acceptance route.

**Decision:** `content` / `renderer` / `qa` / `tooling` remain useful intent labels for branches and PRs, but they are not a hard ceremony system.

**Decision:** Until CI exists, local command execution is the real gate. Use `doctor` when repo structure or entrypoints change, then use `schema:check` -> `route:plan` -> `render:package` -> `qa:bundle` as the stable-core acceptance path.

**Decision:** Legacy direct builders remain compatibility/debugging surfaces, not stable-core acceptance proof.

---

## 2026-04-10 - Content files: authoritative location is engine/content/

**Decision:** `engine/content/` is the single authoritative location for lesson content JSON files. Root-level copies are not allowed.

**Reason:** `careers8_goal_setting.json` and `science9_interconnected_spheres.json` existed at both root and `engine/content/` with material differences. The richer root versions were promoted into `engine/content/`, and the root copies were removed.

**Enforced by:** `scripts/doctor.mjs` fails on root-level lesson JSON duplicates.

---

## 2026-04-10 - PPTX renderer: authoritative entrypoint is engine/pptx/renderer.py

**Decision:** `engine/pptx/renderer.py` is the single authoritative public entrypoint for PPTX rendering.

**Implementation note:** Historical renderer modules were moved under `engine/pptx/archive/`. During transition, `renderer.py` delegates to the archived chain so the repo has one stable active path while the historical files stay preserved.

**Enforced by:** `scripts/doctor.mjs` fails if archived renderer filenames reappear at active top-level PPTX paths.

---

## 2026-04-10 - Governance: decisions log replaces PR-class ceremony

**Decision:** Solo repo operation now uses this decisions log plus lightweight branches/PRs. The old PR-class governance overhead is not the live control surface.

---
