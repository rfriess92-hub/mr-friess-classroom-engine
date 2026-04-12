# Setup status

## Stable-core reality (current)

- Stable-core schemas are active and enforced:
  - `schemas/canonical-vocabulary.json`
  - `schemas/lesson-package.schema.json`
- Planner routing is active via:
  - `engine/planner/output-router.mjs`
  - `scripts/route-plan.mjs`
- Renderer wrappers are active via:
  - `engine/pptx/renderer.py` (public PPTX entrypoint)
  - `engine/pdf/render_stable_core_output.py` (stable-core PDF wrapper)
  - `scripts/render-package.mjs`
- QA and workflow checks are active via:
  - `scripts/doctor.mjs`
  - `scripts/schema-check.mjs`
  - `scripts/qa-render.mjs`
  - `scripts/qa-bundle.mjs`

## Canonical workflow sources

Use these as the canonical workflow references, in order:

1. `README.md`
2. `docs/stable-core-workflow-policy.md`
3. `DECISIONS.md`

## Practical meaning

This repository is an actively runnable stable-core package pipeline with local command gates.
Legacy direct-lesson builders remain available for compatibility/debugging, but stable-core acceptance is package-first (`schema:check` → `route:plan` → `render:package` → `qa:bundle`).
