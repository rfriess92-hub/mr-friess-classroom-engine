# Assessment and Quiz Render Contract

Status: current live contract.  
Scope: schema-level `assessment` and `quiz` output types, plus explicit teacher-only `answer_key` marking guides.

Current render status:

- `assessment` and `quiz` are no longer schema-only stubs.
- Student-facing `assessment` and `quiz` PDFs render through the existing `engine/pdf-html/render.mjs` HTML/Playwright path.
- Teacher marking guides render through explicit teacher-only `answer_key` routes.
- Marking guides are not auto-generated companion files. Packages must declare the teacher-only route.
- Student assessment/quiz artifacts must not render `answer_key`, `marking_notes`, model answers, or teacher-only scoring notes.

This document records the current implementation contract so older A1 design notes do not drift back into the live repo truth.

---

## Why This Exists

The engine supports schema-level `assessment` and `quiz` output types. They are now part of the normal package route/render path, not blocked placeholder types.

The remaining risk is teacher/student leakage and weak classroom formatting. This contract preserves answer separation while later work improves traditional test/quiz formatting.

---

## Output-Type Roles

### `quiz`

Purpose: short, low-stakes check for recall, understanding, or early application.

Default student artifact:

- compact title block
- student name/date area
- instructions
- optional time estimate or time limit
- grouped questions
- word bank only when explicitly supplied through render hints or section data
- short response space scaled by `question_type` and `n_lines`

Teacher marking guide:

- use an explicit teacher-only `answer_key` output route
- include correct answers, explanations, and marking notes when supplied
- do not include student writing space unless deliberately useful for reference

### `assessment`

Purpose: more formal evidence of learning than a quiz.

Default student artifact:

- formal assessment title block
- name/date area
- instructions
- optional time limit
- optional total points
- grouped questions by type or section
- clear response space
- optional proficiency-scale criteria when provided

Teacher marking guide:

- use an explicit teacher-only `answer_key` output route
- include answer key / marking guide content when supplied
- include model responses, partial-credit guidance, common-error notes, and proficiency notes when supplied

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
- partial-credit notes
- marking notes
- likely misconceptions
- point values
- proficiency-scale interpretation

If a question contains `answer_key` or `marking_notes`, those fields must be stripped from the student PDF and routed only to a teacher-facing `answer_key` output when that route is declared.

---

## Required Current Behavior

The implementation must:

1. Register `assessment` and `quiz` in the HTML render path.
2. Keep `assessment` and `quiz` out of `KNOWN_UNIMPLEMENTED_TYPES` while their renderer support remains live.
3. Preserve student/teacher answer separation.
4. Use explicit teacher-only `answer_key` routes for marking guides.
5. Keep proof fixtures and smoke tests proving student assessment/quiz PDFs and teacher marking guides exist.
6. Keep answer-leak QA wired through bundle QA.
7. Keep `engine/contracts/output-type-inventory.json` and `docs/CONTRACT_DRIFT_INVENTORY.md` aligned whenever support changes.

---

## Proof Fixture Expectations

Current proof fixture:

`fixtures/tests/a1-assessment-quiz.proof.json`

Expected current behavior:

- `schema:check`: pass
- `route:plan`: pass
- `render:package`: pass
- student `quiz` PDF exists
- student `assessment` PDF exists
- teacher `answer_key` marking-guide PDFs exist when routes are declared
- `qa:bundle`: runs answer-leak checks and blocks student answer leakage

---

## Current Open Work

1. Improve traditional test/quiz formatting based on artifact review.
2. Extend answer-leak coverage as templates and sidecars evolve.
3. Add question-bank pulling only after render and answer-separation behavior are stable.
4. Keep marking guides explicit until the project deliberately chooses auto-generated companion files.

Do not reintroduce older language saying `assessment` and `quiz` fail at render time. That was the A1.1 design state, not the current implementation state.
