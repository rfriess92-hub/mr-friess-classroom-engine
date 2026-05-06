# Engine Master Task List

Living roadmap for the Mr. Friess Classroom Engine.

**Track A** — Engine infrastructure: schemas, output types, templates, rendering, fixtures, QA.  
**Track B** — Pedagogy + content quality: grade-band calibration, voice, artifact roles, classroom realism.  
**Track C** — Teacher profile + personalization: course/class context, teaching modes, generation defaults.  
**Track D** — Guarded automation / repo agent work.

Working rule: keep contract/rendering work separate from pedagogy/content cleanup unless a task explicitly joins them.

---

## Current Checkpoint — 2026-05-06

Recent stabilization work has landed:

- [x] Phase 0 output-contract inventory and drift guard (#172, refreshed by #180 and #189)
- [x] Phase 1 output-contract render guard for schema-only types (#173, refreshed by #180)
- [x] Variant-role schema/preflight compatibility for legacy `support` (#185)
- [x] Guarded nightly repo-agent scaffold (#182)
- [x] Nightly agent install path aligned with CI (#190)
- [x] First guarded Nightly Repo Agent dry run verified successfully using Issue #183
- [x] Clean classroom worksheet template system (#184)
- [x] `graphic_organizer` now has an HTML-backed classroom-template render path (#184)
- [x] Sample-output-review workflow for representative Mr Friess engine docs (#187)
- [x] Repo-generated Mr Friess document sample fixture and planter-volume decision template (#188)
- [x] PPTX classroom renderer reset through HTML/Playwright screenshot slides (#193)
- [x] Student-facing sample language hygiene pass (#194)
- [x] Random class visual sampling proof pack (#195)
- [x] Mr Friess course sample pack focused on actual course surfaces (#196)
- [x] Mr Friess visual shell formatting update (#197)
- [x] Literacy vocabulary tool templates (#198)
- [x] Long Way Down v5 focused render workflow and classroom toolkit focused renderer (#200)

Current open repo-maintenance PRs/issues:

- PR #199 is stale/superseded by #200. It targets the older Long Way Down base package in `stable-core`; do not merge as-is.

Current important distinction:

- **Output types** are the schema/router-level artifact types, such as `quiz`, `vocabulary_card`, and `assessment`.
- **Layout template IDs** are specialized HTML surfaces under existing output types, such as `frayer_model`, `vocabulary_cards`, `bc_rubric`, `student_self_assessment`, `kwhl_chart`, `fishbone_diagram`, `sentence_frame_card`, `choice_board`, and `scaffolded_quiz`.
- **Focused renderers/workflows** may prove a template module directly before it is wired into the central `render:package` path.

Next recommended cleanup checks:

1. Close or supersede stale PR #199.
2. Decide whether `classroom-toolkit-templates.mjs` should remain focused-render-only for now or be wired into central `render.mjs` via a small router patch.
3. Review the latest `sample-output-review`, `lwd-graphic-novel-rendered-docs`, and `classroom-toolkit-sample-docs` artifacts for visual/pedagogical alignment.
4. Normalize Long Way Down v5 source-of-truth: either keep the v5 builder workflow explicitly documented or commit the generated v5 fixture as a stable fixture.
5. Align Nightly Repo Agent Node version with stable/render workflows unless Node 22 is intentional.

Next recommended implementation target: **A1 assessment foundation implementation**, unless the artifact review shows visual/pedagogical drift that should be corrected through B5 first.

---

# TRACK A — Engine Infrastructure

## A0 — Output Contract Stabilization `COMPLETE`

- [x] Output contract inventory: `engine/contracts/output-type-inventory.json`
- [x] Drift audit script: `scripts/audit-output-contracts.mjs`
- [x] CI guard: `tests/node/output-contract-drift.test.mjs`
- [x] Human-readable audit report: `docs/CONTRACT_DRIFT_INVENTORY.md`
- [x] Schema-only unimplemented types fail loudly instead of silently skipping
- [x] `support` / `supported` preflight compatibility restored

Remaining caution:

- `support` is accepted for compatibility. Long-term canonical role should remain `supported` unless a future schema cleanup deliberately preserves both.
- Contract docs must distinguish output-type implementation from layout-template implementation.

## A0b — Classroom Worksheet Template System `COMPLETE`

Merged in #184, extended by #188, #197, #198, and #200.

Production / central-rendered layout systems:

- [x] Canonical module: `engine/pdf-html/templates/classroom-worksheet-system.mjs`
- [x] `graphic_organizer` moved onto the HTML renderer surface
- [x] Dedicated `planter_volume_decision` layout wired through `engine/pdf-html/render.mjs`
- [x] Dedicated literacy vocabulary layouts through `literacy-vocabulary-tools.mjs`
- [x] Dedicated assessment visual layouts through `assessment-visual-tools.mjs`
- [x] Proof fixtures and sample-output-review coverage

Focused-render-only toolkit proof from #200:

- [x] `engine/pdf-html/templates/classroom-toolkit-templates.mjs`
- [x] `scripts/render-classroom-toolkit-sample.mjs`
- [x] `.github/workflows/classroom-toolkit-render.yml`
- [x] Sample PDFs for KWHL, fishbone, sentence frame card, choice board, and scaffolded quiz

Follow-up decision:

- [ ] Wire classroom toolkit layout IDs into central `render.mjs`, or deliberately keep them focused-render-only until A1/B5 stabilize.

## A1 — Assessment Foundation `NEXT`

Schema foundation merged in #166. Implementation is still missing at output-type level.

Already complete:

- [x] `schemas/question-bank.schema.json`
- [x] `assessmentSection`, `quizSection`, `assessmentQuestion` `$defs`
- [x] `assessment`, `quiz` in output type enum, router, and audience sets
- [x] `proficiency_levels`, `bloom_levels`, `question_difficulty`, `question_types` vocabulary
- [x] Schema-only output types are blocked at render until implementation lands

Do not confuse with existing layout-template support:

- `scaffolded_quiz` currently exists as a focused classroom toolkit layout, not as the schema-level `quiz` output type.
- `bc_rubric` and `student_self_assessment` exist as `layout_template_id` render paths under existing output types, not as the schema-level `rubric` / `formative_check` types.

Next implementation slice:

- [ ] Add `questions/` seed banks per subject
- [ ] Add `engine/pdf-html/templates/assessment.mjs`
- [ ] Add `engine/pdf-html/templates/quiz.mjs`
- [ ] Wire assessment + quiz into HTML render path
- [ ] Add typed-block/classifier/template-router support as needed
- [ ] Add `scripts/pull-questions.mjs`
- [ ] Add proof fixture + render smoke test
- [ ] Add answer-key handling without leaking answers into student artifacts

Acceptance for A1:

```bash
pnpm test
node scripts/audit-output-contracts.mjs
pnpm run schema:check -- --package fixtures/tests/<assessment-proof>.json
pnpm run render:package -- --package fixtures/tests/<assessment-proof>.json --out output --flat-out
pnpm run qa:bundle -- --package fixtures/tests/<assessment-proof>.json --out output
```

## A2 — Rubric + Feedback Loop `QUEUED`

Start after A1 implementation lands.

- [ ] `rubricSection` + `rubricCriterion` schema if not already sufficient
- [ ] `formativeCheckSection` schema
- [ ] `rubric` and `formative_check` render templates
- [ ] Proof fixtures + smoke tests
- [ ] QA checks for BC proficiency language and teacher/student separation

Note: `rubric_sheet` is already production-ready. `bc_rubric` and `student_self_assessment` are layout-template paths. A2 is about separate schema-level `rubric` and `formative_check` output types.

## A3 — Daily Classroom Artifacts `QUEUED`

Start after A2.

- [ ] `warm_up` template + proof fixture
- [ ] `vocabulary_card` output-type template + proof fixture
- [ ] `observation_grid` template + proof fixture
- [ ] `lesson_reflection` template + proof fixture
- [ ] QA for teacher-only daily artifacts

Note: vocabulary card layouts already exist under literacy vocabulary tools. A3 is about the separate output type.

## A4 — Planning View `QUEUED`

Design session required before implementation.

- [ ] `unit_overview` output type
- [ ] Materials checklist generated from package structure
- [ ] Student conference note template
- [ ] Human-readable `review.md` summary after render

## A5 — Render Hardening `QUEUED`

Later hardening after A1/A2/A3.

- [ ] Checkpoint sheet HTML template; currently proof-backed through Python
- [ ] Lesson overview HTML template; currently proof-backed through Python
- [ ] Teacher guide HTML consolidation
- [ ] PPTX pipeline cleanup away from archive delegation
- [ ] More proof fixtures for `workshop_session`, `lab_investigation`, `seminar`, and `station_rotation`

---

# TRACK B — Pedagogy + Content Quality

## B0 — Grade-Band Contracts `COMPLETE`

- [x] Careers 8 contract
- [x] English 10 contract
- [x] English 11 contract
- [x] English 12 contract
- [x] Math 8 contract
- [x] Workplace Math 10 contract

## B0a — Grade-Band Validator Extension `COMPLETE`

Merged in #176.

- [x] ELA 10 validator + tests
- [x] ELA 11 validator + tests
- [x] ELA 12 validator + tests
- [x] Math 8 validator + tests
- [x] Workplace Math 10 validator + tests
- [x] Unified band registry for generation prompt and QA dispatch

## B0b — Docs Grade-Band Contracts `QUEUED — DOCS ONLY`

Publish the normalized docs-first contract set under `docs/grade-band-contracts/`.

Do not mix this with renderer edits, schema changes, fixture rewrites, or content cleanup.

- [ ] `docs/grade-band-contracts/README.md`
- [ ] `docs/grade-band-contracts/careers-8.md`
- [ ] `docs/grade-band-contracts/english-10.md`
- [ ] `docs/grade-band-contracts/english-11.md`
- [ ] `docs/grade-band-contracts/english-12.md`
- [ ] `docs/grade-band-contracts/math-8.md`
- [ ] `docs/grade-band-contracts/workplace-math-10.md`

## B1 — Artifact-Role Cleanup `PARTIAL`

Some role enforcement landed in #179. Continued visual/content review through #194-#200 found fewer blanks and stronger student-facing surfaces, but role leakage still needs audit coverage.

Complete:

- [x] `student_checkpoint` renamed to `teacher_checkpoint`
- [x] Audience mismatch tests for teacher-only output types

Remaining:

- [ ] Audit renderer-injected text vs authored text
- [ ] Remove teacher choreography from shared slides where it appears
- [ ] Remove teacher/admin phrasing from student sheets where it appears
- [ ] Confirm checkpoint language remains teacher-facing only
- [ ] Extend daily-split boilerplate suppression beyond Week 1 where needed

## B2 — Grade 8 Career Mosaic Cleanup `QUEUED`

Use Careers 8 as the calibration model.

- [ ] Cut slogan lines and polished motivational contrasts
- [ ] Reduce abstract senior-secondary phrasing
- [ ] Simplify self-concept vocabulary and adult-written frames
- [ ] Keep concrete examples, real-life references, and structured scaffolds
- [ ] Target Weeks 1–4 mosaic fixtures

## B3 — English 10 / 11 / 12 Band Separation `QUEUED`

- [ ] Side-by-side audit of same task family across grades 10/11/12
- [ ] English 10: practical scaffolds without Grade 8 softness
- [ ] English 11: stronger audience awareness and evidence use
- [ ] English 12: stronger synthesis, precision, and justification

## B4 — Math 8 / Workplace Math 10 Separation `QUEUED`

- [ ] Math 8: cut trade/budget language unless contextually appropriate
- [ ] Workplace Math 10: cut juvenile framing; preserve practical multi-step reasoning

## B5 — Formatting Balance System `QUEUED`

Can run before A1 if artifact review shows visual drift.

- [ ] Baseline audit: ideal vs current formatting drift
- [ ] Slide text floor and word-budget guardrails
- [ ] Packet balance rules to reduce repeated reminder language
- [ ] Slide balance checks for under-explanation
- [ ] Engagement add-on taxonomy in `engine/generation/content-style-policy.json`
- [ ] Formatting balance QA checklist

## B6 — Drift QA Gate `QUEUED`

- [ ] Grade-band check per package
- [ ] Artifact-role leakage check
- [ ] AI-tone check
- [ ] Difficulty spread check
- [ ] Merge-blocking package QA decision

---

# TRACK C — Teacher Profile + Personalization

## C0 — Profile Layer Schema `COMPLETE`

Merged in #171.

- [x] `schemas/teacher-profile.schema.json`
- [x] `schemas/course-profile.schema.json`
- [x] `schemas/class-profile.schema.json`
- [x] Seed profiles for teacher, courses, and classes

## C1 — Profile Integration + Teaching Mode Surface `COMPLETE`

Merged across #174 and #177.

- [x] `scripts/generate-package.mjs` supports `--course` and `--section`
- [x] `engine/generation/profile-loader.mjs`
- [x] Profile merge order: teacher → course → class → overrides
- [x] Profile prompt block injection
- [x] Subject+grade reference fixture selection
- [x] Grade-band contract loading from profile context
- [x] Teaching-mode defaults module
- [x] Teaching-mode prompt notes
- [x] `include_sub_plan` surfaced in prompt context

## C2 — Generation Defaults for Pacing / Sub / Makeup `COMPLETE`

Merged in #178.

- [x] `pacing_guide` included in all teaching-mode default output sets
- [x] `attendance_pattern: spotty` or `very_spotty` auto-sets `include_makeup_packet: true`
- [x] `generation_overrides` can suppress the makeup-packet auto-flag
- [x] BPG class confirmed through tests
- [x] Reading intervention suppression confirmed through tests

## C3 — Differentiated Variants as Default Path `QUEUED`

- [ ] `--tiered` flag on `generate:package`
- [ ] Brief template gains `differentiation_model` field
- [ ] At least two mainstream fixtures with `tiered: true`

## C4 — Multiple Reference Fixtures in Generation `QUEUED`

Partly addressed by C1 reference lookup; still needs explicit override and a richer fixture catalog.

- [ ] Add `--reference <fixture_key>` override
- [ ] Expand subject+grade reference fixture set
- [ ] Add tests for fallback order

## C5 — Unit Memory + Evidence Map `QUEUED`

Design session required.

- [ ] `retro/` directory
- [ ] `scripts/retro:package.mjs`
- [ ] Cross-lesson evidence tracking
- [ ] Gap report

## C6 — Voice + Sameness QA `QUEUED`

After B6.

- [ ] `qa:voice` script
- [ ] Extend `content-style-policy.json` with sameness indicators

## C7 — Image + Diagram Asset Bank `QUEUED`

- [ ] `engine/image/asset-registry.json`
- [ ] Minimum asset set per subject
- [ ] Diagram/graphic-organizer image strategy separate from worksheet HTML templates

---

# Automation / Agent Track

## D0 — Guarded Nightly Repo Agent `COMPLETE — VERIFIED REPORTING ONLY`

Merged in #182; install path fixed in #190; first dry run verified through Issue #183.

- [x] `.github/AGENT_POLICY.md`
- [x] `docs/AGENT_RUNBOOK.md`
- [x] `.github/ISSUE_TEMPLATE/agent_task.yml`
- [x] `.github/workflows/nightly-agent.yml`
- [x] `scripts/agent/select-task.mjs`
- [x] `scripts/agent/write-run-report.mjs`
- [x] First manual dry run with `dry_run=true` verified and Issue #183 closed

Current capability:

- Selects an issue labelled `agent:nightly`
- Rejects blocked or vague tasks
- Runs audits/tests
- Uploads a report artifact
- Does not modify code
- Does not open PRs
- Does not merge

Follow-up cleanup:

- [ ] Align Node version with stable/render workflows, or document why nightly intentionally uses Node 22.

## D1 — Agent Comment/Report Upgrade `QUEUED`

Only after repeated clean D0 runs.

- [ ] Allow the workflow to comment a report link back onto the selected issue
- [ ] Keep permissions narrow
- [ ] Still no code edits or PR creation

## D2 — Draft PR Mode for Docs/Audit Tasks `QUEUED`

Only after repeated clean D0/D1 runs.

- [ ] Draft PR creation for docs/audit-only tasks
- [ ] Allowed paths only
- [ ] No schema/render edits
- [ ] No merge rights

---

# Done Log

- [#200] Long Way Down v5 focused render workflow and classroom toolkit focused renderer
- [#198] Literacy vocabulary tool templates
- [#197] Mr Friess visual shell formatting update
- [#196] Mr Friess course sample packs
- [#195] Random class visual sampling pack
- [#194] Student-facing sample language hygiene
- [#193] PPTX classroom renderer reset
- [#190] Nightly agent install path aligned with CI
- [#189] Output-type inventory and contract drift report refresh
- [#188] Format: render Mr Friess engine document samples
- [#187] Sample-output-review workflow
- [#186] WORKLOAD roadmap refresh
- [#185] Variant-role schema/preflight compatibility
- [#184] Clean classroom worksheet template system
- [#182] Guarded nightly repo-agent scaffold
- [#180] Refreshed executable output-contract audit guard
- [#179] B1 artifact-role enforcement: teacher checkpoint rename + audience mismatch test
- [#178] C2 generation defaults: pacing guide universal, attendance auto-makeup packet
- [#177] C1 teaching mode surface: mode defaults, prompt notes, sub-plan wiring
- [#176] B0a grade-band validator extension
- [#175] Phase 3 render proof fixtures for lesson_overview + checkpoint_sheet
- [#174] C1 profile integration into `generate-package`
- [#173] Phase 1 output-contract fixes
- [#172] Phase 0 contract drift inventory
- [#171] C0 profile layer schema + seed profiles
- [#170] Pedagogy-faithful rendered artifacts: rubric_sheet, station_cards, answer_key
- [#169] B0 grade-band contracts docs in engine contracts folder
- [#167] Student-facing voice pass v2
- [#166] A1 assessment schema foundation
- [#165] `live-contract.mjs` path fix

---

# Superseded / Do Not Revive

- PR #199 / `lwd-unit-render-proof` — superseded by #200 unless deliberately re-scoped to the v5 source-of-truth decision.
- PR #181 / `feat/worksheet-template-system` — superseded by #184.
- PR #168 / `render/careers8-presentation-station-challenge` — closed draft with no commits; treat as abandoned unless deliberately re-scoped.
