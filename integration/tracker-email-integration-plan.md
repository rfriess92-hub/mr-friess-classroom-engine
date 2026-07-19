# Tracker-to-Email Integration Plan

## Architecture

```text
class tracker -> communication bridge -> central communication feed -> email generator
```

The products remain independently usable. Integration is a data-contract layer, not a merged workbook.

## Phase 1: independent stabilization

- Pilot General Course Tracker V2.0.2 in Google Sheets.
- Pilot Literacy V3 with a small roster while retaining V2.1.1 as fallback.
- Complete the Email Generator audit independently.

## Phase 2: central communication feed

Create a school-managed Google Sheet that imports each tracker bridge.

General tracker example:

```gs
=QUERY(
  IMPORTRANGE("<TRACKER_URL>","1 Hub!P4:AI39"),
  "select * where Col4 is not null",
  1
)
```

Literacy tracker example:

```gs
=QUERY(
  IMPORTRANGE("<TRACKER_URL>","1 Hub!BF4:BY39"),
  "select * where Col4 is not null",
  1
)
```

Stack class feeds into one normalized table. Match records by `Record Key`, or by `Student ID + Course + Block` when required.

## Phase 3: generator mapping

Map the Email Generator inputs to the communication bridge. Branch on `Source Type`:

- `graded_course`: percentage, attendance, missing work, review flags, positive evidence, next step.
- `literacy_intervention`: domain priority, current evidence flag, family-safe observation, next step; no course percentage.

## Phase 4: fictional-data QA

Test at minimum:

- positive graded-course update;
- missing-work concern;
- attendance concern;
- literacy progress update;
- literacy transfer or prompt-dependence concern;
- record with limited evidence;
- teacher-only note exclusion;
- duplicate-name protection through stable IDs.

## Phase 5: controlled production rollout

- Keep all Sheets in a school-managed account.
- Do not publish live tracker URLs or student data in GitHub.
- Generate drafts only; do not send automatically.
- Require teacher review before any message leaves the system.
