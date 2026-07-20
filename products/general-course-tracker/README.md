# General Course Tracker

A configurable percentage-based tracker intended to be duplicated once per class or block.

## Working tabs

1. Hub
2. Gradebook
3. Attendance
4. Student Log

## Core rules

- Empty category buckets do not reduce a grade.
- Active assessed buckets are renormalized automatically.
- Within-bucket weighting supports Points, Equal, and Custom.
- `M` contributes zero; blank, `I`, `EX`, and `R` are excluded.
- Assessments are deactivated rather than structurally deleted.
- Roster and category integrity checks prevent ambiguous active records.

## Communication bridge

Version 2.0.2 exposes the standardized bridge at:

```text
1 Hub!P4:AI39
```

Only student/family-appropriate log evidence enters the bridge. Teacher-only notes are excluded.

## Distribution

The current workbook is packaged in `../releases/2026-07-19/Mr_Friess_Tracker_Patches_Literacy_V3_and_Email_Bridge.zip`.

Archive member: `Mr_Friess_General_Course_Tracker_V2.0.2_Email_Bridge.xlsx`.

The workbook contains no real student data. A live Google Sheets round-trip remains required before production use.
