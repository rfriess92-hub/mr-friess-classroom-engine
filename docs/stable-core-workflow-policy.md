# Mr. Friess Classroom Engine — Stable-Core Workflow Policy

## Purpose

This policy governs the frozen stable-core package pipeline.

It exists to protect:

1. pipeline integrity
2. clean defect classification
3. repeatable artifact generation across content proofs

This policy applies to work involving:

- repo structure
- schema validation
- route planning
- render pipeline behavior
- PPTX/PDF generation
- artifact QA
- bundle QA
- output paths
- template bugs
- CLI workflow
- regression review

It does not authorize pedagogy invention or lesson rewriting unless a task is explicitly classified as content authoring.

---

## Core rule

**Do not mix content changes, renderer fixes, and QA/tooling changes in the same PR unless the PR is explicitly classified to do so.**

A PR may reveal a problem outside its class.
A PR may document that problem.
A PR may not silently absorb that problem unless it is reclassified and reviewed under the stricter standard for that class.

---

## Source-of-truth workflow

For stable-core package work, the acceptance path is:

1. `pnpm run schema:check -- --package <path>`
2. `pnpm run route:plan -- --package <path> --print-routes`
3. `pnpm run render:package -- --package <path> --out output`
4. `pnpm run qa:bundle -- --package <path> --out output`

Use `qa:render` as a drill-down tool for individual artifacts, not as the primary bundle acceptance step.

`build:all` is not the stable-core acceptance path.
It may exist for legacy or ad hoc direct-lesson work, but it must not be treated as the authoritative route for stable-core packages.

---

## PR classes

Every PR must declare exactly one primary class.

### 1. Content PR

Allowed scope:

- briefs
- generated package JSON
- fixtures
- package metadata directly tied to lesson/package content

Not allowed:

- renderer logic
- template/layout behavior
- route planner behavior
- schema logic
- QA rules
- output naming/path behavior

Purpose:

A content PR proves whether the current engine can render a package shape cleanly.
It does not repair renderer defects exposed by the package.

### 2. Renderer PR

Allowed scope:

- PPTX renderers
- PDF renderers
- template/layout behavior
- theme maps
- artifact formatting behavior
- render-time text placement logic
- footer/header/card/scaffold rendering behavior

Not allowed:

- broad content rewriting to hide renderer defects
- unrelated schema changes
- unrelated QA policy changes

Purpose:

A renderer PR fixes output behavior while preserving the frozen stable-core pipeline shape.
Renderer PRs should be small, isolated, and regression-tested.

### 3. QA PR

Allowed scope:

- artifact QA
- bundle QA
- release gates
- assertions
- render validation checks
- structural or semantic QA coverage

Not allowed:

- redefining acceptance criteria to excuse known bad renders
- unrelated renderer rewrites
- unrelated content changes

Purpose:

A QA PR adds or tightens guardrails after a defect has been understood.
QA should not be used to mask renderer problems.

### 4. Tooling PR

Allowed scope:

- CLI workflow
- script wiring
- output directories
- package-scoped orchestration
- environment checks
- build command behavior
- repo maintenance tied to pipeline execution

Not allowed:

- pedagogical/content rewriting
- template/layout fixes hidden inside tooling work

Purpose:

A tooling PR improves execution reliability and operator clarity without changing the intended artifact contract.

---

## Required branch naming

Use one of the following branch prefixes:

- `content/<slug>`
- `renderer/<slug>`
- `qa/<slug>`
- `tooling/<slug>`

Examples:

- `content/ela8-community-issue-argument-v1`
- `renderer/remove-pptx-scaffold-headings`
- `qa/catch-visible-scaffold-tokens`
- `tooling/package-flow-output-guardrails`

---

## Required PR title prefixes

Use one of the following prefixes:

- `Content:`
- `Renderer:`
- `QA:`
- `Tooling:`

Examples:

- `Content: Add Grade 8 ELA community issue argument sequence`
- `Renderer: Remove visible PPTX scaffold headings for plain-string rows`
- `QA: Fail artifact review on visible scaffold tokens`
- `Tooling: Clarify stable-core package render entrypoint`

---

## Required defect classification

Every discovered issue must be classified before anyone proposes a fix.

Allowed defect labels:

- `content_problem`
- `renderer_problem`
- `repo_tooling_problem`

Each review note must state:

1. the defect label
2. the evidence for the label
3. whether the current PR is allowed to fix it

Example format:

- `renderer_problem` — visible labels like `Row 1` / `Prompt 1` are injected by PPTX renderer fallback behavior, not authored in the package payload. Current PR is content-only, so do not fix here.

---

## Review gates by PR class

### Content PR review gates

Required:

- package passes `schema:check`
- package routes are sane in `route:plan`
- package renders through `render:package`
- bundle passes `qa:bundle` structurally
- visible outputs are manually inspected
- all discovered failures are classified

Not allowed:

- patching renderer logic inside the same PR unless the PR is explicitly reclassified

Content PR approval standard:

A content PR may be approved only if:

- the package is structurally valid, and
- any discovered defect outside content scope is documented with a follow-up action

A content PR should not silently absorb renderer cleanup.

### Renderer PR review gates

Required:

- identify the exact renderer file(s) touched
- identify the content PR or fixture that exposed the problem
- make the smallest safe change
- rerun at least one older package and one currently affected package
- confirm no regression in output family coverage

Strong preference:

- one defect family per renderer PR
- no schema changes unless strictly required

Renderer PR approval standard:

A renderer PR may be approved only if the change is narrow, explicit, and regression-reviewed.

### QA PR review gates

Required:

- name the known historical defect the check is meant to catch
- show that the new QA rule would have caught that defect
- show that the rule does not broaden into unrelated failures without justification

Not allowed:

- weakening failures to let known bad artifacts pass

QA PR approval standard:

A QA PR may be approved only if it increases signal without hiding a real defect.

### Tooling PR review gates

Required:

- explain exactly which operator confusion or execution failure it fixes
- confirm that stable-core package workflow remains authoritative
- confirm that output paths and route behavior remain predictable

Tooling PR approval standard:

A tooling PR may be approved only if it improves execution clarity without shifting content/render responsibilities.

---

## Manual acceptance criteria for stable-core artifacts

A stable-core package should not be treated as acceptable merely because files exist.

Manual acceptance requires:

- schema pass
- route-plan sanity
- render completion
- bundle QA pass
- no visible scaffold leakage
- no audience leakage
- no obviously broken layout
- no clearly wrong theme fallback when a valid theme exists

Until semantic QA is strengthened, these remain partly manual and must be reviewed honestly.

---

## Handling proof PRs

A proof PR is a repeatability test, not just a content addition.

Workflow for a proof PR:

1. open the content PR
2. run the stable-core package workflow
3. classify all observed failures
4. freeze the content PR if the failures are renderer/tooling/QA defects
5. open the smallest valid follow-up PR in the correct class
6. merge the fix
7. rerun the proof PR
8. decide merge status

Do not bury pipeline defects inside proof-package edits.

---

## Repo laws

### Law 1

**No PR may both reveal and silently fix a renderer defect unless it is explicitly a renderer PR.**

### Law 2

**Stable-core package acceptance must use the package workflow, not ad hoc direct builders.**

### Law 3

**Every visible defect must be assigned to content, renderer, or repo/tooling before a fix is proposed.**

### Law 4

**Small safe fixes are preferred, but not at the cost of hiding the true defect class.**

---

## Decision rules for reviewers

When a defect is found, ask in order:

1. Is the wrong thing present in the source package?
   - If yes, likely `content_problem`.
2. Is the source package reasonable but the artifact is visibly wrong?
   - If yes, likely `renderer_problem`.
3. Is the output process, command path, naming, or gate behavior causing confusion or unreliable results?
   - If yes, likely `repo_tooling_problem`.

Do not skip this classification step.

---

## Recommended near-term enforcement sequence

1. Keep proof/content PRs content-only.
2. Move renderer defects into dedicated renderer PRs.
3. After the renderer fix lands, add a QA rule that would catch the defect next time.
4. Prefer sequential small PRs over blended convenience PRs.
