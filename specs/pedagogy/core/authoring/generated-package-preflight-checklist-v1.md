# Generated Package Preflight Checklist v1

Purpose: a fast review pass after brief -> package generation and before engine execution.

Use this checklist before running the generated package through the render pipeline.

## Structure check

- [ ] output is exactly one JSON object
- [ ] package metadata is present
- [ ] architecture matches the source brief
- [ ] outputs are declared explicitly
- [ ] source sections exist for declared outputs

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

### For `single_period_full`
- [ ] structure stays one-day
- [ ] no unnecessary day scaffolding is introduced

### For `multi_day_sequence`
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

A generated package is ready for engine execution only if:
- the structure is coherent
- separation rules are intact
- evidence integrity is intact
- outputs are explicit and usable

Then run:
- `schema:check`
- `route:plan`
- `render:package`
- `qa:render`
- `qa:bundle`
