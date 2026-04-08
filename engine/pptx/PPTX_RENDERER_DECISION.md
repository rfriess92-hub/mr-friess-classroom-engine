# PPTX renderer decision for cleanup/render-pass-1

This file records the current PPTX renderer decision for the cleanup branch.

## Decision

The **official PPTX renderer candidate** for this cleanup branch is:

- renderer: `engine/pptx/render_pptx_patch_v2.py`
- wrapper: `engine/pptx/build_patched_v2.js`

## Why this candidate is preferred

The older live path on `main` still has these problems:
- it uses `engine/pptx/render_pptx.py`, which flattens lesson JSON structure into visible slide text
- `engine/pptx/build.js` hard-codes `python3`, which is brittle on Windows

The v2 candidate improves that by:
- handling more of the current lesson layouts directly
- addressing the Science `three_rows` crash case from the earlier patch
- using a cross-platform wrapper that probes `python`, `python3`, or `py`

## Meaning for cleanup pass B

For cleanup pass B, this branch should treat the v2 path as the intended replacement for the older live PPTX path.

That means the next eventual merge target is:
- promote `render_pptx_patch_v2.py` to become the official live renderer
- replace the older `engine/pptx/build.js` path with the logic now in `build_patched_v2.js`
- remove or archive superseded sidecar PPTX renderer files after the promotion is complete

## Until merge

Until the cleanup branch is merged, `main` still uses the older live path.
This file exists so the branch has one explicit answer to the question:

> Which PPTX renderer are we actually trying to make official?

Answer:

> `render_pptx_patch_v2.py` with `build_patched_v2.js`
