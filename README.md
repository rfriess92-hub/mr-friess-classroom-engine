# mr-friess-classroom-engine

Repository for the Mr. Friess Classroom Engine stable-core render pipeline and its upstream assignment-family authoring contract.

## Architecture decision

The repo now follows this contract split:

- **stable-core package** = the live render contract
- **assignment-family layer** = the authoritative upstream pedagogy/authoring contract
- **`engine/assignment-family`** replaces **`engine/family`** as the intended long-term source of truth for family definitions, routing rules, and family integrity expectations

Current transition note:

- the live stable-core acceptance path still reads `assignment_family` through `engine/family/*`
- `engine/assignment-family/*` already exists as the newer authoring/validation surface
- repo cleanup work is now explicitly aimed at moving live family truth to `engine/assignment-family/*` and shrinking `engine/family/*` into a temporary compatibility shim

## Current operating model

This repo is still primarily operated as a solo workflow, but stable-core CI smoke coverage now exists for the real package path.

For stable-core package work, the authoritative acceptance path remains:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints change
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

This is the source-of-truth acceptance path for stable-core packages.

Assignment-family tooling is currently upstream and transitional:

- `pnpm run select:assignment-family` selects a family from authoring signals
- `pnpm run qa:assignment-family` validates an assignment-build against family/common-schema rules

Those tools are real, but they are not yet the single live source of truth for render-plan behavior.

Lightweight branches and PRs are still useful as diff capsules. The old PR-class / freeze ceremony is not the live control surface.

## Repo surfaces

Stable-core package surfaces:

- `schemas/` — canonical vocabulary and package schema
- `engine/schema/` — package validation and render-plan normalization
- `engine/planner/` — route planning
- `engine/pptx/` — PPTX renderer entrypoint and layout logic
- `engine/pdf/` — stable-core PDF renderer
- `scripts/` — schema, route, render, QA, and package-generation commands
- `fixtures/` — stable-core package fixtures and generated proof packages
- `docs/stable-core-workflow-policy.md` — current workflow guide and acceptance notes
- `DECISIONS.md` — active decisions log for repo structure and operating rules

Assignment-family / upstream authoring surfaces:

- `engine/assignment-family/` — intended authoritative family selection, chains, config loading, and assignment-build validation
- `engine/assignment-family/config/` — family definitions, routing logic, and common required-field config
- `schemas/canonical-assignment.schema.json` — structural schema surface for canonical assignment metadata

Transitional / compatibility family surfaces:

- `engine/family/` — still used by the live render-plan path today, but now treated as transitional compatibility code during cutover

Legacy direct-lesson surfaces still exist under `engine/content/`, and the direct builders remain callable for compatibility/debugging. They are not the acceptance path for stable-core package work.

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

Legacy compatibility commands (non-authoritative for stable-core acceptance):

```bash
pnpm run build:all -- --lesson engine/content/science9_interconnected_spheres.json --out output
pnpm run build:pptx -- --lesson engine/content/science9_interconnected_spheres.json --out output
pnpm run build:pdf -- --lesson engine/content/science9_interconnected_spheres.json --out output
```

## Current repo truths

- `engine/pptx/renderer.py` is the single public PPTX entrypoint, but implementation still delegates into archived modules during transition.
- `engine/pdf/render_stable_core_output.py` is the live PDF renderer wrapper.
- Stable-core package rendering writes package-scoped output directories by default.
- `qa:render` is a drill-down tool. `qa:bundle` is the acceptance gate.
- The live render-plan path still derives family selection from `engine/family/*`.
- The intended long-term family source of truth is `engine/assignment-family/*`.
- Legacy direct builders remain callable for compatibility/debugging, but they are not the stable-core acceptance path.

## Current cleanup priorities

- unify `engine/assignment-family/*` and `engine/family/*` so one family source of truth remains
- move live render-plan family selection off `engine/family/selection.mjs` and onto the authoritative assignment-family path
- align generation, schema checking, and family validation so assignment-family enters the real acceptance story
- finish stale-doc cleanup so README, DECISIONS, workflow docs, and command surfaces tell one coherent story
- return to deeper renderer consolidation only after the family/source-of-truth split is coherent
