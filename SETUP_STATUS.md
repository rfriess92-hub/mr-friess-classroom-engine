# Setup status

## Engine - fully implemented

- `engine/schema/` - canonical vocabulary, lesson-package schema validation, preflight
- `engine/pdf/` - Python/reportlab stable-core renderer with document chrome
- `engine/pptx/` - Python/pptx slide renderer
- `engine/render/` - typed block validation, artifact classification, multipage page-role classification, template routing
- `engine/planner/` - output router and route planning
- `engine/visual/` - visual plan builder and token system
- `engine/assignment-family/` - live assignment-family selection and validation authority
- `engine/family/` - compatibility-only residue during cleanup, not the live render-plan authority

## Scripts - all wired

- `npm run schema:check` - validate fixtures against schema
- `npm run route:plan` - plan routes for a package
- `npm run render:package` - render a full package (PPTX + PDF)
- `npm run qa:render` / `qa:bundle` / `qa:visual` / `qa:pedagogy-variants` - QA helpers
- `npm run generate:package` - generate a new package
- `npm test` - Node tests in `tests/node`
- `tests/python/` is exercised by `.github/workflows/ci.yml`, not by `npm test`
- Legacy direct-builder scripts remain deprecated compatibility/debugging shims under `scripts/` and are invoked with `node scripts/...`; `package.json` does not expose `build:all`, `build:pptx`, or `build:pdf`

## Fixtures

- `fixtures/core/` - 2 benchmark fixtures
- `fixtures/generated/` - 9 generated lesson package fixtures
- `fixtures/plan-build-grow/` - 10 PBG cross-curricular fixtures
- `fixtures/tests/` - proof fixtures for CI smoke tests

## CI

- `CI` workflow - runs `npm test` plus `pytest tests/python`
- `stable-core` workflow - runs repo doctor, `pnpm test`, and stable-core fixture schema/route/render smoke coverage for benchmark, multi-day, evaluated assignment-family, task-sheet response-pattern, and PBG fixtures
