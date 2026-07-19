# Literacy Intervention Tracker V3.0 Beta — Setup and QA

## V3 setup completed

The beta preserves four working tabs:

1. Hub
2. Sessions
3. Assessment & Mastery
4. Student Log

## Added in V3

- Student ID is the stable key across sessions, evidence, logs, progress, and email export.
- Controlled skill registry with editable starter codes.
- Controlled measure registry with metric type, unit, target, and direction.
- Measure codes automatically populate domain, skill, measure name, unit, and target.
- Metric-aware progress supports accuracy, WCPM, rubric, count, rate, and duration measures.
- Chronological progress series remain correct when rows are entered out of date order.
- Selected-student progress chart and growth-per-week view.
- Flexible-group planner with review flags.
- Automatic group-fit checking.
- Standardized email-generator bridge.
- Family-safe communication preview.
- Teacher-only notes remain excluded from email data.

## Focused QA

- Literacy V3 simulations: **15 of 15 passed**.
- General tracker bridge simulations: **6 of 6 passed**.
- Literacy formula scan: `{"kind":"notice","message":"Cell search matched 0 entries."}`
- General formula scan: `{"kind":"notice","message":"Cell search matched 0 entries."}`

## Beta limits

- The original evidence sheet remains wide. V3 reduces repeated typing through registries but does not yet replace the sheet with an Apps Script sidebar.
- Metric-aware progress is configured for the first 200 evidence rows.
- Starter skill and measure registries are intentionally editable and are not a complete curriculum codebook.
- Google Sheets import and live `IMPORTRANGE` wiring remain untested in this environment.

## Pilot sequence

1. Import the V3 beta into Google Sheets.
2. Add two or three fictional students.
3. Enter several sessions and evidence rows in different domains.
4. Confirm the progress chart, group planner, current profile, and email preview.
5. Replace or expand the starter skill/measure registries.
6. Pilot with a small real roster before retiring V2.1.1.
