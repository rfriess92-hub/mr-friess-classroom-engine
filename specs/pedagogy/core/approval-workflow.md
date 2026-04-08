# Approval Workflow v1.1

Stable-core review order for package acceptance and render readiness.

## Fixed review order

1. canonical vocabulary
2. schema validity
3. architecture fit
4. grade-band fit
5. differentiation alignment
6. output bundle integrity
7. assessment/evidence placement
8. curriculum alignment
9. status assignment

## Status logic

A package is render-ready only when:

- canonical enums are valid
- schema checks pass
- output bundle is complete and canonical
- audience separation is preserved
- final evidence placement is coherent
- no blocking handoff-constraint violation remains

## Review rule

Do not let downstream rendering compensate for invalid vocabulary, invalid schema, or broken package structure.

## Render-pipeline implication

If a package fails any step above, the renderer should stop at preflight and report the failure rather than improvising outputs.
