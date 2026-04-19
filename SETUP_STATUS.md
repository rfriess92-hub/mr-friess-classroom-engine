# Setup status

## Engine — fully implemented

- `engine/schema/` — canonical vocabulary, lesson package schema validation, preflight
- `engine/pdf/` — Python/reportlab stable-core renderer with document chrome
- `engine/pdf-html/` — Playwright HTML→PDF renderer for doc-mode output types
- `engine/pptx/` — Python/pptx slide renderer
- `engine/render/` — typed block validation, artifact classifier, multipage page-role classifier, template router
- `engine/planner/` — output router, route planning
- `engine/visual/` — visual plan builder, token system
- `engine/assignment-family/` — assignment family contract and validation
- `engine/family/` — family validation

## Scripts — all wired

- `npm run schema:check` — validate all fixtures against schema
- `npm run route:plan` — plan routes for a package
- `npm run render:package` — render a full package (PPTX + PDF)
- `npm run pdf:build` — HTML→PDF via Playwright
- `npm run qa:render` / `qa:bundle` / `qa:visual` — QA helpers
- `npm run generate:package` — generate a new package
- `npm test` — node tests + Python contract tests

## Fixtures

- `fixtures/core/` — 2 benchmark fixtures
- `fixtures/generated/` — 9 generated lesson package fixtures
- `fixtures/plan-build-grow/` — 10 PBG cross-curricular fixtures
- `fixtures/tests/` — proof fixtures for CI smoke tests

## CI

- `CI` workflow — node tests
- `stable-core` workflow — contract tests + render smoke tests
