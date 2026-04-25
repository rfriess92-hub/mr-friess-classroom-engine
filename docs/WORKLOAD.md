# Engine Master Task List

Living doc. Three tracks run in parallel. Update status as items move.

**Track A** — Engine infrastructure (new output types, schema, templates)  
**Track B** — Pedagogy + content quality (grade-band calibration, voice, artifact roles)  
**Track C** — Teacher profile + personalization (turns engine into *your* machine)

Dependency rule: B0 (grade-band contracts) must complete before Codex touches any content. C0 (profile layer schema) should be designed before new generation work starts.

---

## TRACK A — Engine Infrastructure

### A1 — Assessment Foundation `STALLED — implementation not started`
Schema merged (#166). Implementation handoff to Codex has not been picked up.
`questions/` dir, templates, and render wiring are all absent from main as of #169.

- [x] `schemas/question-bank.schema.json`
- [x] `assessmentSection`, `quizSection`, `assessmentQuestion` $defs
- [x] `assessment`, `quiz` in outputType enum + router + audience sets
- [x] `proficiency_levels`, `bloom_levels`, `question_types` in vocabulary
- [ ] `questions/` seed banks per subject — Codex
- [ ] `engine/pdf-html/templates/assessment.mjs` + `quiz.mjs` — Codex
- [ ] Wire into render pipeline — Codex
- [ ] `scripts/pull-questions.mjs` — Codex
- [ ] Proof fixture + smoke test — Codex

### A2 — Rubric + Feedback Loop `QUEUED`
Wait for A1 to merge.

- [ ] `rubricSection` + `rubricCriterion` schema (BC proficiency scale, optional weights)
- [ ] `formativeCheckSection` schema (check_type: three_two_one, traffic_light, muddiest_point, thumbs)
- [ ] `rubric`, `formative_check` in outputType enum + router + audience sets
- [ ] `engine/pdf-html/templates/rubric.mjs` — Codex
- [ ] `engine/pdf-html/templates/formative-check.mjs` — Codex
- [ ] Proof fixtures + smoke tests — Codex

### A3 — Daily Classroom Artifacts `QUEUED`
Wait for A2 to merge.

- [ ] `warmUpSection` schema (activity_type, connection_to_lesson)
- [ ] `vocabularyCardSection` schema
- [ ] `observationGridSection` schema (teacher-only)
- [ ] `lessonReflectionSection` schema (teacher-only)
- [ ] All four in outputType enum + router + audience sets
- [ ] HTML templates for all four — Codex
- [ ] Proof fixtures + smoke tests — Codex

### A4 — Planning View `QUEUED`
Design session required before execution.

- [ ] `unit_overview` output type (finish weekly:overview, proper unit grid)
- [ ] Materials checklist auto-generated from package output types
- [ ] Student conference note template

### A5 — Render Hardening `QUEUED`
Last. After content rules (Track B) are stable.

- [ ] Checkpoint sheet HTML template (currently Python-only)
- [ ] PPTX pipeline out of archive delegation
- [ ] Proof fixtures for `workshop_session`, `lab_investigation`, `seminar`, `station_rotation`

---

## TRACK B — Pedagogy + Content Quality

### B0 — Grade-Band Contracts `COMPLETE`
All six contracts landed in `engine/generation/contracts/` (#169).
Codex extended Careers 8 into a live validator + QA gate (wired into `qa-bundle`).
Remaining five bands have contract files — validator extension for those is queued as B0a.

- [x] `engine/generation/contracts/careers-8-grade-band.md` + validator in `grade-band-contracts.mjs`
- [x] `engine/generation/contracts/english-10-grade-band.md`
- [x] `engine/generation/contracts/english-11-grade-band.md`
- [x] `engine/generation/contracts/english-12-grade-band.md`
- [x] `engine/generation/contracts/math-8-grade-band.md`
- [x] `engine/generation/contracts/workplace-math-10-grade-band.md`

### B0a — Grade-Band Validator Extension `COMPLETE`
All five bands landed in `grade-band-contracts.mjs` (#176). Unified band registry
feeds `getApplicableGradeBandContracts` and `buildGradeBandGenerationPrompt`.
22 new tests added in `grade-band-contracts-extended.test.mjs`.

- [x] ELA 10 validator + tests
- [x] ELA 11 validator + tests
- [x] ELA 12 validator + tests
- [x] Math 8 validator + tests
- [x] WM10 validator + tests

### B0b — Docs Grade-Band Contracts `QUEUED — canon rule`
Publish the normalized docs-first contract set under `docs/grade-band-contracts/` as its own canon-rule PR.
This is documentation only and should not be mixed with content cleanup, renderer edits, fixture rewrites, or QA-gate implementation.

- [ ] `docs/grade-band-contracts/README.md`
- [ ] `docs/grade-band-contracts/careers-8.md`
- [ ] `docs/grade-band-contracts/english-10.md`
- [ ] `docs/grade-band-contracts/english-11.md`
- [ ] `docs/grade-band-contracts/english-12.md`
- [ ] `docs/grade-band-contracts/math-8.md`
- [ ] `docs/grade-band-contracts/workplace-math-10.md`

### B1 — Artifact-Role Cleanup `QUEUED`
After B0.

- [ ] Audit: renderer-injected vs authored text
- [ ] Remove teacher choreography from shared slides
- [ ] Remove teacher/admin phrasing from student sheets
- [ ] Confirm checkpoint language teacher-facing only
- [ ] Extend daily-split boilerplate suppression beyond Week 1 (#160) to all packages

### B2 — Grade 8 Career Mosaic Cleanup `QUEUED`
After B1. Use as calibration model.

- [ ] Cut: slogan lines, polished motivational contrasts, abstract senior-secondary phrasing
- [ ] Simplify: self-concept vocabulary, adult-written sentence frames
- [ ] Keep: concrete examples, real-life references, structured scaffolds
- [ ] Target: Weeks 1–4 mosaic fixtures

### B3 — English 10 / 11 / 12 Band Separation `QUEUED`
After B2.

- [ ] Side-by-side audit of same task family across 10/11/12
- [ ] English 10: cut Grade 8 softness + 12 precision; keep structure + practical scaffolds
- [ ] English 11: elevate audience awareness + evidence; cut over-scaffolded frames
- [ ] English 12: elevate synthesis + justification; cut generic reflection voice

### B4 — Math 8 / Workplace Math 10 Separation `QUEUED`
After B3.

- [ ] Math 8: cut trade/budget language; keep concrete structure + recording supports
- [ ] WM10: cut juvenile framing; keep applied/practical/multi-step logic

### B5 — Formatting Balance System `QUEUED`
Can run alongside B2. Week 1 Career 8 focused first.

- [ ] Baseline audit — ideal vs current, top 5 drift indicators
- [ ] Hard constraints — slide text floor 24pt, word budget ≤40, packet footer suppression
- [ ] Packet balance — reduce verbatim-repeated reminder language
- [ ] Slide balance — check Day 2/3 for under-explanation
- [ ] Encode engagement add-on taxonomy in `engine/generation/content-style-policy.json`
- [ ] Formatting balance QA checklist

### B6 — Drift QA Gate `QUEUED`
After B5.

- [ ] Grade-band check per package (vocabulary, abstraction, output demand)
- [ ] Artifact-role check (teacher leakage, student admin language)
- [ ] AI-tone check (slogans, symmetrical contrasts, framework language)
- [ ] Difficulty spread check (within-week swings)
- [ ] Pass/fail gate per package before merge

---

## TRACK C — Teacher Profile + Personalization

### C0 — Profile Layer Schema `COMPLETE`
All three schemas landed (#171). Profiles seeded for Mr. Friess, three courses
(careers_8, reading_intervention, workplace_readiness), and three class sections
(careers8_mosaic, reading_intervention, workplace_readiness_bpg with BPG project).
`generate-package.mjs` wired with `--course` and `--section` args (#174).
`profile-loader.mjs` with `mergeProfileContext`, `buildProfilePromptBlock`,
`findReferenceFixture`, and `loadGradeBandContract` (#174). 14 tests added.

- [x] `schemas/teacher-profile.schema.json`
- [x] `schemas/course-profile.schema.json`
- [x] `schemas/class-profile.schema.json`
- [x] `profiles/` directory + seed files (teacher.json, courses/, classes/)
- [x] Wire into `scripts/generate-package.mjs` (`--course`, `--section` args)
- [x] Replace hardcoded reference fixture with subject+grade-matched lookup

### C1 — Teaching Mode Surface `NEXT`
C0 complete. `teaching_mode` field is already in `class-profile.schema.json`
and wired through `mergeProfileContext` → `buildProfilePromptBlock`. Remaining
work is the mode→default output types mapping and generate-package awareness.

- [ ] `teaching_mode` field: standard, sub_friendly, hands_on, low_tech, quiet_writing, recovery_reteach, conferencing
- [ ] Mode → default output types mapping
- [ ] Wire into `generate:package`

### C2 — Generation Defaults for Pacing / Sub / Makeup `QUEUED`
After C1.

- [ ] `generate:package` always emits `pacing_guide` by default
- [ ] `attendance_pattern: spotty` in class profile → include `makeup_packet`
- [ ] `teaching_mode: sub_friendly` → include `sub_plan`

### C3 — Differentiated Variants as Default Path `QUEUED`
- [ ] `--tiered` flag on `generate:package`
- [ ] Brief template gains `differentiation_model` field
- [ ] At least two mainstream fixtures with `tiered: true`

### C4 — Multiple Reference Fixtures in Generation `QUEUED`
- [ ] Subject+grade-matched fixture selection in `generate:package`
- [ ] `--reference <fixture_key>` override

### C5 — Unit Memory + Evidence Map `QUEUED`
Design session required.

- [ ] `retro/` directory + `scripts/retro:package.mjs`
- [ ] Evidence map: cross-lesson artifact + gaps view

### C6 — Voice + Sameness QA `QUEUED`
After B6.

- [ ] `qa:voice` script
- [ ] Extend `content-style-policy.json` with sameness indicators

### C7 — Image + Diagram Asset Bank `QUEUED`
- [ ] Minimum 20 assets per subject in `engine/image/asset-registry.json`

---

## Maintenance Queue

- [x] PR #165 — `live-contract.mjs` path fix — merged with #166

---

## Done (recent)

- [#176] B0a grade-band validator extension — ELA 10/11/12, Math 8, WM10 (22 new tests)
- [#175] Phase 3 render proof fixtures for lesson_overview + checkpoint_sheet
- [#174] C0 profile integration — generate-package.mjs `--course`/`--section`, profile-loader.mjs
- [#173] Phase 1 output-contract fixes — KNOWN_UNIMPLEMENTED_TYPES guard, variant_role sync
- [#172] Phase 0 audit — output-contract-drift inventory + test
- [#171] C0 profile layer schema — three schemas + seed profiles for all three classes
- [#169] B0 grade-band contracts (all six) + restore three-track WORKLOAD.md
- [#167] Student-facing voice pass v2
- [#166] Phase A1 assessment schema — question bank, assessment, quiz output types, vocabulary, router wiring
- [#165] `live-contract.mjs` path fix
- [#164] Weeks 2–4 packet copy trim
- [#163] Smoke tests: English 11/12 + tiered worksheet fan-out
- [#162] Teacher-facing fixture voice rewrite
- [#161] Schema voice descriptions for teacher-facing fields
- [#160] Week 1 daily-sheet boilerplate suppression + copy trim
- [#159] Pacing guide redesign — agenda rows
- [#158] Weeks 1–4 richer response patterns
- [#157] Differentiated worksheet tiers (scaffolded/core/extension)

## Open / Unmerged (Codex branches)

- `render/careers8-presentation-station-challenge` — Careers 8 presentation + station challenge fixture (no PR yet)
