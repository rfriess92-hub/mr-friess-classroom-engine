# Current Repo Status

Snapshot date: 2026-06-07

## Current repo truth

The repo has a live stable-core package renderer, a parallel classroom-activity subsystem, and a growing proof surface. The main risk is contract drift between docs, generator prompts, schema, renderer support, and QA expectations.

The output-type source of truth is `engine/contracts/output-type-inventory.json`. The human-readable drift map is `docs/CONTRACT_DRIFT_INVENTORY.md`.

Render-backed stable-core output types are: `teacher_guide`, `lesson_overview`, `slides`, `worksheet`, `task_sheet`, `checkpoint_sheet`, `exit_ticket`, `final_response_sheet`, `graphic_organizer`, `discussion_prep_sheet`, `rubric_sheet`, `station_cards`, `answer_key`, `pacing_guide`, `sub_plan`, `makeup_packet`, `assessment`, and `quiz`.

Schema-only output types are intentionally blocked until implemented: `rubric`, `formative_check`, `warm_up`, `vocabulary_card`, `observation_grid`, and `lesson_reflection`.

Primary architectures remain: `single_period_full`, `multi_day_sequence`, `three_day_sequence`, `workshop_session`, `lab_investigation`, `seminar`, `project_sprint`, and `station_rotation`.

## Wired surfaces

Present and wired now:

- stable-core schema files under `schemas/`
- package preflight and render-plan normalization under `engine/schema/`
- live assignment-family selection under `engine/assignment-family/`
- route planning under `engine/planner/`
- package rendering through `scripts/render-package.mjs`
- package generation through `scripts/generate-package.mjs`
- required-output preservation through `engine/generation/brief-output-contract.mjs`
- bundle and artifact QA through `scripts/qa-bundle.mjs` and `scripts/qa-render.mjs`
- page-role classification and QA under `engine/render/`
- visual planning and sidecars during package rendering
- public renderer entrypoints at `engine/pptx/renderer.py` and `engine/pdf/render_stable_core_output.py`
- HTML/PDF rendering under `engine/pdf-html/`
- contract tests under `tests/node/`
- Python tests under `tests/python/`

## Proven in CI today

CI proves Node tests, Python tests, selected stable-core route/render/bundle fixtures, A1 assessment/quiz render proof, output-contract drift tests, and generated-package required-output preservation tests.

This is meaningful coverage, but it is not the same as full regression proof for every declared architecture and output type combination.

## Transitional

- PPTX rendering is still transitional behind the public entrypoint.
- `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` remain proof-backed through the Python fallback path until A5 consolidation.
- legacy direct-lesson builder surfaces still exist but are not the acceptance path.
- some declared architectures remain more broadly declared than they are deeply regression-tested.
- generated-package classroom quality still depends on the full acceptance chain, not schema validity alone.

## Operational rule

For stable-core package work, the live acceptance path remains: `doctor` when structure changes, then `schema:check`, `route:plan`, `render:package`, and `qa:bundle`.

`qa:render` is a single-artifact drill-down tool.

Generated packages must preserve the brief's `required_outputs` into both `bundle.declared_outputs` and routable package outputs. Missing requested outputs are generation failures.

## Next hardening steps

- keep `engine/contracts/output-type-inventory.json`, `docs/CONTRACT_DRIFT_INVENTORY.md`, `SETUP_STATUS.md`, and `README.md` aligned whenever output support changes
- keep generated-package acceptance tied to the full chain: brief required outputs -> package outputs -> route plan -> rendered artifacts -> bundle QA
- expand classroom-substance QA beyond structural artifact existence
- keep proof coverage moving closer to the declared live surface
