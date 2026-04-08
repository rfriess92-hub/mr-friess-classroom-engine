# Artifact QA Runtime Block V2

Run artifact QA on this PPTX/PDF output. Check blockers first, then metadata coherence, visibility separation, and overflow refusal. Score 7 categories out of 14, escalate only if structural risk remains, classify findings as content_issue / render_logic_issue / artifact_formatting_issue, rank the top 3 patches by classroom impact, and end with judgment + ship_rule.

This runtime block is the pipeline-facing invocation intent.
It is not a substitute for the full canonical ruleset, and it should only run after a real artifact exists.
