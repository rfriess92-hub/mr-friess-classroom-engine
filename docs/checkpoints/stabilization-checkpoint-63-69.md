# Stabilization checkpoint: PR range #63–#69

Date: 2026-04-12 (UTC)

## Scope

Acceptance path executed end-to-end on:

1. **Single-period fixture**: `fixtures/core/benchmark-1.grade2-math.json`
2. **Multi-day fixture**: `fixtures/generated/careers-8-technology-use-school-workplace.grade8-careers.json`

Commands used per fixture:

- `pnpm run schema:check -- --package <fixture>`
- `pnpm run route:plan -- --package <fixture> --print-routes`
- `pnpm run render:package -- --package <fixture> --out output/stabilization`
- `pnpm run qa:bundle -- --package <fixture> --out output/stabilization`

Repo precheck:

- `pnpm run doctor`

## Captured artifacts

### Route plans

- Single-period route plan: `output/stabilization/benchmark-1.routes.txt`
- Multi-day route plan: `output/stabilization/careers-8-technology.routes.txt`

### Visual sidecars (`*.visual.json`)

- Single-period sidecars (4 total) under:
  - `output/stabilization/benchmark_1_grade2_math/`
- Multi-day sidecars (14 total) under:
  - `output/stabilization/careers_8_technology_use_school_workplace/`

### Bundle QA outputs

- Single-period QA output: `output/stabilization/benchmark-1.qa.txt`
- Multi-day QA output: `output/stabilization/careers-8-technology.qa.txt`

## Comparison summary

| Dimension | Single-period fixture | Multi-day fixture |
|---|---:|---:|
| Primary architecture | `single_period_full` | `multi_day_sequence` |
| Routes discovered | 4 | 14 |
| Expected artifacts | 4 | 14 |
| Actual artifacts | 4 | 14 |
| Bundle QA judgment | `pass` | `revise` |
| Ship rule | `ship` | `patch_then_ship` |
| Revised visual artifacts | none | `day1_task_sheet`, `day2_task_sheet`, `day3_task_sheet`, `day4_task_sheet`, `day5_task_sheet` |

## Regression log for #63–#69

Commits in range include schema/grammar threading, grammar bridge work, and grammar-driven task sheet composition (PRs #63, #64, #65, #66, #69).

### Regression R1 — multi-day task sheets fail visual QA

- **Observed on**: multi-day fixture only.
- **Symptoms**:
  - Bundle QA judgment drops to `revise`.
  - `visual_qa` findings on all five day task sheets report:
    - `type: main_task_visible`
    - `note: Page contains more than one main prompt region.`
- **Blast radius**:
  - `day1_task_sheet` through `day5_task_sheet` visual sidecars.
  - No missing artifacts; route planning and schema checks remain green.
- **Likely introduction window**:
  - During grammar-driven task sheet layout changes in PR #66 and follow-up canonical page-role enforcement in PR #69.
- **Status**: **OPEN** (not stabilized).

### Non-regressions (verified green)

- Single-period fixture acceptance path remains fully green (`ship`).
- Route planning and artifact counts are consistent for both fixtures.
- No cross-package collisions or blocked artifacts were reported.

## Freeze decision

**Feature merge freeze is ACTIVE** for post-#69 feature work until this checkpoint is green.

Unfreeze criteria:

1. Multi-day fixture bundle QA judgment returns to `pass`.
2. No `main_task_visible` findings across day task sheets.
3. Re-run this same two-fixture acceptance pass with captured outputs.
