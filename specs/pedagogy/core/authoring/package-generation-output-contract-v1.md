# Package Generation Output Contract v1

Purpose: define what a brief-to-package generator must return and which checks must pass before the result can be trusted.

This contract sits between the teacher-facing brief and the engine-facing package.

## Output format

The generator must return:

- exactly one JSON object
- no markdown
- no commentary
- no multiple options in one response

## Required package qualities

The generated package must be:

- architecture-consistent
- classroom-realistic
- explicit about outputs
- explicit about evidence location
- explicit about teacher/student separation
- minimal but sufficient for rendering

## Required semantic guarantees

### Teacher/student separation

- teacher-only notes remain teacher-only
- checkpoint and release logic remain teacher-only
- student-facing artifacts contain only student-facing language and embedded supports

### Evidence integrity

- there is one declared final evidence location
- final evidence appears only in the declared evidence artifact
- planning artifacts do not become final evidence artifacts unless explicitly declared

### Architecture integrity

- `single_period_full` packages do not simulate fake multi-day structures
- `multi_day_sequence` packages preserve day boundaries and continuity
- carryover and checkpoint logic survive package generation

### Requested-output integrity

- the brief’s `required_outputs` field is authoritative
- every requested output must appear in `bundle.declared_outputs`
- every requested output must appear in routable package outputs, either top-level `outputs[]` or day-scoped `days[*].outputs[]`
- missing requested outputs are generation failures, not optional cleanup items
- ordinary teacher language such as PowerPoint, PPT, slide deck, marking guide, answer guide, or student packet must be mapped to canonical output types before validation

## Required package components by architecture

### `single_period_full`

At minimum, the package should include metadata, teacher guide source content, student-facing source content, and an outputs array.

### `multi_day_sequence`

At minimum, the package should include metadata, lesson overview source content when requested or needed, teacher guide source content, `days[]`, per-day source content, and outputs at top level and per-day level as needed.

## Output declarations

The package must declare outputs explicitly.

Required output declarations must be driven by the brief’s `required_outputs` field.

Defaults may fill obvious structural gaps for coherence, but may not override or erase the brief’s explicit output choices.

The package generator must not emit schema-only blocked output types as classroom-ready outputs. When a teacher asks for a generic rubric, prefer `rubric_sheet` unless the task deliberately targets future schema-only `rubric` work.

## Naming rules

- `lesson_title` remains human-facing display naming
- `topic` remains a short canonical topic label
- output IDs should be deterministic and renderer-safe
- generated source sections must match the outputs they feed

## Package readiness rule

A generated package is ready for the engine only if it can plausibly pass:

- brief required-output preservation
- `schema:check`
- `route:plan`
- `render:package`
- `qa:bundle`

`qa:render` remains a single-artifact drill-down tool. It is useful for diagnosing a specific PDF or PPTX, but `qa:bundle` is the package-level gate.

## Failure conditions

A generated package should be rejected before classroom use if any of these are true:

- required outputs from the brief are missing from `bundle.declared_outputs`
- required outputs from the brief are missing from routable package outputs
- required output names in the brief cannot be mapped to canonical output types
- evidence location is ambiguous
- teacher-only guidance leaks into student-facing artifacts
- architecture and day structure conflict
- checkpoint/release logic conflicts with final evidence timing
- output declarations do not match source sections
- schema-only blocked output types are presented as render-ready classroom artifacts

## Preferred generation strategy

Prefer clear package structure, explicit output declarations, embedded supports, stable naming, deterministic structure, and full render/bundle QA before calling the package classroom-ready.

Avoid speculative extra artifacts, hidden assumptions about evidence placement, duplicated teacher/student content, collapsing multi-day lessons into one undifferentiated block, or treating schema validity as classroom readiness.
