# mr-friess-classroom-engine

Repository for the Mr. Friess Classroom Engine stable-core render pipeline and its upstream assignment-family contract.

## Architecture decision

The repo now follows this contract split:

- **stable-core package** = the live render contract
- **assignment-family layer** = the authoritative upstream pedagogy/authoring contract
- **`engine/assignment-family/*`** = the live family-selection authority for the stable-core render-plan path
- **`engine/family/*`** = compatibility-only residue during cleanup

## Current operating model

For stable-core package work, the authoritative acceptance path remains:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints change
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

This is the source-of-truth acceptance path for stable-core packages.

Assignment-family tooling is also live, but it serves a different role:

- `pnpm run select:assignment-family` selects a family from authoring signals
- `pnpm run qa:assignment-family` validates an assignment-build against family/common-schema rules
- `engine/schema/render-plan.mjs` already imports `engine/assignment-family/package-selector.mjs` for live family selection

That means the stable-core path already depends on `engine/assignment-family/*`, while `qa:assignment-family` remains an upstream authoring/validation surface rather than the stable-core acceptance gate.

Lightweight branches and PRs are still useful as diff capsules. The old PR-class or freeze ceremony is not the live control surface.

## Repo surfaces

Stable-core package surfaces:

- `schemas/` - canonical vocabulary and package schema
- `engine/schema/` - package validation and render-plan normalization
- `engine/planner/` - route planning
- `engine/pptx/` - PPTX renderer entrypoint and layout logic
- `engine/pdf/` - stable-core PDF renderer
- `scripts/` - schema, route, render, QA, and package-generation commands
- `fixtures/` - stable-core package fixtures and generated proof packages
- `docs/stable-core-workflow-policy.md` - current workflow guide and acceptance notes
- `DECISIONS.md` - active decisions log for repo structure and operating rules

Assignment-family and upstream authoring surfaces:

- `engine/assignment-family/` - live package-facing selector plus upstream family selection, config loading, and assignment-build validation
- `engine/assignment-family/config/` - family definitions, routing logic, and common required-field config
- `schemas/canonical-assignment.schema.json` - structural schema surface for canonical assignment metadata

Transitional and compatibility surfaces:

- `engine/family/` - compatibility wrappers and residue during cleanup
- `scripts/build-all.mjs`, `scripts/build-pptx.mjs`, `scripts/build-pdf.mjs` - legacy direct-builder residue kept for compatibility or debugging, not package acceptance proof
- `docs/legacy-direct-builders.md` - current note on the legacy direct-builder surface

## Local commands

Check that stable-core repo scaffolding is present:

```bash
pnpm run doctor
```

Generate a package from a teacher brief:

```bash
pnpm run generate:package -- --brief briefs/templates/teacher-lesson-brief-v1.md
```

Validate a package:

```bash
pnpm run schema:check -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json
```

Print routes for a package:

```bash
pnpm run route:plan -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --print-routes
```

Render a package bundle:

```bash
pnpm run render:package -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --out output
```

Run bundle QA:

```bash
pnpm run qa:bundle -- --package fixtures/generated/ela-8-community-issue-argument.grade8-ela.json --out output
```

Select an assignment family from upstream signals:

```bash
pnpm run select:assignment-family -- --input path/to/signals.json
```

Validate an assignment build against assignment-family rules:

```bash
pnpm run qa:assignment-family -- --input path/to/assignment-build.json
```

Drill down on a single artifact:

```bash
pnpm run qa:render -- --artifact output/ela_8_community_issue_argument/day2_slides.pptx
```

Legacy direct-builder note:

- `package.json` does not currently define `pnpm run build:all`, `pnpm run build:pptx`, or `pnpm run build:pdf`.
- The direct-builder files still exist under `scripts/` and are callable with `node scripts/...`, but they remain deprecated compatibility/debugging surfaces rather than acceptance commands.
- See `docs/legacy-direct-builders.md` for the current compatibility note.

## Test surfaces

- `pnpm test` runs Node tests only.
- `.github/workflows/ci.yml` runs the Node test command and `pytest tests/python`.
- `.github/workflows/stable-core.yml` runs `pnpm test` plus stable-core schema, route, and render smoke coverage for the current fixture set.
- `stable-core.yml` installs Python renderer dependencies for render steps, but it does not invoke `pytest`.
- The current stable-core workflow covers `benchmark1`, `challenge7`, the evaluated assignment-family fixture, and the task-sheet response-pattern proof fixture.

## Current repo truths

- `engine/schema/render-plan.mjs` reads family selection from `engine/assignment-family/package-selector.mjs`.
- `engine/family/*` is compatibility-only residue, not the live family-selection authority.
- `engine/pptx/renderer.py` is the public PPTX entrypoint, but implementation still delegates into archived modules during transition.
- `engine/pdf/render_stable_core_output.py` is the live PDF renderer wrapper.
- Stable-core package rendering writes package-scoped output directories by default.
- `qa:render` is a drill-down tool. `qa:bundle` is the acceptance gate.
- `pnpm test` is node-only. Python tests run separately in `.github/workflows/ci.yml`.
- Legacy direct-builder script files remain in the repo as direct `node scripts/...` surfaces, but no `build:*` package scripts are exposed in `package.json`.

## Current cleanup priorities

- reduce `engine/family/*` to explicit compatibility shims or residue and remove dead duplication only when safe
- keep README, workflow docs, and setup notes aligned with the live `engine/assignment-family/*` path
- decide the legacy direct-builder future: either wire `build:*` scripts deliberately or deprecate and remove the wrapper surface
- expand stable-core fixture coverage to newer proof fixtures in a separate slice
- return to deeper renderer consolidation only after repo-truth drift is reduced
