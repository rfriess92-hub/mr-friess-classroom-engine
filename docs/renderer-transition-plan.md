# Renderer Transition Plan

## Purpose

This document makes the renderer transition explicit so repo/build work does not confuse the public entrypoints with the archived implementation that still sits behind them.

## Current state

### PPTX

- Public entrypoint: `engine/pptx/renderer.py`
- CLI wrapper: `engine/pptx/render-cli.mjs`
- Current implementation status: transitional and archive-backed
- Active risk: render regressions can be harder to localize because behavior still spans preserved historical modules under `engine/pptx/archive/`

### PDF

- Public entrypoint: `engine/pdf/render_stable_core_output.py`
- Current implementation status: active wrapper over archive-backed base behavior plus newer student-facing overrides
- Active risk: layout fixes can land in the wrapper while core assumptions remain in archived support files

## Decision boundary

Until the transition is complete:

- the public entrypoints remain the only supported operator-facing render surfaces
- archived modules are implementation detail, not public contract
- acceptance proof must come from `doctor` → `schema:check` → `route:plan` → `render:package` → `qa:bundle`
- legacy direct builders are compatibility/debugging surfaces only

## Consolidation sequence

### 1. Freeze the public contract

Keep these paths stable while internals move:

- `engine/pptx/renderer.py`
- `engine/pptx/render-cli.mjs`
- `engine/pdf/render_stable_core_output.py`

### 2. Move live logic inward without changing the public path

For each renderer family:

- identify the active code path actually used by the public entrypoint
- move one coherent chunk at a time into non-archive active modules
- keep behavior covered by contract tests or fixture-based acceptance runs before deleting any archived module

### 3. Keep archived code preserved but clearly demoted

Archive code can remain for reference during transition, but:

- no archived filename should reappear at active top-level render paths
- new repo wiring should never point operators directly at archive files
- bug fixes should land on the active path, not only in preserved historical modules

### 4. Retire archive coupling intentionally

A renderer family is only considered consolidated when:

- the public entrypoint no longer imports the live path from `archive/`
- the stable-core acceptance path still passes on at least one benchmark package and one older proof package
- the remaining archived modules are either deleted or clearly marked as historical-only

## Definition of done

The transition is complete when:

- the repo still has one stable public entrypoint per renderer family
- render behavior is implemented in active modules rather than archive-backed bridges
- CI mirrors the stable-core acceptance path successfully
- regressions can be localized to active renderer code without tracing through preserved historical chains
