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
4. `engine/assignment-family/package-selector.mjs`
5. `engine/assignment-family/live-contract.mjs`
6. `engine/assignment-family/schema-check-report.mjs`
7. `engine/assignment-family/validate-build.mjs`

This means the live render-plan and schema-check path now reads assignment-family behavior from `engine/assignment-family/*`.

### Compatibility family path

1. `engine/family/selection.mjs`
2. `engine/family/canonical.mjs`
3. `engine/family/validation.mjs`

These files now exist as compatibility surfaces during cleanup. `selection.mjs` is already a direct shim over assignment-family authority, `canonical.mjs` now sources canonical values from `engine/assignment-family/live-contract.mjs`, and `validation.mjs` is retained as compatibility-only residue pending further cleanup.

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

This means `engine/assignment-family/*` is now both the live stable-core authority and the upstream authoring/validation surface.

## Classification by path

### Live

- `scripts/schema-check.mjs`
- `engine/schema/render-plan.mjs`
- `engine/assignment-family/package-selector.mjs`
- `engine/assignment-family/live-contract.mjs`
- `engine/assignment-family/schema-check-report.mjs`
- `engine/assignment-family/validate-build.mjs`
- `engine/assignment-family/load-config.mjs`
- `engine/assignment-family/config/package-index.json`
- `engine/assignment-family/config/families.json`
- `engine/assignment-family/config/common-schema.json`

### Compatibility-only

- `engine/family/selection.mjs`
- `engine/family/canonical.mjs`
- `engine/family/validation.mjs`

### Duplicate contract surfaces still being reduced

- `engine/family/validation.mjs`
- `engine/assignment-family/config/families.json`
- `engine/assignment-family/config/common-schema.json`
- `schemas/canonical-assignment.schema.json`

The remaining overlap is now narrower than before. Family/routing values have already been collapsed off `engine/family/canonical.mjs` onto assignment-family authority.

### Live generation path with upstream metadata alignment in progress

- `scripts/generate-package.mjs`

The generation path now prompts for canonical assignment-family metadata, but legacy fixtures still remain transitional until they are backfilled deliberately.

## Updated core problem

The repo no longer has two equally live family systems. The live stable-core path now depends on `engine/assignment-family/*`.

The remaining problem is narrower:

- `engine/family/*` still exists as a compatibility surface
- `engine/family/validation.mjs` still carries an older duplicate validation surface
- fixtures and historical packages have not all been backfilled to the upstream family contract yet

That means the cleanup phase has shifted from authority cutover to compatibility reduction and fixture migration strategy.

## Updated migration order

1. Document the architecture decision in repo-facing docs.
2. Add an authoritative package-facing selector under `engine/assignment-family/`.
3. Switch `engine/schema/render-plan.mjs` to the authoritative `engine/assignment-family/*` path.
4. Add transitional assignment-family reporting into `schema:check`.
5. Align `generate:package` with canonical assignment-family metadata.
6. Hard-gate `schema:check` for fully declared upstream family contracts.
7. Reduce `engine/family/*` to explicit compatibility shims and residue.
8. Remove dead duplicate logic only after the compatibility surface is no longer needed.

## Safe immediate next step

Continue reducing `engine/family/*` from a compatibility layer into either:

- thin wrappers over assignment-family authority, or
- explicit deprecation residue marked for later removal

Do not backfill fixtures or remove compatibility surfaces blindly; keep those as deliberate follow-up slices.
