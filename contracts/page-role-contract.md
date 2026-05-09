# Page Role Contract

This contract protects rendered package structure and page-role detection.

## Purpose

Rendered classroom packages must expose predictable roles so QA can verify that required teacher and student functions exist.

## Stable role expectations

Student-facing packets commonly require:

- `learning_target`
- `student_task`
- `scaffold`
- `practice`
- `reflection`
- `completion_check`

Teacher-facing guides commonly require:

- `teacher_overview`
- `materials`
- `timing`
- `facilitation_notes`
- `assessment_guidance`
- `project_tools`

Not every package requires every role. Required roles must be declared by the relevant fixture, package type, or QA proof file.

## Classifier drift rule

A render that looks acceptable can still fail if its role signals drift. Role detection must remain stable across snake_case keys, dotted keys, heading text, checklist labels, closure/completion language, and project prompt/tool bank language.

## Teacher/student separation

Teacher-only roles must not appear in student packets. Student-facing roles must not rely on teacher-only context to be usable.

## Contract migration

If a role is renamed, split, merged, or removed, the phase card must explicitly identify a contract migration and include old role, new role, affected packages, affected fixtures, migration tests, and QA report notes.

## Known high-risk roles

- `completion_check`: often confused with reflection, check-in, or closure support.
- `project_tools`: often missed when project prompts, matching banks, quick tools, or tool menus are rendered as ordinary notes.
- `assessment_guidance`: often leaks into student-facing assessment pages if output boundaries are weak.
