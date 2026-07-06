---
course: Psychology 11/12
artifact_type: source_register
audience: teacher
version: 2
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
phase: phase_1_source_authority
created_from_repo_scan: true
depends_on:
  - source/psychology_11_12/course/lens_based_cycle_reference.md
  - source/psychology_11_12/course/lens_matrix.md
---

# Psychology 11/12 Source Register and Authority Rules

## 1. Purpose

This file is the Phase 1 housekeeping register for Psychology 11/12. It defines which repo areas count as Psychology source, how existing files should be classified, and which file wins when older engine materials conflict with the new A-F lens-based architecture.

This file does not create new curriculum content. It is a source-authority and drift-prevention document.

## 2. Phase 0 Decision Freeze

The following decisions are treated as frozen working assumptions for future Psychology 11/12 planning:

| Decision | Status |
|---|---|
| Psychology 11/12 is moving toward an A-F lens-based spiral curriculum. | Accepted |
| The course is not a random topic grab bag. | Accepted |
| Each cycle needs a dominant lens, repeated psychology domains, permanent through-lines, and a coherent capstone. | Accepted |
| OpenStax Psychology 2e remains the primary academic spine. | Accepted |
| Student safety boundary remains fixed: no diagnosis, no therapy, no forced disclosure, no peer counselling. | Accepted |
| Existing engine materials are source banks, archive material, or legacy context unless reclassified. | Accepted |
| Old Semester 1 / Semester 2 survey logic no longer governs the future architecture. | Accepted |
| A-D prebuilt materials are preserved, but they do not automatically define the course. | Accepted |
| E-F remain mapped future cycles until active source files or manifests exist. | Accepted |
| Cycle A remains the first active build target after housekeeping. | Accepted |

## 3. Current Architecture Source of Truth

The current governing architecture is the A-F lens model.

| Cycle | Current lens | Legacy / prior labels to preserve as aliases |
|---|---|---|
| A | Scientific / Evidence | Foundations; Psychology as a Science |
| B | Intellectual / Learning | Learning / Cognition / Development / Applied; Applied |
| C | Relational / Identity | Personality / Identity / Social / Relationships; Consciousness / Meaning |
| D | Wellness / Change | Mental Health / Stress / Disorders / Treatment / Support; Change / Support Systems |
| E | Justice / Responsibility | Forensic and Legal Psychology |
| F | Systems / Media / Influence | Media / Technology / Persuasion / Consumer Psychology |

Permanent through-lines across all cycles:

- Cultural / contextual
- Developmental / lifespan
- Biological / brain-body
- Ethical / evidence

## 4. Source Authority Hierarchy

Use this hierarchy when files disagree.

| Authority level | Source area | What it governs |
|---:|---|---|
| 1 | `source/psychology_11_12/course/lens_based_cycle_reference.md` | Governing architecture, safety stance, lens model, through-lines. |
| 2 | `source/psychology_11_12/course/lens_matrix.md` | Domain-by-lens planning control panel. |
| 3 | `source/psychology_11_12/course/source_register.md` | Source authority, lane classification, conflict rules. |
| 4 | Future `source/psychology_11_12/course/course_map.md` | Program map once created. |
| 5 | `source/psychology_11_12/cycles/` | Normalized cycle-specific source files. |
| 6 | `courses/psychology-11-12/` | Legacy course-family planning and package support until migrated. |
| 7 | `units/psychology/` | Prebuilt archive indexing and engine-native package staging. |
| 8 | `fixtures/psychology/` | Render proof / QA evidence only. |
| 9 | `scripts/validate-psychology-*` and `scripts/qa-psychology-*` | Validation behaviour and QA rules only. |
| 10 | Uploaded or legacy materials | Provenance/source bank only when referenced by Psychology manifests. |

## 5. Conflict Resolution Rules

Use these rules before editing files.

| Conflict | Winning rule |
|---|---|
| Old Sem1/Sem2 survey model conflicts with A-F lens model. | A-F lens model wins. Treat Sem1/Sem2 files as legacy planning unless explicitly migrated. |
| A-D prebuilt cycle assets conflict with normalized source files. | Normalized source files win. Prebuilt assets become source banks or archive references. |
| Engine-native package JSON conflicts with course-level architecture. | Course-level architecture wins. Package JSON may remain useful for renderer proof or later migration. |
| Render proof conflicts with source content. | Source content wins. Render proof only proves artifact-generation state. |
| Old cycle titles conflict with new lens titles. | New lens title wins; old title is preserved as an alias until migration. |
| Safety boundary conflicts with an activity idea. | Safety boundary wins. Revise, sanitize, or classify as needs safety review. |
| OpenStax/course evidence boundary conflicts with pop-psych content. | OpenStax/evidence boundary wins. Treat pop-psych content as media-analysis material only, not as accepted psychology. |

## 6. Source Lanes

### 6.1 Current Architecture Source

These files govern future planning.

| File | Lane | Status | Notes |
|---|---|---|---|
| `source/psychology_11_12/course/lens_based_cycle_reference.md` | Current source-of-truth | draft | Architecture, safety, A-F lens model, through-lines. |
| `source/psychology_11_12/course/lens_matrix.md` | Current source-of-truth | draft | Domain-by-lens planning matrix. |
| `source/psychology_11_12/course/source_register.md` | Current source-of-truth | draft | Source authority and conflict rules. |
| `source/psychology_11_12/course/course_map.md` | Future source-of-truth | missing | Next program-level artifact. |

### 6.2 Active Normalized Source

These files are safe to build from, subject to ordinary review and QA.

| Area / file | Lane | Status | Notes |
|---|---|---|---|
| `source/psychology_11_12/cycles/cycle_a_foundations/manifest.yaml` | Active normalized source | draft_manifest | Tracks Cycle A artifacts and known gaps. |
| `source/psychology_11_12/cycles/cycle_a_foundations/assessment_pack.md` | Active normalized source | draft | Student-facing evidence/research assessment. |
| `source/psychology_11_12/cycles/cycle_a_foundations/marking_guide.md` | Active normalized source | draft | Teacher-facing marking support. |
| `source/psychology_11_12/cycles/cycle_a_foundations/source_sheet.md` | Active normalized source | draft | Student-facing source support. |
| `source/psychology_11_12/cycles/cycle_a_foundations/capstone_packet.md` | Active normalized source | draft | Student-facing claim-analysis capstone. |
| `source/psychology_11_12/slides/source/cycle_a_foundations_slides.md` | Active normalized source | language_locked_draft | Student-facing slide language for Cycle A L1. |

### 6.3 Legacy Planning Source

These files are useful, but they do not govern the future course architecture.

| File / area | Lane | Decision |
|---|---|---|
| `courses/psychology-11-12/scope-sequence.yaml` | Legacy planning source | Useful generic survey-semester spine; superseded by A-F lens model for program architecture. |
| `courses/psychology-11-12/semester-map.sem1.yaml` | Legacy planning source | Useful for pacing/first-run logic; no longer governs future architecture. |
| `courses/psychology-11-12/semester-map.sem2.yaml` | Legacy planning source | Useful for refinement logic; no longer governs future architecture. |
| `courses/psychology-11-12/packages/foundations/` | Legacy / engine-support source | Useful for Cycle A package support; should be migrated into normalized source when needed. |

### 6.4 Prebuilt Archive / Intake Source

These files preserve provenance and may be mined carefully, but they are not automatically source-of-truth.

| Area / file | Lane | Decision |
|---|---|---|
| `units/psychology/_raw/` | Prebuilt archive lane | Preserve as intake/archive material. |
| `units/psychology/psychology-unit.manifest.json` | Archive / engine staging | Tracks prebuilt source archive and engine-native render boundary. |
| `units/psychology/cycles/cycle-a/cycle.manifest.json` | Prebuilt archive index | Mine carefully; Cycle A normalized source wins when conflicts occur. |
| `units/psychology/cycles/cycle-b/cycle.manifest.json` | Prebuilt archive index | Useful source bank; content crosses multiple future lenses and must be remapped. |
| `units/psychology/cycles/cycle-c/cycle.manifest.json` | Prebuilt archive index | Useful source bank; requires evidence and safety review before migration. |
| `units/psychology/cycles/cycle-d/cycle.manifest.json` | Prebuilt archive index | Under-indexed; requires source normalization before use. |

### 6.5 Engine-Native Package / Render Proof Lane

These files show implementation/render state. They do not override course architecture.

| Area / file | Lane | Decision |
|---|---|---|
| `units/psychology/cycles/*/packages/` | Engine-native staging | Use only when converting normalized content to package JSON. |
| `fixtures/psychology/` | Render proof / QA | Evidence of output generation only. Not curriculum source by itself. |
| `scripts/validate-psychology-*` | Validation logic | Update later after course map and cycle overviews stabilize. |
| `scripts/qa-psychology-*` | QA logic | Update later after source lanes are stable. |

### 6.6 Future / Mapped Only

These cycles should not be treated as active engine-native cycles until active source files or manifests exist.

| Cycle | Current lens | Lane | Rule |
|---|---|---|---|
| E | Justice / Responsibility | Future mapped only | Do not build from as active cycle yet. Avoid true-crime drift. |
| F | Systems / Media / Influence | Future mapped only | Do not build from as active cycle yet. Avoid moral panic about technology. |

## 7. Anti-Backtracking Classification Rule

When an older Psychology file conflicts with the new architecture, do not immediately revise the new architecture. Classify the older file first.

| Classification | Meaning | Action |
|---|---|---|
| Compatible | Fits the new A-F lens model directly. | Keep and use. |
| Compatible with alias | Fits, but uses legacy naming. | Keep; rename or alias later. |
| Useful source bank | Contains useful lesson/content material but does not define architecture. | Mine selectively. |
| Legacy structure | Reflects old course organization. | Preserve, but supersede in course map. |
| Needs safety review | Could invite disclosure, diagnosis, clinical overreach, true-crime drift, or moral panic. | Do not use until revised. |
| Future/mapped only | Belongs to E/F or inactive future cycle. | Do not build as active source yet. |

## 8. Safety and Suitability Rules

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
- publicly analyze classmates
- rank or judge people in the room

Use instead:

- fictional scenarios
- public examples
- neutral case studies
- low-risk academic reflection
- concept application
- source analysis
- evidence evaluation
- teacher-controlled discussion structures

Mental health lessons should teach literacy, stigma reduction, support awareness, careful language, and appropriate help-seeking. They should not become therapy lessons, self-diagnosis lessons, peer-counselling simulations, or trauma-disclosure activities.

## 9. Audience and Visibility Rules

| Artifact type | Student visible? | Teacher visible? | Answer key allowed? | Notes |
|---|---:|---:|---:|---|
| Student packet | Yes | No, unless duplicated into teacher guide | No | Keep free of teacher rationale and hidden notes. |
| Source sheet | Yes | No, unless duplicated into teacher guide | No | Use short, purposeful, traceable source support. |
| Assessment pack | Yes | No | No | Student version only. |
| Capstone packet | Yes | No | No | Student-facing synthesis task. |
| Slide source | Yes | No | No | Low-density, student-facing language. |
| Teacher binder | No | Yes | Yes, where appropriate | Delivery guide, safety notes, misconceptions, differentiation, answer keys. |
| Marking guide | No | Yes | Yes | Teacher-only assessment support. |
| QA bundle | No | Yes / repo | No | Render and maintenance support. |

## 10. What Phase 1 Does Not Do

Phase 1 does not:

- rewrite the old scope sequence
- rewrite Sem1/Sem2 maps
- rename existing repo folders
- split old Cycle B content across new lenses
- rewrite old Cycle C Consciousness / Meaning material
- add E/F manifests
- update validation scripts
- produce student-facing curriculum artifacts

Those are later phases.

## 11. Phase 1 Completion Criteria

Phase 1 is complete when:

1. Source authority is explicit.
2. Legacy files are classified without being deleted or rewritten.
3. The source register is registered in `content_inventory.yaml`.
4. Old files can be reviewed without triggering architecture backtracking.
5. The next step is clearly `course_map.md`.

## 12. Next Step After Phase 1

The next source artifact should be:

`source/psychology_11_12/course/course_map.md`

The course map should translate the Phase 0 architecture freeze and this Phase 1 source authority model into a stable program map.
