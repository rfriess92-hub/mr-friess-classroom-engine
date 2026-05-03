# Nightly Repo Agent Policy

The Nightly Repo Agent is a guarded maintenance helper for the Mr. Friess Classroom Engine.

It exists to reduce repo drift, surface QA failures, and prepare small reviewable work. It is not allowed to act as an unsupervised maintainer.

## Operating mode

Default mode: **Repo / build / rendering / QA**.

The agent must preserve:

- stable-core package contract discipline
- teacher/student separation
- BC-aligned classroom realism
- differentiated but aligned task structure
- explicit validation before any implementation claim

The agent must not perform pedagogy/content expansion unless the labelled issue explicitly requests it and the task remains small.

## Hard limits

The agent must never:

- merge pull requests
- push directly to `main`
- close issues as complete without a human review path
- make broad rewrites
- modify secrets or credentials
- change production render behaviour without tests
- weaken tests to pass a failing run
- silently mark unsupported output types as production
- edit generated classroom content except for minimal proof fixtures

## Allowed first-phase work

The first-phase nightly agent may:

- select labelled GitHub issues
- run repo audits
- run selected validation commands
- write a run report
- open or update a tracking issue when configured
- create draft PRs only in later phases after explicit workflow expansion

## Safe default paths

The first-phase agent may inspect the full repo but should only change these paths once write mode is introduced:

```text
docs/
tests/node/
scripts/audit-*.mjs
scripts/agent/
engine/contracts/
.github/workflows/
.github/ISSUE_TEMPLATE/
.github/AGENT_POLICY.md
```

## Restricted paths

The agent must not change these paths unless the selected issue explicitly grants permission and the PR remains small:

```text
schemas/
engine/schema/
engine/pdf/
engine/pdf-html/templates/
engine/planner/
engine/render/
scripts/render-package.mjs
scripts/generate-package.mjs
fixtures/
```

## Task eligibility

A task is eligible only when it has `agent:nightly` and does not have `agent:blocked`.

Preferred labels:

```text
agent:nightly
agent:safe
agent:repo-qa
agent:contract
agent:docs
agent:tests
```

The agent must reject vague tasks such as:

```text
fix everything
improve the repo
make the engine better
add all missing functionality
```

Good tasks are specific:

```text
Refresh output contract inventory after schema changes.
Add a proof test for checkpoint_sheet render output.
Remove stale variant_role support enum value from the schema.
```

## PR requirements for future write mode

If write mode is added later, every agent PR must include:

- selected issue
- files changed
- validation commands run
- validation result
- known risks
- next human decision

All agent-created PRs must be draft PRs unless a human explicitly changes the workflow policy.
