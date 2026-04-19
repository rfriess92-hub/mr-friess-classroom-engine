# Mr. Friess Classroom Engine - Stable-Core Workflow Guide

## Purpose

This document describes the current workflow for the stable-core package pipeline and the assignment-family contract that sits upstream of it.

Its job is to keep the repo honest about:

- what the stable-core acceptance path actually is
- which commands are the real gates
- where the upstream pedagogy and authoring contract now lives
- how to make bounded changes without reintroducing workflow theater
- how to review package, render, QA, tooling, and authoring-contract work without blurring their intent

It does not authorize pedagogy invention or lesson redesign unless a task is explicitly content-authoring work.

---

## Architectural contract

The repo distinguishes between two connected contracts.

### 1. Stable-core package = live render contract

The stable-core package remains the machine-facing contract that the render path consumes directly.

The authoritative stable-core acceptance path is:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints changed
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

Use `qa:render` as a drill-down tool for a single artifact, not as the primary acceptance step.

### 2. Assignment-family layer = authoritative upstream pedagogy and authoring contract

The assignment-family layer is the authoritative upstream contract for:

- family selection
- family chain recommendations
- required upstream assignment metadata
- family integrity expectations
- authoring-time validation before render work begins

The live stable-core render-plan path already reads family selection from `engine/assignment-family/package-selector.mjs`.

### 3. Transition rule

Docs should distinguish clearly between:

- **live today** - what the stable-core render path actually uses now
- **upstream tooling** - authoring and validation surfaces used before render work
- **compatibility-only** - temporary residue kept so the live path does not break during cleanup

---

## Current repo reality

Current reality, stated plainly:

- `schema:check`, `route:plan`, `render:package`, and `qa:bundle` remain the stable-core acceptance path
- `engine/schema/render-plan.mjs` already imports `engine/assignment-family/package-selector.mjs` for live family selection
- `engine/family/*` remains compatibility-only residue during cleanup
- `pnpm test` runs Node tests only
- `.github/workflows/ci.yml` runs the Node test command plus `pytest tests/python`
- `.github/workflows/stable-core.yml` runs `pnpm test` plus stable-core fixture schema, route, and render smoke coverage
- `stable-core.yml` installs Python renderer dependencies for render steps, but it does not invoke `pytest`
- legacy direct builders remain compatibility and debugging surfaces, not acceptance proof
- `package.json` does not currently expose `build:all`, `build:pptx`, or `build:pdf`
- the remaining direct-builder scripts are callable with `node scripts/...`, not through `pnpm run build:*`

That means the family-authority cutover already happened in live code, while compatibility reduction, docs cleanup, and direct-builder cleanup are still in progress.

---

## Working rules

### 1. Keep changes bounded

Prefer small, explicit changes over broad blended passes.
A branch may still contain more than one file if the files are part of one coherent fix.

### 2. Name the intent clearly

`content`, `renderer`, `qa`, and `tooling` remain useful labels for describing change intent.
`assignment-family` is also a meaningful intent label for upstream pedagogy-contract work.

These are intent labels, not a PR ceremony system.

### 3. Use lightweight branches and PRs when the diff matters

For anything non-trivial, use a branch and PR as a review capsule.
That preserves history and makes rollback easier.

### 4. Do not use legacy direct builders as acceptance proof

If the question is whether a stable-core package is valid, the answer must come from the package workflow, not from direct-builder residue.

### 5. Do not blur live stable-core behavior and upstream assignment-family decisions

The stable-core package path decides what renders today.
The assignment-family layer decides what upstream family contract should exist before generation and rendering.
Keep those distinct until the compatibility residue is removed.

### 6. Keep teacher and student separation explicit

Do not fix renderer or workflow issues by silently collapsing teacher-facing and student-facing artifact logic.

---

## Review expectations by change type

### Assignment-family or authoring-contract changes

Expected:

- identify whether the change affects live stable-core behavior or only upstream authoring surfaces
- classify touched paths as live, compatibility-only, or dead
- show where the authoritative family rule now lives
- avoid destructive cleanup before the live import chain is confirmed

### Content-shaped changes

Expected:

- package passes `schema:check`
- routes are sane in `route:plan`
- package renders through `render:package`
- bundle outcome is visible in `qa:bundle`
- visible artifacts are reviewed honestly

### Renderer-shaped changes

Expected:

- identify the renderer surface touched
- rerun at least the affected package
- rerun one older proof package when practical
- confirm the acceptance path still works end to end

### QA-shaped changes

Expected:

- name the defect the new check is meant to catch
- show that the check increases signal rather than excusing bad renders

### Tooling-shaped changes

Expected:

- explain the operator confusion or execution failure being fixed
- confirm the stable-core package path remains authoritative

---

## Manual acceptance criteria

A package is not acceptable merely because files were written.
Manual acceptance still requires:

- schema pass
- sane routes
- successful render completion
- bundle QA outcome understood
- no visible scaffold leakage
- no obvious audience leakage
- no broken layout that would embarrass the artifact in classroom use

Until semantic QA grows, some of this remains manual by design.

---

## Repo truths to preserve

- `engine/schema/render-plan.mjs` reads family selection from `engine/assignment-family/package-selector.mjs`.
- `engine/family/*` is compatibility-only residue.
- `engine/pptx/renderer.py` is the public PPTX entrypoint, but the implementation is still transitional and archive-backed.
- `engine/pdf/render_stable_core_output.py` is the active PDF renderer wrapper.
- Stable-core package rendering writes package-scoped output directories by default.
- Legacy direct builders remain compatibility and debugging surfaces, not stable-core acceptance proof.
- `DECISIONS.md` is the active decisions log for repo structure and operating rules.
- `pnpm test` is node-only, while Python tests run separately in `.github/workflows/ci.yml`.

---

## When to reassess the workflow

Revisit this guide when one of these becomes true:

- compatibility residue under `engine/family/*` is removed
- family validation becomes part of the real stable-core acceptance gate
- stable-core CI expands to cover the newer proof fixtures
- the PPTX implementation is truly consolidated
- legacy direct builders are formally wired or removed
- package generation moves to a different provider abstraction or integrated authoring flow
