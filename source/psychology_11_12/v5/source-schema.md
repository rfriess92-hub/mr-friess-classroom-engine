# Psychology 11/12 v5 Source & Provenance Schema

This is the non-secure source-control schema for the v5 course rebuild. It supports the classroom package; it does not replace the v5 Operating Semester Plan, Student Guides, secure assessments, or local source binaries.

## Canonical source ID

Use a stable numeric source ID:

`PSY5-SRC-0001`

Rules:

- IDs never encode unit or lesson because one source may be reused.
- Never recycle an ID after a source is retired.
- Existing Scientific Currency Ledger IDs such as `S07` or claim IDs such as `B4-04` remain unchanged and are stored as legacy aliases.
- Course-constructed stimuli/data are not external sources. Give them a construction ID such as `PSY5-CC-U3-L05-01` and label them `COURSE-CONSTRUCTED` wherever students or teachers could mistake them for published findings.

## Required source fields

Every admitted external source record must contain:

1. `source_id`
2. `title`
3. `author_or_provider`
4. `year_or_version`
5. `source_type`
6. `primary_url_or_doi`
7. `access_date`
8. `status` — `admitted | candidate | retired`
9. `unit_tags` — `U1` through `U6`, `FINAL`, or `CROSS_COURSE`
10. `lesson_tags` — one or more current v5 lesson/date IDs when scheduled
11. `resource_role` — `Core | Flex | Extension | Contingency | Source Bank`
12. `evidence_role` — `textbook | primary | review | meta | professional-guidance | policy | dataset | visual | teaching-resource`
13. `currency_class` — `stable | biennial | annual | term-check`
14. `next_review`
15. `rights_or_licence`
16. `fallback_source_id_or_local_fallback`
17. `legacy_aliases`
18. `notes_or_limitation`

## Admission gate

A source is `admitted` only when it solves a named lesson, evidence, accessibility, or maintenance problem. A useful resource does not create curriculum by itself.

For a live scheduled dependency, record a fallback before the lesson becomes release-ready.

## Content-bank citation pattern

Each content-bank item should carry:

`Source: PSY5-SRC-#### — short source label`

If a current/contested claim is also tracked on the Scientific Currency Ledger, add the existing claim/source alias rather than inventing a replacement ID.

## Visual provenance

For visual assets, also record creator, original page/item URL, licence, attribution text, whether modification is allowed, and modification notes. Search-engine results are discovery aids only; item-level licence evidence controls reuse.

## Security boundary

Never store secure assessment items/answers, controlled-reveal content, student names/data, accommodation records, credentials, or copyrighted source binaries in the public GitHub source register.