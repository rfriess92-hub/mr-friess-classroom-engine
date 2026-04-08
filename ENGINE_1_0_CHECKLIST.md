# Engine 1.0 checklist

This file defines the first practical pass condition for the **Mr. Friess Classroom Engine**.

It is not the final polished state.
It is the first stable baseline where the system is buildable, reviewable, and patchable.

## Naming

Use these names consistently:

- **classroom engine** = the whole system
- **render pipeline** = the repo / build / rendering side
- **workflow** = how the user and assistant move work through the system

## Integration model

The pedagogy side and the render side are connected by canonical lesson packets.

Flow:

1. Pedagogy / design produces a canonical lesson packet
2. The packet is stored in `engine/content/`
3. The render pipeline validates and builds the packet
4. PPTX and PDF outputs are reviewed
5. Remaining issues are classified as:
   - content problem
   - renderer problem
   - repo/tooling problem

This prevents pedagogy issues and rendering issues from being mixed together.

## Engine 1.0 passes when all of these are true

### 1. Canonical lesson packets exist
At least two reference lessons exist in `engine/content/`.

Current reference lessons:
- `science9_interconnected_spheres.json`
- `careers8_goal_setting.json`

### 2. Lesson packets are structurally complete
Each lesson packet includes:
- lesson metadata
- slide sequence
- differentiated worksheets
- rubrics
- teacher extension
- lesson plan

### 3. The repo is the source of truth
- Current working lesson packets live in the repo
- Builds are run from the repo
- Patches are tracked in the repo

### 4. Local build works for both reference lessons
For both Science and Careers:
- PDF build runs locally without crashing
- PPTX build runs locally without crashing
- output files are produced in `output/`

### 5. PPTX output is usable
For both lessons:
- file opens
- every slide renders
- no raw JSON keys appear on slides
- no layout-specific crash blocks build
- content is readable enough for teacher review

Usable does **not** mean visually final.
It means the deck is reviewable and teachable in rough form.

### 6. PDF output is usable
For both lessons:
- file opens
- worksheets are readable
- teacher guide is present
- answer keys are present
- layout is stable enough for review

Usable does **not** mean fully polished or canonical-final.

### 7. Problems are classified correctly
Every remaining issue is labeled as one of:
- content problem
- renderer problem
- repo/tooling problem

Avoid vague labels like “the engine is broken.”

### 8. Known weaknesses are tracked, not confused with blockers
Engine 1.0 can still pass even if:
- PPTX styling is not yet final-quality
- PDF pack structure is still compressed
- some layout handlers still need refinement

Engine 1.0 does **not** pass if:
- builds crash
- output files are missing
- slides still dump raw structure like `Left:` or `Items:`
- lesson packets drift into inconsistent shapes
- it is unclear whether a problem belongs to content or rendering

### 9. Technical work stays separate from pedagogy work
- pedagogy chat produces or revises the lesson packet
- technical chat validates, builds, and patches the render pipeline
- repo changes do not silently rewrite pedagogy intent

### 10. One active backend patch track exists
Use one active backend patch track at a time so the cleanup path is clear.
For the current repo state, that is the cleanup render pass branch / PR.

## Engine 1.0 meaning

Engine 1.0 means:

> The classroom engine can take a canonical lesson packet and produce usable review artifacts through the render pipeline.

That is the baseline milestone.
It is the point where the system is real enough to patch forward instead of being rebuilt from scratch each time.

## What passes now vs later

### Pass now
- both reference packets exist
- both can be built locally
- both PPTX files open
- both PDF files open
- outputs are usable for review
- remaining issues are categorized

### Patch later
- PPTX visual polish
- full PDF pack fidelity
- removal of duplicate patch artifacts
- deeper repo cleanup
