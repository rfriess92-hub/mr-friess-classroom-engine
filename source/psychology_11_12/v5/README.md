# Psychology 11/12 v5 — GitHub support layer

This directory supports the current six-unit Psychology 11/12 v5 course with non-secure source metadata, provenance rules, validation, and link checking.

## Authority boundary

- Classroom operating authority: `Psych11_12_v5.0.1_OPERATING_Semester_Plan.xlsx`.
- Current unit architecture: U1–U6 as recorded in `manifest.yaml`.
- GitHub is **not** the canonical classroom package and does not store secure assessments, answer keys, controlled reveals, student data, private school links, or copyrighted source binaries.
- Legacy Cycle A–F and earlier Psychology repository structures are historical/reference material only. They do not override the v5 manifest or operating semester plan.

## Current support files

- `manifest.yaml` — six-unit v5 architecture and release boundaries.
- `source-schema.md` — source-record field contract.
- `zotero-tagging.md` — source-library organization and tagging rules.
- `tool-decision-rules.md` — bounded tool-use decisions.
- `resources/urls.txt` — non-secure live URLs checked by the link workflow.
- `units/` — unit-specific source maps where current-evidence mapping required an explicit repository artifact.

The unified non-secure source register remains at `source/psychology_11_12/course/source_register.md`.

## Validation

`node scripts/validate-psychology-v5-source-register.mjs`

The validator checks the v5 operating authority, six-unit architecture, all six unit release states, source-ID uniqueness, security boundaries, required source infrastructure, and the non-secure URL list. The Psychology Render QA workflow includes this validator through its targeted Node test.

Do not treat the presence of historical Psychology files elsewhere in the repository as a current-course instruction. Current work begins from this directory and the v5 source register; older structures are provenance/reference only.
