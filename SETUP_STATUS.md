# Setup status

## Engine - implemented on the declared stable-core path

- `engine/schema/` - canonical vocabulary, lesson-package schema validation, preflight
- `engine/pdf-html/` - Playwright/Chromium HTML-to-PDF renderer for the active document surface
- `engine/pdf/` - Python/ReportLab fallback and transitional document renderer for remaining non-consolidated doc types
- `engine/pptx/` - PPTX slide renderer; current classroom slide path uses HTML/Playwright screenshots before PPTX assembly
- `engine/render/` - typed block validation, artifact classification, multipage page-role classification, template routing
- `engine/planner/` - output router and route planning
- `engine/visual/` - visual plan builder and token system
- `engine/assignment-family/` - live assignment-family selection and validation authority
- `engine/family/` - compatibility-only residue during cleanup, not the live render-plan authority

## Scripts - wired operator surface

- `pnpm run schema:check` - validate fixtures against schema
- `pnpm run route:plan` - plan routes for a package
- `pnpm run render:package` - render a full package (PPTX + PDF)
- `pnpm run qa:render` / `qa:bundle` / `qa:visual` / `qa:pedagogy-variants` - QA helpers
- `pnpm run generate:package` - generate a new package
- `pnpm test` - Node tests in `tests/node`
- `pnpm run test:all` - Node tests plus `pytest tests/python`
- Legacy direct-builder scripts remain deprecated compatibility/debugging shims under `scripts/`
- fixture shortcuts in `scripts/lib.mjs` cover core, generated, PBG, and proof/test packages used in current operator flows

## Declared live stable-core surface

### Output types

Implemented render path:

- `teacher_guide` — Python fallback path; proof-backed, not yet HTML-consolidated
- `lesson_overview` — Python fallback path; proof-backed, not yet HTML-consolidated
- `slides`
- `worksheet`
- `task_sheet`
- `checkpoint_sheet` — Python fallback path; proof-backed, not yet HTML-consolidated
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
- `assessment` — first student-facing HTML render slice implemented in #205; future improvement needed for visual polish and teacher marking guide
- `quiz` — first student-facing HTML render slice implemented in #205; future improvement needed for visual polish and teacher marking guide

Still schema-only / blocked at render until deliberately implemented:

- `rubric`
- `formative_check`
- `warm_up`
- `vocabulary_card`
- `observation_grid`
- `lesson_reflection`

### Primary architectures

- `single_period_full`
- `multi_day_sequence`
- `three_day_sequence`
- `workshop_session`
- `lab_investigation`
- `seminar`
- `project_sprint`
- `station_rotation`

## Proven surface in CI today

- `CI` runs install, Playwright Chromium install, Node tests, and Python tests
- `stable-core` proves core route/render/QA surfaces
- `classroom-toolkit-render` proves direct and central toolkit rendering
- `toolkit-multi-class-samples` proves toolkit transfer across six subject samples
- `lwd-graphic-novel-render` proves the Long Way Down v5 focused render path
- `a1-assessment-quiz-render` proves schema-level `assessment` and `quiz` render as student-facing PDFs through the normal package renderer

## Transitional / not yet fully consolidated

- `assessment` and `quiz` render as student PDFs, but their traditional test formatting should continue to improve through artifact review
- `assessment` and `quiz` do not yet auto-generate a teacher-facing marking guide or answer-key PDF
- `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` remain proof-backed through the Python fallback path until A5 render hardening
- some declared architectures remain more broadly declared than they are deeply regression-tested
- legacy direct-lesson builder surfaces still exist but are not the acceptance path

## Repo-truth rule

Distinguish clearly between:

- **live** - declared surface that the planner and render path accept
- **proven in CI** - surfaces exercised by current workflows and tests
- **transitional** - compatibility, fallback, or first-slice implementations kept to avoid breaking the live path
- **deprecated/debug-only** - direct-builder residue and non-acceptance tooling
