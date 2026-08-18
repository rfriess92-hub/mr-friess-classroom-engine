# Psychology 11/12 v5 — Zotero Collection & Tag Convention

Zotero is the teacher-facing source library. It stores source metadata once so content banks, currency review, visual attribution and lesson planning do not repeatedly rediscover the same source.

## Collection tree

- `Psychology 11-12 v5`
  - `00 Canonical Spine`
  - `01 Unit 1 — Introduction & Brain`
  - `02 Unit 2 — Cognition, Learning & Perception`
  - `03 Unit 3 — Development`
  - `04 Unit 4 — Biopsychology`
  - `05 Unit 5 — Personality & Mental Health`
  - `06 Unit 6 — Social & Forensic`
  - `07 Final Assessment`
  - `08 Cross-Course Methods & Pedagogy`
  - `90 Retired / Replaced Sources`

A source may appear in multiple collections without duplication.

## Minimal required tags

Keep tagging small and operational. Required tags are:

- Unit: `u1` ... `u6`, `final`, or `cross-course`
- Lesson: `lesson:U3-L01` or the current v5 lesson/date identifier when scheduled
- Resource role: `role:core`, `role:flex`, `role:extension`, `role:contingency`, `role:source-bank`
- Status: `status:admitted`, `status:candidate`, `status:retired`
- Currency: `currency:stable`, `currency:biennial`, `currency:annual`, `currency:term-check`

Use fields rather than tags for author, year, DOI, URL, publication, licence and access date.

## Optional evidence tags

Use only when useful for retrieval:

- `evidence:primary`
- `evidence:review`
- `evidence:meta`
- `evidence:textbook`
- `evidence:professional-guidance`
- `evidence:policy`
- `evidence:dataset`
- `evidence:visual`
- `evidence:teaching-resource`
- `volatile`
- `canada`
- `bc`
- `first-nations`

Do not create dozens of topic tags that duplicate Zotero collections or lesson tags.

## Extra field template

Use the Zotero Extra field for course-control metadata that Zotero does not natively model:

```text
PSY5 Source ID: PSY5-SRC-0001
Legacy IDs: S07; B4-04
Fallback: PSY5-SRC-0002
Rights note: CC BY 4.0; attribution required
Lesson limitation: Use as psychometric evidence boundary, not as a learning-styles typing activity.
```

## Scientific Currency Ledger bridge

Do not renumber existing Scientific Currency Ledger source IDs (`S01`, `S02`, etc.) or claim IDs (`B4-01`, etc.). Add them to `Legacy IDs` and cross-reference the new `PSY5-SRC-####` record.

If a source is annual/biennial/term-check, its `next_review` date remains controlled by the Scientific Currency Ledger or unified source register—not by a Zotero reminder alone.

## Visual items

For reusable visuals, record creator, original item/page URL, licence, attribution, modification permission and modification notes. Store open/licensed source metadata in Zotero; do not commit copyrighted binaries to public GitHub.

## Security

Do not store secure assessments, answer keys, student work/data, accommodations, controlled reveals, passwords, or private school links in shared/public Zotero collections or GitHub exports.