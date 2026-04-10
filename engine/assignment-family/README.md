# Assignment family decision layer

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
