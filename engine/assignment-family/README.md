# Assignment family decision layer

> **STATUS: NOT IN ACTIVE RENDER PIPELINE**
>
> This module is a standalone CLI tool layer (`scripts/select-assignment-family.mjs`,
> `scripts/validate-assignment-build.mjs`) and is NOT imported by the render pipeline
> (`scripts/render-package.mjs` → `engine/schema/render-plan.mjs`).
>
> The active render pipeline uses `engine/family/selection.mjs` for assignment family
> selection as part of render plan normalization.
>
> This module remains available as an independent CLI tool for assignment design workflows.

This layer sits before artifact generation.

Purpose:
- select the most natural assignment family before artifact design
- preserve a stable family set
- expose a common teacher-facing schema
- validate family integrity before assignment builds are accepted

Current scope:
- config for stable families and common schema
- family selector
- recommended chaining helper
- build validator

Intended insertion point:
- family selection happens before planner/output routing
- artifact generation should consume the selected family and common schema fields
