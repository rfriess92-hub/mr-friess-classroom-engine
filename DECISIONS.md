# Decisions Log

Running record of architectural and structural decisions for repo operation.

---

## 2026-04-12 — Stable-core render contract and assignment-family authority are separate on purpose

**Decision:** The stable-core package remains the live render contract.

**Decision:** The assignment-family layer is the authoritative upstream pedagogy/authoring contract.

**Decision:** `engine/assignment-family/` is the intended long-term source of truth for family definitions, routing rules, chain recommendations, required upstream assignment metadata, and family integrity expectations.

**Decision:** `engine/family/` is now treated as transitional compatibility code. It may continue to serve the live render-plan path during cutover, but it is no longer the architectural end-state.

**Decision:** Until cutover is complete, docs must distinguish clearly between:

- what is live today
- what is compatibility-only
- what is the intended authoritative path after cleanup

**Reason:** The repo currently contains two overlapping family systems. The live stable-core acceptance path still reads `assignment_family` through `engine/family/*`, while `engine/assignment-family/*` already contains the newer config-driven authoring/validation surface. Keeping both without an explicit architecture decision invites rule drift and operator confusion.

**Implementation note:** The safe migration order is:

1. document the contract split
2. add an authoritative package-facing selector under `engine/assignment-family/`
3. switch `engine/schema/render-plan.mjs` to that authoritative path
4. demote `engine/family/*` to explicit compatibility shims
5. only then remove dead duplicate logic

**Validation note:** `schema:check` remains the live stable-core gate today. Assignment-family validation should enter the real acceptance path only after generation and package metadata are aligned enough to support it cleanly.

---

## 2026-04-11 — Workflow docs aligned to the live solo operating model

**Decision:** `README.md`, `DECISIONS.md`, and `docs/stable-core-workflow-policy.md` should describe the same live workflow: lightweight solo operation, local command gates, and the stable-core package path as the acceptance route.

**Decision:** `content` / `renderer` / `qa` / `tooling` remain useful intent labels for branches and PRs, but they are not a hard ceremony system.

**Decision:** Until CI exists, local command execution is the real gate. Use `doctor` when repo structure or entrypoints change, then use `schema:check` → `route:plan` → `render:package` → `qa:bundle` as the stable-core acceptance path.

**Decision:** Legacy direct builders remain compatibility/debugging surfaces, not stable-core acceptance proof.

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
