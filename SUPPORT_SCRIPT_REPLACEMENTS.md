# Support script and test replacement targets

This file captures the intended replacement targets for cleanup passes C and D.

The connector accepted the config/doc updates on this branch, but blocked direct creation of additional JS replacement files during this pass.
So this file records the exact next-state targets for the support layer.

## Dependency alignment target

`pyproject.toml` should be updated to match the current engine reality.

Intended changes:
- rename project metadata from `integrated-engine` to `mr-friess-classroom-engine`
- add `python-pptx>=1.0`
- keep `reportlab>=4.0`

A replacement candidate already exists on this branch:
- `pyproject.current.toml`

## Script replacement targets

### 1. doctor script target
Current problem:
- current doctor only checks for `engine/content` and `README.md`

Target behavior:
- check for:
  - `engine/content`
  - `engine/schema/lesson.schema.json`
  - `engine/pdf/build.py`
  - `engine/pptx/render_pptx.py`
  - `package.json`

### 2. schema-check target
Current problem:
- current script is a stub and still implies schema does not exist

Target behavior:
- confirm `engine/schema/lesson.schema.json` exists
- confirm reference lesson packets exist
- parse each lesson packet in `engine/content/`
- verify required top-level keys are present:
  - `lesson_id`
  - `subject`
  - `grade`
  - `topic`
  - `time_minutes`
  - `learning_goals`
  - `slides`
  - `worksheets`
- verify worksheet tiers:
  - `supported`
  - `proficient`
  - `extending`

### 3. qa-render target
Current problem:
- current script is still only placeholder text

Target behavior:
- check that expected output artifacts exist for reference lessons
- verify output file sizes are non-trivial
- report missing output files clearly

## Test replacement targets

### 1. repo layout test
Current problem:
- current test only checks `engine/content` and `README.md`

Target behavior:
- verify engine directories and core files exist:
  - `engine/content`
  - `engine/schema/lesson.schema.json`
  - `engine/pdf/build.py`
  - `engine/pptx/render_pptx.py`
  - `package.json`

### 2. lesson packet contract test
Add a Python test that:
- loads the reference lesson packets
- verifies required top-level keys exist
- verifies worksheet tiers exist
- verifies `slides` is non-empty

## Meaning

Even though direct creation of the JS replacement files was blocked in this pass, the cleanup branch now has:
- the dependency alignment candidate
- the replacement targets written down clearly
- a stable next step for completing support-script cleanup when the write path allows it
