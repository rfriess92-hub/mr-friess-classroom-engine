# Mr. Friess Classroom Engine — Stable-Core Workflow Guide

## Purpose

This document describes the current solo-operated workflow for the stable-core package pipeline.

Its job is to keep the repo honest about:

- what the acceptance path actually is
- which commands are the real gates
- how to make bounded changes without reintroducing workflow theater
- how to review package/render work without confusing content, renderer, QA, and tooling intent

It does not authorize pedagogy invention or lesson redesign unless a task is explicitly content-authoring work.

---

## Current repo reality

The repo is currently operated by one person.
There is no CI gate on the stable-core path yet.
The live enforcement surface is local command execution plus manual review.

That means:

- `doctor` protects basic repo layout assumptions
- `schema:check`, `route:plan`, `render:package`, and `qa:bundle` are the real acceptance path
- lightweight branches and PRs are useful, but heavy PR-class ceremony is not the operating model

---

## Source-of-truth acceptance path

For stable-core package work, use this sequence:

1. `pnpm run doctor` when repo structure, scripts, or renderer entrypoints changed
2. `pnpm run schema:check -- --package <path>`
3. `pnpm run route:plan -- --package <path> --print-routes`
4. `pnpm run render:package -- --package <path> --out output`
5. `pnpm run qa:bundle -- --package <path> --out output`

Use `qa:render` as a drill-down tool for a single artifact, not as the primary acceptance step.

`build:all` is not the stable-core acceptance path.
It remains available only for legacy compatibility/debugging work.

---

## Working rules

### 1. Keep changes bounded

Prefer small, explicit changes over broad blended passes.
A branch may still contain more than one file if the files are part of one coherent fix.

### 2. Name the intent clearly

`content`, `renderer`, `qa`, and `tooling` are still useful labels for describing what kind of change you are making.
They are intent labels, not hard PR classes that require ceremony before every fix.

### 3. Use lightweight branches and PRs when the diff matters

For anything non-trivial, use a branch and PR as a review capsule.
That preserves history and makes rollback easier.

### 4. Do not use legacy direct builders as acceptance proof

If the question is whether a stable-core package is valid, the answer must come from the package workflow, not from ad hoc direct builders.

### 5. Keep teacher/student separation explicit

Do not fix renderer or workflow issues by silently collapsing teacher-facing and student-facing artifact logic.

---

## Recommended naming

The following prefixes are still useful because they make intent obvious:

- `content/<slug>`
- `renderer/<slug>`
- `qa/<slug>`
- `tooling/<slug>`

Likewise, these PR title prefixes remain useful:

- `Content:`
- `Renderer:`
- `QA:`
- `Tooling:`

These are recommendations for clarity, not a strict ceremony system.

---

## Defect labels

The following labels remain useful when discussing a bug:

- `content_problem`
- `renderer_problem`
- `repo_tooling_problem`

Use them when they add clarity.
Do not treat defect labeling as a mandatory ritual before every small edit.

A simple decision rule still works:

1. If the source package itself is wrong, it is probably a `content_problem`.
2. If the package is reasonable but the artifact renders badly, it is probably a `renderer_problem`.
3. If execution, routing, output paths, or command behavior are the source of confusion, it is probably a `repo_tooling_problem`.

---

## Review expectations by change type

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

---

## When to reassess the workflow

Revisit this guide when one of these becomes true:

- CI is added and becomes a real gate
- the PPTX implementation is truly consolidated
- legacy direct builders are formally deprecated or removed
- package generation moves to a different provider abstraction or integrated authoring flow
