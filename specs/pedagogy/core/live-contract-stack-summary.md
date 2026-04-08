# Live Contract Stack Summary

## Stable core trust order

The render pipeline should trust the following sources in this order:

1. `/schemas/canonical-vocabulary.json`
2. `/schemas/lesson-package.schema.json`
3. `/specs/pedagogy/core/approval-workflow.md`
4. `/specs/pedagogy/core/handoff-constraints.md`
5. `/qa/render-acceptance-checklist.md`
6. validated stable-core fixtures
7. background prose and benchmark history

## Stable core position

The stable core pack is the minimum repo-ready pedagogy layer the render pipeline should trust first.
It excludes experimental project support from the blocking implementation path.

## Implementation rule

Build from schema and handoff constraints, not from benchmark prose alone.
Preserve pedagogy meaning, not just content presence.

## Boundaries

- teacher/student separation is non-negotiable
- output-role integrity is non-negotiable
- bundle integrity is non-negotiable
- curriculum visibility stays teacher-facing by default
- embedded support elements are not standalone outputs by default
- hybrid packages may declare one primary architecture and one `secondary_architecture_support`
- multi-day packages must preserve day boundaries, checkpoints, and carryover logic

## Ready now

- stable-core schema ingestion
- stable-core fixture validation
- audience-aware output handling
- bundle-preserving rendering

## Next

- project fixture JSON files
- regression fixtures
- CI wiring for schema + render QA
- broader render QA coverage
