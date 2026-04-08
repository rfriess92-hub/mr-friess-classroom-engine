# Repo Cleanup Plan v1

This file converts the current repo audit into a concrete cleanup sequence.

The goal is not to make the repo perfect in one pass.
The goal is to make the repo truthful, buildable, and easier to patch.

## Primary principle

Clean up in this order:
1. make docs truthful
2. make the live build path truthful
3. align declared dependencies with actual imports
4. replace stubs with checks that reflect the real engine
5. remove or archive superseded files only after the replacements are live

---

## Cleanup pass A — truthfulness fixes

### A1. Rewrite `README.md`
Current problem:
- README still describes the repo as a starter and says builders still need to be added.

Action:
- rewrite README to describe the repo as a classroom engine repository with:
  - canonical lesson packets in `engine/content/`
  - current schema file
  - current PDF builder
  - current PPTX builder status
  - current cleanup branch / patch state
  - local build instructions

Result:
- top-level repo description matches reality.

### A2. Rewrite or retire `SETUP_STATUS.md`
Current problem:
- file still says the real builders/schema are not loaded yet.

Action:
- either rewrite it into a current status file or remove it after README absorbs its purpose.

Preferred outcome:
- remove it after updating README and Engine 1.0 docs.

### A3. Merge `ENGINE_1_0_CHECKLIST.md` into main after review
Current problem:
- Engine 1.0 definition is only on the cleanup branch.

Action:
- keep it on the cleanup branch for now
- merge it when the cleanup branch is accepted

Result:
- repo has a stable definition of done.

---

## Cleanup pass B — live build path cleanup

### B1. Choose one live PPTX renderer path
Current problem:
- `render_pptx.py` is still the live official renderer
- `render_pptx_patch.py` and patch v2 files exist beside it
- `main` has multiple candidate renderers

Action:
- promote one patched renderer to become the live file at `engine/pptx/render_pptx.py`
- move older versions out of the live path or archive them clearly

Preferred outcome:
- only one file is treated as the official PPTX renderer.

### B2. Replace `engine/pptx/build.js`
Current problem:
- wrapper still points to old renderer
- wrapper hard-codes `python3`

Action:
- replace it with a cross-platform wrapper that:
  - detects `python`, `python3`, or `py`
  - calls the chosen live PPTX renderer

Result:
- repo build path works more reliably on Windows and Mac/Linux.

### B3. Reconcile `package.json`
Current problem:
- package.json points to the old PPTX build path indirectly through `engine/pptx/build.js`

Action:
- update package.json scripts so the default build path matches the chosen live renderer and current repo reality

Result:
- `build:pptx` is truthful.

---

## Cleanup pass C — dependency and config cleanup

### C1. Update `pyproject.toml`
Current problem:
- `python-pptx` is used by the repo but not declared

Action:
- add `python-pptx`
- review whether `jsonschema` should also be included if schema validation is implemented in Python

Result:
- declared dependencies match imports.

### C2. Review naming consistency in config
Current problem:
- Python project name is `integrated-engine`, while repo and project naming now use `classroom engine`

Action:
- rename project metadata to match current naming, if that does not disrupt tooling

Preferred outcome:
- package metadata aligns with repo identity.

---

## Cleanup pass D — script and test cleanup

### D1. Replace `scripts/schema-check.mjs`
Current problem:
- script is a stub and still claims schema does not exist

Action:
- update it to:
  - verify `engine/schema/lesson.schema.json` exists
  - verify lesson packets exist
  - optionally run real validation against the schema

### D2. Replace `scripts/qa-render.mjs`
Current problem:
- currently only logs placeholder text

Action:
- turn it into a real render QA entry point, even if minimal at first
- baseline checks can include:
  - expected output files exist
  - file sizes are non-trivial
  - both reference lessons can be built

### D3. Strengthen `scripts/doctor.mjs`
Current problem:
- current doctor only checks for `engine/content` and `README.md`

Action:
- expand it to check for:
  - `engine/content`
  - `engine/schema/lesson.schema.json`
  - `engine/pdf/build.py`
  - `engine/pptx/render_pptx.py`
  - `package.json`

### D4. Strengthen tests
Current problem:
- test only checks shallow repo layout

Action:
- add tests that reflect actual engine structure and expectations

Result:
- tests tell the truth about the repo.

---

## Cleanup pass E — artifact and patch file cleanup

### E1. Remove superseded patch sidecars after promotion
Current problem:
- multiple renderer patch files create ambiguity

Action:
- once one renderer becomes official, archive or remove the superseded sidecars from the live path

### E2. Remove docs that only describe an old temporary state
Current problem:
- starter-status docs remain after repo reality changed

Action:
- keep only current, useful docs

---

## Immediate recommended order of execution

1. rewrite README
2. retire or rewrite SETUP_STATUS
3. choose and promote one official PPTX renderer
4. replace `build.js` with cross-platform wrapper
5. update `package.json`
6. update `pyproject.toml`
7. replace `schema-check`, `qa-render`, and `doctor`
8. strengthen tests
9. archive/remove superseded patch files

---

## Definition of success for cleanup v1

Cleanup v1 succeeds when:
- repo docs describe the repo truthfully
- only one official live PPTX renderer path exists
- live build scripts point to the right renderer
- Python dependencies match imports
- support scripts reflect the actual engine
- the repo is easier to understand without reading old chat history
