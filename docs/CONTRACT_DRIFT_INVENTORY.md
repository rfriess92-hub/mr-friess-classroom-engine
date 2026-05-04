# Contract Drift Inventory

**Audited:** 2026-05-04  
**Scope:** Output-type support across schema, canonical vocabulary, router, renderer, classifier, template, QA, and fixtures.  
**Machine-readable source:** `engine/contracts/output-type-inventory.json`  
**Audit script:** `node scripts/audit-output-contracts.mjs`

---

## Status Summary

| Status | Count | Output Types |
|--------|-------|-------------|
| `production` | 13 | task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, answer_key, pacing_guide, sub_plan, makeup_packet, slides, graphic_organizer |
| `partial` | 3 | teacher_guide, lesson_overview, checkpoint_sheet |
| `schema_only` | 8 | assessment, quiz, rubric, formative_check, warm_up, vocabulary_card, observation_grid, lesson_reflection |
| `experimental` | 0 | — |
| `drifted` | 0 | — |
| `unsupported` | 0 | — |

Total output types: **24**

---

## Render Path Coverage

```
task_sheet             [HTML] [Python]
final_response_sheet   [HTML] [Python]
exit_ticket            [HTML] [Python]
worksheet              [HTML] [Python]
discussion_prep_sheet  [HTML] [Python]
rubric_sheet           [HTML]
station_cards          [HTML]
answer_key             [HTML]
pacing_guide           [HTML]
sub_plan               [HTML]
makeup_packet          [HTML]
graphic_organizer      [HTML] [Python]
slides                          [PPTX]
teacher_guide                  [Python]
lesson_overview                [Python]
checkpoint_sheet               [Python]
assessment             ← BLOCKED_UNIMPLEMENTED
quiz                   ← BLOCKED_UNIMPLEMENTED
rubric                 ← BLOCKED_UNIMPLEMENTED
formative_check        ← BLOCKED_UNIMPLEMENTED
warm_up                ← BLOCKED_UNIMPLEMENTED
vocabulary_card        ← BLOCKED_UNIMPLEMENTED
observation_grid       ← BLOCKED_UNIMPLEMENTED
lesson_reflection      ← BLOCKED_UNIMPLEMENTED
```

`planter_volume_decision` is a dedicated `layout_template_id` path inside the HTML renderer, not a standalone output type.

---

## Current Findings

### 1. Eight schema-only types are blocked until implemented (MEDIUM)

`assessment`, `quiz`, `rubric`, `formative_check`, `warm_up`, `vocabulary_card`, `observation_grid`, and `lesson_reflection` exist in canonical vocabulary, the lesson schema enum, the output router, and the canonical audience/architecture maps. They still have no render implementation.

**Current behavior:** `render-package.mjs` lists these output types in `KNOWN_UNIMPLEMENTED_TYPES`. If a package declares one, rendering exits with a clear error instead of logging a skip and producing an incomplete artifact bundle.

**Next fix:** Implement `assessment` and `quiz` first in A1. Remove each type from `KNOWN_UNIMPLEMENTED_TYPES` only when its renderer, proof fixture, and smoke test are in place.

---

### 2. `teacher_guide` remains Python-only (LOW)

`teacher_guide` renders through the Python PDF path. It is valid and proof-covered, but it is not yet consolidated onto the HTML/Playwright renderer surface.

**Next fix:** Add a teacher-guide HTML template in A5 after A1/A2 are stable.

---

### 3. `lesson_overview` and `checkpoint_sheet` remain partial (MEDIUM)

`lesson_overview` and `checkpoint_sheet` are in `DOC_OUTPUT_TYPES` and remain proof-backed through the Python path. They still have no dedicated HTML template.

**Next fix:** Keep current proof coverage, then add HTML templates during A5 if render consolidation remains the goal.

---

### 4. Render path split is documented by the inventory (LOW)

The decision between HTML/Playwright, Python/ReportLab, and PPTX rendering is still controlled by `render-package.mjs` and `supportsHtmlRender()`. The machine-readable inventory is the current human-readable map for that split.

**Next fix:** Update `engine/contracts/output-type-inventory.json` whenever output types or layout-template render paths change.

---

## Resolved Since Initial Audit

- Schema-only output types no longer silently skip render; they fail loudly through `KNOWN_UNIMPLEMENTED_TYPES`.
- `variant_role` schema/preflight compatibility is aligned for `scaffolded`, `core`, `shared_core`, `supported`, `support`, and `extension`.
- `graphic_organizer` is now HTML-backed through the classroom worksheet template system.
- The sample-output-review workflow renders representative Mr Friess engine docs.
- `planter_volume_decision` is wired as a dedicated classroom worksheet layout path.

---

## What Is Production-Ready

The following 13 output types are coherent across render path, routing, typed blocks, classifier/template support, QA, and fixture proof:

- **Student-facing:** task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, makeup_packet, graphic_organizer
- **Teacher-facing:** answer_key, pacing_guide, sub_plan
- **Shared:** slides

---

## What Is Partial

| Type | Missing |
|------|---------|
| `teacher_guide` | No HTML template — Python path only. Works but not on the HTML consolidation path. |
| `lesson_overview` | No HTML template. Python path is proof-backed. |
| `checkpoint_sheet` | No HTML template. Python path is proof-backed. |

---

## Recommended Next Actions

1. **A1 assessment foundation** — add question banks, assessment/quiz HTML templates, render wiring, proof fixture, smoke test, and answer-key separation.
2. **Verify nightly repo agent dry run** — use Issue #183 and inspect the report artifact.
3. **Review sample-output-review artifact** — confirm the rendered Mr Friess sample docs match the new classroom worksheet formatting expectations.
4. **A5 later** — consolidate `teacher_guide`, `lesson_overview`, and `checkpoint_sheet` onto HTML only after A1/A2 stabilize.

---

## Files

| File | Purpose |
|------|---------|
| `engine/contracts/output-type-inventory.json` | Machine-readable per-type status record |
| `scripts/audit-output-contracts.mjs` | Runnable audit script — prints render coverage and drift findings |
| `tests/node/output-contract-drift.test.mjs` | CI guard — fails if types are unclassified or production types lose render paths |
| `docs/CONTRACT_DRIFT_INVENTORY.md` | This document |
