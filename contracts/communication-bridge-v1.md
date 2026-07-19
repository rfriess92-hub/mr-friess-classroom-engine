# Mr. Friess Tracker-to-Email Bridge Specification

## Decision

Automatic transfer from the assessment trackers into the email generator is feasible. The safe architecture is:

**Class tracker → standardized communication bridge → central communication feed → email generator**

The email generator should never read raw gradebook, assessment, session, or teacher-log sheets directly.

## Standard bridge schema

Both trackers now expose the same 20 fields:

1. Bridge Version
2. Source Type
3. Record Key
4. Student ID
5. Student Name
6. Course
7. Block
8. Term
9. Teacher
10. Current Grade
11. Attendance
12. Missing Count
13. Review Flag
14. Strength / Positive Evidence
15. Concern / Current Priority
16. Next Step
17. Share Level
18. Last Evidence Date
19. Data Status
20. Suggested Email Mode

## Export ranges

- General Course Tracker V2.0.2: `1 Hub!P4:AI39`
- Literacy Intervention Tracker V3.0 Beta: `1 Hub!BF4:BY39`

The ranges are placed far to the right and visually suppressed so they do not add another working tab.

## Source-specific behaviour

### Graded courses

The bridge exports:

- current percentage
- attendance percentage
- missing-assessment count
- review flag
- latest student/family-appropriate observation
- latest student/family-appropriate next step

### Literacy intervention

The bridge exports:

- no course percentage
- latest literacy priority
- current evidence flag
- latest student/family-safe observation
- latest family-safe next step
- literacy-specific email mode

The email generator must branch on `Source Type` rather than treating literacy intervention as a graded course.

## Recommended Google Sheets connection

For each tracker imported into a central communication workbook:

```gs
=QUERY(
  IMPORTRANGE("<TRACKER_URL>","1 Hub!P4:AI39"),
  "select * where Col4 is not null",
  1
)
```

Use `1 Hub!BF4:BY39` for the literacy tracker.

Multiple class feeds can be stacked in the central workbook. The email generator should read only the consolidated feed and select records by `Record Key` or `Student ID + Course + Block`.

## Privacy and control

- Teacher-only notes are excluded from the bridge.
- Only notes marked for student/family use enter the feed.
- No email is sent automatically.
- Every generated message remains a reviewable draft.
- Files should remain in a school-managed Google account.

## Remaining wiring

The final connection requires:

1. The current Email Generator workbook/package.
2. The Google Sheets URL for each tracker.
3. The Google Sheets URL for the email generator.
4. Confirmation of the generator's current input field names.

After those are available, the generator can be connected without rewriting either tracker.
