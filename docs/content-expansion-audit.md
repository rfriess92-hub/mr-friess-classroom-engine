# Content Expansion Audit

Phase: `phase-003-content-expansion-audit`

Mode: Repo / build / rendering / QA

## Purpose

This audit turns broad content-expansion needs into a ranked, phase-ready backlog. It is not a content-generation phase. It does not add classroom packages, renderer logic, schemas, or tests.

The next work should move deliberately through small content phases that can be rendered and QA-checked by the repo, instead of randomly adding packages.

## Current operating baseline

The repo now has a workable expansion path:

1. Phase cards define the work.
2. Implementation agents work inside allowed areas.
3. QA contracts protect renderability, teacher/student separation, and page-role expectations.
4. Content PRs can run exact package render proof for changed package JSON files.

This means content expansion can now happen safely, but only if each package phase stays narrow.

## Confirmed coverage anchors

The repo already has evidence of these useful content surfaces:

- Careers 8 career-cluster package patterns.
- Careers 8 guest-speaker package for Patrick from BCLC.
- Multi-page student packet and teacher-guide proof patterns.
- Rubric-sheet proof patterns.
- Final-response-sheet proof patterns.
- Worksheet, task-sheet, exit-ticket, and student-facing PDF output families.
- Kamloops Growth Project weekly package direction.
- PBG-style English and math fixture families.
- Classroom worksheet and graphic-organizer template system surfaces.

This is enough to expand from known patterns. It is not yet enough to say coverage is complete.

## Major gaps

### 1. Math 8 garden/growth stream

Priority: Critical

The user needs an 8-week Grade 8 Math stream tied to the planter/growth project. Existing content direction exists, but the repo needs renderable weekly packages that cover the curriculum through measurement, graphing, proportional reasoning, volume, data, and financial/decision math where appropriate.

Needed package types:

- weekly teacher guide
- daily or weekly student packet
- measurement log
- graphing worksheet
- watering-volume / rate worksheet
- final response sheet
- rubric or checklist
- catch-up packet for absences

Risk:

The stream can become a loose project without full curriculum coverage. Each package must name the math target and preserve Grade 8 BC fit.

### 2. Literacy / English growth-writing stream

Priority: Critical

The user needs a parallel English stream where students can write fiction or nonfiction about community, building, and growth. The repo needs differentiated but aligned packages that support planning, drafting, conferencing, revising, and final publishing.

Needed package types:

- writer's notebook packet
- narrative planning organizer
- nonfiction process-writing organizer
- paragraph / scene builder
- peer feedback sheet
- revision checklist
- final response / final draft support
- rubric

Risk:

Differentiation could split into unrelated assignments. The same theme and evidence target should stay visible across support/core/extension paths.

### 3. K-designation access toolkit

Priority: Critical

The classroom needs highly scaffolded, reduced-output, high-clarity supports that remain aligned to the same goals as the core task.

Needed package types:

- reduced-output version generator pattern
- sentence-frame banks
- visual checklist templates
- oral-response option sheet
- partner-work role card
- chunked task sheet
- quiet-start / re-entry sheet
- teacher intervention notes

Risk:

Access supports can accidentally lower the learning goal or become separate assignments. The contract should require aligned evidence targets.

### 4. Graphic organizer library

Priority: High

The user explicitly asked for reusable graphic-organizer and worksheet templates. The repo has some surfaces, but it needs a systematic classroom library.

Needed organizers:

- observe / wonder / infer
- claim / evidence / reasoning
- compare / contrast
- sequence / process
- cause / effect
- problem / solution
- decision matrix
- vocabulary Frayer-style organizer
- growth log organizer
- interview notes organizer

Risk:

Organizers can become generic filler unless each has a clear classroom use case and render proof.

### 5. Careers 8 reusable package set

Priority: High

The repo has career clusters and guest-speaker coverage. It should become a repeatable Careers 8 set for real classroom routines.

Needed package types:

- guest speaker template
- values and interests lesson
- education pathway lesson
- job profile mini-inquiry
- workplace skills scenario task
- career myth vs reality sort
- community career connection
- reflection and portfolio checkpoint

Risk:

Careers content can become generic and adult-toned. Keep Grade 8 language, real examples, and exploratory framing.

### 6. Assessment and rubric library

Priority: High

Rubric-sheet support exists, but the repo needs classroom-ready assessment patterns for recurring use.

Needed package types:

- single-point rubric
- checklist rubric
- peer feedback sheet
- teacher conference notes
- self-assessment sheet
- final evidence rubric
- oral-response rubric
- portfolio reflection rubric

Risk:

Student-facing rubrics must avoid teacher-only grading rationale and answer leakage.

### 7. Sub plans and makeup packets

Priority: Medium

The repo should support attendance realities and substitute days without manual reconstruction.

Needed package types:

- one-day sub plan
- short independent makeup packet
- missed-lab catch-up sheet
- absent-student re-entry sheet
- low-tech emergency worksheet

Risk:

Sub plans can drift from the current unit if they are too generic. Each should connect to the active stream.

## Recommended phase sequence

1. `phase-004-math8-growth-measurement-package`
2. `phase-005-math8-watering-volume-rate-package`
3. `phase-006-literacy-growth-writing-launch-package`
4. `phase-007-k-designation-access-toolkit`
5. `phase-008-graphic-organizer-library-proof`
6. `phase-009-careers8-reusable-speaker-template`
7. `phase-010-assessment-rubric-library-proof`
8. `phase-011-sub-plan-makeup-packet-library`

## Rules for the next content phases

- One package family per PR.
- No renderer changes unless the phase is explicitly an engine phase.
- Use existing supported output types before proposing new ones.
- Every changed package JSON must render in CI.
- Every package must preserve teacher/student separation.
- Differentiation must be aligned, not separate work.
- Keep classroom details concrete and usable for Mr. Friess.

## Immediate recommendation

Start with `phase-004-math8-growth-measurement-package`.

Reason: it is the highest classroom-value next move and directly supports the 8-week Grade 8 planter/growth project. It also gives the render system a practical test across math worksheet, student packet, teacher guide, graphing task, and assessment evidence.
