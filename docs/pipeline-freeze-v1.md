# Pipeline Freeze v1

Status: frozen reference snapshot for the Mr. Friess Classroom Engine pipeline.

Purpose: record the current stable pipeline shape before the next phase begins.

## Frozen pipeline shape

The current intended pipeline is:

teacher idea
-> teacher brief
-> brief-to-package generation spec
-> stable-core package
-> schema / route / render
-> artifact QA / bundle QA
-> lesson bundle
-> baseline-to-engaging upgrade pass

## What is now considered stable on `main`

### Engine layer
- stable-core schema/preflight/render-plan pipeline
- canonical output routing
- route-driven rendering for the proven bounded slice
- fast artifact QA
- bundle QA
- package-scoped output isolation

### Authoring layer
- canonical teacher lesson brief template
- brief-to-package conversion contract
- brief-quality checklist
- brief-to-package generation prompt/spec
- package-generation output contract
- generated-package preflight checklist

### Design layer
- engagement and design layer spec
- slide pattern library
- student artifact pattern library
- design-layer integration notes
- baseline-to-engaging upgrade rubric

### Content proofs now on `main`
- benchmark fixtures proving the engine slice
- generated Careers 8 career clusters lesson
- upgraded engaging v2 Careers 8 career clusters lesson

## What this freeze means

This freeze does **not** mean the project is finished.
It means the top-level workflow is stable enough that the next phase should stop reinventing the pipeline shape.

From this point forward, work should prefer:
- repeated use of the frozen pipeline
- evidence from multiple generated lessons
- targeted improvements based on repeated friction

Work should avoid:
- changing the overall pipeline shape casually
- reopening already-settled structural questions without evidence
- mixing design experiments with backend rewrites unless clearly required

## What is intentionally not frozen yet
- semantic classroom QA
- CI / release-gating automation
- first-class renderer support for richer engagement artifact types
- full theme/template system
- broad content library scale

## Freeze rule

New work should be judged against this question first:

Does this strengthen the frozen pipeline, or does it unnecessarily change the frozen pipeline?
