# Pedagogy variant proof workflow

This branch adds a proof-of-support layer for the updated pedagogy pipeline without changing the frozen stable-core schema or the existing canonical output vocabulary.

## What is included

- `fixtures/generated/ela-8-community-issue-argument.variant-proof.json`
  - multi-day stable-core proof package
  - aligned Day 1 and Day 2 `task_sheet` variants (`supported`, `core`, `extension`)
  - optional pedagogy metadata:
    - `student_voice_opportunity`
    - `choice_structure`
    - `differentiation_intent`
    - `acceptable_response_modes`
  - optional output metadata:
    - `variant_group`
    - `variant_role`
    - `alignment_target`
    - `final_evidence_target`

- `scripts/qa-pedagogy-variants.mjs`
  - standalone QA for pedagogy-support conventions
  - checks student-facing planning sections for optional pedagogy metadata
  - checks grouped worksheet variants for aligned `alignment_target` and `final_evidence_target`
  - checks grouped worksheet variants for duplicate roles and audience leakage

## Why this is a proof branch

The current repository can already render multiple `task_sheet` outputs as long as each output has a unique `output_id` and points to a valid `source_section`.

The main repo gap is not raw rendering. The gap is that the current normalized render plan and bundle QA do not yet preserve or inspect worksheet-family semantics directly.

This branch proves that the engine can safely support the pedagogy pipeline with:

- optional metadata
- aligned differentiated task-sheet variants
- a standalone QA pass

without forcing a schema rewrite or redesigning lesson content.

## PowerShell test loop

Run from repo root.

```powershell
pnpm run schema:check -- --package fixtures/generated/ela-8-community-issue-argument.variant-proof.json
pnpm run route:plan -- --package fixtures/generated/ela-8-community-issue-argument.variant-proof.json --print-routes
pnpm run render:package -- --package fixtures/generated/ela-8-community-issue-argument.variant-proof.json --out output
pnpm run qa:bundle -- --package fixtures/generated/ela-8-community-issue-argument.variant-proof.json --out output
node scripts/qa-pedagogy-variants.mjs --package fixtures/generated/ela-8-community-issue-argument.variant-proof.json
```

## Expected rendered proof artifacts

Under `output/ela_8_community_issue_argument_variant_proof/` the current renderer should produce:

- `day1_task_sheet_supported.pdf`
- `day1_task_sheet_core.pdf`
- `day1_task_sheet_extension.pdf`
- `day2_task_sheet_supported.pdf`
- `day2_task_sheet_core.pdf`
- `day2_task_sheet_extension.pdf`
- `day1_checkpoint_sheet.pdf`
- `day2_final_response_sheet.pdf`
- `day1_slides.pptx`
- `day2_slides.pptx`
- teacher-facing overview and guide PDFs

## Known limitation

This branch does **not** yet rewrite the built-in task-sheet PDF template into the full worksheet-family layout system described in the implementation brief.

It proves the engine can:

- carry the aligned variant structure
- route and render differentiated student sheets as separate outputs
- keep final evidence distinct
- run a dedicated QA layer for pedagogy-support conventions

A later renderer pass can upgrade visible worksheet-family layout behavior without forcing another schema redesign.
