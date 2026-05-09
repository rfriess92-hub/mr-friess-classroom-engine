# Implementation Report: phase-002-careers-guest-speaker-package

Status: READY FOR QA

Phase goal:
- Create a renderable Careers 8 guest speaker package for Patrick from BCLC with teacher-facing and student-facing outputs.

Files changed:
- `fixtures/generated/careers-8-guest-speaker-patrick-bclc.grade8-careers.json` — added a Careers 8 guest speaker package using existing supported output types.
- `roadmap/reports/phase-002-implementation-report.md` — added this implementation handoff report.

Contracts touched:
- None.

Fixtures added or changed:
- `fixtures/generated/careers-8-guest-speaker-patrick-bclc.grade8-careers.json`

Commands run:
- `pnpm run agent:phase-check` — NOT RUN in local tool session; expected in CI if triggered.
- `pnpm run agent:qa-check` — NOT RUN in local tool session; expected in CI if triggered.
- `pnpm test` — NOT RUN in local tool session; expected in CI if triggered.
- `pnpm run render:package -- --package fixtures/generated/careers-8-guest-speaker-patrick-bclc.grade8-careers.json --out output` — NOT RUN in local tool session.
- `pnpm run qa:report -- --package fixtures/generated/careers-8-guest-speaker-patrick-bclc.grade8-careers.json --out output` — NOT RUN in local tool session.

Known risks:
- The phase card originally names `question_sheet` and `reflection_sheet`, but those are not stable output types in the current repo. This implementation maps them to existing renderable types: `worksheet` for the question sheet and `final_response_sheet` for the reflection sheet.
- The package should be checked by schema, route planning, render, and QA report before merge.

Suggested QA focus:
- Confirm the package is schema-valid.
- Confirm all five declared outputs render: teacher guide, student packet, question sheet, reflection sheet, and rubric.
- Confirm student-facing outputs do not include teacher-only notes or answer keys.
- Confirm the reflection is treated as final evidence.
- Confirm Careers 8 tone and scaffolding are appropriate for a Grade 8 classroom.
