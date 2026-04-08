# Mr. Friess Classroom Engine — Review Protocol

## Purpose
This protocol turns the house workflow into a repeatable review routine for lesson packages, rendered artifacts, and pull requests.

Use it to keep review disciplined, fast, and correctly scoped.

The rule is simple: **classify the problem first, then make the smallest safe fix in the correct layer.**

---

## Review Order
Always review in this order:

1. instructional coherence
2. artifact readability and classroom usability
3. renderer/template/output behavior
4. repeatability and merge safety

Do not start by changing templates, schema, or lesson structure until the problem is classified.

---

## The Four-Pass Review

### Pass 1 — Instructional Coherence
Goal: confirm the lesson actually makes sense before spending time polishing it.

Check:
- Is the lesson goal clear?
- Is the final evidence explicit?
- Does the sequence build toward the final evidence?
- Do checkpoints prepare students for the next release?
- Are teacher moves and student tasks aligned?
- Are embedded supports present where students will need them?

If this pass fails, hand the issue to **Instructional Design**.

---

### Pass 2 — Classroom-Facing Artifact Quality
Goal: confirm the output is readable and usable under real classroom conditions.

Check:
- Can a teacher find the final evidence quickly?
- Can a student tell what to do next without rescue?
- Is teacher-facing material visually distinct from student-facing material?
- Are checkpoints and release moments easy to see?
- Is the page or slide too crowded?
- Is hierarchy clear?
- Is spacing helping readability?
- Are prompts clean, visible, and easy to scan?
- Do the materials feel classroom-ready rather than template-generated?

If this pass fails, hand the issue to **Visual Design / Formatting**.

---

### Pass 3 — Render / Template Behavior
Goal: confirm the engine produced the artifact correctly.

Check:
- Are any blocks missing?
- Is any content duplicated?
- Are sections misordered?
- Are scaffold placeholders showing, such as `Row 1`?
- Are footer or branding elements colliding with content?
- Did teacher/student sections collapse into each other?
- Are page breaks or slide flows wrong?
- Did PPTX/PDF output introduce layout problems not intended by the content?

If this pass fails, hand the issue to **Repo / build / rendering / QA**.

---

### Pass 4 — Repeatability and Merge Safety
Goal: confirm the fix is safe for the frozen pipeline.

Check:
- Is this a content issue, formatting issue, or renderer issue?
- Was the smallest safe change used?
- Does the proposed change preserve the current pipeline shape on `main`?
- Is this a one-off workaround, or does it improve repeatability?
- Does this PR accidentally mix pedagogy, formatting, and technical fixes?
- Is the artifact now good enough to trust as an example of stable output?

If this pass fails, do not merge yet.

---

## Three-Bucket Classification Rule
Before making any change, place the issue in exactly one primary bucket.

### Bucket A — Instructional Design
Use this bucket when the lesson logic itself is the problem.

Signals:
- students are being asked to do work they have not been prepared for
- the checkpoint does not actually test the next required skill
- the final evidence is unclear or weakly set up
- teacher moves and student tasks are out of sync

Default action:
- revise lesson structure, task sequence, or supports
- do **not** start with template or renderer changes

---

### Bucket B — Visual Design / Formatting
Use this bucket when the lesson is sound but the artifact is hard to use.

Signals:
- weak hierarchy
- cramped spacing
- visually buried directions
- cluttered worksheets or slides
- teacher/student distinction is too subtle
- the output looks technically valid but not classroom-ready

Default action:
- improve layout, spacing, typographic hierarchy, and visual pacing
- do **not** rewrite the lesson unless the formatting issue reveals a real instructional flaw

---

### Bucket C — Renderer / Template / Repo
Use this bucket when the authored lesson and design intent are sound, but the output is behaving incorrectly.

Signals:
- placeholder scaffolding appears
- footer overlaps content
- content vanishes or duplicates
- rendering order is wrong
- output changes unpredictably between renders
- bundle/export behavior is inconsistent

Default action:
- isolate the render/template failure
- avoid solving it by rewriting the lesson or over-formatting the artifact

---

## Standing Non-Negotiables
These must stay true in every review:

- Teacher-facing and student-facing artifacts remain clearly separated.
- Final evidence location remains obvious.
- Checkpoint/release logic stays visually legible.
- Embedded supports stay embedded in the correct place.
- Visual polish does not reduce instructional clarity.
- The frozen pipeline shape on `main` is preserved.

---

## PR Review Questions
Use these in every PR review:

### Scope control
- What layer is this PR actually changing?
- Does it stay in that lane?
- Is it mixing multiple problem types without cause?

### Lesson integrity
- What is the final evidence?
- Does the sequence support it?
- Are supports present and placed correctly?

### Artifact quality
- What will the teacher see first?
- What will the student see first?
- Is the task flow obvious?
- Is the page/slide visually manageable?

### Technical behavior
- Did the renderer produce what the package intended?
- Are there collisions, omissions, duplicates, or placeholders?
- Is the output stable enough to trust?

### Merge readiness
- Is this the smallest safe fix?
- Does this preserve the frozen pipeline?
- Would merging this make future lesson proofs easier or riskier?

---

## Suggested Review Output Format
When leaving a review, use this structure:

### 1. Classification
State the primary bucket:
- Instructional design
- Visual design / formatting
- Renderer / template / repo

### 2. What is working
Name the stable parts first.

Example:
- Final evidence is clear.
- Teacher/student separation is present.
- Multi-day checkpoint logic is structurally visible.

### 3. What is failing
Name the concrete failure without mixing layers.

Example:
- Student task page is too dense and buries the next-step prompt.
- Footer branding is colliding with lower-page content.
- Checkpoint 2 does not prepare the writing move required on Day 3.

### 4. Required next action
State the smallest safe fix.

Example:
- Compress teacher notes and increase student prompt hierarchy.
- Hand footer collision to render/template QA.
- Rewrite checkpoint prompt so it rehearses the evidence move used later.

### 5. Merge recommendation
Use one of:
- ready to merge
- fix before merge
- re-render and review again
- hand off to repo/render QA

---

## Fast Triage Version
If time is short, ask these five questions:

1. What is the final evidence, and can I find it instantly?
2. Can a student tell what to do next?
3. Is this hard to use because of lesson logic, formatting, or rendering?
4. What is the smallest safe fix?
5. Should this merge now?

---

## One-Line Review Standard
A package is review-ready only when it is instructionally coherent, visually classroom-ready, and technically repeatable.
