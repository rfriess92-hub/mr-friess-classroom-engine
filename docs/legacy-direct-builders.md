# Legacy Direct Builders

## Purpose

This document defines the current status of the direct lesson builder surfaces so repo and build work does not confuse them with the stable-core package acceptance path.

## Current status

Legacy direct builders still exist only as compatibility/debugging surfaces.

They are **not the stable-core package acceptance path** for repo acceptance work.

The authoritative acceptance path remains:

1. `doctor`
2. `schema:check`
3. `route:plan`
4. `render:package`
5. `qa:bundle`

## Direct builder surfaces currently present

- `scripts/build-all.mjs`
- `scripts/build-pptx.mjs`
- `scripts/build-pdf.mjs`

These are intentionally transitional.
They should be treated as operator aids or debugging residue, not as the main pipeline.

## What is true today

- `package.json` does not define `pnpm run build:all`, `pnpm run build:pptx`, or `pnpm run build:pdf`.
- The direct-builder files remain callable with `node scripts/...`.
- They remain deprecated compatibility/debugging surfaces rather than stable-core acceptance commands.

## How to inspect them today

If you need to inspect the remaining direct-builder surfaces, call the individual script files directly with Node:

```bash
node scripts/build-all.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
node scripts/build-pptx.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
node scripts/build-pdf.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
```

Do not present these as equivalent to the stable-core package path.

## What they do not prove

A successful direct-builder run does **not** prove that:

- a stable-core package is schema-valid
- routes are correct
- bundle composition is correct
- teacher and student audience boundaries are preserved
- visual or artifact QA passed

## Cleanup direction

One of these futures should be chosen explicitly:

### Option 1 - keep them as compatibility/debugging shims

If kept:

- document them as transitional
- keep them outside the acceptance path
- avoid presenting them as equivalent to stable-core rendering

### Option 2 - formally deprecate and remove them

If removed:

- remove stale documentation references
- preserve only the stable-core package path
- keep any needed debugging behavior behind dedicated internal tools instead

## Current recommendation

Keep the direct builders only as narrow compatibility/debugging surfaces until their future is decided explicitly.
Do not advertise `pnpm run build:*` commands while package script wiring is absent.
