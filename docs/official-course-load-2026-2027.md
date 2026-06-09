# Official Course Load — 2026-2027

Mode: Repo / build / rendering / QA

This document records the first repo adjustment after receiving the official 2026-2027 teaching load.

## Source of truth

The source-of-truth file is:

```text
school-year/2026-2027/official-course-load.yaml
```

That file should be read before generating course maps, package fixtures, teacher guides, student packets, or render-contract proofs for the 2026-2027 school year.

## Official load

### Semester 1

- Psychology 11/12
- Literacy — Cohort 1, returning from the current semester
- Literacy — Cohort 2, beginning a two-semester sequence

### Semester 2

- Psychology 11/12
- Literacy — Cohort 2, continuing from Semester 1
- Careers 10

## Engine implications

### Psychology 11/12

Psychology is a repeatable semester course. The engine should build one reusable course spine, then preserve separate Semester 1 and Semester 2 instance evidence. Do not merge assessment notes, pacing notes, or student evidence between the two runs.

### Literacy

Literacy is a cohort-continuity course. This is the most important structural correction in the repo. Cohort 1 is a returning group; Cohort 2 spans Semester 1 and Semester 2. The engine must carry forward writing goals, reading needs, successful scaffolds, and unfinished evidence for Cohort 2.

### Careers 10

Careers 10 is a contained Grade 10 semester course. It should not inherit the old Careers 8 package assumptions. Build it around practical project flow, employability work, graduation planning, portfolio artifacts, and completion evidence.

## Contract implications

The previous contract drift work made `completion_check` and `project_tools` important signals. This official-load layer keeps those constraints visible:

- student packets require a concrete `completion_check`
- project-based teacher guides require `project_tools` when applicable
- Literacy packages must not treat support prompts as completion evidence
- Careers packages must identify the product, criteria, and artifact evidence

## Files added in this pass

```text
school-year/2026-2027/official-course-load.yaml
school-year/2026-2027/semester-1.yaml
school-year/2026-2027/semester-2.yaml
courses/psychology-11-12/course-profile.yaml
courses/literacy/course-profile.yaml
courses/careers-10/course-profile.yaml
fixtures/course-load/official-2026-2027.proof.json
tests/node/official-course-load.test.mjs
```

## Verification command

Run:

```bash
pnpm test
```

The new course-load test is intentionally lightweight. It does not parse YAML with a new dependency. It checks that the official-load source file, proof fixture, and course profiles preserve the core assumptions.

## Next repo work

1. Add a formal course-load schema or parser when the engine starts consuming this data directly.
2. Add Literacy Cohort 2 learner-profile placeholders.
3. Build the Psychology 11/12 semester spine.
4. Build the Careers 10 package-type map.
5. Connect generated packages to `course_instance_id` metadata before scaling content.
