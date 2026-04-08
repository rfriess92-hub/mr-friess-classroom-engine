# Brief Quality Checklist v1

Purpose: a quick review pass before a teacher brief is converted into a stable-core package.

A brief should pass this checklist before package generation.

## Required metadata

- [ ] `lesson_title` is present
- [ ] `subject` is present
- [ ] `grade` is present
- [ ] `topic` is present
- [ ] `architecture` is present
- [ ] `number_of_days` matches the architecture

## Core lesson intent

- [ ] `big_idea` is present
- [ ] `student_task` is present
- [ ] `final_product` is present
- [ ] `evidence_location` is explicit
- [ ] `required_outputs` is explicit

## Architecture coherence

### For `single_period_full`
- [ ] `number_of_days` is `1`
- [ ] no unnecessary multi-day carryover is implied
- [ ] final evidence is either embedded in the main student artifact or explicitly separated

### For `multi_day_sequence`
- [ ] `number_of_days` is `2+`
- [ ] day boundaries are described
- [ ] carryover logic is explicit
- [ ] checkpoint/release logic is explicit if needed
- [ ] final evidence timing is clear

## Teacher/student separation

- [ ] teacher-only guidance is explicit where needed
- [ ] teacher constraints are present
- [ ] student supports are meant to remain in student-facing artifacts
- [ ] no teacher-only instructions are written as student-facing task language

## Evidence integrity

- [ ] the final product and evidence location are not confused
- [ ] final evidence has one declared location
- [ ] checkpoint or release logic does not conflict with final evidence placement

## Output sanity check

- [ ] outputs fit the architecture
- [ ] outputs fit the lesson task
- [ ] outputs are not underdeclared
- [ ] outputs are not bloated beyond what the lesson needs

## Drift check

- [ ] `lesson_title` is human-facing
- [ ] `topic` is short and canonical
- [ ] `required_outputs` is explicit rather than assumed
- [ ] `teacher_constraints` preserves non-negotiables
- [ ] the brief can plausibly map into a stable-core package without guessing key fields

## Pass rule

A brief is ready for package conversion only if:
- all required metadata checks pass
- core lesson intent checks pass
- teacher/student separation is clear
- final evidence location is explicit
- the output list is usable without major inference
