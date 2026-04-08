# Artifact QA GitHub Integration Spec

Artifact QA enters the classroom engine pipeline as a structured post-render gate.

## Pipeline position

Recommended sequence:

1. content generation approved
2. render/build step completes
3. artifact emitted (PPTX and/or PDF)
4. artifact QA runs
5. artifact QA judgment determines next action
6. if needed, patch cycle runs
7. artifact is rechecked if materially changed
8. final ship/release proceeds only when the artifact is not blocked

Artifact QA should not run before a real artifact exists or as a substitute for content/pedagogy planning review.

## Required invocation intent

Run artifact QA on this PPTX/PDF output. Check blockers first, then metadata coherence, visibility separation, and overflow refusal. Score 7 categories out of 14, escalate only if structural risk remains, classify findings as content_issue / render_logic_issue / artifact_formatting_issue, rank the top 3 patches by classroom impact, and end with judgment + ship_rule.

## Required output contract

Every artifact-QA run must emit the one-screen schema documented in `/qa/artifact-qa-output-contract.yaml`.

## Gating rules

### pass
- no hard blockers
- fast score 13–14
- no override rule forces revise/block

Workflow result: artifact may ship.

### revise
- fast score 10–12
- metadata_coherence, visibility_separation, or overflow_refusal = soft
- artifact is usable but not yet acceptable for final output quality

Workflow result: patch cycle should run and recheck is required after material change.

### block
- any hard blocker
- fast score 0–9
- two 0s anywhere in the score categories
- severe failure weakening readability, task start, or surface identity

Workflow result: artifact must not ship.

## Issue typing

Preserve issue typing:
- content_issue
- render_logic_issue
- artifact_formatting_issue

Do not collapse all failures into one generic QA bucket.

## Recommended integration tier

Tier 2 workflow integration:
- run artifact QA after render
- emit structured schema
- respect pass/revise/block
- hold release on block
- store QA outputs
- require recheck after material patching
- surface issue typing clearly
