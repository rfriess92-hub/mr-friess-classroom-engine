# Backend transition notes

## What this branch adds

This branch adds executable helper files that point at the stronger PPTX renderer already staged in the repo.

- `engine/pptx/build_canonical.js`
- `scripts/build-all-fixed.mjs`

## Why this exists

The current canonical PPTX builder on `main` still points at the weaker generic renderer.
The stronger renderer already exists as `engine/pptx/render_pptx_patch_v2.py`, but it is not yet the canonical entry point.
The current `scripts/build-all.mjs` path is also broken for PDF because it does not pass `--out` to `engine/pdf/build.py`.

## Immediate manual swaps to make next

1. Replace `engine/pptx/build.js` with the contents of `engine/pptx/build_canonical.js`.
2. Replace the current `scripts/build-all.mjs` logic with the contents of `scripts/build-all-fixed.mjs`.
3. Add `python-pptx` to the Python dependency manifest.
4. Update `README.md` so the repo description matches the actual render-pipeline state.

## After that

- add real schema validation under `engine/schema`
- replace render QA stubs with artifact checks
- add CI for canonical lesson artifacts
