# Current Repo Status

Snapshot date: 2026-04-19

## What is already real in this repo

The repo is no longer starter scaffolding.

Present and wired now:

- stable-core schema files under `schemas/`
- package preflight and render-plan normalization under `engine/schema/`
- route planning under `engine/planner/`
- package rendering through `scripts/render-package.mjs`
- bundle and artifact QA through `scripts/qa-bundle.mjs` and `scripts/qa-render.mjs`
- visual planning and visual QA sidecars written during package rendering
- public renderer entrypoints at `engine/pptx/renderer.py` and `engine/pdf/render_stable_core_output.py`
- stable-core fixtures under `fixtures/core/`, `fixtures/generated/`, `fixtures/plan-build-grow/`, and `fixtures/tests/`
- contract tests under `tests/node/`
- Python tests under `tests/python/`
- GitHub Actions workflows for CI and stable-core proof coverage

## Live vs proven vs transitional

### Live stable-core surface

Declared output types:
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

Declared primary architectures:
- `single_period_full`
- `multi_day_sequence`
- `three_day_sequence`
- `workshop_session`
- `lab_investigation`
- `seminar`
- `project_sprint`
- `station_rotation`

### Proven in CI today

- Node tests via `npm test`
- Python tests via `pytest tests/python`
- benchmark single-period bundle render + bundle QA
- multi-day route-planning proof (`challenge7`)
- evaluated assignment-family schema/route proof (`careers-8-career-clusters`)
- task-sheet response-pattern render proof (`fixtures/tests/task-sheet-response-patterns.workshop-session.json`)
- seminar discussion-prep render + bundle QA proof (`fixtures/tests/seminar-discussion-prep.proof.json`)
- station-rotation graphic-organizer render + bundle QA proof (`fixtures/tests/station-rotation-graphic-organizer.proof.json`)
- PBG generated package schema/route/render smoke for ELA 10, Math 8, and Workplace Math 10

### Transitional

- PPTX rendering is still archive-backed behind the public entrypoint
- PDF rendering still depends on archive-backed base behavior
- legacy direct-lesson builder surfaces still exist but are not the acceptance path
- some declared architectures remain more broadly declared than they are deeply regression-tested

## What this means operationally

For stable-core package work, the live acceptance path remains:

1. `doctor`
2. `schema:check`
3. `route:plan`
4. `render:package`
5. `qa:bundle`

Anything outside that path is either support tooling, compatibility/debugging surface, or transitional renderer internals.

Repo truth now needs to be read in four buckets:
- **live** - surface the planner and renderer accept today
- **proven in CI** - surface exercised by tests and workflow smokes today
- **transitional** - compatibility or archive-backed residue still required by the live path
- **deprecated/debug-only** - older direct-builder surfaces outside stable-core acceptance

## Next hardening steps

- keep contract alignment between declared output types and artifact QA
- keep proof coverage moving closer to the declared live surface
- reduce compatibility residue under `engine/family/*` only where no live caller depends on it
- avoid renderer-consolidation work until proof and contract alignment are tighter
