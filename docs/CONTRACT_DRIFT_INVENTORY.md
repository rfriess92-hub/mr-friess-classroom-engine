# Contract Drift Inventory

**Audited:** 2026-05-15  
**Scope:** Repo-truth refresh after compact-template adaptation, the live assessment/quiz HTML path, and the emergence of the parallel classroom-activity subsystem.

This document is the human-readable contract map. Keep it aligned with:

- `SETUP_STATUS.md`
- `engine/contracts/output-type-inventory.json`
- `scripts/audit-output-contracts.mjs`
- `scripts/qa-bundle.mjs`
- focused render workflows under `.github/workflows/`

---

## Current Stable-Core Surface

### Production / usable output types

The following output types are expected to route and render through the normal package pipeline:

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

### Still schema-only / blocked at render

These output types are declared but intentionally blocked until deliberately implemented:

- `rubric`
- `formative_check`
- `warm_up`
- `vocabulary_card`
- `observation_grid`
- `lesson_reflection`

The renderer should fail loudly if these are declared as package outputs before implementation. It should not silently skip them.

---

## Assessment / Quiz Truth

Assessment and quiz are no longer contract stubs.

Current behavior:

- `assessment` and `quiz` render student-facing PDFs through the HTML renderer.
- Student assessment/quiz PDFs should not render `answer_key` or `marking_notes` fields.
- Teacher marking guides are implemented through explicit teacher-only `answer_key` routes when sourced from assessment/quiz question sections.
- Marking guides are not auto-generated companion files. Packages must declare the teacher-only route.

Remaining work:

- Add stronger answer-leak text-scan QA across rendered student PDFs and sidecars.
- Continue visual polish for traditional test/quiz formatting.
- Add question-bank pulling only after render and answer-separation behavior is stable.

Do not revive the older A1.3 decision text that says teacher marking guides still need to be designed. The current decision is explicit teacher-only `answer_key` routes first.

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

Current policy after the repo-truth cleanup:

- `teacher_only` and `student_facing` coverage are required by default.
- `shared_view` coverage is required only when the package or QA contract explicitly declares that shared-view coverage is required.
- `qa:bundle` still blocks missing declared artifacts, duplicate artifact names, invalid final-evidence roles, blocked artifact QA, and invalid variant groups.
- Artifact-level `revise` findings do not necessarily mean the renderer failed. They mean the bundle needs patch/review before classroom shipping.

This fixed the LWD render-proof failure pattern where the package rendered successfully but failed only because `shared_view` had been treated as a universal hard requirement.

---

## Parallel Activity Subsystem Truth

The repo now contains a parallel classroom-activity subsystem under:

- `activity-library/`
- `engine/activity-family/`
- `schemas/classroom-activity.schema.json`
- related activity-bank / activity-family / activity-bridge schemas and scripts

Important boundary:

- This subsystem is real and should be treated as live repo surface area.
- It is not the same thing as the stable-core lesson-package output contract.
- Do not mix activity-family routing assumptions into `engine/contracts/output-type-inventory.json` unless those artifacts become stable-core output types.

---

## Layout Template Coverage

These layout-template families are usable through central package rendering when attached to supported output types:

- Classroom worksheet system layouts
- Planter volume decision layout
- Literacy vocabulary layouts
- Assessment visual layouts
- Classroom toolkit layouts
- Assessment/quiz student test layouts
- Answer-key marking-guide layouts

Important distinction:

- Output types are schema/router-level artifact declarations, such as `quiz`, `assessment`, `vocabulary_card`, or `rubric`.
- Layout template IDs are specialized visual treatments under supported output types, such as `frayer_model`, `vocabulary_cards`, `bc_rubric`, `student_self_assessment`, `kwhl_chart`, `choice_board`, or `scaffolded_quiz`.
- A layout can render while a same-looking standalone output type remains schema-only. For example, `vocabulary_cards` can render as a layout under a worksheet/graphic organizer, while schema-level `vocabulary_card` remains unimplemented.

---

## Current Repo Noise / Cleanup State

- The machine-readable inventory had drifted behind the live renderer and now needs to stay coupled to `scripts/audit-output-contracts.mjs`.
- Duplicate LWD trigger PRs should stay closed once superseded.
- Docs-only repo-truth work should not merge ahead of this refresh unless it is rebased and revalidated.

---

## Recommended Next Actions

1. Keep `engine/contracts/output-type-inventory.json` and `scripts/audit-output-contracts.mjs` aligned whenever render support changes.
2. Add answer-leak QA for student assessment/quiz PDFs and sidecars.
3. Keep Python fallback consolidation for `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` as later A5 work.
4. Publish the docs-first grade-band contracts under `docs/grade-band-contracts/` when that docs-only slice is ready.
5. Decide whether the classroom-activity subsystem needs its own contract inventory document rather than being tracked informally.
