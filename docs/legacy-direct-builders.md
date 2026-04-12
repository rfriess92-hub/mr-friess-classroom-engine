# Legacy Direct Builders

## Purpose

This document defines the current status of the direct lesson builder surfaces so repo/build work does not confuse them with the stable-core package acceptance path.

## Current status

Legacy direct builders still exist only as compatibility/debugging surfaces.

They are **not** acceptance proof for stable-core package work.

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
They should be treated as operator aids for narrow debugging cases, not as the main pipeline.

## How to invoke them today

Until package-level script wiring is refreshed, call them directly with Node:

```bash
node scripts/build-all.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
node scripts/build-pptx.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
node scripts/build-pdf.mjs --lesson engine/content/science9_interconnected_spheres.json --out output
```

## What they do not prove

A successful direct-builder run does **not** prove that:

- a stable-core package is schema-valid
- routes are correct
- bundle composition is correct
- teacher/student audience boundaries are preserved
- visual or artifact QA passed

## Cleanup direction

One of these futures should be chosen explicitly:

### Option 1 — keep them as compatibility/debugging shims

If kept:

- document them as transitional
- keep them outside the acceptance path
- avoid presenting them as equivalent to stable-core rendering

### Option 2 — formally deprecate and remove them

If removed:

- remove stale documentation references
- preserve only the stable-core package path
- keep any needed debugging behavior behind dedicated internal tools instead

## Current recommendation

Keep the direct builders only as narrow compatibility/debugging shims until the stale README/workflow docs are rewritten. After that, either wire them deliberately or deprecate them formally.
