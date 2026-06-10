# Classroom Render Repo Handoff

## Psychology 11/12 Classroom Engine

This repo is an instructional production engine for teacher-ready and student-ready Psychology 11/12 classroom artifacts. It should prioritize lesson logic, classroom usability, clean formatting, and student/teacher separation over decorative template variety.

The Psychology 11/12 course spine should use OpenStax Psychology 2e as the core content spine, translated into B.C.-style classroom practice: Know-Do-Understand framing, Core Competencies, concept-based learning, formative assessment, realistic timing, and accessible student-facing language.

## Non-negotiables

Instructional constraints:

- One clear core idea per lesson or slide section.
- No textbook-on-a-slide output.
- Realistic classroom timing.
- Student-facing language must be clear, direct, and age-appropriate.
- Teacher-facing notes must not appear in student-facing outputs.
- Answer keys and marking guidance must never leak into student packets.
- No required personal disclosure from students.
- Activities must work in an ordinary classroom without elaborate setup.
- OpenStax Psychology 2e remains the core content spine.

Formatting constraints:

- Clean Markdown or structured source files.
- Predictable heading hierarchy.
- No oversized text blocks.
- No text under titles.
- No text touching box edges.
- No unsafe text fill.
- No inconsistent spacing by slide role.
- No hidden overflow.
- No clipped instructions.
- No density that makes the artifact unusable.

Differentiation constraints:

- Default aligned tiers: Supported, Proficient, Extending.
- Tiers adjust access, scaffolding, and complexity without changing the core learning target.

## Render philosophy

Instruction comes first. Visual polish supports the lesson; it does not replace it. Good output should feel calm, clear, organized, classroom-realistic, student-readable, and teacher-usable with minimal prep.

When deciding between polish and clarity, choose clarity.

## Source of truth

Active source inputs:

1. Final Psychology 11/12 package materials.
2. OpenStax Psychology 2e as the course content spine.
3. Classroom engine master specs.
4. Active cycle binders and student packet bundles.
5. Current render decisions log.
6. QA notes from prior decks and packages.

Archived unit files are not active unless explicitly restored.

## Pipeline expectations

The expected pipeline is:

```text
doctor
schema:check
route:plan
render:package
qa:bundle
```

The system should fail loudly with useful reports rather than silently producing broken artifacts.

## Audience rules

Every artifact must have a clear audience.

Student-facing artifacts may include instructions, learning targets, examples, sentence frames, student tasks, practice prompts, reflection questions, and student-facing rubrics.

Student-facing artifacts must not include answer keys, teacher notes, marking notes, hidden rationale, internal source comments, repo/debug metadata, or teacher-only directions.

Teacher-facing artifacts may include lesson flow, timing, setup notes, assessment intent, differentiation options, answer keys, marking guidance, misconception notes, extension options, and source notes.

The render system should enforce this separation, not rely only on manual checking.

## Slide rules

Slides should have one main instructional move, short assertion-style titles, clear task or takeaway, minimal body text, strong spacing, no visible teacher notes, and no crowded cards.

Common slide roles:

- Mission / purpose
- Routine / retrieval
- Concept introduction
- Example
- Stop and check
- Compare
- Apply
- Misconception check
- Reflection
- Takeaway

Density guard: if a slide needs more than roughly 40-60 student-facing words, split it. If one slide has multiple distinct tasks, split it.

## PDF and DOCX rules

PDFs must be printable and classroom-usable: clear margins, no clipped content, readable text, task instructions near work areas, adequate writing space, and separated teacher/student versions.

DOCX outputs are editable source artifacts and should prioritize clean heading styles, editable tables, predictable file naming, and teacher/student separation.

## QA categories

Use three separate QA categories:

1. Content issue: instructional content is wrong, unclear, misaligned, or incomplete.
2. Render logic issue: the renderer made a bad structural decision.
3. Artifact formatting issue: the content is correct, but the artifact looks or functions badly.

Do not mix these categories. They need different fixes.

## Required QA checklist

Student safety and appropriateness:

- No required personal disclosure.
- No inappropriate self-labelling tasks.
- No stigmatizing language.
- No answer key leakage.
- No teacher-only notes visible.

Instructional quality:

- Clear learning target.
- Clear task.
- One core idea at a time.
- OpenStax alignment preserved.
- B.C.-style Know-Do-Understand alignment where relevant.
- Core Competencies included where relevant.
- Supported / Proficient / Extending tiers aligned.

Artifact quality:

- Slides readable and not crowded.
- PDFs printable with good margins and no clipping.
- Student writing space adequate.
- Teacher/student versions clearly separated.
- Names are predictable.
- Manifest and QA evidence generated.
- Errors captured.

## Immediate build priorities

1. Stabilize schema validation.
2. Enforce student/teacher visibility rules.
3. Build route planning before rendering.
4. Render student PDFs and teacher PDFs separately.
5. Add answer-leakage QA guard.
6. Improve slide density handling.
7. Add formatting QA for spacing, overflow, and page breaks.
8. Produce full QA bundle.
9. Render Psychology 11/12 package from the final active source package.
10. Build teacher-facing marking guide outputs.

Do not start by adding decorative template variety. Fix correctness, separation, and usability first.

## Working principle

The repo should protect classroom reality. A technically successful render is not enough. The output must be something a teacher can actually use with students.

Optimize in this order:

1. Instructional correctness.
2. Student/teacher separation.
3. Classroom usability.
4. Readability.
5. Visual polish.
6. Decorative variation.
