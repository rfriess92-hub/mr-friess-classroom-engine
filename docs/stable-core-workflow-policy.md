# Mr. Friess Classroom Engine — Stable-Core Workflow Guide

## Purpose

This document describes the current workflow for the stable-core package pipeline and the assignment-family contract that now sits upstream of it.

Its job is to keep the repo honest about:

- what the stable-core acceptance path actually is
- which commands are the real gates
- where the upstream pedagogy/authoring contract now lives
- how to make bounded changes without reintroducing workflow theater
- how to review package/render work without confusing content, renderer, QA, tooling, and authoring-contract intent

It does not authorize pedagogy invention or lesson redesign unless a task is explicitly content-authoring work.

---

## Architectural contract

The repo now distinguishes between two different but connected contracts.

### 1. Stable-core package = live render contract

The stable-core package is still the machine-facing contract that the render path consumes directly.

The authoritative stable-core acceptance path is still:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints changed
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

Use `qa:render` as a drill-down tool for a single artifact, not as the primary acceptance step.

### 2. Assignment-family layer = authoritative upstream pedagogy/authoring contract

The assignment-family layer is now the authoritative upstream contract for:

- family selection
- family chain recommendations
- required upstream assignment metadata
- family integrity expectations
- authoring-time validation before render work begins

This means the repo should move toward one family source of truth under `engine/assignment-family/`.

### 3. Transition rule

During cleanup, docs must distinguish clearly between:

- **live today** — what the stable-core render path actually uses right now
- **authoritative target** — what the repo is migrating toward
- **compatibility-only** — temporary shims kept so the live path does not break during cutover

---

## Current repo reality

The repo is still primarily operated by one person.
CI now exists for stable-core smoke coverage, but local command execution and direct review still matter.

Current reality, stated plainly:

- `schema:check`, `route:plan`, `render:package`, and `qa:bundle` are still the real stable-core acceptance path
- `engine/schema/render-plan.mjs` still reads family selection from `engine/family/*` today
- `engine/assignment-family/*` already exists as the newer authoring/validation surface
- the current cleanup goal is to move live family truth into `engine/assignment-family/*` and shrink `engine/family/*` into a temporary compatibility layer before removal

That means the architectural decision is ahead of the full code cutover, on purpose.

---

## Working rules

### 1. Keep changes bounded

Prefer small, explicit changes over broad blended passes.
A branch may still contain more than one file if the files are part of one coherent fix.

### 2. Name the intent clearly

`content`, `renderer`, `qa`, and `tooling` are still useful labels for describing what kind of change you are making.
`assignment-family` is now also a meaningful intent label for upstream pedagogy-contract work.

These are intent labels, not hard PR classes that require ceremony before every fix.

### 3. Use lightweight branches and PRs when the diff matters

For anything non-trivial, use a branch and PR as a review capsule.
That preserves history and makes rollback easier.

### 4. Do not use legacy direct builders as acceptance proof

If the question is whether a stable-core package is valid, the answer must come from the package workflow, not from ad hoc direct builders.

### 5. Do not blur live stable-core behavior and upstream assignment-family decisions

The stable-core package path decides what renders today.
The assignment-family layer decides what upstream family contract should exist before generation/rendering.
Keep those distinct until the cutover is complete.

### 6. Keep teacher/student separation explicit

Do not fix renderer or workflow issues by silently collapsing teacher-facing and student-facing artifact logic.

---

## Recommended naming

The following prefixes are still useful because they make intent obvious:

- `content/<slug>`
- `renderer/<slug>`
- `qa/<slug>`
- `tooling/<slug>`
- `assignment-family/<slug>`

Likewise, these PR title prefixes remain useful:

- `Content:`
- `Renderer:`
- `QA:`
- `Tooling:`
- `Assignment-family:`

These are recommendations for clarity, not a strict ceremony system.

---

## Review expectations by change type

### Assignment-family / authoring-contract changes

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

- `engine/pptx/renderer.py` is the public PPTX entrypoint, but the implementation is still transitional and archive-backed.
- `engine/pdf/render_stable_core_output.py` is the active PDF renderer wrapper.
- Stable-core package rendering writes package-scoped output directories by default.
- Legacy direct builders remain compatibility/debugging surfaces, not stable-core acceptance proof.
- `DECISIONS.md` is the active decisions log for repo structure and operating rules.
- `engine/family/*` is still part of the live render-plan path today.
- `engine/assignment-family/*` is the intended authoritative upstream family surface.

---

## When to reassess the workflow

Revisit this guide when one of these becomes true:

- assignment-family cutover is complete and `engine/family/*` is no longer live
- family validation becomes part of the real stable-core acceptance gate
- CI becomes the dominant gate rather than local review plus smoke coverage
- the PPTX implementation is truly consolidated
- legacy direct builders are formally deprecated or removed
- package generation moves to a different provider abstraction or integrated authoring flow
