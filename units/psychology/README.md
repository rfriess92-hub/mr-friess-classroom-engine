# Psychology Unit

This directory is the GitHub source of truth for the complete Psychology 11/12 classroom unit.

The unit is not considered classroom-ready until the cycle manifests, source packages, rendered artifacts, and QA reports are all present and reproducible through GitHub Actions.

## Structure

```text
units/psychology/
  psychology-unit.manifest.json
  _raw/
    cycle-a/
    cycle-b/
    cycle-c/
    cycle-d/
  cycles/
    cycle-a/
      cycle.manifest.json
      packages/
    cycle-b/
      cycle.manifest.json
      packages/
    cycle-c/
      cycle.manifest.json
      packages/
    cycle-d/
      cycle.manifest.json
      packages/
```

## Add a package

1. Put the engine-readable package JSON under the correct cycle `packages/` folder.
2. Add an entry to that cycle's `cycle.manifest.json`:

```json
{
  "package_id": "psych_11_12_cycle_a_unit_01_example",
  "title": "Example Psychology Package",
  "source": "units/psychology/cycles/cycle-a/packages/psych-11-12-cycle-a-unit-01-example.json",
  "output_dir": "unit-01-example"
}
```

## Required artifact standard

A full classroom package should render teacher-facing material, student-facing material, PPTX slides, assessment or completion evidence where appropriate, and `rendered-package.qa.json`.

The render workflow should fail when packages are missing, when PPTX decks are missing, or when rendered PDFs are skeletal placeholders.
