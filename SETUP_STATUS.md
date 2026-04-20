# Setup status

## Engine - fully implemented on the declared stable-core path

- `engine/schema/` - canonical vocabulary, lesson-package schema validation, preflight
- `engine/pdf/` - Python/reportlab stable-core renderer with document chrome and live student short-form organizers
- `engine/pptx/` - Python/pptx slide renderer
- `engine/render/` - typed block validation, artifact classification, multipage page-role classification, template routing
- `engine/planner/` - output router and route planning
- `engine/visual/` - visual plan builder and token system
- `engine/assignment-family/` - live assignment-family selection and validation authority
- `engine/family/` - compatibility-only residue during cleanup, not the live render-plan authority

## Scripts - wired operator surface

- `npm run schema:check` - validate fixtures against schema
- `npm run route:plan` - plan routes for a package
- `npm run render:package` - render a full package (PPTX + PDF)
- `npm run qa:render` / `qa:bundle` / `qa:visual` / `qa:pedagogy-variants` - QA helpers
- `npm run generate:package` - generate a new package
- `npm test` - Node tests in `tests/node`
- `npm run test:all` - Node tests plus `pytest tests/python`
- `tests/python/` is also exercised by `.github/workflows/ci.yml`
- Legacy direct-builder scripts remain deprecated compatibility/debugging shims under `scripts/` and are invoked with `node scripts/...`; `package.json` does not expose `build:all`, `build:pptx`, or `build:pdf`

## Declared live stable-core surface

### Output types
- `teacher_guide`
- `lesson_overview`
- `slides`
- `worksheet`
- `task_sheet`
- `checkpoint_sheet`
- `exit_ticket`
- `final_response_sheet`
- `graphic_organizer`
- `discussion_prep_sheet`

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

### `CI` workflow
- runs `npm test`
- runs `pytest tests/python`

### `stable-core` workflow
- runs repo doctor and `pnpm test`
- proves benchmark single-period bundle render + bundle QA
- proves multi-day route planning (`challenge7`)
- proves evaluated assignment-family schema/route planning (`careers-8-career-clusters`)
- proves task-sheet response-pattern render path (`fixtures/tests/task-sheet-response-patterns.workshop-session.json`)
- proves seminar discussion-prep render + bundle QA (`fixtures/tests/seminar-discussion-prep.proof.json`)
- proves station-rotation graphic-organizer render + bundle QA (`fixtures/tests/station-rotation-graphic-organizer.proof.json`)
- proves PBG generated package schema/route/render smoke for ELA 10, Math 8, and Workplace Math 10

## Transitional / not yet fully consolidated

- PPTX rendering is still archive-backed behind the public entrypoint
- PDF rendering still depends on archive-backed base behavior
- some declared architectures remain more broadly declared than they are deeply regression-tested
- legacy direct-lesson builder surfaces still exist but are not the acceptance path

## Repo-truth rule

Distinguish clearly between:
- **live** - declared stable-core surface that the planner and render path accept
- **proven in CI** - surfaces exercised by current workflows and tests
- **transitional** - compatibility or archive-backed surfaces kept to avoid breaking the live path
- **deprecated/debug-only** - direct-builder residue and non-acceptance tooling
