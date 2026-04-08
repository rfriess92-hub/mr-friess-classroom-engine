# Baseline-to-Engaging Upgrade Rubric v1

Purpose: define how to improve a structurally sound lesson bundle into a more engaging classroom-ready lesson bundle without breaking the stable-core engine model.

This rubric is derived from comparing:
- a structurally sound baseline lesson
- a more engaging v2 lesson built within the same engine constraints

## Core principle

Do not treat engagement as decoration.

A lesson becomes more engaging when:
- the task structure is more active
- the slide rhythm is more purposeful
- the student artifact better matches the thinking demand
- the final evidence prompt produces stronger evidence

while still preserving:
- teacher/student separation
- evidence-location integrity
- architecture integrity
- output declarations
- renderer compatibility

## Rating scale

Use this three-part judgment for each area:
- `baseline_ok`
- `meaningfully_upgraded`
- `overcomplicated_or_unclear`

## Area 1: slide rhythm

### Baseline signs
- slides mostly move from prompt -> explanation -> task -> reflection
- interaction is present but thin
- comparison and discussion are limited

### Meaningfully upgraded signs
- deck opens with a real challenge or hook
- students are asked to classify, compare, defend, or decide
- the deck includes a clearer progression from launch -> evidence rule -> guided thinking -> task launch -> closure
- discussion prompts require reasoning, not just recall

### Drift warnings
- too many novelty slides without instructional purpose
- slide variety that confuses rather than helps
- teacher-only guidance leaking into visible slides

## Area 2: student task quality

### Baseline signs
- worksheet relies mostly on generic blank-line responses
- students do one simple sort, then explain
- task structure is usable but plain

### Meaningfully upgraded signs
- worksheet includes stronger structure for the thinking task
- students sort and justify, not just list
- at least one task requires comparison, ambiguity, or best-fit reasoning
- personal reflection is better connected to the lesson concept

### Drift warnings
- too much complexity for the lesson length
- task overload without clearer learning
- worksheets becoming visually crowded or cognitively muddy

## Area 3: evidence quality

### Baseline signs
- final evidence artifact exists and is valid
- prompt produces basic reflection or justification

### Meaningfully upgraded signs
- final evidence prompt requires a stronger decision or defense
- students compare one option against another, or justify a best fit using evidence
- the final evidence feels more diagnostic for the teacher

### Drift warnings
- evidence prompt becomes too long for the time available
- final evidence location becomes unclear
- planning work starts to compete with the declared final evidence artifact

## Area 4: teacher guide strength

### Baseline signs
- teacher guide covers timing, materials, and general notes
- notes preserve teacher/student separation

### Meaningfully upgraded signs
- teacher guide includes clearer facilitation moves
- notes help the teacher push reasoning, not just task completion
- the guide signals how to manage discussion, debate, or evidence-based decisions

### Drift warnings
- teacher guide becomes bloated with over-scripted language
- too much pedagogy detail for the lesson’s actual complexity

## Area 5: engagement fit

### Baseline signs
- lesson is valid but not strongly aligned to a dominant engagement mode

### Meaningfully upgraded signs
- lesson clearly matches a dominant engagement mode such as:
  - `sort_classify`
  - `discussion_heavy`
  - `case_study`
  - `reflection_writing`
- slides and student artifacts both reinforce that mode

### Drift warnings
- lesson tries to do too many engagement modes at once
- activity style and evidence location conflict

## Upgrade checks before accepting a v2 lesson

- [ ] the lesson is still renderer-safe
- [ ] outputs are unchanged unless a deliberate change is needed
- [ ] teacher/student separation is preserved
- [ ] evidence location is preserved
- [ ] slide rhythm is more purposeful than the baseline
- [ ] worksheet/task structure better matches the thinking demand
- [ ] final evidence is stronger, not just longer
- [ ] the upgraded lesson still fits the time available

## Recommended use

Use this rubric when comparing:
- baseline vs upgraded versions of the same lesson
- multiple candidate versions generated from the same brief
- future design-pattern experiments that stay within the current engine

## Pass rule

An upgrade is worth keeping only if it is:
- more engaging than baseline
- still structurally coherent
- still easy enough to teach and render

If an upgrade adds novelty but not better thinking, do not keep it.
