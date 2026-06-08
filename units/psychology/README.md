# Psychology Unit

This directory is the GitHub source of truth for the complete Psychology 11/12 classroom unit.

## Non-negotiable render boundary

The uploaded Psychology all-cycles zip contains prebuilt final classroom assets. Those files were not created by the classroom engine in this branch.

Do not call a LibreOffice conversion, PDF preview, screenshot, or extracted PPTX/PDF copy an engine render.

In this repo there are two separate lanes:

1. **Prebuilt asset lane**: preserve and validate the existing DOCX/PDF/PPTX package from the uploaded archive.
2. **Engine-native lane**: convert lesson content into engine-readable package JSON and render it through `pnpm run render:package` / `pnpm run render:unit`.

The unit is not considered engine-rendered until package JSON files exist under the cycle `packages/` folders and render successfully through GitHub Actions.

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

## Add an engine-native package

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

## Required engine-rendered artifact standard

A full engine-rendered classroom package should produce teacher-facing material, student-facing material, PPTX slides, assessment or completion evidence where appropriate, and `rendered-package.qa.json`.

The render workflow should fail when packages are missing, when PPTX decks are missing, or when rendered PDFs are skeletal placeholders.
