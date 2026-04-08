# Engagement and Design Layer v1

Purpose: define the next layer above the stable-core engine so rendered lessons feel more engaging, classroom-alive, and visually intentional without breaking package integrity.

This layer does **not** replace the stable-core package model.
It sits on top of it.

## Core principle

The engine already proves:
- teacher/student separation
- evidence-location integrity
- route-driven rendering
- artifact QA and bundle QA
- package-scoped output isolation

The next need is not more structural proof.
The next need is stronger classroom experience quality.

## What this layer is for

This layer should improve:
- slide rhythm
- task variety
- visual clarity
- student engagement
- classroom energy
- artifact usability

without breaking:
- teacher/student separation
- final evidence location
- checkpoint/release integrity
- architecture integrity
- bundle coherence

## Design problem statement

The current engine can produce valid lesson bundles.
That does not automatically make those bundles feel high-energy, visually polished, or richly interactive.

So the design layer must answer:
- how do lessons become more engaging without becoming structurally inconsistent?
- how do slides and student materials support better interaction patterns?
- how do we preserve stable rendering while adding richer activity formats?

## Boundaries for v1

This design layer is:
- pattern-driven
- reusable
- architecture-aware
- compatible with the stable-core package model

This design layer is not yet:
- a full theme engine
- a full visual template system
- a replacement for subject pedagogy
- a replacement for downstream QA

## The five focus areas

### 1. Slide pattern quality
Move beyond simple prompt/bullet/reflect loops.

### 2. Student artifact pattern quality
Move beyond blank-line response sheets when the task calls for stronger structure.

### 3. Visual consistency
Create a clearer visual language for subject/theme families.

### 4. Engagement logic in authoring
Allow briefs and packages to declare what kind of student interaction the lesson is built around.

### 5. Renderer-aligned evolution
Only introduce richer pattern types when they can be represented cleanly in the package model.

## Recommended engagement modes for v1

These modes should be treated as authoring signals, not rigid lesson types.

- `discussion_heavy`
- `sort_classify`
- `case_study`
- `inquiry`
- `reflection_writing`
- `collaborative_task`
- `mini_project`

A lesson may use one primary engagement mode and one secondary mode.

## Recommended v1 rule

Do not try to make every lesson use every engagement mode.

Instead:
- choose the dominant engagement mode
- align slides to that mode
- align student artifact patterns to that mode
- keep the final evidence artifact consistent with that mode

## Design-layer success criteria

A lesson should feel stronger after the design layer if:
- the slide deck has purposeful rhythm, not repetition
- the student artifact fits the task structure, not just generic writing lines
- visual hierarchy is clearer
- discussion/task prompts feel active and concrete
- the lesson still preserves stable-core integrity

## First recommended upgrade target

Use `Careers 8 — Exploring Career Clusters` as the first design-upgrade candidate because:
- it already exists as a generated package
- it already renders
- it is structurally sound
- it naturally fits stronger sort/classify patterns

## Next-phase implementation sequence

1. define slide patterns
2. define student artifact patterns
3. define how briefs can request engagement modes
4. define how packages carry those design signals
5. only then consider renderer extensions needed for richer layouts
