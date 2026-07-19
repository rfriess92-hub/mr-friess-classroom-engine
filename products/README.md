# Classroom Engine Product Templates

This directory contains teacher-operated products that sit beside the stable-core classroom render pipeline.

These products are intentionally independent:

- `general-course-tracker`: percentage-based course assessment, attendance, and student follow-up.
- `literacy-intervention-tracker`: domain-specific literacy placement, sessions, evidence, mastery, progress, and grouping.
- `email-generator`: communication drafting product. Its current workbook package remains outside this change and will be imported after its independent audit is complete.

Integration occurs through a versioned communication bridge under `contracts/`. The email generator must consume the bridge rather than read raw tracker sheets.

## Data safety

Repository artifacts must contain no real student names, IDs, grades, attendance, family contact details, or teacher notes. Production copies and live Google Sheets URLs must remain outside the public repository.

## Version status

| Product | Version | Status |
|---|---|---|
| General Course Tracker | 2.0.2 | Stable candidate; Google Sheets round-trip pending |
| Literacy Intervention Tracker | 2.1.1 | Stable fallback |
| Literacy Intervention Tracker | 3.0 Beta | Pilot |
| Communication Bridge | 1.0 | Draft integration contract |
| Email Generator | 2.2.1 | Existing product; repository import pending separate audit |
