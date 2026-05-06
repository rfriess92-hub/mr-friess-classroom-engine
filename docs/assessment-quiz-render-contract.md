# Assessment and Quiz Render Contract

Status: A1.1 contract/design slice.  
Scope: schema-level `assessment` and `quiz` output types.  
Current render status: blocked by `KNOWN_UNIMPLEMENTED_TYPES` in `scripts/render-package.mjs`.

This document defines the intended implementation contract before renderer work begins.

---

## Why This Exists

The engine already has schema support for:

- `assessment`
- `quiz`
- `assessmentQuestion`

But those output types are still schema-only. They validate and route, then fail loudly at render time. That is correct until the student-facing PDF templates, answer-key separation, QA, and proof fixtures exist.

This contract prevents drift between schema, render behavior, and classroom expectations.

---

## Output-Type Roles

### `quiz`

Purpose: short, low-stakes check for recall, understanding, or early application.

Expected classroom use:

- exit-style check
- vocabulary check
- short skill check
- warm-up or end-of-lesson check
- practice quiz with no formal grading pressure

Default student artifact:

- compact title block
- student name/date area
- instructions
- optional time estimate or time limit
- grouped questions
- word bank only when explicitly supplied through render hints or section data
- short response space scaled by `question_type` and `n_lines`

Default teacher artifact:

- answer key entries for all questions with `answer_key` or `marking_notes`
- no student writing space
- optional total points and scoring guidance

### `assessment`

Purpose: more formal evidence of learning than a quiz.

Expected classroom use:

- unit check
- lab reasoning check
- evidence-based constructed response
- mixed-format assessment
- performance-task written component

Default student artifact:

- formal assessment title block
- name/date area
- instructions
- optional time limit
- optional total points
- grouped questions by type or section
- clear response space
- optional proficiency-scale criteria when provided

Default teacher artifact:

- answer key / marking guide
- model responses
- partial-credit guidance
- common-error notes
- optional proficiency notes

---

## Student / Teacher Separation Rules

Student artifacts must never render:

- `answer_key`
- `marking_notes`
- model answers
- acceptable variants
- teacher-only scoring comments
- hidden question-bank metadata

Teacher artifacts may render:

- question text
- correct answers
- model responses
- partial credit notes
- marking notes
- likely misconceptions
- point values
- proficiency-scale interpretation

If a question contains `answer_key` or `marking_notes`, those fields must be stripped from the student PDF and routed only to a teacher-facing answer key / marking guide.

---

## Question-Type Render Contract

| `question_type` | Student Render | Teacher Render |
|---|---|---|
| `multiple_choice` | question text + labelled choices + circle/checkbox target | correct option, explanation if supplied |
| `true_false` | true/false choice targets | correct answer + marking note |
| `short_answer` | prompt + response lines; use `n_lines` when present | model answer + partial-credit notes |
| `extended_response` | larger lined response area; optional planning reminder | model response + rubric/marking notes |
| `fill_in_blank` | sentence/prompt with blank line(s) | accepted answer(s) |
| `matching` | two-column matching layout | correct pairings |
| `calculation` | problem + answer line + workspace grid/lines | solution, units, partial-credit notes |
| `diagram_label` | diagram placeholder/parts list + label lines | labelled solution or answer list |

---

## Required Implementation Behavior

A1.2 renderer implementation must:

1. Add HTML templates for `assessment` and `quiz`.
2. Register both output types in the HTML render path.
3. Remove `assessment` and `quiz` from `KNOWN_UNIMPLEMENTED_TYPES` only after proof fixtures pass.
4. Preserve student/teacher answer separation.
5. Add at least one proof fixture with both student and teacher-facing artifacts.
6. Add smoke tests proving render output exists.
7. Update `engine/contracts/output-type-inventory.json` and `docs/CONTRACT_DRIFT_INVENTORY.md`.

---

## Proof Fixture Expectations

A1.1 adds a blocked proof fixture:

`fixtures/tests/a1-assessment-quiz.blocked-proof.json`

Expected current behavior:

- `schema:check`: pass
- `route:plan`: pass
- `render:package`: fail loudly with current unimplemented output-type message

Expected A1.2 behavior after implementation:

- `schema:check`: pass
- `route:plan`: pass
- `render:package`: pass
- student `quiz` PDF exists
- student `assessment` PDF exists
- teacher answer key / marking guide exists
- no answer-key text appears in student PDFs

---

## Open Design Decisions for A1.2

1. Should `assessment` auto-generate a teacher-facing answer-key PDF when answer data is present, or require an explicit `answer_key` output route?

   Recommended: require explicit teacher-facing output route for now. Auto-generation can come later.

2. Should `quiz` and `assessment` share one template module?

   Recommended: yes. Use one module with different density/formality settings.

3. Should answer-key separation be enforced through rendering only or through QA too?

   Recommended: both. Rendering strips teacher-only fields; QA checks student sidecars/PDF text where feasible.

4. Should point values be mandatory?

   Recommended: no. Support point values, but allow proficiency-only or formative checks.

5. Should question-bank pulling happen before render implementation?

   Recommended: no. First support inline questions. Add question-bank pulling after base render is stable.
