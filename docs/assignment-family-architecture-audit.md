# Assignment-Family Architecture Audit

Date: 2026-04-12

## Purpose

This audit records the current live usage split between `engine/family/*` and `engine/assignment-family/*` so the repo can migrate to one authoritative family source of truth without guessing.

## Architectural target

- stable-core package = live render contract
- assignment-family layer = authoritative upstream pedagogy/authoring contract
- `engine/assignment-family/*` = intended long-term family source of truth
- `engine/family/*` = temporary compatibility layer during cutover

## Current live usage map

### Live stable-core acceptance path

1. `pnpm run schema:check`
2. `scripts/schema-check.mjs`
3. `engine/schema/render-plan.mjs`
4. `engine/family/selection.mjs`
5. `engine/family/canonical.mjs` + `engine/family/validation.mjs`

This means family selection used by the live render-plan path still comes from `engine/family/*` today.

### Upstream assignment-family tooling path

1. `pnpm run select:assignment-family`
2. `scripts/select-assignment-family.mjs`
3. `engine/assignment-family/selector.mjs`
4. `engine/assignment-family/chains.mjs`
5. `engine/assignment-family/load-config.mjs`
6. `engine/assignment-family/config/*`

And separately:

1. `pnpm run qa:assignment-family`
2. `scripts/validate-assignment-build.mjs`
3. `engine/assignment-family/validate-build.mjs`
4. `engine/assignment-family/load-config.mjs`
5. `engine/assignment-family/config/*`

This means `engine/assignment-family/*` is real tooling, but it is not yet the live family source for render-plan behavior.

## Classification by path

### Live

- `scripts/schema-check.mjs`
- `engine/schema/render-plan.mjs`
- `engine/family/selection.mjs`
- `engine/family/canonical.mjs`
- `engine/family/validation.mjs`

### Tooling-only / not yet live in render-plan

- `scripts/select-assignment-family.mjs`
- `scripts/validate-assignment-build.mjs`
- `engine/assignment-family/selector.mjs`
- `engine/assignment-family/chains.mjs`
- `engine/assignment-family/load-config.mjs`
- `engine/assignment-family/validate-build.mjs`
- `engine/assignment-family/config/package-index.json`
- `engine/assignment-family/config/families.json`
- `engine/assignment-family/config/common-schema.json`

### Duplicate contract surfaces

- `engine/family/canonical.mjs`
- `engine/family/validation.mjs`
- `engine/assignment-family/config/families.json`
- `engine/assignment-family/config/common-schema.json`
- `schemas/canonical-assignment.schema.json`

These surfaces overlap on:

- family enums
- routing order
- chain recommendations
- required-field expectations
- family integrity expectations

### Live generation path but not yet family-authoritative

- `scripts/generate-package.mjs`

The generation path still produces stable-core packages directly and then runs `schema:check`. It does not yet make assignment-family metadata the authoritative upstream contract.

## Core problem

The repo currently has two different family systems:

- `engine/family/*` is package-facing, heuristic-heavy, and still used by the live render-plan path
- `engine/assignment-family/*` is config-driven, authoring-oriented, and currently lives beside the main acceptance path instead of driving it

That creates overlapping truth and rule-drift risk.

## Recommended migration order

1. Document the architecture decision in repo-facing docs.
2. Add an authoritative package-facing selector under `engine/assignment-family/`.
3. Keep `engine/family/*` intact until the new package-facing selector matches current live behavior on proof fixtures.
4. Switch `engine/schema/render-plan.mjs` to the authoritative `engine/assignment-family/*` path.
5. Fold family validation into the real acceptance path once generation and package metadata are aligned enough to support it cleanly.
6. Reduce `engine/family/*` to explicit compatibility shims.
7. Remove dead duplicate logic only after the live import path is proven clean.

## Safe immediate next step

Build a package-facing authoritative selector inside `engine/assignment-family/` without switching the live import yet.

That keeps the next code change small, reviewable, and reversible.
