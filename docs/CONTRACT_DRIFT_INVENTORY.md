# Contract Drift Inventory

**Audited:** 2026-06-07  
**Scope:** Repo-truth refresh after generated-package required-output hardening, the live assessment/quiz HTML path, and the parallel classroom-activity subsystem.

This document is the human-readable contract map. Keep it aligned with:

- `SETUP_STATUS.md`
- `README.md`
- `engine/contracts/output-type-inventory.json`
- `scripts/audit-output-contracts.mjs`
- `scripts/generate-package.mjs`
- `scripts/qa-bundle.mjs`
- focused render workflows under `.github/workflows/`

---

## Current Stable-Core Surface

Production / usable output types:

- `teacher_guide` - Python fallback path; proof-backed, not HTML-consolidated yet
- `lesson_overview` - Python fallback path; proof-backed, not HTML-consolidated yet
- `slides` - PPTX path
- `worksheet`
- `task_sheet`
- `checkpoint_sheet` - Python fallback path; proof-backed, not HTML-consolidated yet
- `exit_ticket`
- `final_response_sheet`
- `graphic_organizer`
- `discussion_prep_sheet`
- `pacing_guide`
- `sub_plan`
- `makeup_packet`
- `rubric_sheet`
- `station_cards`
- `answer_key`
- `assessment`
- `quiz`

Still schema-only / blocked at render:

- `rubric`
- `formative_check`
- `warm_up`
- `vocabulary_card`
- `observation_grid`
- `lesson_reflection`

The renderer should fail loudly if these are declared as package outputs before implementation. It should not silently skip them.

---

## Generated Package Truth

Generated packages are not trusted merely because they parse as JSON or pass schema.

Current generation checks:

- `generate:package` enforces that the brief's `required_outputs` field survives into both `bundle.declared_outputs` and routable package outputs.
- `generate:package` maps ordinary teacher phrasing such as PowerPoint, PPT, slide deck, student packet, marking guide, and answer guide to canonical output types before checking requested-output preservation.
- `generate:package` runs schema and route checks after generation.
- `generate:package --full-check` additionally runs `render:package` and `qa:bundle`.

Known rule:

- Missing requested outputs are generation failures, not subjective classroom-review issues.
- Schema validity is not classroom readiness.

---

## Assessment / Quiz Truth

Assessment and quiz are no longer contract stubs.

Current behavior:

- `assessment` and `quiz` render student-facing PDFs through the HTML renderer.
- Student assessment/quiz PDFs should not render `answer_key` or `marking_notes` fields.
- Teacher marking guides are implemented through explicit teacher-only `answer_key` routes when sourced from assessment/quiz question sections.
- Marking guides are not auto-generated companion files. Packages must declare the teacher-only route.
- Answer-leak QA is wired through bundle QA and should keep expanding as templates and sidecars evolve.

Remaining work:

- Continue visual polish for traditional test/quiz formatting.
- Add question-bank pulling only after render and answer-separation behavior is stable.

Do not revive older text that says `assessment` and `quiz` still fail at render time.

---

## Multipage Artifact QA Truth

Multipage classifier/page-role work is active and should remain guarded.

Current checks include:

- Student packet: visible phase progression, distinct phase treatment, reference/planner treatment, and checklist completion close.
- Teacher guide: early workflow entry, timing/sequence promotion, distinct project tools, model exemplar, assessment reference, and non-flattened support stream.

Known rule:

- These checks are meant to catch flattened multi-page artifacts. They are not general-purpose content review.
- If a generated package fails one of these checks, fix role detection or authored section structure before weakening the QA rule.

---

## Bundle QA Truth

`qa:bundle` is a shipping gate, not a pure render-proof gate.

Current policy:

- `teacher_only` and `student_facing` coverage are required by default.
- `shared_view` coverage is required only when the package or QA contract explicitly declares that shared-view coverage is required.
- `qa:bundle` blocks missing declared artifacts, duplicate artifact names, invalid final-evidence roles, blocked artifact QA, answer leakage, and invalid variant groups.
- Artifact-level `revise` findings do not necessarily mean the renderer failed. They mean the bundle needs patch/review before classroom shipping.

---

## Parallel Activity Subsystem Truth

The repo contains a parallel classroom-activity subsystem under `activity-library/`, `engine/activity-family/`, `schemas/classroom-activity.schema.json`, and related activity-bank / activity-family / activity-bridge schemas and scripts.

Important boundary:

- This subsystem is real and should be treated as live repo surface area.
- It is not the same thing as the stable-core lesson-package output contract.
- Do not mix activity-family routing assumptions into `engine/contracts/output-type-inventory.json` unless those artifacts become stable-core output types.

---

## Layout Template Coverage

Layout-template families are usable through central package rendering when attached to supported output types. A layout can render while a same-looking standalone output type remains schema-only. For example, `vocabulary_cards` can render as a layout under a worksheet/graphic organizer, while schema-level `vocabulary_card` remains unimplemented.

---

## Recommended Next Actions

1. Keep `engine/contracts/output-type-inventory.json`, `scripts/audit-output-contracts.mjs`, `README.md`, and `SETUP_STATUS.md` aligned whenever render support changes.
2. Keep generated-package required-output preservation enforced before render work begins.
3. Expand classroom-substance QA beyond structural artifact existence and shallow text checks.
4. Keep Python fallback consolidation for `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` as later A5 work.
5. Decide whether the classroom-activity subsystem needs its own contract inventory document.
