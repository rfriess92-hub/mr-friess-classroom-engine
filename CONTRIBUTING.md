# Contributing & Re-entry Guide

## What this repo is

The Mr. Friess Classroom Engine generates structured classroom content bundles (PPTX slides + PDF
worksheets) from teacher-authored lesson packages. A "package" is a validated JSON file describing
a lesson's architecture, content blocks, and output types. The engine routes each package through
schema validation, route planning, and multi-format rendering.

## What a complete successful run looks like

```bash
pnpm run doctor                                                          # verify repo scaffolding
pnpm run schema:check -- --package <path>                               # validate package schema
pnpm run route:plan -- --package <path> --print-routes                  # confirm route plan
pnpm run render:package -- --package <path> --out output                # render artifacts
pnpm run qa:bundle -- --package <path> --out output                     # acceptance gate
```

All five steps passing = a proven package bundle.

## Where canonical acceptance proof lives

- `fixtures/` — stable-core fixture packages
- `.github/workflows/stable-core.yml` — CI proof runs
- `SETUP_STATUS.md` — current surface status (live vs. transitional vs. deprecated)

## Canonical sources of truth

| Surface | Authority |
|---|---|
| Family selection | `engine/assignment-family/` |
| Schema validation | `engine/schema/` |
| PPTX rendering | `engine/pptx/renderer.py` (public entrypoint) |
| PDF rendering | `engine/pdf/render_stable_core_output.py` |
| Decisions log | `DECISIONS.md` |

## What NOT to use

- `engine/family/*` — compatibility residue only, not the live render-plan authority
- `scripts/build-all.mjs`, `build-pptx.mjs`, `build-pdf.mjs` — deprecated debug surfaces, not acceptance proof
- Root-level lesson JSON files — not allowed; `engine/content/` is authoritative

## Operating model

Solo repo. Lightweight branches and PRs as diff capsules. Local command gates are the real
acceptance path until CI covers the full declared surface.
