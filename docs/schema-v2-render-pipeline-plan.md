# Schema v2.1 render-pipeline scaffold

## Mode

Repo / build / rendering / QA

This document translates the stabilized pedagogy handoff into a minimal technical render-pipeline plan.
It is intentionally contract-first and avoids template-library expansion, output invention, or benchmark overfitting.

## Working interpretation

The render pipeline must preserve:

- pedagogy meaning, not just content presence
- teacher/student separation
- output-role integrity
- bundle integrity
- embedded-support placement
- final evidence location
- multi-day boundaries and carryover logic

The package schema, not benchmark prose, is the source of truth.

## Minimal flow

1. ingest a Schema v2.1 package
2. run preflight validation
3. normalize the package into a render plan
4. route each normalized output to an audience-aware renderer
5. emit only the declared bundle outputs

## First implementation scope

### single_period_full

Supported canonical outputs:

- teacher_guide
- slides
- worksheet
- exit_ticket

### multi_day_sequence

Supported canonical outputs:

- lesson_overview
- teacher_guide
- slides
- task_sheet
- checkpoint_sheet
- final_response_sheet (optional)

## First internal target contract

This scaffold assumes a package model with these minimum root fields:

- `schema_version`
- `package_id`
- `primary_architecture`
- `outputs` and/or `days[*].outputs`

This is the minimum internal contract for the scaffold.
If the authoritative Schema v2.1 docs use different field names, the ingestion layer should be updated rather than bending renderer logic around benchmark prose.

## Preflight checks

The scaffold preflight is designed to check:

- canonical `output_type` recognition
- valid audience values
- required top-level package sections
- no non-canonical output types
- embedded-support elements remain embedded
- no undeclared final-evidence duplication
- `materials_control_note` when required for inquiry packages
- `secondary_architecture_support` note presence when declared

## Render-plan target

Normalized outputs should carry at least:

- `output_id`
- `output_type`
- `audience`
- `bundle_id`
- `primary_architecture`
- `secondary_architecture_support`
- `day_scope`
- `is_embedded`
- `final_evidence_role`
- `source_path`

## Acceptance strategy

Do not start from visual polish.
The first proof point is a correct `render_plan` for:

- Benchmark 1 style `single_period_full`
- Challenge Benchmark 7 style `multi_day_sequence`

The render plan should prove:

- no teacher-facing material in student outputs
- no undeclared outputs
- no dropped outputs
- no broken bundle membership
- no lost day boundaries
- no duplicated final evidence unless explicitly declared
