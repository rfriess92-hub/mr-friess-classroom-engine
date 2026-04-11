# mr-friess-classroom-engine

Repository for the Mr. Friess Classroom Engine stable-core render pipeline.

## Current operating model

This repo is currently operated as a solo workflow. There is no CI or GitHub Actions gate on the stable-core path yet.

For stable-core package work, the authoritative local acceptance path is:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints change
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

This is the source-of-truth acceptance path for stable-core packages.

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
- `docs/stable-core-workflow-policy.md` — current solo workflow guide and acceptance notes
- `DECISIONS.md` — active decisions log for repo structure and operating rules

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
- Package-scoped output directories are the default render behavior.
- `qa:render` is a drill-down tool. `qa:bundle` is the acceptance gate.
- Legacy direct builders remain callable for compatibility/debugging, but they are not the stable-core acceptance path.

## Current cleanup priorities

- true PPTX implementation consolidation behind `engine/pptx/renderer.py`
- extract shared student-facing PDF worksheet grammar from the recent Day 2 overrides
- expand semantic QA beyond visible scaffold-token leakage and structural bundle checks
- decide whether legacy direct-lesson builders should remain supported or be formally deprecated
