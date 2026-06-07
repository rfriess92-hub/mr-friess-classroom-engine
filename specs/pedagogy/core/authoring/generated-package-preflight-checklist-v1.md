# Generated Package Preflight Checklist v1

Purpose: a fast review pass after brief -> package generation and before classroom use.

Use this checklist before trusting a generated package. Schema validity is not enough.

## Structure check

- [ ] output is exactly one JSON object
- [ ] package metadata is present
- [ ] architecture matches the source brief
- [ ] outputs are declared explicitly
- [ ] source sections exist for declared outputs

## Requested-output check

- [ ] the brief has a readable `required_outputs` field
- [ ] every required output from the brief appears in `bundle.declared_outputs`
- [ ] every required output from the brief appears in top-level `outputs[]` or day-scoped `days[*].outputs[]`
- [ ] teacher-language synonyms are mapped to canonical output types (`PowerPoint` -> `slides`, `student packet` -> `task_sheet`, `marking guide` -> `answer_key`)
- [ ] no schema-only blocked output type is presented as classroom-ready

## Teacher/student separation check

- [ ] teacher guide content is teacher-facing
- [ ] lesson overview content is teacher-facing when present
- [ ] checkpoint content is teacher-facing when present
- [ ] student-facing artifacts do not contain teacher-only instructions
- [ ] student supports remain embedded in student-facing artifacts

## Evidence integrity check

- [ ] evidence location is explicit
- [ ] there is one final evidence artifact
- [ ] planning artifacts are not being used as final evidence unless explicitly declared
- [ ] checkpoint/release logic does not conflict with final evidence timing

## Architecture integrity check

For `single_period_full`:

- [ ] structure stays one-day
- [ ] no unnecessary day scaffolding is introduced

For `multi_day_sequence`:

- [ ] day boundaries are explicit
- [ ] carryover is explicit
- [ ] checkpoint/release timing is preserved when present
- [ ] final response timing is preserved when present

## Output sanity check

- [ ] outputs match the brief’s `required_outputs`
- [ ] no essential outputs are missing
- [ ] no obviously unnecessary outputs were introduced
- [ ] output IDs look deterministic and renderer-safe

## Readiness rule

A generated package is ready for engine execution only if the structure is coherent, requested outputs are preserved, separation rules are intact, evidence integrity is intact, and outputs are explicit and usable.

Then run the package acceptance path:

- `schema:check`
- `route:plan`
- `render:package`
- `qa:bundle`

Use `qa:render` only when drilling into one specific rendered artifact.
