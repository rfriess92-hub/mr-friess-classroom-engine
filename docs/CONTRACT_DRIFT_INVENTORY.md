# Contract Drift Inventory

**Audited:** 2026-05-06  
**Scope:** Output-type support across schema, canonical vocabulary, router, renderer, classifier, template, QA, fixtures, and focused proof renderers.  
**Machine-readable source:** `engine/contracts/output-type-inventory.json`  
**Audit script:** `node scripts/audit-output-contracts.mjs`

---

## Status Summary — Output Types

| Status | Count | Output Types |
|--------|-------|-------------|
| `production` | 13 | task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, answer_key, pacing_guide, sub_plan, makeup_packet, slides, graphic_organizer |
| `partial` | 3 | teacher_guide, lesson_overview, checkpoint_sheet |
| `schema_only` | 8 | assessment, quiz, rubric, formative_check, warm_up, vocabulary_card, observation_grid, lesson_reflection |
| `experimental` | 0 | — |
| `drifted` | 0 | — |
| `unsupported` | 0 | — |

Total output types: **24**

Important distinction:

- **Output types** are schema/router-level artifact types declared in package `outputs[]`, such as `quiz`, `assessment`, `vocabulary_card`, or `rubric`.
- **Layout template IDs** are specialized page designs used under existing output types, such as `frayer_model`, `vocabulary_cards`, `bc_rubric`, `student_self_assessment`, `kwhl_chart`, `choice_board`, or `scaffolded_quiz`.
- A layout can exist and render while the same-looking output type remains schema-only. Example: `vocabulary_cards` can render as a layout under `worksheet`/`graphic_organizer`, while schema-level `vocabulary_card` remains unimplemented as a standalone output type.

---

## Render Path Coverage — Output Types

```
task_sheet             [HTML] [Python]
final_response_sheet   [HTML] [Python]
exit_ticket            [HTML] [Python]
worksheet              [HTML] [Python]
discussion_prep_sheet  [HTML] [Python]
rubric_sheet           [HTML]
station_cards          [HTML]
answer_key             [HTML]
pacing_guide           [HTML]
sub_plan               [HTML]
makeup_packet          [HTML]
graphic_organizer      [HTML] [Python]
slides                          [PPTX]
teacher_guide                  [Python]
lesson_overview                [Python]
checkpoint_sheet               [Python]
assessment             ← BLOCKED_UNIMPLEMENTED
quiz                   ← BLOCKED_UNIMPLEMENTED
rubric                 ← BLOCKED_UNIMPLEMENTED
formative_check        ← BLOCKED_UNIMPLEMENTED
warm_up                ← BLOCKED_UNIMPLEMENTED
vocabulary_card        ← BLOCKED_UNIMPLEMENTED
observation_grid       ← BLOCKED_UNIMPLEMENTED
lesson_reflection      ← BLOCKED_UNIMPLEMENTED
```

`planter_volume_decision` is a dedicated `layout_template_id` path inside the HTML renderer, not a standalone output type.

---

## Layout Template Coverage

### Central HTML render path

The following layout-template families are wired through `engine/pdf-html/render.mjs` and can render from normal package routes when used under supported output types:

| Module | Layout examples | Notes |
|--------|-----------------|-------|
| `classroom-worksheet-system.mjs` | generic organizers, reading response, CER, Cornell/two-column style pages, exit/reflection-style pages | Main reusable worksheet/graphic organizer system. |
| `planter-volume-decision.mjs` | `planter_volume_decision` | Dedicated Math 8 classroom decision layout. |
| `literacy-vocabulary-tools.mjs` | `frayer_model`, `frayer_vocabulary`, `vocabulary_cards`, `vocab_cards`, `prefix_root_word_study` | Layout-level vocabulary tools. This does not implement schema-level `vocabulary_card`. |
| `assessment-visual-tools.mjs` | `bc_rubric`, `student_self_assessment`, `self_assessment`, `assessment_rubric`, `rubric_feedback` | Layout-level assessment/rubric/self-assessment tools. This does not implement schema-level `rubric` or `formative_check`. |

### Focused proof renderer only

The following toolkit layouts currently render through a focused sample renderer/workflow, not through central `render:package` routing:

| Module | Layout examples | Proof path | Integration status |
|--------|-----------------|------------|--------------------|
| `classroom-toolkit-templates.mjs` | `kwhl_chart`, `fishbone_diagram`, `sentence_frame_card`, `choice_board`, `scaffolded_quiz` | `scripts/render-classroom-toolkit-sample.mjs` and `.github/workflows/classroom-toolkit-render.yml` | Proven as direct Playwright/PDF templates; not yet wired into central `engine/pdf-html/render.mjs`. |

Decision needed: either keep these focused-render-only until A1/B5 stabilize, or add a small central-router patch that imports `isClassroomToolkitLayout` / `buildClassroomToolkitHTML` and routes those layout IDs before generic classroom templates.

---

## Current Findings

### 1. Eight schema-only output types are blocked until implemented (MEDIUM)

`assessment`, `quiz`, `rubric`, `formative_check`, `warm_up`, `vocabulary_card`, `observation_grid`, and `lesson_reflection` exist in canonical vocabulary, the lesson schema enum, the output router, and the canonical audience/architecture maps. They still have no output-type render implementation.

**Current behavior:** `render-package.mjs` lists these output types in `KNOWN_UNIMPLEMENTED_TYPES`. If a package declares one, rendering exits with a clear error instead of logging a skip and producing an incomplete artifact bundle.

**Clarification:** Some similar classroom surfaces already exist as layout-template IDs. Those do not remove the schema-only status of the standalone output types.

**Next fix:** Implement `assessment` and `quiz` first in A1. Remove each type from `KNOWN_UNIMPLEMENTED_TYPES` only when its renderer, proof fixture, smoke test, and answer-separation behavior are in place.

---

### 2. Classroom toolkit templates are proven but not centrally routed (MEDIUM)

`classroom-toolkit-templates.mjs` can render KWHL, fishbone, sentence-frame card, choice board, and scaffolded quiz pages through the focused sample renderer. The focused workflow uploads `classroom-toolkit-sample-docs`.

**Current behavior:** These layouts are not yet imported by `engine/pdf-html/render.mjs`, so a normal `render:package` route using `layout_template_id: kwhl_chart` would not automatically select the toolkit renderer unless it is handled by another existing layout family.

**Next fix:** Add a small routing PR, or explicitly keep this module focused-render-only for now.

---

### 3. Long Way Down v5 source-of-truth is workflow-generated (LOW/MEDIUM)

The focused LWD workflow builds `fixtures/generated/long-way-down-graphic-novel-study.grade8-ela.v5.json` from v4 using `scripts/build-lwd-v5-package.mjs`, then renders v5.

**Current behavior:** The v5 workflow is valid, but the package source of truth is less obvious than a checked fixture.

**Next fix:** Decide whether to commit the generated v5 fixture or keep the builder and document that v5 is a derived package.

---

### 4. PR #199 is stale after #200 (LOW)

PR #199 adds the older Long Way Down base package to `stable-core`. PR #200 merged the focused LWD v5 workflow and toolkit proof work.

**Current behavior:** PR #199 remains open but should not be merged as-is.

**Next fix:** Close #199 or re-scope it to the v5 source-of-truth/stable-core decision.

---

### 5. `teacher_guide` remains Python-only (LOW)

`teacher_guide` renders through the Python PDF path. It is valid and proof-covered, but it is not yet consolidated onto the HTML/Playwright renderer surface.

**Next fix:** Add a teacher-guide HTML template in A5 after A1/A2 are stable.

---

### 6. `lesson_overview` and `checkpoint_sheet` remain partial (MEDIUM)

`lesson_overview` and `checkpoint_sheet` are in `DOC_OUTPUT_TYPES` and remain proof-backed through the Python path. They still have no dedicated HTML template.

**Next fix:** Keep current proof coverage, then add HTML templates during A5 if render consolidation remains the goal.

---

### 7. Nightly agent Node version differs from core render workflows (LOW)

Most core render/review workflows use Node 20. The Nightly Repo Agent currently uses Node 22.

**Next fix:** Align nightly to Node 20 unless there is a documented reason for Node 22.

---

## Resolved Since Initial Audit

- Schema-only output types no longer silently skip render; they fail loudly through `KNOWN_UNIMPLEMENTED_TYPES`.
- `variant_role` schema/preflight compatibility is aligned for `scaffolded`, `core`, `shared_core`, `supported`, `support`, and `extension`.
- `graphic_organizer` is now HTML-backed through the classroom worksheet template system.
- The sample-output-review workflow renders representative Mr Friess engine docs.
- `planter_volume_decision` is wired as a dedicated classroom worksheet layout path.
- PPTX rendering was reset to an HTML/Playwright screenshot-to-PPTX pipeline.
- Literacy vocabulary layouts are centrally routed.
- Assessment visual layouts are centrally routed.
- Long Way Down v5 has a focused render workflow.
- Classroom toolkit layouts have a focused proof renderer/workflow.

---

## What Is Production-Ready

The following 13 output types are coherent across render path, routing, typed blocks, classifier/template support, QA, and fixture proof:

- **Student-facing:** task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, makeup_packet, graphic_organizer
- **Teacher-facing:** answer_key, pacing_guide, sub_plan
- **Shared:** slides

The following layout-template families are usable through central package rendering when attached to supported output types:

- Classroom worksheet system layouts
- Planter volume decision layout
- Literacy vocabulary layouts
- Assessment visual layouts

The following layout-template family is proof-rendered but not central-rendered:

- Classroom toolkit layouts: KWHL, fishbone, sentence-frame card, choice board, scaffolded quiz

---

## What Is Partial

| Type / Surface | Missing |
|----------------|---------|
| `teacher_guide` output type | No HTML template — Python path only. Works but not on the HTML consolidation path. |
| `lesson_overview` output type | No HTML template. Python path is proof-backed. |
| `checkpoint_sheet` output type | No HTML template. Python path is proof-backed. |
| `classroom-toolkit-templates.mjs` layouts | Focused renderer exists; central `render:package` routing decision still pending. |
| Long Way Down v5 package | Focused workflow builds v5 from v4; source-of-truth decision still pending. |

---

## Recommended Next Actions

1. **Close or re-scope PR #199.** Do not merge it as-is.
2. **Decide classroom toolkit routing.** Either add a surgical central-router patch or keep the focused workflow as the only proof path until A1/B5 stabilize.
3. **Normalize Long Way Down v5.** Commit generated v5 or document the builder as the source of truth.
4. **Review artifacts.** Inspect `sample-output-review`, `lwd-graphic-novel-rendered-docs`, and `classroom-toolkit-sample-docs` before new template expansion.
5. **A1 assessment foundation.** Add question banks, assessment/quiz HTML templates, render wiring, proof fixture, smoke test, and answer-key separation.
6. **A5 later.** Consolidate `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` onto HTML only after A1/A2 stabilize.

---

## Files

| File | Purpose |
|------|---------|
| `engine/contracts/output-type-inventory.json` | Machine-readable per-type status record |
| `scripts/audit-output-contracts.mjs` | Runnable audit script — prints render coverage and drift findings |
| `tests/node/output-contract-drift.test.mjs` | CI guard — fails if types are unclassified or production types lose render paths |
| `docs/CONTRACT_DRIFT_INVENTORY.md` | This document |
| `engine/pdf-html/templates/classroom-toolkit-templates.mjs` | Focused-render classroom toolkit templates |
| `scripts/render-classroom-toolkit-sample.mjs` | Focused renderer for classroom toolkit sample PDFs |
| `.github/workflows/classroom-toolkit-render.yml` | Focused toolkit artifact workflow |
| `scripts/build-lwd-v5-package.mjs` | Builds the Long Way Down v5 package from v4 for focused rendering |
