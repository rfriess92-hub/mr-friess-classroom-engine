# Psychology 11/12 Classroom Content Contract

## 1. Purpose

This document defines how classroom content should be written, structured, tagged, and stored for the Psychology 11/12 classroom render repo.

The repo’s job is to turn structured instructional content into usable classroom artifacts:

- student slide decks
- teacher lesson guides
- student packets
- printable activities
- assessments
- answer keys
- marking guides
- QA bundles

This document is the content-side contract. It explains what the source files should contain before the render system turns them into classroom materials.

---

## 2. Content Philosophy

The Psychology 11/12 package should not be a textbook dump.

The content should translate OpenStax Psychology 2e into classroom-ready learning:

- clear concepts
- short explanations
- concrete examples
- low-risk discussion
- student-safe reflection
- formative checks
- applied tasks
- teacher guidance
- assessment-ready outputs

The course should feel academically legitimate but usable for high school students.

The content should avoid:

- overloading students with textbook density
- turning psychology into therapy
- asking students to disclose private experiences
- requiring self-diagnosis
- relying on long lectures
- making slides carry teacher-only explanation
- using activities that need excessive setup

---

## 3. Source Spine

The default academic spine is:

OpenStax Psychology 2e

OpenStax may be adapted, summarized, sequenced, and classroom-translated, but the package should preserve conceptual accuracy.

Source references should be tracked in metadata or teacher notes when possible.

Example:

```yaml
source_spine: OpenStax Psychology 2e
source_chapter: "Chapter 1: Introduction to Psychology"
source_section: "1.1 What Is Psychology?"
```

The render system does not need full academic citations on every student page, but the content system should preserve enough source tracking for teacher confidence and later revision.

---

## 4. Required Content Separation

Every source item must clearly identify its audience.

Allowed audiences:

```text
student
teacher
assessment_student
assessment_teacher
admin
qa
```

Student-facing content may include:

- learning targets
- simple definitions
- class instructions
- worked examples
- discussion prompts
- practice questions
- reflection prompts
- student rubrics
- student checklist language

Student-facing content must not include:

- answer keys
- teacher notes
- marking instructions
- internal rationale
- private repo notes
- hidden QA comments
- “correct answer is…” unless it is intentionally part of feedback
- therapy-like guidance
- diagnostic language directed at students

Teacher-facing content may include:

- lesson rationale
- setup notes
- timing
- materials
- key vocabulary
- answer keys
- marking guidance
- common misconceptions
- differentiation options
- extension activities
- source notes
- classroom management notes

The repo should fail loudly if teacher-only content appears in student-visible output.

---

## 5. Default File Types

Source content should be written primarily in Markdown.

Recommended source extensions:

```text
.md
.yaml
.json
```

Markdown is preferred for lesson and artifact source because it is easy to read, revise, and diff.

YAML or JSON may be used for structured manifests, route plans, or schema-heavy data.

---

## 6. Recommended Content Folder Structure

```text
/source
  /psychology_11_12
    /course
      course-overview.md
      course-map.md
      vocabulary-bank.md
      assessment-plan.md
    /units
      unit01_intro_to_psychology.md
      unit02_research_methods.md
      unit03_biopsychology.md
      unit04_sensation_perception.md
      unit05_learning.md
      unit06_memory.md
      unit07_development.md
      unit08_personality.md
      unit09_social_psychology.md
      unit10_mental_health.md
    /lessons
      unit01_lesson01_what_is_psychology.md
      unit01_lesson02_perspectives.md
      unit01_lesson03_ethics.md
    /student_packets
      unit01_student_packet.md
    /teacher_guides
      unit01_teacher_guide.md
    /assessments
      unit01_quiz_student.md
      unit01_quiz_teacher.md
      unit01_performance_task_student.md
      unit01_performance_task_teacher.md
    /marking_guides
      unit01_marking_guide.md
```

The exact unit list may change, but the folder logic should remain stable.

---

## 7. Naming Convention

Use predictable file names.

Recommended pattern:

```text
unit##_lesson##_short-title.md
```

Examples:

```text
unit01_lesson01_what_is_psychology.md
unit01_lesson02_perspectives.md
unit02_lesson01_research_questions.md
unit02_lesson02_correlation_vs_causation.md
```

For artifact-specific files:

```text
unit01_student_packet.md
unit01_teacher_guide.md
unit01_quiz_student.md
unit01_quiz_teacher.md
unit01_marking_guide.md
```

Avoid:

```text
final.md
new.md
psych_lesson_fixed.md
copy_of_unit1.md
stuff_for_students.md
```

---

## 8. Required Markdown Style

Use clean Markdown.

Allowed heading structure:

```markdown
# Lesson Title
## Section
### Subsection
#### Small Subsection
```

Do not skip heading levels.

Use short paragraphs.

Prefer:

> Students learn that psychology is the scientific study of behaviour and mental processes.

Avoid:

> Psychology is a very broad and interesting field that students may already have many assumptions about, so in this lesson they will begin to unpack and explore the many ways that psychologists think about behaviour and mental life across different contexts...

Use lists only when they improve scanability.

Avoid long nested lists.

---

## 9. Required Front Matter

Each major source file should begin with YAML front matter.

Lesson file example:

```yaml
---
course: Psychology 11/12
unit_number: 1
unit_title: Introduction to Psychology
lesson_number: 1
lesson_title: What Is Psychology?
artifact_type: lesson
audience: teacher
version: 1
status: draft
source_spine: OpenStax Psychology 2e
source_chapter: "Chapter 1: Introduction to Psychology"
source_section: "1.1 What Is Psychology?"
estimated_time: 75
visibility:
  student: false
  teacher: true
answer_key: false
tiering:
  - Supported
  - Proficient
  - Extending
---
```

Student packet example:

```yaml
---
course: Psychology 11/12
unit_number: 1
unit_title: Introduction to Psychology
artifact_type: student_packet
audience: student
version: 1
status: draft
visibility:
  student: true
  teacher: false
answer_key: false
---
```

Teacher marking guide example:

```yaml
---
course: Psychology 11/12
unit_number: 1
unit_title: Introduction to Psychology
artifact_type: marking_guide
audience: teacher
version: 1
status: draft
visibility:
  student: false
  teacher: true
answer_key: true
---
```

---

## 10. Lesson Content Contract

Each lesson should include the following sections.

```markdown
# Lesson Title

## Lesson Snapshot

## Learning Target

## Big Idea

## Know / Do / Understand

## Key Vocabulary

## Materials

## Lesson Flow

## Student Tasks

## Formative Checks

## Differentiation

## Teacher Notes

## Assessment Connection

## Render Notes
```

Not every section needs to be long. Missing sections should be intentional.

---

## 11. Lesson Snapshot

The lesson snapshot gives the renderer and teacher a quick overview.

Example:

```markdown
## Lesson Snapshot

Students examine what psychology studies and distinguish psychology from common myths about mind-reading, advice-giving, and personal opinion.

Estimated time: 75 minutes

Core move: Students move from everyday assumptions about psychology to a scientific definition of psychology.
```

The snapshot should be short and practical.

---

## 12. Learning Target

Use student-friendly language.

Example:

```markdown
## Learning Target

I can explain psychology as the scientific study of behaviour and mental processes.
```

Good learning targets are:

- specific
- observable
- student-readable
- tied to the lesson task

Avoid vague targets:

> I can understand psychology.

---

## 13. Big Idea

The big idea should capture the conceptual point of the lesson.

Example:

```markdown
## Big Idea

Psychology studies behaviour and mental processes using evidence, not just opinion or personal advice.
```

The big idea should usually be one sentence.

---

## 14. Know / Do / Understand

Use this structure when possible.

```markdown
## Know / Do / Understand

### Know

- psychology
- behaviour
- mental processes
- empirical evidence

### Do

- distinguish psychology from common misconceptions
- explain why evidence matters in psychology
- apply a definition to examples

### Understand

Psychology uses systematic evidence to study behaviour and mental processes.
```

The "Know" section is content.

The "Do" section is skill.

The "Understand" section is conceptual transfer.

---

## 15. Key Vocabulary

Use simple definitions first.

Example:

```markdown
## Key Vocabulary

### Psychology

The scientific study of behaviour and mental processes.

### Behaviour

Actions that can be observed.

### Mental processes

Internal experiences such as thoughts, feelings, memories, and perceptions.
```

Avoid overloading vocabulary. A typical lesson should introduce 3–6 key terms.

---

## 16. Materials

List only what the teacher actually needs.

Example:

```markdown
## Materials

- slides
- student packet
- projector
- whiteboard
- exit ticket
```

Avoid vague material entries like:

- stuff for activity

---

## 17. Lesson Flow

Use a timed sequence.

Example:

```markdown
## Lesson Flow

### 1. Entry Question — 5 minutes

Students respond to the prompt:

> What do people often think psychology is?

### 2. Mini-Lesson — 10 minutes

Teacher introduces psychology as the scientific study of behaviour and mental processes.

### 3. Sort Activity — 20 minutes

Students sort examples into:
- psychology
- not psychology
- unsure

### 4. Debrief — 15 minutes

Class discusses what makes something psychological and what makes it scientific.

### 5. Exit Ticket — 5 minutes

Students explain one misconception about psychology.
```

Lesson flow should be usable by a teacher without needing to reverse-engineer the plan.

---

## 18. Student Tasks

Student tasks should be written as clear instructions.

Example:

```markdown
## Student Tasks

### Task 1: Psychology or Not?

Read each example. Decide whether it is psychology, not psychology, or unsure.

Be ready to explain your reason.
```

A good task has:

- an action
- a product
- a clear stopping point
- enough structure for students to begin

Avoid:

> Discuss psychology.

Better:

> With a partner, choose one example and explain whether it uses evidence to study behaviour or mental processes.

---

## 19. Formative Checks

Every lesson should include at least one formative check.

Examples:

```markdown
## Formative Checks

### Stop and Check

Which option best fits psychology?

A. Giving advice based on personal opinion  
B. Studying behaviour and mental processes using evidence  
C. Guessing what someone is thinking  
D. Telling people how to fix their problems  

Correct answer: B
```

For student-facing versions, the correct answer should be hidden unless the artifact is designed as feedback or review.

Teacher-facing versions may include correct answers.

---

## 20. Differentiation

Use three consistent tiers.

```markdown
## Differentiation

### Supported

Students receive fewer examples and sentence frames.

### Proficient

Students complete the standard sort and explain their reasoning.

### Extending

Students create their own example and justify why it does or does not count as psychology.
```

Differentiation should preserve the same learning target.

It should not become three unrelated lessons.

---

## 21. Teacher Notes

Teacher notes are for delivery support.

Example:

```markdown
## Teacher Notes

Students may think psychology means therapy, advice, or reading people’s minds. Keep returning to the phrase “scientific study of behaviour and mental processes.”

Avoid asking students to share personal mental health experiences. Use neutral examples.
```

Teacher notes must not render into student-facing slides or packets.

---

## 22. Assessment Connection

This section explains how the lesson connects to future assessment.

Example:

```markdown
## Assessment Connection

Students will later need to explain how psychology uses evidence to study behaviour and mental processes. This lesson introduces the definition they will use in the unit quiz and performance task.
```

---

## 23. Render Notes

Use render notes only for technical or layout instructions.

Example:

```markdown
## Render Notes

- Slide deck should use low-density layouts.
- Sort activity should become a printable half-page table.
- Exit ticket should render as a student packet box.
- Teacher notes should appear only in the teacher guide.
```

Render notes are not instructional content.

---

## 24. Slide Content Contract

Slide source should be short and role-based.

Recommended structure:

```markdown
## Slide: Mission

### Title

Psychology is more than advice.

### Student Text

Today you will figure out what psychology studies and what makes it scientific.

### Speaker Notes

Emphasize that psychology is not mind-reading or advice-giving.
```

Student text should be brief.

Speaker notes are teacher-facing only.

---

## 25. Slide Role Types

Use stable slide roles.

Allowed default roles:

```text
mission
retrieval
concept
example
check
compare
apply
misconception
discussion
reflect
takeaway
```

Example:

```yaml
slide_role: concept
```

The renderer may use slide role to select layout.

---

## 26. Slide Density Rules

Slides should generally contain:

- one idea
- one task
- one visual focus
- one short title

If a slide needs more than 40–60 student-facing words, split it.

If a slide has multiple tasks, split it.

If a slide needs a paragraph of explanation, that belongs in teacher notes or a teacher guide.

---

## 27. Student Packet Content Contract

Student packets should contain the materials students write on or keep.

Recommended sections:

```markdown
# Unit 1 Student Packet

## Lesson 1: What Is Psychology?

### Learning Target

### Key Vocabulary

### Activity

### Practice

### Reflection

### Exit Ticket
```

Student packet language should be practical.

Avoid making packets too long. A student packet should support the lesson, not replace instruction.

---

## 28. Teacher Guide Content Contract

Teacher guides should contain the delivery version of the lesson.

Recommended sections:

```markdown
# Unit 1 Teacher Guide

## Unit Overview

## Lesson Sequence

## Lesson 1: What Is Psychology?

### Purpose

### Timing

### Materials

### Lesson Flow

### Teacher Moves

### Likely Student Responses

### Misconceptions

### Differentiation

### Assessment Notes

### Answer Key
```

Teacher guides should be direct and usable during planning.

---

## 29. Assessment Content Contract

Assessments need student and teacher versions.

Student assessment file:

```markdown
# Unit 1 Quiz

## Instructions

Answer each question clearly. Use class vocabulary where possible.

## Questions

1. What is psychology?
2. Which example best shows psychology as a science?
3. Explain one common misconception about psychology.
```

Teacher assessment file:

```markdown
# Unit 1 Quiz — Teacher Version

## Answer Key

1. Psychology is the scientific study of behaviour and mental processes.
2. Correct answer will depend on options provided.
3. Students may explain that psychology is not mind-reading, advice-giving, or guessing.

## Marking Notes

Look for:
- accurate definition
- reference to behaviour and/or mental processes
- reference to scientific evidence
```

Do not combine student questions and teacher answers unless visibility tags are airtight.

---

## 30. Marking Guide Contract

Marking guides should support consistent teacher judgment.

Recommended sections:

```markdown
# Marking Guide

## Assessment Overview

## Learning Targets Assessed

## Criteria

## Rubric

## Look-Fors

## Common Misconceptions

## Feedback Language

## Accommodation Notes
```

Example:

```markdown
## Look-Fors

A strong response:
- defines psychology accurately
- explains behaviour or mental processes
- mentions evidence or scientific study
- uses an example that fits the definition
```

---

## 31. Rubric Language

Rubrics should use clear performance descriptors.

Recommended levels:

```text
Emerging
Developing
Proficient
Extending
```

Example:

| Criteria | Emerging | Developing | Proficient | Extending |
|---|---|---|---|---|
| Concept accuracy | Definition is missing or inaccurate. | Definition is partly accurate. | Definition is accurate. | Definition is accurate and applied clearly to a new example. |
| Use of evidence | Does not refer to evidence. | Mentions evidence vaguely. | Explains that psychology uses evidence. | Explains why evidence separates psychology from opinion. |

Keep student-facing rubrics simple.

Teacher-facing rubrics may include more detailed look-fors.

---

## 32. Student-Safe Psychology Rule

Psychology class must not become therapy.

Avoid prompts like:

```text
Describe your own trauma response.
Diagnose yourself using this model.
Share a time when your family affected your mental health.
Explain your own attachment style to the class.
```

Use safer alternatives:

```text
Analyze the fictional scenario.
Explain how the concept could apply to a person in general.
Compare two possible interpretations of the behaviour.
Identify what information would be needed before making a claim.
```

Students may reflect, but reflection must be optional, bounded, and low-risk.

---

## 33. Mental Health Unit Guardrails

Mental health content requires extra care.

Student-facing content should:

- avoid diagnostic self-labeling
- use person-first or neutral language
- distinguish symptoms from diagnosis
- emphasize that diagnosis belongs to qualified professionals
- avoid sensational examples
- avoid graphic details
- focus on concepts, stigma, support, and evidence

Teacher-facing notes may include safety reminders.

Example:

```markdown
## Teacher Safety Note

Do not ask students to disclose personal mental health histories. Use fictional examples and general language. If a student discloses risk or harm, follow school reporting procedures.
```

---

## 34. Scenario Writing Rules

Scenarios are useful in psychology. They must be neutral and classroom-safe.

Good scenario:

> Maya studies for a test by reading her notes three times. She feels confident, but the next day she cannot remember many details. What memory concept might help explain this?

Risky scenario:

> Maya has severe anxiety because of her parents’ divorce and cannot function at school. Diagnose her.

Good scenarios should:

- use fictional names
- avoid graphic content
- avoid requiring diagnosis
- focus on observable behaviour
- invite evidence-based reasoning
- leave room for uncertainty

---

## 35. Discussion Prompt Rules

Good discussion prompts are bounded.

Example:

> Which claim is stronger? Explain why.
>
> Claim A: People remember everything accurately if the event is emotional.  
> Claim B: Emotion can affect memory, but memory is still reconstructive.

Avoid open-ended prompts that invite oversharing:

> Tell the class about your most emotional memory.

---

## 36. Reflection Prompt Rules

Reflection prompts should be low-risk.

Good:

> What is one study strategy from today’s lesson that could help a student remember information more effectively?

Risky:

> Describe a painful memory and explain why you still remember it.

Use academic reflection more than personal disclosure.

---

## 37. Vocabulary Bank Contract

The course should maintain a vocabulary bank.

Recommended format:

```markdown
# Psychology 11/12 Vocabulary Bank

## Psychology

The scientific study of behaviour and mental processes.

Unit: 1  
Student-facing: yes  
Teacher-only: no  

## Empirical Evidence

Information gathered through observation, measurement, or research.

Unit: 1  
Student-facing: yes  
Teacher-only: no  
```

Vocabulary definitions should be consistent across slides, packets, and assessments.

---

## 38. Unit Content Contract

Each unit should have a unit overview file.

Recommended structure:

```markdown
# Unit 1: Introduction to Psychology

## Unit Purpose

## Essential Questions

## Learning Targets

## Key Vocabulary

## Lesson Sequence

## Assessment Plan

## OpenStax Alignment

## Student Safety Notes

## Teacher Notes

## Render Notes
```

---

## 39. Course Map Contract

The course map should show the whole course structure.

Example:

```markdown
# Psychology 11/12 Course Map

| Unit | Title | Core Concepts | Major Assessment |
|---|---|---|---|
| 1 | Introduction to Psychology | psychology, perspectives, ethics | concept check |
| 2 | Research Methods | variables, correlation, experiments | research critique |
| 3 | Biopsychology | neurons, brain, nervous system | applied explanation |
```

The course map should be stable enough for planning but easy to revise.

---

## 40. Recommended Unit Sequence

A workable default sequence:

```text
Unit 1: Introduction to Psychology
Unit 2: Research Methods and Ethics
Unit 3: Biopsychology
Unit 4: Sensation and Perception
Unit 5: Learning
Unit 6: Memory
Unit 7: Development
Unit 8: Personality
Unit 9: Social Psychology
Unit 10: Mental Health and Psychological Disorders
```

This sequence can be changed, but source files should preserve unit numbering.

---

## 41. Content Status Labels

Use consistent status labels.

Allowed values:

```text
stub
draft
review
ready
archived
```

Definitions:

```text
stub: placeholder only
draft: usable but incomplete
review: ready for QA or teacher review
ready: classroom-ready
archived: not active
```

The renderer should not include archived content in active package outputs unless explicitly instructed.

---

## 42. Versioning

Use simple version numbers in metadata.

Example:

```yaml
version: 1
```

Major revision:

```yaml
version: 2
```

Do not use vague version names inside filenames.

Bad:

```text
unit1_lesson1_FINAL_FINAL.md
```

Good:

```text
unit01_lesson01_what_is_psychology_v2.md
```

---

## 43. Content QA Categories

Use three categories when reviewing problems.

Content Issue

The instructional content is wrong, weak, unclear, unsafe, or incomplete.

Examples:

- inaccurate definition
- weak prompt
- missing learning target
- unsafe personal-disclosure question
- poor assessment alignment

Render Logic Issue

The content is fine, but the renderer classified or routed it incorrectly.

Examples:

- teacher guide rendered as student packet
- answer key included in student file
- slide role misread
- assessment routed to wrong template

Artifact Formatting Issue

The content and route are correct, but the final artifact looks bad.

Examples:

- clipped text
- crowded slide
- awkward page break
- text too small
- table overflow

Do not fix a content issue by changing formatting. Do not fix a render logic issue by rewriting good content.

---

## 44. Content Review Checklist

Before rendering, check:

- Does the lesson have a clear learning target?
- Is the OpenStax connection clear?
- Is student-facing language readable?
- Are teacher-only notes tagged correctly?
- Are answer keys separated?
- Are activities realistic for classroom use?
- Are personal reflection prompts low-risk?
- Are vocabulary definitions consistent?
- Are Supported / Proficient / Extending tiers aligned?
- Is the assessment connection clear?
- Are render notes separate from instructional content?

---

## 45. Minimal Lesson Template

Use this when creating a new lesson quickly.

```yaml
---
course: Psychology 11/12
unit_number:
unit_title:
lesson_number:
lesson_title:
artifact_type: lesson
audience: teacher
version: 1
status: draft
source_spine: OpenStax Psychology 2e
source_chapter:
source_section:
estimated_time: 75
visibility:
  student: false
  teacher: true
answer_key: false
tiering:
  - Supported
  - Proficient
  - Extending
---
```

```markdown
# Lesson Title

## Lesson Snapshot

## Learning Target

I can...

## Big Idea

## Know / Do / Understand

### Know

### Do

### Understand

## Key Vocabulary

## Materials

## Lesson Flow

### 1. Entry — 5 minutes

### 2. Mini-Lesson — 10 minutes

### 3. Main Task — 25 minutes

### 4. Debrief — 15 minutes

### 5. Exit Ticket — 5 minutes

## Student Tasks

## Formative Checks

## Differentiation

### Supported

### Proficient

### Extending

## Teacher Notes

## Assessment Connection

## Render Notes
```

---

## 46. Minimal Student Packet Template

```yaml
---
course: Psychology 11/12
unit_number:
unit_title:
artifact_type: student_packet
audience: student
version: 1
status: draft
visibility:
  student: true
  teacher: false
answer_key: false
---
```

```markdown
# Unit Student Packet

## Lesson Title

### Learning Target

I can...

### Key Vocabulary

### Activity

### Practice

### Reflection

### Exit Ticket
```

---

## 47. Minimal Assessment Template — Student Version

```yaml
---
course: Psychology 11/12
unit_number:
unit_title:
artifact_type: assessment
audience: assessment_student
version: 1
status: draft
visibility:
  student: true
  teacher: false
answer_key: false
---
```

```markdown
# Assessment Title

## Instructions

## Questions

## Student Checklist
```

---

## 48. Minimal Assessment Template — Teacher Version

```yaml
---
course: Psychology 11/12
unit_number:
unit_title:
artifact_type: assessment
audience: assessment_teacher
version: 1
status: draft
visibility:
  student: false
  teacher: true
answer_key: true
---
```

```markdown
# Assessment Title — Teacher Version

## Learning Targets Assessed

## Answer Key

## Marking Guide

## Look-Fors

## Common Misconceptions

## Feedback Language

## Accommodation Notes
```

---

## 49. Writing Style

Student-facing writing should be:

- clear
- concrete
- calm
- age-appropriate
- not childish
- not overly academic
- not therapy-like

Teacher-facing writing should be:

- direct
- practical
- specific
- easy to scan
- focused on classroom use

Avoid filler phrases like:

> In today’s exciting lesson, students will embark on a journey...

Prefer:

> Students distinguish psychology from common misconceptions and explain why evidence matters.

---

## 50. Final Content Rule

Every source file should make the renderer’s job easier.

A good source file has:

- clear metadata
- clear audience
- clean Markdown
- accurate content
- separate teacher/student material
- explicit artifact type
- realistic classroom tasks
- visible assessment connection
- safe psychology prompts
- minimal ambiguity

The source content should be boringly clear. The renderer can add polish later.
