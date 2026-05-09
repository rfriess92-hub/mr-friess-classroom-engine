# Engine Expansion Contract

This contract governs phase implementation and engine expansion work in the Mr. Friess Classroom Engine.

## Core rule

Engine expansion must be phase-card driven. A phase may only change the files and systems it explicitly names.

## Phase types

- Engine phase: renderer, schema, routing, classifier, package orchestration, fixture proofing, or QA tooling only when the phase card lists those areas.
- Content phase: classroom packages, rubrics, assessments, slides, worksheets, graphic organizers, and proof fixtures. It must not casually alter renderer internals.
- QA phase: verification, cleanup, and blocking. It may perform mechanical cleanup but must not expand feature scope.

## Protected systems

The following areas are protected unless explicitly listed in a phase card:

- renderer core
- schema contracts
- page-role classifier logic
- routing/planning logic
- QA pass/fail thresholds
- package output naming conventions
- teacher/student content boundary rules

## Required evidence

Every implementation phase must produce at least one of the following:

- new or updated fixture proof package
- rendered output evidence
- test coverage
- QA report
- contract update with migration notes

## Prohibited shortcuts

- deleting failing tests to pass CI
- weakening QA thresholds without a contract migration
- mixing teacher notes into student-facing documents
- adding content that is not renderable through the engine
- broad refactors inside a content-only phase
- changing output names without updating fixtures and reports

## Definition of done

A phase is done only when the phase goal is implemented, existing tests pass, affected outputs render, fixture proof coverage exists where needed, teacher and student materials are separated, no protected system changed outside the phase card, and an implementation report plus QA report exist.
