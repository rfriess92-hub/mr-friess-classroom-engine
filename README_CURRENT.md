# Mr. Friess Classroom Engine

Repository for the **classroom engine** and its **render pipeline**.

This repo is no longer just a starter scaffold. It now contains:

- canonical lesson packets in `engine/content/`
- a live lesson-packet schema in `engine/schema/lesson.schema.json`
- a working PDF build path in `engine/pdf/build.py`
- a live PPTX build path in `engine/pptx/`, with active cleanup work to promote the stronger renderer
- support scripts and tests that are being upgraded from starter stubs to real engine checks

## Naming

Use these names consistently:

- **classroom engine** = the whole system
- **render pipeline** = the repo / build / rendering side
- **workflow** = how the user and assistant move work through the system

## Current reference lessons

The repo currently uses these as reference lesson packets:

- `engine/content/science9_interconnected_spheres.json`
- `engine/content/careers8_goal_setting.json`

These packets are the current source-of-truth examples for Engine 1.0.

## Current repo state

### Stable enough to use
- lesson packets exist in the repo
- schema file exists
- PDF builder exists and runs locally
- local PPTX generation is possible

### Still under active cleanup
- the default live PPTX path on `main` still points at the older renderer
- stronger PPTX renderer patches exist and are being evaluated on the cleanup branch / PR
- some support scripts are still stub-level and need to be upgraded
- repo docs are being rewritten to match the real state of the engine

## Engine 1.0 target

Engine 1.0 means:

> The classroom engine can take a canonical lesson packet and produce usable review artifacts through the render pipeline.

The detailed pass condition is documented in `ENGINE_1_0_CHECKLIST.md` on the cleanup branch.

## Local build notes

### Python
The repo expects Python 3.11+.

Current Python dependencies used by the repo include:
- `reportlab`
- `python-pptx`

### Typical local commands
Build PDF directly:

```bash
python engine/pdf/build.py --lesson engine/content/science9_interconnected_spheres.json --out output
```

Build PPTX directly using the current live path:

```bash
python engine/pptx/render_pptx.py --lesson engine/content/science9_interconnected_spheres.json --out output
```

During cleanup / patch testing, stronger patched PPTX renderers may be run directly from sidecar patch files on the cleanup branch.

## What happens next

The current cleanup order is:
1. make docs truthful
2. choose one official live PPTX renderer path
3. align build wrappers and package scripts to that path
4. align declared dependencies with actual imports
5. replace stub support scripts and shallow tests
6. remove superseded patch artifacts after replacements are live

The cleanup sequence is tracked in `REPO_CLEANUP_PLAN_V1.md` on the cleanup branch.
