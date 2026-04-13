# Current Repo Status

Snapshot date: 2026-04-12

## What is already real in this repo

The repo is no longer just starter scaffolding.

Present and wired now:

- stable-core schema files under `schemas/`
- package preflight and render-plan normalization under `engine/schema/`
- route planning under `engine/planner/`
- package rendering through `scripts/render-package.mjs`
- bundle and artifact QA through `scripts/qa-bundle.mjs` and `scripts/qa-render.mjs`
- visual planning and visual QA sidecars written during package rendering
- public renderer entrypoints at `engine/pptx/renderer.py` and `engine/pdf/render_stable_core_output.py`
- stable-core fixtures under `fixtures/core/`
- contract tests under `tests/node/`
- GitHub Actions workflow mirroring the stable-core path under `.github/workflows/stable-core.yml`

## What is still transitional

- PPTX rendering is still archive-backed behind the public entrypoint
- PDF rendering still depends on archive-backed base behavior
- legacy direct-lesson builder surfaces still exist but are not the acceptance path
- CI now mirrors the stable-core contract, but local execution remains the authoritative operator gate while the workflow proves out

## What this means operationally

For stable-core package work, the acceptance path is already real:

1. `doctor`
2. `schema:check`
3. `route:plan`
4. `render:package`
5. `qa:bundle`

Anything outside that path is either support tooling, compatibility/debugging surface, or transitional renderer internals.

## Next repo-hardening steps

- consolidate PPTX behavior into active non-archive modules
- reduce archive coupling in the PDF path
- keep expanding semantic QA signal
- decide whether to formally deprecate or retain legacy direct builders
