---
course: Psychology 11/12
artifact_type: source_register
audience: teacher
version: 1
status: draft
source_spine: OpenStax Psychology 2e
scope: psychology_only
applicability:
  psychology_11_12: true
  other_courses: false
visibility:
  student: false
  teacher: true
answer_key: false
created_from_repo_scan: true
---

# Psychology 11/12 Source Register

## Applicability Confirmation

This source register applies only to Psychology 11/12.

It should not be treated as a shared source register for Careers, English, literacy intervention, classroom-engine rendering in general, or any other course family. Any source, package, cycle, routine, safety rule, or assessment model listed here is included only because it is explicitly tied to Psychology 11/12 in the repository structure or course documents.

## Scanned Psychology-Specific Repo Areas

The following repo areas were treated as Psychology-applicable:

| Repo area | Psychology-only reason | Use in source register |
|---|---|---|
| `source/psychology_11_12/` | Dedicated normalized source folder for Psychology 11/12. | Primary source-side content location. |
| `source/psychology_11_12/content_inventory.yaml` | Identifies the course as Psychology 11/12 and the source spine as OpenStax Psychology 2e. | Content status, expected paths, cycle inventory. |
| `source/psychology_11_12/course/` | Expected course-level source folder for course map, overview, vocabulary, assessment spine, and source register. | Course-level source organization. |
| `source/psychology_11_12/cycles/` | Dedicated normalized Psychology cycle folders. | Cycle-specific content registry. |
| `source/psychology_11_12/slides/source/` | Dedicated Psychology slide-source folder. | Student-facing slide source references. |
| `source/psychology_11_12/qa/` | Dedicated Psychology QA folder. | QA, render, and visibility checks. |
| `courses/psychology-11-12/` | Course-family planning spine for Psychology 11/12. | Semester, unit, package, and pacing references. |
| `units/psychology/` | GitHub source of truth for the complete Psychology 11/12 classroom unit. | Engine-native package source and render boundary. |
| `fixtures/psychology/` | Psychology render proof / QA fixture area. | Render-proof evidence only; not a curriculum source by itself. |
| Psychology-specific scripts such as `validate-psychology-*` and `qa-psychology-*` | Scripts explicitly named for Psychology. | Validation context only; not student or teacher content. |

## Excluded Areas

The following were not treated as Psychology source material unless a file explicitly referenced Psychology 11/12:

- generic classroom-engine renderer code
- generic repo setup, tooling, and package-management files
- non-Psychology course folders
- general official course-load files except where they identify Psychology course instances
- generic QA scripts that are not Psychology-specific
- generated previews, proof files, or render outputs as standalone curriculum sources
- uploaded archives except where a Psychology manifest uses them as a provenance reference

## Primary Academic Source Spine

Primary source spine:

- OpenStax Psychology 2e

Repo function:

- provides core concepts
- provides vocabulary grounding
- provides chapter alignment
- supports source-safe classroom adaptation
- does not get reproduced directly into student materials

Classroom adaptation rule:

Use OpenStax Psychology 2e as the academic spine, then translate it into high-school-appropriate classroom materials: teacher binders, student packets, assessment packs, source sheets, scenario tasks, capstone work, and low-risk reflection/application prompts.

## Whole-Course Psychology Unit Map

| Unit | Topic | OpenStax Psychology 2e alignment | Psychology-only use |
|---|---|---|---|
| Unit 1 | Psychology as a Science | Chapters 1-2 | Foundations, research reasoning, evidence, ethics. |
| Unit 2 | Brain, Body, and Behaviour | Chapter 3 | Biological bases of behaviour and introductory brain-behaviour links. |
| Unit 3 | Consciousness, Sensation, and Perception | Chapters 4-5 | States of consciousness, sensation, perception, and interpretation. |
| Unit 4 | Learning and Memory | Chapters 6 and 8 | Learning theories, memory, study strategies, behaviour change. |
| Unit 5 | Thinking, Intelligence, and Cognition | Chapter 7 | Cognition, problem-solving, intelligence, bias, decision-making. |
| Unit 6 | Development Across the Lifespan | Chapter 9 | Lifespan change, development, nature/nurture, identity context. |
| Unit 7 | Emotion, Motivation, and Personality | Chapters 10-11 | Emotion, motivation, trait language, personality concepts. |
| Unit 8 | Social Psychology and Relationships | Chapter 12 | Social influence, groups, attribution, bias, belonging, relationships. |
| Unit 9 | Stress, Health, and Mental Health | Chapters 14-16 | Stress, stigma, support literacy, disorder/treatment concepts. |
| Unit 10 | Applied Psychology, Work, Law, Media, and Society | Chapter 13 plus extension sources | Applied psychology, work, forensic/legal, media, persuasion, consumer psychology. |

## Three-Year Cycle Register

| Cycle | Normalized title | Current repo status | Source alignment | Register decision |
|---|---|---|---|---|
| A | Foundations | Active / partially normalized source | OpenStax Chapters 1-2 | Active Psychology source. |
| B | Learning / Cognition / Development / Applied | Active external package; not yet fully normalized | OpenStax Chapters 6-9, Chapter 13 as useful | Psychology source, but requires normalization before treating all artifacts as source-stable. |
| C | Personality / Identity / Social / Relationships | Active external package; not yet fully normalized | OpenStax Chapters 11-12, selected Chapter 4 | Psychology source, with heightened disclosure safeguards. |
| D | Mental Health / Stress / Disorders / Treatment / Support | Active external package; not yet fully normalized | OpenStax Chapters 14-16 | Psychology source, with strongest safety controls. |
| E | Forensic and Legal Psychology | Mapped future cycle | OpenStax Chapters 8, 12, 15 plus extension sources | Psychology-only future/extension source; not active unless files exist. |
| F | Media / Technology / Persuasion / Consumer Psychology | Mapped future cycle | OpenStax Chapters 6-8, 12-13 plus extension sources | Psychology-only future/extension source; not active unless files exist. |

## Active Cycle A Source Register

Cycle A is the clearest normalized source area currently present under `source/psychology_11_12/cycles/cycle_a_foundations/`.

| Source file | Artifact type | Audience | Status | Source spine | Psychology-only use |
|---|---|---|---|---|---|
| `manifest.yaml` | cycle manifest | repo / teacher | draft_manifest | OpenStax Psychology 2e, Chapters 1-2 | Tracks Cycle A artifact inventory and render links. |
| `assessment_pack.md` | assessment pack | student assessment | draft | OpenStax Psychology 2e, Chapters 1-2 | Student-facing assessment of psychology definition, evidence, observation/inference, correlation/causation, ethics. |
| `marking_guide.md` | marking guide | teacher assessment | draft | OpenStax Psychology 2e, Chapters 1-2 | Teacher-only answer key, rubric, look-fors, feedback language, accommodation notes. |
| `source_sheet.md` | source sheet | student | draft | OpenStax Psychology 2e, Chapters 1-2 | Student-safe source support for foundational Psychology vocabulary and reasoning. |
| `capstone_packet.md` | capstone packet | student | draft | OpenStax Psychology 2e, Chapters 1-2 | Student-facing claim-analysis capstone using evidence, limits, research reasoning, and ethics. |
| `source/psychology_11_12/slides/source/cycle_a_foundations_slides.md` | slide source | student | language_locked_draft | OpenStax Psychology 2e, Chapters 1-2 | Student-facing slide language for Cycle A Lesson 1: What Is Psychology? |

## Psychology-Specific Pedagogical Frame

All included material supports a Psychology 11/12 classroom frame:

- students define psychological concepts accurately
- students distinguish evidence from opinion
- students separate observation, inference, claim, and evidence
- students avoid diagnostic overreach
- students apply concepts to neutral scenarios
- students recognize uncertainty and limits
- students discuss mental health and identity topics with safety and precision
- students use source material responsibly

This frame is not a generic classroom-engagement model. It belongs to Psychology because it is organized around behaviour, mental processes, psychological science, research reasoning, social influence, development, learning, cognition, personality, mental health, treatment, and applied psychology.

## Safety and Suitability Rules

The Psychology source materials must preserve classroom safety.

Do not require students to:

- disclose trauma
- disclose diagnoses
- analyze their own mental health publicly
- diagnose themselves
- diagnose peers
- share family history
- role-play therapy
- provide counselling
- reveal private relationships
- expose personal identity struggles

Use instead:

- fictional scenarios
- public examples
- neutral case studies
- low-risk reflection
- concept application
- source analysis
- evidence evaluation

Mental health lessons should teach literacy, stigma reduction, support awareness, and careful language. They should not become therapy or self-diagnosis lessons.

## Audience and Visibility Rules

| Artifact type | Student visible? | Teacher visible? | Answer key allowed? | Notes |
|---|---:|---:|---:|---|
| Student packet | Yes | No, unless duplicated into teacher guide | No | Keep free of teacher rationale and hidden notes. |
| Source sheet | Yes | No, unless duplicated into teacher guide | No | Use short, purposeful, cited or traceable source support. |
| Assessment pack | Yes | No | No | Student version only. |
| Capstone packet | Yes | No | No | Student-facing synthesis task. |
| Slide source | Yes | No | No | Low-density, student-facing language. |
| Teacher binder | No | Yes | Yes, where appropriate | Delivery guide, safety notes, misconceptions, differentiation, answer keys. |
| Marking guide | No | Yes | Yes | Teacher-only assessment support. |
| QA bundle | No | Yes / repo | No | Render and maintenance support. |

## Differentiation Register

Use the same task tiers across Psychology materials:

- Supported
- Proficient
- Extending

These are task-access tiers, not rubric achievement levels.

Use the same default rubric performance levels where needed:

- Emerging
- Developing
- Proficient
- Extending

Do not confuse differentiation tiers with rubric levels.

## Render and Source Boundary

There are two lanes in the repo:

1. Prebuilt asset lane: preserves and validates existing uploaded Psychology assets.
2. Engine-native lane: converts lesson content into engine-readable package JSON and renders through the classroom engine.

A file is not considered engine-rendered just because it exists as a DOCX, PDF, PPTX, screenshot, or uploaded archive asset. It becomes engine-native only when the correct package JSON/source exists in the repo and renders successfully through the defined render workflow.

## Current Source Gaps to Track

The source inventory identifies several course-level files as missing or still needing normalization:

- `source/psychology_11_12/course/course_map.md`
- `source/psychology_11_12/course/course_overview.md`
- `source/psychology_11_12/course/vocabulary_bank.md`
- `source/psychology_11_12/course/assessment_spine.md`
- `source/psychology_11_12/course/source_register.md` now created by this file

Cycle A also identifies these normalization/render gaps:

- normalized teacher binder Markdown not yet created
- normalized student packet Markdown not yet created
- assessment pack and marking guide need render proof / artifact rendering follow-through
- source sheet needs render proof
- capstone packet needs render proof
- slide source needs artifact rendering and visual review

## Source Register Maintenance Rules

When adding future sources to this register:

1. Add only material explicitly connected to Psychology 11/12.
2. Keep OpenStax Psychology 2e as the core spine unless a new approved source is intentionally added.
3. Mark extension sources clearly, especially for forensic/legal psychology and media/technology/persuasion topics.
4. Separate student-facing, teacher-facing, and QA-facing materials.
5. Do not place answer keys, marking notes, or teacher rationale in student-facing artifacts.
6. Preserve the no-diagnosis, no-therapy, no-forced-disclosure boundary.
7. Treat Cycles E-F as mapped future cycles unless active source files are present.
8. Treat generated proof files as evidence of rendering, not as source curriculum by themselves.

## Final Scope Statement

Confirmed: this register is only applicable to Psychology 11/12.

It should remain inside `source/psychology_11_12/course/` and should not be imported as a general source register for other course families.
