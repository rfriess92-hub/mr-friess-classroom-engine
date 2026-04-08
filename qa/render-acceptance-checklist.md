# Render Acceptance Checklist

Reusable render QA checklist for stable-core outputs.

## Core checks

- canonical output types are preserved
- audience separation is preserved
- teacher-facing content does not appear in student-facing outputs
- declared output bundle is complete
- no undeclared outputs are emitted
- embedded supports remain embedded unless explicitly declared standalone
- final evidence appears only in its declared location
- multi-day sequence boundaries and checkpoints are preserved

## Artifact checks

- artifact exists
- artifact type is recognized
- output naming matches declared package outputs
- PPTX/PDF bundle matches package bundle intent

## Benchmark 1 checks

Pass if:
- teacher_guide is teacher-only
- slides are shared-view
- worksheet is student-facing task space
- exit_ticket is separate evidence artifact
- no teacher notes appear in worksheet or exit_ticket
- student-facing text remains Grade 2-readable

## Challenge Benchmark 7 checks

Pass if:
- 2-day structure is preserved
- lesson_overview stays teacher-facing
- teacher_guide stays distinct from student task materials
- task_sheet carries continuity across days
- checkpoint_sheet remains teacher-facing
- secondary architecture support is legible but subordinate
- materials-control logic is preserved
- final evidence is not duplicated unless explicitly declared
