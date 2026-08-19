# Page Role Contract

This contract protects rendered package structure and page-role detection.

## Purpose

Rendered classroom packages must expose predictable roles so routing and QA can verify that required teacher and student functions exist.

## Contract layers

The engine uses two related but distinct vocabularies:

1. **Package semantic requirements** describe instructional functions that a fixture or package may require.
2. **Renderer page-role IDs** are exact machine values emitted in artifact traces and consumed by template routing and structural QA.

Semantic requirements are not implicit aliases for renderer page-role IDs. A fixture or migration must map them explicitly when both layers are used.

## Canonical renderer page-role IDs

Student multi-page packets may emit:

- `follow_along`
- `continuation_notes`
- `reference_bank`
- `research_planner`
- `completion_check`

Teacher multi-page guides may emit:

- `overview`
- `sequence_map`
- `project_tools`
- `teacher_model`
- `assessment_reference`

These identifiers are canonical. They must remain aligned across page-role detection, artifact traces, template routing, density rules, proof fixtures, and structural QA.

## Package semantic requirements

Student-facing packages commonly require instructional functions such as:

- `learning_target`
- `student_task`
- `scaffold`
- `practice`
- `reflection`
- `completion_check`

Teacher-facing packages commonly require instructional functions such as:

- `teacher_overview`
- `materials`
- `timing`
- `facilitation_notes`
- `assessment_guidance`
- `project_tools`

Not every package requires every function or page role. Required values must be declared by the relevant fixture, package type, or QA proof file.

## Classifier drift rule

A render that looks acceptable can still fail if its role signals drift. Role detection must remain stable across snake_case keys, dotted keys, hyphenated keys, heading or label text, checklist labels, closure/completion language, and project prompt/tool-bank language.

Regression tests must cover both positive detection and nearby false-positive cases for high-risk roles.

## Route and density coverage

Every canonical renderer page role that resolves to a compact template must have:

- a stable template-route assertion;
- a density rule for the resolved template;
- a QA or proof-fixture path that exercises the role.

A route without a density rule is contract drift even when rendering succeeds.

## Teacher/student separation

Teacher-only roles must not appear in student packets. Student-facing roles must not rely on teacher-only context to be usable.

## Contract migration

If a role is renamed, split, merged, or removed, the phase card must explicitly identify a contract migration and include the old role, new role, affected packages, affected fixtures, migration tests, and QA report notes.

## Known high-risk roles

- `completion_check`: often confused with reflection, check-in, or closure support. A live multi-page packet must end with a real completion or success-criteria checklist.
- `project_tools`: often missed when project prompts, matching banks, quick tools, materials, or tool menus are rendered as ordinary notes.
- `assessment_reference`: can drift from the package-level `assessment_guidance` concept and must remain teacher-only.
- `continuation_notes`: can route correctly while silently escaping compact density checks if its template is omitted from the density registry.
