# Renderer Dependency Map

## Purpose

This document records the current live renderer dependency chain so cleanup and consolidation work do not accidentally remove modules that are still active.

## PPTX renderer

Public entrypoint:

- `engine/pptx/renderer.py`

Current live chain:

- `engine/pptx/renderer.py`
- `engine/pptx/archive/render_pptx_image_bridge.py`
- `engine/pptx/archive/render_pptx_visual_bridge.py`
- `engine/pptx/archive/render_pptx_patch_v3.py`

Implication:

- `render_pptx_patch_v3.py` is still live through the archive-backed bridge chain
- deleting it now breaks PPTX generation
- dead-code cleanup in the archive must be validated against this chain before merge

## PDF renderer

Public entrypoint:

- `engine/pdf/render_stable_core_output.py`

Current live path:

- `engine/pdf/render_stable_core_output.py`
- `engine/pdf/archive/render_stable_core_output_base.py`
- student-facing helper modules under `engine/pdf/`

Implication:

- the active PDF renderer is still wrapper-plus-archive-backed-base, not yet a fully consolidated active-only implementation
- direct edits to printable PDF behavior should preserve both wrapper execution and any remaining direct base execution path that still matters in repo workflows

## Current guardrail rule

Until renderer consolidation is actually complete:

- do not delete an archive-backed module just because it looks old
- trace the active import chain first
- keep one public entrypoint per renderer family
- prefer additive tests and dependency-map updates before destructive cleanup

## What counts as true consolidation

PPTX is only consolidated when:

- `engine/pptx/renderer.py` no longer depends on archive-backed bridge modules for the live path
- the repo can render benchmark fixtures without `render_pptx_patch_v3.py`

PDF is only consolidated when:

- `engine/pdf/render_stable_core_output.py` no longer depends on `archive/render_stable_core_output_base.py` for the live path
- wrapper behavior and printable output behavior are implemented in active modules without archive-backed fallthrough
