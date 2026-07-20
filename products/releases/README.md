# Product Releases

Binary workbook artifacts belong in GitHub Releases rather than normal Git history because `.xlsx` files are not meaningfully diffable.

## Planned tracker release: 2026-07-19

Release asset:

```text
Mr_Friess_Tracker_Patches_Literacy_V3_and_Email_Bridge.zip
```

Expected SHA-256:

```text
e37a462132e2b86dfaed0b303cd3f8a87e2cd60f5edc5a5d88e3fb6ec6c03cbe
```

Contents:

- General Course Tracker V2.0.2 with communication bridge
- Literacy Intervention Tracker V2.1.1 stable fallback
- Literacy Intervention Tracker V3.0 Beta
- tracker-to-email bridge specification
- Literacy V3 beta setup and QA report

The repository connector used for this change can create branches, commits, pull requests, and text files, but it cannot publish GitHub Release assets. The release asset is therefore tracked separately and must be uploaded from the validated local package before the release is marked complete.
