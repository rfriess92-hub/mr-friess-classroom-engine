# Codex Handoff: Engine Phase Roadmap

**Date:** 2026-04-22  
**Repo:** mr-friess-classroom-engine  
**Maintained by:** Mr. Friess (rfriess92-hub)

This document describes five phases of engine development. Each phase has a defined scope. Read the constraints carefully — there are decisions already made that you must not reverse.

---

## How to Work in This Repo

**Acceptance path — run in this order before any PR:**
```
pnpm run schema:check -- --fixture <key>
pnpm run render:package -- --fixture <key> --out output
pnpm run qa:bundle -- --fixture <key> --out output
npm test
```

**Fixture shortcuts** (see `scripts/lib.mjs` FIXTURE_MAP for the full list):
- `benchmark1` — single-period math, Grade 2
- `challenge7` — multi-day ELA, Grade 8
- `careers8_w1` through `careers8_w4` — Week 1–4 Careers mosaic
- `pbg_english10`, `pbg_english11`, `pbg_english12`, `pbg_math8`, `pbg_workplace_math10`

**Never:**
- Change `engine/schema/canonical.mjs` path resolution (uses `import.meta.url` — leave it)
- Modify the stable-core acceptance gate in `scripts/render-package.mjs` or `scripts/qa-bundle.mjs` without a design decision
- Add prescriptive/coaching voice to teacher-facing fields (see `docs/CODEX_HANDOFF_CONTENT_VOICE.md`)
- Remove or rename existing output types from the schema enum — add only
- Skip CI (`npm test`) before opening a PR

---

## Phase 1 — Assessment Foundation

**Status:** Schema designed. Implementation pending.

### What's already done (do not redo)
- `schemas/question-bank.schema.json` — full question bank schema with `bankQuestion` $def
- `schemas/lesson-package.schema.json` — `assessmentSection`, `quizSection`, `assessmentQuestion` $defs added; `assessment` and `quiz` added to `outputType` enum; `assessment` and `quiz` properties added to root package
- `schemas/canonical-vocabulary.json` — `assessment`, `quiz` added to `output_types`; `proficiency_levels`, `bloom_levels`, `question_difficulty`, `question_types` added

### What Codex must build

#### 1. `questions/` directory + seed banks
Create `questions/` at repo root. Add one seed bank per subject using `schemas/question-bank.schema.json`:
- `questions/ela-10-argument-writing.json`
- `questions/ela-11-analysis-writing.json`
- `questions/ela-12-extended-writing.json`
- `questions/math-8-measurement.json`
- `questions/workplace-math-10-applied.json`
- `questions/careers-8-identity-and-work.json`

Each bank: minimum 8 questions, mix of difficulty levels and question types. Derive questions from existing fixture content (task sheet prompts, exit tickets, success criteria, worksheet questions already in the repo). Do not invent content wholesale.

#### 2. HTML templates
Create two HTML template files following the exact pattern of existing templates in `engine/pdf-html/templates/`:

**`engine/pdf-html/templates/assessment.mjs`**
- Export `buildAssessmentHTML(pkg, section, fontFaceCSS, designCSS, { teacherVersion = false } = {})`
- Student version: title, instructions, time limit (if present), questions numbered with response space
- Teacher version: same layout + answer key callout beside each question + marking notes + point values
- Proficiency scale footer when `section.proficiency_scale !== false`
- Masthead matches existing templates (subject · grade, right-aligned type label)
- Use `escapeHtml` from `./shared.mjs`

**`engine/pdf-html/templates/quiz.mjs`**
- Export `buildQuizHTML(pkg, section, fontFaceCSS, designCSS, { teacherVersion = false } = {})`
- Same structure as assessment but lighter — no proficiency scale footer, compact layout
- Max 10 questions enforced at render (log warning and truncate if exceeded)

#### 3. Register templates in the render pipeline
Update `engine/pdf-html/render.mjs` and `engine/pdf-html/index.mjs` to:
- Handle `assessment` and `quiz` output types
- Pass `teacherVersion: true` when `route.audience === 'teacher'`
- Both output types produce TWO PDFs: one student, one teacher (named `{artifact_id}.pdf` and `{artifact_id}.teacher.pdf`)

Update `scripts/render-package.mjs`:
- Add `assessment` and `quiz` to the `DOC_OUTPUT_TYPES` set so they route through the HTML path

#### 4. `scripts/pull-questions.mjs`
Create a CLI script:
```
node scripts/pull-questions.mjs --bank questions/math-8-measurement.json --difficulty core --bloom apply --count 5
```
Options:
- `--bank <path>` — path to a question bank file (required)
- `--difficulty <level>` — filter by scaffolded/core/extension
- `--bloom <level>` — filter by bloom level
- `--type <question_type>` — filter by question type
- `--standards <code>` — filter by standard code (partial match)
- `--count <n>` — limit output (default: all matching)
- `--out <path>` — write JSON to file (default: stdout)

Output: JSON array of matching `bankQuestion` objects.

Add to `package.json` scripts: `"pull:questions": "node scripts/pull-questions.mjs"`

#### 5. Proof fixture
Create `fixtures/tests/assessment-quiz.proof.json` — a `single_period_full` package with:
- One `assessment` output (student + teacher audience declared)
- One `quiz` output
- 3–5 inline questions covering multiple `question_type` values
- At least one `question_bank_refs` entry pointing to a seed bank

#### 6. Smoke test
Create `tests/node/render-package-assessment-smoke.test.mjs`:
- Validates the proof fixture passes `planPackageRoutes`
- Confirms both `assessment` and `quiz` output types appear in routes
- Runs `render-package.mjs` on the proof fixture and checks that student + teacher PDFs are produced

---

## Phase 2 — Rubric + Feedback Loop

**Status:** Not started. Wait for Phase 1 to merge.

### Schema to add (do before templates)
Add to `schemas/lesson-package.schema.json`:

**`rubricSection`** — linked to existing `success_criteria` and `final_evidence_target`:
```
title, criteria (array of rubricCriterion), proficiency_scale (bool, default true),
point_values (optional object mapping level → points)
```
**`rubricCriterion`**:
```
label (string), descriptions (object: emerging/developing/proficient/extending → string),
weight (optional number)
```

**`formativeCheckSection`**:
```
title, check_type (enum: three_two_one | traffic_light | muddiest_point | thumbs | exit_slip),
prompt (string), n_lines (integer)
```

Add `rubric`, `formative_check` to `outputType` enum and `canonical-vocabulary.json`.

### Templates to build
- `engine/pdf-html/templates/rubric.mjs` — criteria table, proficiency scale columns, clean grid
- `engine/pdf-html/templates/formative-check.mjs` — half-page, quick format, matches check_type

### Proof fixture + smoke test
Same pattern as Phase 1.

---

## Phase 3 — Daily Classroom Artifacts

**Status:** Not started. Wait for Phase 2 to merge.

### Schema to add

**`warmUpSection`**:
```
title, prompt (string), activity_type (enum: think_pair_share | quick_write | retrieval_practice | notice_wonder | estimation),
n_lines (integer), connection_to_lesson (string — one line linking warm-up to lesson goal)
```

**`vocabularyCardSection`**:
```
title, terms (array of: { term, definition, example_sentence, subject_area })
```

**`observationGridSection`** (teacher-only):
```
title, observation_targets (array of strings — pulled from success_criteria/checkpoints),
student_count (integer, default 13), notes_lines (integer, default 3)
```

**`lessonReflectionSection`** (teacher-only):
```
date, what_landed (string), who_needs_followup (array of strings),
what_changes_tomorrow (string), curriculum_gaps (string)
```

Add `warm_up`, `vocabulary_card`, `observation_grid`, `lesson_reflection` to `outputType` enum and `canonical-vocabulary.json`.

### Templates to build
- `engine/pdf-html/templates/warm-up.mjs` — half-page prompt, clean
- `engine/pdf-html/templates/vocabulary-card.mjs` — term cards, printable
- `engine/pdf-html/templates/observation-grid.mjs` — teacher-only grid, names down left
- `engine/pdf-html/templates/lesson-reflection.mjs` — teacher-only, one page, structured fields

### Proof fixture + smoke test
Same pattern as Phase 1.

---

## Phase 4 — Planning View

**Status:** Not started. Wait for Phase 3 to merge.

`weekly:overview` script exists at `scripts/weekly-overview.mjs` but is partial. The goal is a proper `unit_overview` output type that renders a one-page unit grid (weeks × days, artifact types per cell, learning progression visible).

Design to be determined before implementation. Do not start Phase 4 without a schema design session.

---

## Phase 5 — Render Hardening

**Status:** Not started. Design-only phase guidance below.

### Checkpoint sheet HTML template
`checkpoint_sheet` currently has no HTML template — it routes to Python only. Add `engine/pdf-html/templates/checkpoint-sheet.mjs` and wire into `render.mjs`. Follow the same pattern as `exit-ticket.mjs` but with a checkpoint-specific layout.

### PPTX pipeline stabilization
`engine/pptx/renderer.py` currently delegates to archive modules. The goal is to consolidate renderers so the archive layer is no longer in the live call path. **Do not attempt this without reading `docs/renderer-transition-plan.md` and `docs/renderer-dependency-map.md` first.**

### Architecture proof fixtures
Add proof fixtures for the four declared-but-unexemplified architectures:
- `workshop_session` — e.g. `fixtures/tests/workshop-session.proof.json`
- `lab_investigation` — e.g. `fixtures/tests/lab-investigation.proof.json`
- `seminar` — e.g. `fixtures/tests/seminar-extended.proof.json` (one already exists for discussion-prep only)
- `station_rotation` — e.g. `fixtures/tests/station-rotation-extended.proof.json`

---

## Cross-Phase Rules

1. **One phase per PR.** Don't mix Phase 2 schema work into a Phase 1 PR.
2. **Schema first, templates second, fixtures third, tests last.** In that order within each phase.
3. **All new output types must have a proof fixture and a smoke test before the PR closes.**
4. **Content voice:** teacher-facing fields use reference/agenda voice. Student-facing fields are direct and plain. See `docs/CODEX_HANDOFF_CONTENT_VOICE.md`.
5. **Proficiency scale is BC-standard:** Emerging / Developing / Proficient / Extending. Not percentage-based unless `proficiency_scale: false` is explicitly set.
6. **Don't touch `engine/family/*`** — compatibility-only, being deprecated.
7. **Update `docs/WORKLOAD.md`** as items complete.
