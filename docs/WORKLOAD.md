# Engine Workload

Living doc — update as items move.

---

## Active Phase

### Phase 1 — Assessment Foundation
*Build the infrastructure everything else depends on.*

- [x] Question bank schema (`schemas/question-bank.schema.json`)
- [x] Tag vocabulary added to `canonical-vocabulary.json` (bloom_level, difficulty, question_type)
- [x] `assessment` + `quiz` output types added to schema + vocabulary
- [ ] `assessmentSection` + `quizSection` $defs in lesson-package.schema.json (Codex)
- [ ] `questions/` directory + seed banks per subject (Codex)
- [ ] `assessment` + `quiz` HTML templates (Codex)
- [ ] `pull:questions` script (Codex)
- [ ] `generate:package` question bank hook (Codex)
- [ ] Proof fixture + CI smoke test (Codex)

---

## Queued Phases

### Phase 2 — Rubric + Feedback Loop
- `rubric` output type (auto-built from `success_criteria` + `final_evidence_target`, BC proficiency scale)
- `feedback_strip` output type (attach to returned work)
- `formative_check` output type (faster than exit ticket — 3-2-1, traffic light, muddiest point)
- Proof fixtures for all three

### Phase 3 — Daily Classroom Artifacts
- `warm_up` output type (half-page bell ringer, feeds into pacing guide)
- `vocabulary_card` output type (promote from makeup_packet.vocabulary)
- `observation_grid` output type (teacher-only, pulled from success_criteria + checkpoints)
- `lesson_reflection` output type (teacher-only, post-lesson structured note)
- Proof fixtures for all four

### Phase 4 — Planning View
- Finish `weekly:overview` → promote to `unit_overview` output type
- Unit grid: weeks × days, key artifacts per cell, learning progression visible
- Materials checklist auto-generated from package output types
- Student conference note template

### Phase 5 — Render Hardening
- Checkpoint sheet HTML template (currently Python-only)
- PPTX pipeline out of archive delegation
- Proof fixtures for `workshop_session`, `lab_investigation`, `seminar`, `station_rotation` architectures

---

## Bug / Maintenance Queue

- [ ] `assignment-family/live-contract.mjs` path fix — PR #165 open, pending merge

---

## Done (recent)

- [#164] Weeks 2–4 packet copy trim to match Week 1 style
- [#163] Smoke tests for English 11/12 fixtures and tiered worksheet fan-out
- [#161] Schema voice descriptions for teacher-facing fields
- [#160] Week 1 daily-sheet boilerplate suppression + copy trim
- [#159] Pacing guide redesign — agenda rows
- [#158] Weeks 1–4 richer response patterns
- [#157] Differentiated worksheet tiers (scaffolded/core/extension)
