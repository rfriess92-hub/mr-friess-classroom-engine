# mr-friess-classroom-engine

Repository for the Mr. Friess classroom engine render pipeline.

## Current state

The repo now contains:

- canonical lesson packets in `engine/content/`
- a canonical PPTX builder in `engine/pptx/`
- a canonical PDF builder in `engine/pdf/`
- Node helper scripts in `scripts/`

The current backend priority is to keep one trustworthy render path rather than multiple parallel patch paths.

## Canonical lesson packets

- `engine/content/science9_interconnected_spheres.json`
- `engine/content/careers8_goal_setting.json`

## Local commands

Run a basic repo check:

```bash
pnpm run doctor
```

Build both PPTX and PDF artifacts for one lesson:

```bash
pnpm run build:all -- --lesson engine/content/science9_interconnected_spheres.json --out output
```

Build only PPTX:

```bash
pnpm run build:pptx -- --lesson engine/content/science9_interconnected_spheres.json --out output
```

Build only PDF:

```bash
pnpm run build:pdf -- --lesson engine/content/science9_interconnected_spheres.json --out output
```

## Next backend steps

- add real schema validation under `engine/schema`
- replace render QA stubs with artifact checks
- add CI so canonical lessons render on every PR
