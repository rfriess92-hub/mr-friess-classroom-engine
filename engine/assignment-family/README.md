# Assignment family decision layer

> **STATUS: ACTIVE IN LIVE RENDER PIPELINE**
>
> The live stable-core render pipeline reaches this layer through
> `scripts/render-package.mjs` -> `engine/schema/render-plan.mjs` ->
> `engine/assignment-family/package-selector.mjs`.
>
> `scripts/select-assignment-family.mjs` and
> `scripts/validate-assignment-build.mjs` remain useful standalone CLI
> surfaces for assignment design workflows.
>
> `engine/family/*` remains compatibility-only residue during cleanup. It is
> not the live family-selection authority.

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
