# Sidecar Evidence Workflow

## Purpose

Stable-core rendering already writes sidecar JSON files next to rendered artifacts.

This workflow turns those sidecars into reviewable regression evidence instead of leaving them as passive byproducts.

## Sidecars written today

For each routed output rendered through `render:package`, the repo writes:

- `{output_id}.visual.json`
- `{output_id}.images.json`
- `{output_id}.grammar.json`

These capture:

- visual plan structure and visual QA judgment
- image planning structure and image QA judgment
- core render-grammar metadata such as artifact family, render intent, evidence role, density, and length band

## Utilities added

### Collect evidence

```bash
node scripts/collect-sidecar-evidence.mjs --out output/<package_id> --manifest output/<package_id>/sidecar-evidence.json
```

This scans one package output directory and emits a normalized manifest with:

- artifact count
- sidecar completeness count
- per-artifact summaries for grammar, visual QA, image QA, page roles, and image slot counts

### Compare evidence

```bash
node scripts/compare-sidecar-evidence.mjs \
  --baseline path/to/baseline-sidecar-evidence.json \
  --candidate path/to/candidate-sidecar-evidence.json
```

Optional strict mode:

```bash
node scripts/compare-sidecar-evidence.mjs \
  --baseline path/to/baseline-sidecar-evidence.json \
  --candidate path/to/candidate-sidecar-evidence.json \
  --fail-on-revise
```

## Judgment model

The sidecar comparison utility returns:

- `pass` when no meaningful drift is detected
- `revise` when grammar/QA/summary drift is detected but the sidecar surface is still structurally complete
- `block` when artifacts disappear or sidecar presence breaks

## Suggested use

For a proof package or benchmark fixture:

1. render the package
2. collect a sidecar-evidence manifest
3. store that manifest as the current review baseline
4. after renderer or QA changes, render again and compare the new manifest against the baseline
5. review any `revise` or `block` drift before shipping

## Important boundary

This workflow does **not** replace artifact review.

It is best used as a structured early-warning system for:

- route/grammar drift
- page-role drift
- visual QA judgment changes
- image-plan drift
- missing sidecars or missing artifacts

It complements `qa:bundle` and `qa:render`; it does not replace them.
