# Contract Drift Inventory

**Audited:** 2026-05-07  
**Scope:** Repo-truth reset after assessment/quiz marking-guide work, multipage QA, and LWD render-proof failures.

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

- `teacher_guide` — Python fallback path; proof-backed, not HTML-consolidated yet
- `lesson_overview` — Python fallback path; proof-backed, not HTML-consolidated yet
- `slides` — PPTX path
- `worksheet`
- `task_sheet`
- `checkpoint_sheet` — Python fallback path; proof-backed, not HTML-consolidated yet
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

Assessment and quiz are no longer only contract stubs.

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

This fixes the LWD render-proof failure pattern where the package rendered successfully but failed only because `shared_view` had been treated as a universal hard requirement.

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

- Duplicate LWD trigger PRs should stay closed once superseded.
- The freshest LWD render-proof failure should be used as the current QA-policy validation case.
- Docs-only retirement-map work should not merge ahead of this repo-truth reset unless it is rebased and updated against this document.

---

## Recommended Next Actions

1. Merge the repo-truth and QA-policy cleanup before any new renderer/template expansion.
2. Re-run the LWD render-proof case and confirm the missing-`shared_view` blocker is gone.
3. Add answer-leak QA for student assessment/quiz PDFs and sidecars.
4. Keep Python fallback consolidation for `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` as later A5 work.
5. Continue schema-level `rubric` / `formative_check` only after answer-separation QA is stable.
