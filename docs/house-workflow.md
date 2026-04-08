# Mr. Friess Classroom Engine — House Workflow

## Purpose
This workflow keeps the Classroom Engine stable while improving lesson quality and artifact quality. It separates instructional design, visual formatting, and rendering/technical concerns so fixes happen in the right layer.

The operating principle is simple: **preserve the frozen pipeline shape on `main`, make the smallest safe change, and diagnose the problem before changing anything.**

---

## Core Workflow

### Stage 1 — Lesson Authoring
The lesson is designed inside the current engine contract.

This stage includes:
- lesson intent
- sequence logic
- teacher moves
- student tasks
- checkpoints and release logic
- final evidence target
- embedded supports
- BC-aligned classroom realism

Success at this stage means the lesson is instructionally coherent before visual polish is applied.

**Primary question:**
Is the lesson structurally sound and teachable?

---

### Stage 2 — Package Construction Within the Frozen Shape
The lesson is organized to fit the current stable engine structure.

This stage is not about inventing new backend behavior. It is about making the lesson fit the existing contract cleanly and consistently.

Success at this stage means:
- the lesson package matches current structure
- teacher/student separation is explicit
- checkpoint/release logic is represented clearly
- evidence location is defined
- supports remain embedded in the correct place

**Primary question:**
Does this lesson fit the engine without requiring backend drift?

---

### Stage 3 — Artifact Rendering
The engine produces classroom-facing outputs such as:
- slides
- worksheets
- task sheets
- lesson packets
- PPTX/PDF bundles

This is where instructional structure becomes visible output.

Success at this stage means the package renders completely and predictably.

**Primary question:**
Did the engine produce the intended artifacts correctly?

---

### Stage 4 — Visual Design and Formatting Polish
Structurally valid artifacts are improved so they feel classroom-ready.

This stage includes:
- slide composition
- worksheet readability
- task-sheet layout
- typography hierarchy
- spacing and visual rhythm
- prompt clarity
- teacher/student visual distinction
- branding consistency
- clutter reduction

This stage should improve readability and engagement **without changing lesson intent or breaking the frozen pipeline.**

Success at this stage means the artifacts are usable, readable, and professionally classroom-facing.

**Primary question:**
Does this artifact look and read like something a real teacher would use tomorrow?

---

### Stage 5 — QA Review
QA happens in two distinct passes.

#### A. Classroom-Facing QA
Checks whether the artifact works in real classroom use.

Look for:
- obvious final evidence location
- legible checkpoint/release flow
- clean teacher/student separation
- readable task prompts
- embedded supports staying with the task
- manageable visual load
- no template clutter distracting students or teacher

#### B. Technical / Render QA
Checks whether the engine and templates behaved correctly.

Look for:
- broken layout behavior
- repeated scaffolding labels
- footer or branding collisions
- missing blocks
- duplicated blocks
- incorrect page flow
- bundle/output inconsistencies
- PPTX/PDF generation issues

Success at this stage means the artifact is both instructionally usable and technically stable.

**Primary question:**
Is the result both classroom-ready and pipeline-safe?

---

### Stage 6 — PR Review and Repeatability Check
New proofs are tested in PRs before anything is normalized into the stable system.

A PR should answer two questions:
1. Is this a good lesson/artifact?
2. Can this type of lesson/artifact move through the engine reliably without introducing instability?

This stage is where repeatability matters. A lesson is not only judged on content quality but also on whether the engine can produce it cleanly and predictably.

**Primary question:**
Is this a one-off success, or a stable repeatable output?

---

## Non-Negotiables
- Teacher-facing and student-facing material must remain clearly separate.
- Final evidence location must remain obvious.
- Checkpoint/release logic must remain visually legible in multi-day sequences.
- Embedded supports must stay embedded in the correct artifact.
- Visual polish must not obscure instructional clarity.
- Do not casually solve lesson problems with backend changes.
- Do not casually solve template/render problems by rewriting the lesson.

---

## Handoff Rules by Layer

### Hand to Instructional Design when:
- the task sequence is confusing
- the evidence target is unclear
- checkpoint/release logic is weak
- supports are missing, misplaced, or pedagogically thin
- the lesson is structurally valid but not actually teachable

### Hand to Visual Design / Formatting when:
- the lesson is structurally sound but hard to read
- hierarchy is weak
- spacing is cramped or visually noisy
- worksheet/task-sheet composition reduces clarity
- teacher/student distinction is too subtle
- prompts are technically present but not visually usable

### Hand to Repo / Build / Rendering / QA when:
- repeated scaffold labels appear
- content is dropped, duplicated, or misordered
- footer/branding collisions occur
- page or slide layout breaks unpredictably
- bundle generation is inconsistent
- outputs differ across renders without content changes
- the issue clearly points to renderer/template behavior

---

## Issue Triage: Three-Bucket Diagnosis
Before changing anything, classify the issue.

### 1. Instructional Design Problem
The lesson logic itself is weak.

Examples:
- students are asked to produce evidence without enough preparation
- a checkpoint appears but does not actually check the next required skill
- teacher moves and student tasks are misaligned

### 2. Visual Design Problem
The lesson logic is fine, but the artifact is hard to use.

Examples:
- too much text on a page
- weak prompt hierarchy
- poor spacing
- visually buried evidence directions
- student page feels templated or cluttered

### 3. Renderer / Template Implementation Problem
The content and design intent are sound, but the output is behaving incorrectly.

Examples:
- scaffold placeholders such as “Row 1” appear
- footer overlaps content
- teacher/student blocks collapse into each other
- repeated content appears in the wrong place

---

## Decision Path for Reviewing Any Artifact
Use this sequence every time.

### Step 1
Ask: **What kind of problem is this?**
Instructional design, visual design, or renderer/template?

### Step 2
Ask: **Is the lesson itself sound?**
If no, fix the lesson first.

### Step 3
Ask: **Is the artifact readable and classroom-usable?**
If no, fix hierarchy, spacing, layout, and visual pacing.

### Step 4
Ask: **Is the output behaving correctly?**
If no, hand it to Repo / build / rendering / QA.

### Step 5
Make the **smallest safe fix** in the correct layer.

### Step 6
Re-render and review again.

---

## Practical Review Standard
A lesson package is ready only when all three conditions are true:

1. **Instructionally coherent**  
The lesson makes sense and supports the final evidence.

2. **Visually classroom-ready**  
The materials are readable, paced well, and usable under real classroom conditions.

3. **Technically repeatable**  
The engine can render the package reliably without special handling.

If one of these fails, the package is not ready.

---

## One-Line Workflow Summary
Design the lesson, fit it cleanly to the stable engine, render the artifacts, diagnose the right layer, make the smallest safe fix, and re-check until the output is both classroom-ready and repeatable.

---

## Suggested Standing Review Questions
For every package review, ask:
- What is the final evidence, and can a teacher find it instantly?
- Can a student tell what to do next without teacher rescue?
- Are checkpoint/release moments easy to see?
- Are supports embedded where they are actually needed?
- Does the page or slide feel clean enough to use live?
- Is this a content problem, a formatting problem, or a render problem?
- What is the smallest safe fix?
