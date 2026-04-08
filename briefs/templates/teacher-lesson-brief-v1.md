# Teacher Lesson Brief v1

Purpose: a short, teacher-facing intake format that can be converted into a stable-core lesson package.

Use this template in plain English. Do not write JSON here.

```text
lesson_title:
subject:
grade:
topic:
architecture:
number_of_days:

big_idea:
essential_question:
learning_goals:

student_task:
final_product:
evidence_location:

required_outputs:
teacher_constraints:
student_supports:
timing_or_day_flow:
notes:
```

## Required fields

A brief is ready for package conversion only when it includes:
- `lesson_title`
- `subject`
- `grade`
- `topic`
- `architecture`
- `big_idea`
- `student_task`
- `final_product`
- `evidence_location`
- `required_outputs`

## Field guidance

### `lesson_title`
The human-facing lesson name.

### `subject`
Example values: `Math`, `Science`, `English Language Arts`, `Careers`.

### `grade`
Single grade for v1.

### `topic`
Short canonical topic label.

### `architecture`
Use one of:
- `single_period_full`
- `multi_day_sequence`

### `number_of_days`
- Use `1` for `single_period_full`
- Use `2+` for `multi_day_sequence`

### `big_idea`
What the lesson is fundamentally about.

### `essential_question`
The central question students are working toward.

### `learning_goals`
Plain-language goals, usually 2 to 4.

### `student_task`
What students actually do during the lesson.

### `final_product`
What students produce by the end.

### `evidence_location`
Where final evidence must live.
Examples:
- `worksheet`
- `exit_ticket`
- `final_response_sheet`

### `required_outputs`
What the engine must render.
Examples:
- `teacher_guide`
- `lesson_overview`
- `slides`
- `worksheet`
- `task_sheet`
- `checkpoint_sheet`
- `final_response_sheet`
- `exit_ticket`

### `teacher_constraints`
Non-negotiables such as:
- teacher notes stay teacher-only
- embedded supports stay embedded
- checkpoint happens before final response release
- final evidence stays in the declared location

### `student_supports`
Supports that should remain embedded in student-facing materials.

### `timing_or_day_flow`
Either a single-class flow or a day-by-day flow.

### `notes`
Optional extra context for conversion.

## Architecture defaults

### Default for `single_period_full`
Typical outputs:
- `teacher_guide`
- `slides`
- `worksheet` or `task_sheet`
- `exit_ticket` or `final_response_sheet` if evidence is separate

### Default for `multi_day_sequence`
Typical outputs:
- `lesson_overview`
- `teacher_guide`
- `slides`
- `task_sheet`
- `checkpoint_sheet` when release/control matters
- `final_response_sheet` when final evidence is distinct from planning

## Decision rules

- Use `exit_ticket` when final evidence is short and end-of-lesson.
- Use `final_response_sheet` when final evidence is extended writing or a more developed response.
- Use `task_sheet` when students do guided task work during the lesson.
- Include `checkpoint_sheet` when teacher-controlled release matters.
- Include `lesson_overview` when the lesson spans multiple days.
