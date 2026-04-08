# Design Layer Integration Notes v1

Purpose: explain how the engagement/design layer should connect to the current authoring and engine pipeline without destabilizing the stable-core system.

## Current pipeline

The current pipeline is:

teacher idea
-> teacher brief
-> brief-to-package generation prompt/spec
-> stable-core package
-> schema / route / render
-> artifact QA / bundle QA
-> lesson bundle

## Where the design layer belongs

The design layer belongs between:
- teacher brief
- stable-core package generation

The brief should eventually declare:
- primary engagement mode
- optional secondary engagement mode
- optional preferred artifact style

The generator should then:
- choose appropriate slide patterns
- choose appropriate student artifact patterns
- keep evidence location and output declarations intact

## Recommended authoring additions for a later version

Add these optional fields to the brief in a future revision:
- `primary_engagement_mode`
- `secondary_engagement_mode`
- `preferred_artifact_style`
- `visual_tone`

Do not add them yet unless the repo is ready to update the canonical brief template and conversion contract together.

## Safe v1 implementation strategy

For now:
- keep the canonical brief stable
- keep package generation stable
- use the design layer as guidance for lesson upgrades and future prompt refinement

## What must stay fixed

Even when applying richer design patterns, do not break:
- teacher/student separation
- final evidence location
- checkpoint/release timing
- architecture integrity
- output declarations

## First practical use

Use this design layer to upgrade lessons after they are structurally proven.

Recommended first target:
- `Careers 8 — Exploring Career Clusters`

Reason:
- already generated
- already rendered
- naturally suited to stronger sort/classify activity patterns

## Next practical phase

After this design layer is accepted, the next step should be:
- create one upgraded lesson package using these patterns
- render it
- compare the upgraded lesson bundle against the baseline version

That will show whether the design layer improves engagement without breaking the stable-core pipeline.
