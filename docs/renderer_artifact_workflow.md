# Renderer artifact workflow

## Scope
This workflow applies to renderer, layout, artifact-shell, and PDF-output changes. It does not cover pedagogy/content redesign.

## Standard verification package
Use this package as the default artifact-engine verification package unless a change clearly requires a different fixture:

- `fixtures/generated/ela-8-community-issue-argument.variant-proof.json`

Why this package is the default:
- it exercises the worksheet family
- it includes Day 1 task-sheet pagination
- it includes Day 2 task-sheet rendering
- it includes the Day 2 final response sheet
- it preserves the current classroom-engine integrity rules around planning vs final evidence

## Required pre-PR verification
Before opening a renderer PR:

1. Render the intended changed artifact from the standard verification package.
2. Render at least one adjacent artifact family that could regress.
3. Inspect the code diff for unintended collateral changes.
4. Record any known renderer ceilings or constraints in the PR body.

Minimum required artifact checks for layout changes:
- intended changed output
- one neighboring artifact family on the same package

Recommended standard checks on the default package:
- `day1_task_sheet_core`
- `day2_task_sheet_core`
- `day2_final_response_sheet`

## Required PR evidence
Renderer PRs should include:
- exact layout/template changes made
- proof images or PDFs for the changed artifact
- any renderer constraints, ceilings, or known follow-up items
- explicit in-scope and out-of-scope notes

## Required post-merge verification on main
After merge:

1. Re-render the same verification package from `main`.
2. Confirm the intended artifact changed as expected.
3. Confirm at least one neighboring artifact family did not regress.
4. Record any remaining cleanup items as follow-up work.

## Issue buckets for stabilization review
Use these buckets after bounded QA sweeps:
- merge-now fixes
- next-pass fixes
- workflow pain points

## Current known renderer ceilings
As of the Day 2 final response sheet redesign pass:
- final-response success-check overflow should render all criteria, not silently drop later items
- strip-style rows should be reviewed whenever source lists may exceed the compact layout assumptions
