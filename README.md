# mr-friess-classroom-engine

Repository for the Mr. Friess Classroom Engine stable-core render pipeline.

## Current state

The authoritative workflow is now the stable-core **package** path:

1. `pnpm run schema:check -- --package <path>`
2. `pnpm run route:plan -- --package <path> --print-routes`
3. `pnpm run render:package -- --package <path> --out output`
4. `pnpm run qa:bundle -- --package <path> --out output`

This is the source-of-truth acceptance path for stable-core packages.

## Repo surfaces

Stable-core package surfaces:

- `schemas/` — canonical vocabulary and package schema
- `engine/schema/` — package validation and render-plan normalization
- `engine/planner/` — route planning
- `engine/pptx/` — PPTX renderer entrypoint and layout logic
- `engine/pdf/` — stable-core PDF renderer
- `scripts/` — schema, route, render, and QA commands
- `fixtures/` — stable-core package fixtures and generated proof packages
- `docs/stable-core-workflow-policy.md` — workflow policy and PR-class rules

Legacy direct-lesson surfaces still exist under `engine/content/` and the direct builders remain callable for compatibility/debugging. They are **not** the acceptance path for stable-core package work.

## Local commands

Check that stable-core repo scaffolding is present:

```bash
pnpm run doctor
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

## Current cleanup priorities

- decide whether legacy direct-lesson builders remain supported or are formally deprecated
- tighten schema coverage for themes and layout payloads so bad package shapes fail before render time
- centralize duplicated script constants and output-entry collection logic
- expand semantic QA beyond visible scaffold-token leakage
