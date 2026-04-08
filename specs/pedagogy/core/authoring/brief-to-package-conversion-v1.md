# Brief to Stable-Core Package Conversion Contract v1

Purpose: define how a teacher-facing brief becomes a machine-facing stable-core package.

This contract keeps the authoring layer aligned with the engine layer.

## Core principle

The teacher writes a plain-English brief.
The converter produces a stable-core package.
The engine then runs:
- `schema:check`
- `route:plan`
- `render:package`
- `qa:render`
- `qa:bundle`

## Field mapping

### Brief -> package metadata

- `lesson_title` -> human-facing title and display labels
- `subject` -> `subject`
- `grade` -> `grade`
- `topic` -> `topic`
- `architecture` -> `primary_architecture`
- `number_of_days` -> day structure

### Brief -> teacher-facing sections

- `big_idea` -> `teacher_guide.big_idea`
- `essential_question` -> `lesson_overview.essential_question` and slide prompt seed
- `learning_goals` -> `teacher_guide.learning_goals`
- `timing_or_day_flow` -> `teacher_guide.timing` or day sequence flow
- `notes` -> `teacher_guide.teacher_notes` where appropriate

### Brief -> student-facing sections

- `student_task` -> task/worksheet prompts
- `final_product` -> final output intent and prompt framing
- `student_supports` -> embedded supports in student-facing artifacts

### Brief -> control and integrity rules

- `evidence_location` -> declared final evidence artifact
- `required_outputs` -> declared outputs and route surface
- `teacher_constraints` -> teacher/student separation rules, checkpoint/release rules, and evidence-location rules

## Conversion rules

### Rule 1: explicit outputs win
`required_outputs` must be treated as authoritative. Defaults may fill gaps, but may not override explicit output requests.

### Rule 2: one evidence location
Every package must declare one explicit final evidence location.
Examples:
- `worksheet`
- `exit_ticket`
- `final_response_sheet`

### Rule 3: teacher-only content stays teacher-only
Teacher notes, control instructions, and checkpoint logic may not leak into student-facing outputs.

### Rule 4: architecture must match shape
- `single_period_full` -> one-day structure
- `multi_day_sequence` -> day-based structure with preserved boundaries

### Rule 5: multi-day continuity must survive conversion
If the brief declares multiple days, the package must preserve:
- day boundaries
- carryover logic
- checkpoint/release logic
- final evidence timing and placement

### Rule 6: lesson overview is teacher-facing
If `lesson_overview` is present, it remains teacher-facing and is not treated as a student artifact.

## Output selection defaults

### `single_period_full`
Default outputs:
- `teacher_guide`
- `slides`
- `worksheet` or `task_sheet`
- `exit_ticket` or `final_response_sheet` if final evidence is separate

### `multi_day_sequence`
Default outputs:
- `lesson_overview`
- `teacher_guide`
- per-day `slides`
- `task_sheet`
- `checkpoint_sheet` when release/control matters
- `final_response_sheet` when final evidence is distinct from planning

## Minimum package expectations

### Minimum for `single_period_full`
A generated package should include:
- metadata
- teacher guide
- at least one student-facing work artifact
- declared outputs array

### Minimum for `multi_day_sequence`
A generated package should include:
- metadata
- lesson overview
- teacher guide
- `days[]`
- per-day source sections
- declared outputs at the top level and day level as needed

## Drift controls

To prevent drift between the authoring layer and the engine:
- `lesson_title` is human-facing
- `topic` is short and canonical
- `final_product` describes what students make
- `evidence_location` describes where evidence must live
- `required_outputs` is always explicit
- `teacher_constraints` is always present, even if brief

## End state

The intended path is:

teacher brief -> stable-core package -> engine validation/routing/rendering/QA -> lesson bundle
