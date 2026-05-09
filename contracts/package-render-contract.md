# Package Render Contract

This contract protects package rendering and output completeness.

## Renderable package rule

A package is not complete until it can be rendered by the repo scripts without manual reconstruction.

## Required package expectations

A renderable package should define package identifier, title or topic, subject or course context, grade or grade band, architecture or primary architecture, declared outputs, audience for teacher-facing and student-facing outputs where applicable, and enough structured content for each declared output to render meaningfully.

## Output matching

Declared outputs must map cleanly to produced files. Output names, ids, labels, and types should be stable enough for QA scripts to match artifacts.

## Render evidence

Implementation phases that add or modify packages should include at least one rendered-output check:

```bash
pnpm run render:package -- --package <package-json> --out output
pnpm run qa:report -- --package <package-json> --out output
```

## Failure conditions

A package render phase fails when declared outputs are not produced, output files are empty or structurally unusable, teacher-only materials appear in student packets, answer keys or teacher notes leak into student-facing assessment materials, a package requires manual edits before classroom use, or output naming makes QA matching unreliable.

## Preferred output separation

Teacher-facing outputs include teacher guide, pacing guide, facilitation notes, answer key, and assessment guidance.

Student-facing outputs include student packet, worksheet, graphic organizer, reflection sheet, checkpoint or completion check, and assessment without answers.

Shared or presentation-facing outputs include slides, station cards, class anchor chart, and project prompt when intended for display.
