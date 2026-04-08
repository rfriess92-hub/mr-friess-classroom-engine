# Brief to Stable-Core Package Generation Prompt v1

Purpose: define the canonical prompt for converting a teacher-facing lesson brief into a stable-core package that the engine can validate, route, render, and QA-check.

This prompt is intended for AI-assisted package generation.

## Prompt objective

Given a completed teacher lesson brief, generate exactly one stable-core package JSON object.

The generated package must:
- preserve teacher/student separation
- preserve declared evidence location
- preserve architecture boundaries
- preserve checkpoint/release logic when present
- declare explicit outputs
- be suitable for:
  - `schema:check`
  - `route:plan`
  - `render:package`
  - `qa:render`
  - `qa:bundle`

## Canonical generator prompt

```text
You are generating a stable-core lesson package for the Mr. Friess Classroom Engine.

You will receive a teacher-facing lesson brief.
Your job is to convert that brief into exactly one machine-facing stable-core package JSON object.

Hard requirements:
1. Return JSON only. No markdown. No explanation.
2. Preserve the lesson architecture declared in the brief.
3. Preserve teacher/student separation.
4. Preserve the declared final evidence location.
5. Preserve checkpoint/release logic when present.
6. Declare outputs explicitly. Do not rely on hidden or implied outputs.
7. Keep embedded supports embedded in student-facing artifacts unless the brief explicitly says otherwise.
8. Do not invent contradictory lesson structures.
9. Use clear, classroom-realistic language.
10. Prefer minimal sufficient structure over bloated structure.

Field handling rules:
- `lesson_title` is human-facing display naming.
- `topic` is the short canonical topic label.
- `final_product` describes what students make.
- `evidence_location` determines where final evidence must live.
- `required_outputs` is authoritative and must drive the declared outputs.
- `teacher_constraints` is authoritative for separation, control, and release rules.

Architecture rules:
- If `architecture` is `single_period_full`, generate a one-day package.
- If `architecture` is `multi_day_sequence`, generate a package with preserved day boundaries and day-scoped outputs where needed.

Output rules:
- Always generate teacher-facing sections needed for the declared outputs.
- Always generate student-facing sections needed for the declared outputs.
- If `lesson_overview` is present, keep it teacher-facing.
- If `checkpoint_sheet` is present, keep it teacher-facing.
- If `final_response_sheet` or `exit_ticket` is the evidence location, final evidence must live there.

Quality rules:
- Do not place teacher-only guidance in student-facing artifacts.
- Do not place final evidence in planning-only artifacts.
- Do not collapse multi-day continuity into a single undifferentiated block.
- Do not omit required outputs.
- Do not add unnecessary outputs unless required for coherence.

Return exactly one JSON object representing the stable-core package.
```

## Expected input

The prompt expects a completed teacher lesson brief in the Phase A format.

## Expected output

The prompt must return exactly one stable-core package JSON object.

## Recommended usage pattern

1. Start with the canonical teacher brief template.
2. Run the generator prompt against the completed brief.
3. Save the generated JSON package.
4. Run:
   - `schema:check`
   - `route:plan`
   - `render:package`
   - `qa:render`
   - `qa:bundle`

## Non-goals for v1

This prompt does not attempt to:
- optimize style for every teacher voice
- generate multiple package variants at once
- perform semantic classroom QA across rendered artifacts
- replace downstream engine validation
