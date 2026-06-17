# Literacy Quest Wrapper Contract

## Status

This is a design and engineering contract for the Classroom Engine.

Use it when generating, rendering, naming, styling, and QA-checking classroom resources.

## Core decision

The Classroom Engine uses a consistent Literacy Quest / Guild Handbook wrapper across generated literacy resources.

This wrapper is the visual and organizational identity of the system.

It is not a requirement that every lesson’s academic content become fantasy-themed.

## Core rule

**Gamification is the navigation layer, not the curriculum.**

The wrapper helps students understand where they are in the learning process.

The academic content still needs to vary naturally across genres, topics, texts, inquiry questions, and real-world contexts.

## What the wrapper does

The wrapper may provide:

- document labels
- section headers
- progress markers
- completion language
- navigation cues
- light story framing
- visual identity
- consistent student-facing resource structure

The wrapper should make the resource easier to use.

It should not hide the learning task.

## What the wrapper must not do

The wrapper must not:

- force every lesson into knights, wizards, fantasy, or medieval language
- replace clear academic labels with vague game labels
- make teacher-facing resources less practical
- obscure machine-detectable document roles
- interfere with BC curriculum alignment
- weaken science-of-reading practice
- turn reading intervention into decorative roleplay

## Machine-detectable roles stay intact

Rendering and QA still need clean structural roles.

The system should continue to detect and preserve roles such as:

- student packet
- teacher guide
- completion check
- project tools
- matching bank
- rubric
- checklist
- prompt
- reflection
- assessment
- graphic organizer
- vocabulary support
- lesson outline

The themed label can sit on top of the role.

The role must remain clear to the renderer, teacher, and QA process.

## Role-to-wrapper mapping

Use these mappings as defaults:

| Structural role | Literacy Quest wrapper label |
| --- | --- |
| student packet | Quest Journal |
| teacher guide | Guild Leader Guide |
| worksheet | Mission Page |
| graphic organizer | Strategy Map |
| checklist | Quest Completion Check |
| rubric | Guild Criteria / Mastery Scale |
| vocabulary | Word Arsenal / Key Terms |
| reflection | Campfire Reflection |
| extension | Side Quest |
| assessment | Final Challenge / Mastery Check |
| project tools | Guild Tools / Quest Toolkit |
| prompt | Quest Prompt |
| completion check | Quest Completion Check |
| matching bank | Match Bank / Sorting Deck |

These labels can be adjusted when a resource needs a plainer title, but the underlying structural role should not change.

## Student-facing rule

Student-facing resources may use more immersive labels.

Use clear, short language.

A student should still know what to do next.

Good pattern:

`Quest Journal: Voice Trial Lesson 1`

Then a plain task line:

`Do not race. Read so someone can follow what is happening.`

Bad pattern:

`Enter the Chamber of Sonic Resonance and activate your fluency pathway.`

## Teacher-facing rule

Teacher-facing resources should stay practical and professional.

The label may say Guild Leader Guide, but the content should read like a useful teacher guide.

Use:

- lesson sequence
- teacher script
- what to watch for
- likely responses
- evidence guide
- recovery moves
- small-group notes
- print directions

Do not over-theme teacher directions.

## Content variety rule

The lesson content does not have to match the wrapper theme.

A resource may be about:

- memoir
- dystopian fiction
- climate change
- media literacy
- debate
- poetry
- research
- Indigenous perspectives
- creative writing
- novel study
- science texts
- social issues
- personal narrative
- public speaking
- inquiry questions

Do not force these topics into fantasy unless the lesson itself calls for it.

## Literacy intervention rule

For reading intervention, the wrapper must support the actual literacy work.

It should reinforce:

- decoding and word inspection
- fluency practice
- morphology
- vocabulary development
- comprehension repair
- evidence use
- rereading
- reflection on strategy use

It must not encourage context guessing, public comparison, or speed-based ranking.

## Rendering and QA rule

The renderer should treat the wrapper label and the structural role as separate fields.

Example:

- role: `student_packet`
- wrapper_label: `Quest Journal`
- display_title: `Quest Journal: Voice Trial Lesson 1`

This allows the visual theme to be consistent while preserving the document’s function.

QA should check:

1. Is the structural role still obvious?
2. Is the themed label consistent?
3. Does the theme support navigation?
4. Does the theme avoid taking over the academic content?
5. Is the student-facing language readable and classroom-usable?
6. Is the teacher-facing language practical?
7. Is the content BC-aligned and instructionally clear?

## Final rule

A resource should feel like part of the Literacy Quest / Guild Handbook system.

It should also still feel like a real classroom resource.

If the theme makes the resource less clear, reduce the theme.

If the theme only decorates the page without helping navigation, simplify it.
