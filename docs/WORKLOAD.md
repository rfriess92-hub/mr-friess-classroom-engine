# Engine Workload

Living doc — update as items move. Most recent first within each section.

---

## In Progress

_(none)_

---

## Queued

### 1. Weeks 2–4 packet copy trim (content — Codex)
Weeks 2, 3, and 4 careers mosaic fixtures still have pre–Week 1 cleanup copy:
- 3 instructions each (Week 1 trimmed to 2)
- 4 embedded supports each (Week 1 trimmed to 2, softened)
- 4 success criteria each (Week 1 emptied — packet is planning-only)
- Purpose lines are verbose ("Use this packet across the week to…")

**Task:** Send to Codex with `docs/CODEX_HANDOFF_CONTENT_VOICE.md` + the Week 1 fixture as the reference model.  
**Files:** `fixtures/generated/careers-8-mosaic-week-{2,3,4}-*.json`

---

### 2. Worksheet tier smoke test (engine)
Tiered worksheets (scaffolded/core/extension) are implemented and merged (#157) but there's no CI smoke test for the fan-out render path. No test confirms 3 artifacts are produced with correct `artifact_id` naming.

**Task:** Add a proof fixture with `"tiered": true` on a worksheet output and a smoke test asserting 3 routes with `_scaffolded`, `_core`, `_extension` artifact IDs.

---

### 3. PBG English 11 and 12 smoke tests (engine)
`pbg_english11.json` and `pbg_english12.json` are live class fixtures with no validate+route smoke coverage (English 12 appears in one classifier test only).

**Task:** Add smoke tests mirroring `pbg-english10-smoke.test.mjs` for English 11 and 12.

---

### 4. `assignment-family/live-contract.mjs` schema load path (engine)
Uses `repoPath()` (which wraps `process.cwd()`) to resolve the schema at module load time. Low risk today since everything runs from root, but won't survive import from a non-root context.

**Task:** Switch to `fileURLToPath(import.meta.url)`-relative path, matching `engine/schema/canonical.mjs`.  
**File:** `engine/assignment-family/live-contract.mjs:4`

---

## Done (recent)

- [#161] Schema voice descriptions for teacher-facing fields
- [#160] Week 1 daily-sheet boilerplate suppression + copy trim
- [#159] Pacing guide redesign — agenda rows
- [#158] Weeks 1–4 richer response patterns
- [#157] Differentiated worksheet tiers (scaffolded/core/extension)
- ELA fixture theme + package_id bugs fixed
- `canonical.mjs` path resolution fixed (uses `import.meta.url`)
- `lib.mjs run()` error check already present
- FIXTURE_MAP fully populated with all generated + PBG fixtures
