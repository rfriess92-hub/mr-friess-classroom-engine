# Decisions Log

Running record of architectural and structural decisions for solo operation.

---

## 2026-04-10 — Content files: authoritative location is engine/content/

**Decision:** `engine/content/` is the single authoritative location for lesson content JSON files. Root-level copies are not allowed.

**Reason:** `careers8_goal_setting.json` and `science9_interconnected_spheres.json` existed at both root and `engine/content/` with material differences. The richer root versions were promoted into `engine/content/`, and the root copies were removed.

**Enforced by:** `scripts/doctor.mjs` fails on root-level lesson JSON duplicates.

---

## 2026-04-10 — PPTX renderer: authoritative entrypoint is engine/pptx/renderer.py

**Decision:** `engine/pptx/renderer.py` is the single authoritative public entrypoint for PPTX rendering.

**Implementation note:** Historical renderer modules were moved under `engine/pptx/archive/`. During transition, `renderer.py` delegates to the archived chain so the repo has one stable active path while the historical files stay preserved.

**Enforced by:** `scripts/doctor.mjs` fails if archived renderer filenames reappear at active top-level PPTX paths.

---

## 2026-04-10 — Governance: decisions log replaces PR-class ceremony

**Decision:** Solo repo operation now uses this decisions log plus lightweight branches/PRs. The old PR-class governance overhead is not the live control surface.

---
