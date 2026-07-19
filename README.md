# mr-friess-classroom-engine

Repository for the Mr. Friess Classroom Engine stable-core render pipeline and upstream assignment-family contract.

## Current operating model

The stable-core package is the live machine-facing render contract. The assignment-family layer is the authoritative upstream pedagogy/authoring contract. `engine/assignment-family/*` is the live family-selection authority; `engine/family/*` is compatibility-only residue during cleanup.

For stable-core package work, the acceptance path is:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints change
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

`qa:render` is a drill-down tool for one artifact. It is not the package-level shipping gate.

Generated packages have an additional guard: the brief's `required_outputs` field must survive into both `bundle.declared_outputs` and routable package outputs. `generate:package` enforces that contract before accepting the generated package as structurally usable. Use `--full-check` when a generated package needs render and bundle QA proof immediately.

## Current output-type truth

The source of truth is `engine/contracts/output-type-inventory.json`, with the human-readable summary in `docs/CONTRACT_DRIFT_INVENTORY.md`.

Render-backed stable-core output types are: `teacher_guide`, `lesson_overview`, `slides`, `worksheet`, `task_sheet`, `checkpoint_sheet`, `exit_ticket`, `final_response_sheet`, `graphic_organizer`, `discussion_prep_sheet`, `rubric_sheet`, `station_cards`, `answer_key`, `pacing_guide`, `sub_plan`, `makeup_packet`, `assessment`, and `quiz`.

Schema-only output types are intentionally blocked at render time until deliberately implemented: `rubric`, `formative_check`, `warm_up`, `vocabulary_card`, `observation_grid`, and `lesson_reflection`.

Do not describe a schema-only output type as classroom-ready. A same-looking layout template may be usable under another output type while the standalone output type remains blocked.

## Repo surfaces

Stable-core package surfaces include `schemas/`, `engine/schema/`, `engine/planner/`, `engine/render/`, `engine/pdf-html/`, `engine/pdf/`, `engine/pptx/`, `scripts/`, `fixtures/`, `engine/contracts/output-type-inventory.json`, `docs/CONTRACT_DRIFT_INVENTORY.md`, `docs/stable-core-workflow-policy.md`, and `DECISIONS.md`.

Assignment-family and upstream authoring surfaces include `engine/assignment-family/`, `engine/assignment-family/config/`, and `schemas/canonical-assignment.schema.json`.

Transitional and compatibility surfaces include `engine/family/`, the Python fallback document paths for `teacher_guide`, `lesson_overview`, and `checkpoint_sheet`, the transitional PPTX internals behind `engine/pptx/renderer.py`, and the deprecated direct-builder scripts under `scripts/`.

## Teacher-operated product templates

Teacher-operated spreadsheet products are documented under `products/`. They remain outside the stable-core render contract and are independently usable.

- `products/general-course-tracker/`
- `products/literacy-intervention-tracker/`
- `products/email-generator/`

Cross-product integration is governed by `contracts/communication-bridge-v1.md` and `integration/tracker-email-integration-plan.md`. The email generator must consume the versioned bridge rather than raw tracker sheets. Real student data, live school Sheet URLs, credentials, and contact details must not be committed.

## Local commands

Install dependencies:

```bash
pnpm install
pnpm exec playwright install chromium
python -m pip install --upgrade pip reportlab python-pptx pypdf pillow lxml
```

Generate a package from a teacher brief:

```bash
pnpm run generate:package -- --brief briefs/templates/teacher-lesson-brief-v1.md
```

Generate and run the full render/QA acceptance chain:

```bash
pnpm run generate:package -- --brief briefs/templates/teacher-lesson-brief-v1.md --full-check
```

Run the package acceptance path manually:

```bash
pnpm run schema:check -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json
pnpm run route:plan -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --print-routes
pnpm run render:package -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --out output
pnpm run qa:bundle -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --out output
```

Drill down on a single artifact only when needed:

```bash
pnpm run qa:render -- --artifact output/ela_8_community_issue_argument/day2_slides.pptx
```

## Test surfaces

`pnpm test` runs Node tests only. `pnpm run test:all` runs Node tests plus `pytest tests/python`. `.github/workflows/ci.yml` runs the Node test command plus Python tests. `.github/workflows/stable-core.yml` runs selected stable-core schema, route, render, and bundle proof coverage. `.github/workflows/a1-assessment-quiz-contract.yml` proves schema-level `assessment` and `quiz` student PDFs plus explicit teacher-only `answer_key` marking guides.

## Current cleanup priorities

Keep `README.md`, `SETUP_STATUS.md`, `docs/CONTRACT_DRIFT_INVENTORY.md`, and `engine/contracts/output-type-inventory.json` aligned whenever output support changes. Keep generated-package acceptance tied to the full chain: brief required outputs -> package outputs -> route plan -> rendered artifacts -> bundle QA. Expand classroom-substance QA beyond structural artifact existence.
