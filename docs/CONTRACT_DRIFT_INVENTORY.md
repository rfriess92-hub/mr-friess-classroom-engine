# Contract Drift Inventory

**Audited:** 2026-04-24  
**Scope:** Output-type support across schema, canonical vocabulary, router, renderer, classifier, template, QA, and fixtures.  
**Machine-readable source:** `engine/contracts/output-type-inventory.json`  
**Audit script:** `node scripts/audit-output-contracts.mjs`

---

## Status Summary

| Status | Count | Output Types |
|--------|-------|-------------|
| `production` | 12 | task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, answer_key, pacing_guide, sub_plan, makeup_packet, slides |
| `partial` | 4 | teacher_guide, lesson_overview, checkpoint_sheet, graphic_organizer |
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
slides                          [PPTX]
teacher_guide                  [Python]
lesson_overview                [Python]
checkpoint_sheet               [Python]
graphic_organizer              [Python]
assessment             ← SILENT SKIP
quiz                   ← SILENT SKIP
rubric                 ← SILENT SKIP
formative_check        ← SILENT SKIP
warm_up                ← SILENT SKIP
vocabulary_card        ← SILENT SKIP
observation_grid       ← SILENT SKIP
lesson_reflection      ← SILENT SKIP
```

---

## Top Drift Findings

### 1. Eight schema-only types silently skip rendering (HIGH)

`assessment`, `quiz`, `rubric`, `formative_check`, `warm_up`, `vocabulary_card`, `observation_grid`, and `lesson_reflection` exist in canonical vocabulary, the lesson schema enum, the output router, and the canonical audience/architecture maps — but have no HTML template and are not in `DOC_OUTPUT_TYPES`.

**What happens:** `render-package.mjs` hits the `supportsHtmlRender()` check (false), then the `DOC_OUTPUT_TYPES` check (not present), then logs `Skipping unsupported doc-mode route` and continues. The package appears to render successfully. No artifact is produced. QA does not catch the miss because these types have no expected-artifact definition.

**Risk:** A package declaring `assessment` in its outputs passes `schema:check`, routes cleanly, but produces nothing. The teacher gets an incomplete bundle with no error.

**Recommended fix (Phase 1):** Add a `KNOWN_UNIMPLEMENTED_TYPES` set in `render-package.mjs` that exits with a clear error message rather than silently continuing, until each type has a real template.

---

### 2. `variant_role` schema enum and preflight validator disagree (HIGH)

`schemas/lesson-package.schema.json` declares:
```json
"variant_role": { "enum": ["scaffolded", "core", "shared_core", "supported", "support", "extension"] }
```

`engine/schema/preflight.mjs` `VARIANT_ROLES` set contains:
```javascript
['shared_core', 'core', 'supported', 'extension']
```

**What happens:** A package using `variant_role: "scaffolded"` or `variant_role: "support"` passes `schema:check` but is rejected by `preflight` with `unsupported_variant_role`. The two validation layers disagree.

**Recommended fix (Phase 1):** Choose one canonical set. The tiered worksheet fan-out uses `scaffolded`/`core`/`extension` — if those are valid roles they must be added to the preflight set. If they are not, remove them from the schema enum.

---

### 3. Partial types (`lesson_overview`, `checkpoint_sheet`) have no dedicated Python renderer (MEDIUM)

`lesson_overview` and `checkpoint_sheet` are in `DOC_OUTPUT_TYPES` in `render-package.mjs` (so they attempt Python rendering), but `engine/pdf/render_stable_core_output.py` has no dedicated `render_lesson_overview` or `render_checkpoint_sheet` function. They fall through to a base renderer that may or may not produce a usable artifact.

**Risk:** These types appear to work because the process doesn't fail, but the output quality or completeness is unverified.

**Recommended fix:** Verify what the base Python renderer produces for these types. Add proof fixtures or promote to HTML templates.

---

### 4. Render path split is implicit (LOW)

The decision between HTML/Playwright and Python/ReportLab rendering is embedded in `render-package.mjs` logic (`supportsHtmlRender()` first, then `DOC_OUTPUT_TYPES`). There is no single source of truth that documents which path each output type takes. This makes it easy to add a type to one layer and miss the other.

**Recommended fix:** The inventory in `engine/contracts/output-type-inventory.json` now serves as this source of truth. Reference it when adding new output types.

---

### 5. Grade-band validators exist for Careers 8 only (LOW — tracked in WORKLOAD.md as B0a)

`engine/generation/grade-band-contracts.mjs` implements contract validation for Careers 8. Contracts for ELA 10/11/12, Math 8, and Workplace Math 10 exist as markdown files in `engine/generation/contracts/` but have no validator implementation. They are present but unenforced.

---

## What Is Production-Ready

The following 12 output types are coherent across all layers: schema, vocabulary, audience/architecture canonicals, router, HTML template (or PPTX path), typed blocks, artifact classifier, template router, QA, and fixture proof:

- **Student-facing:** task_sheet, final_response_sheet, exit_ticket, worksheet, discussion_prep_sheet, rubric_sheet, station_cards, makeup_packet
- **Teacher-facing:** answer_key, pacing_guide, sub_plan
- **Shared:** slides

---

## What Is Partial

| Type | Missing |
|------|---------|
| `teacher_guide` | No HTML template — Python path only. Works but not on the HTML consolidation path. |
| `lesson_overview` | No HTML template, no dedicated Python renderer. Python fallback unverified. |
| `checkpoint_sheet` | No HTML template, no dedicated Python renderer. Python fallback unverified. |
| `graphic_organizer` | No HTML template — dedicated Python renderer exists. Works but not consolidated. |

---

## Recommended Phase 1 Actions

In priority order:

1. **Fix variant_role drift** — decide canonical set, align schema enum and preflight VARIANT_ROLES in one PR. This is a correctness bug, not just drift.

2. **Block schema-only types at render time** — add `KNOWN_UNIMPLEMENTED_TYPES` check in `render-package.mjs` that exits loudly. Prevents silent package corruption. Small, safe change.

3. **Verify lesson_overview and checkpoint_sheet Python rendering** — add proof fixtures or a smoke test that confirms actual artifacts are produced.

4. **Track schema-only types in CI** — the `output-contract-drift.test.mjs` test now guards against unclassified types entering the inventory silently.

---

## Files Created

| File | Purpose |
|------|---------|
| `engine/contracts/output-type-inventory.json` | Machine-readable per-type status record |
| `scripts/audit-output-contracts.mjs` | Runnable audit script — prints render coverage and drift findings |
| `tests/node/output-contract-drift.test.mjs` | CI guard — fails if types are unclassified or production types lose render paths |
| `docs/CONTRACT_DRIFT_INVENTORY.md` | This document |
