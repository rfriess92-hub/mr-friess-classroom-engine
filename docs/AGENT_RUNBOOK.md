# Nightly Repo Agent Runbook

This runbook explains how the guarded nightly agent should be used in the Mr. Friess Classroom Engine repo.

## Purpose

The agent is for low-risk overnight repo maintenance and daily implementation intake. Its first job is to surface drift and prepare a clear daily brief, not to autonomously rewrite the engine.

The safe workflow is:

```text
collect overnight repo signals
→ select one labelled task when available
→ validate task scope
→ run repo checks
→ write nightly report
→ write daily implementation brief
→ stop
```

The nightly workflow is a signal collector. It does not implement. The daily implementation brief is the bridge from overnight information to a separate human-controlled implementation workflow.

## Current implementation level

This scaffold is **dry-run first**.

It can:

- find one issue labelled `agent:nightly`
- reject blocked or vague issues
- run configured audit/validation commands in the workflow
- write `agent-output/selected-task.json`
- write `agent-output/nightly-agent-report.md`
- write `agent-output/daily-implementation-brief.md`
- write `agent-output/daily-implementation-brief.json`
- upload the report and brief as workflow artifacts

It does not currently:

- call an AI coding model
- edit implementation files
- create branches with code changes
- create pull requests
- merge pull requests

## Daily implementation brief

The nightly report is not the endpoint. The workflow also writes a daily implementation brief that can be consumed by a Daily Implementation Intake Agent or a human-controlled implementation workflow.

The brief uses one of three decisions:

```text
IMPLEMENT_TODAY
BLOCKED
NO_SAFE_TASK
```

`IMPLEMENT_TODAY` means the selected task and validation status are good enough for daily intake review. It does not mean the nightly workflow may edit code.

`BLOCKED` means a task was selected but prerequisite checks failed or implementation would be unsafe without human judgment.

`NO_SAFE_TASK` means there is no eligible task to hand off.

Before any implementation work starts, the daily intake must confirm:

- selected issue or phase card
- allowed paths
- protected paths
- required checks
- render/QA proof expectations
- stop conditions
- teacher/student separation
- draft PR or blocked-report handoff

## Labels

Required label:

```text
agent:nightly
```

Optional useful labels:

```text
agent:safe
agent:repo-qa
agent:contract
agent:docs
agent:tests
```

Blocking label:

```text
agent:blocked
```

## Creating a task

Use the `Agent Task` issue template and keep the request small.

Good examples:

```text
Refresh output contract inventory after a schema change.
Add a smoke test for the checkpoint_sheet render path.
Add documentation for KNOWN_UNIMPLEMENTED_TYPES behaviour.
```

Bad examples:

```text
Fix the whole repo.
Add all missing artifact types.
Improve the engine.
```

## Manual run

Use GitHub Actions → `Nightly Repo Agent` → `Run workflow`.

Inputs:

- `dry_run`: keep `true` unless the workflow has been explicitly upgraded
- `max_task_count`: keep `1` for now
- `task_label`: normally `agent:nightly`

## Nightly schedule

The workflow is scheduled for an overnight Vancouver-time window approximation. GitHub cron runs in UTC, so exact local time shifts with daylight saving time.

## Expected output

The workflow writes:

```text
agent-output/selected-task.json
agent-output/nightly-agent-report.md
agent-output/daily-implementation-brief.md
agent-output/daily-implementation-brief.json
```

The nightly report should say:

- whether an eligible task was found
- which issue was selected
- why it was eligible or rejected
- what validation commands were run
- whether the run is safe to continue
- what a human should decide next
- where to find the daily implementation brief

The daily implementation brief should say:

- whether the intake decision is `IMPLEMENT_TODAY`, `BLOCKED`, or `NO_SAFE_TASK`
- which issue or task is selected
- whether prerequisite checks passed
- why implementation may or may not proceed
- what the next daily intake step is
- what hard limits and stop conditions apply

## Human review rule

The agent is not a replacement for review. Any future PR-creating version must open draft PRs only and must not merge itself.

A daily implementation agent may use the brief as intake, but it must still verify scope, allowed paths, protected paths, required checks, and stop conditions before starting work.

## Upgrade path

Recommended sequence:

1. Keep dry-run task selection/reporting stable.
2. Keep daily implementation brief generation stable.
3. Add read-only issue comment summaries.
4. Add manual daily implementation intake from `daily-implementation-brief.json`.
5. Add draft PR creation for docs/audit-only tasks.
6. Add limited code edits for tests and contract inventory.
7. Consider core-schema/render edits only after repeated clean runs.
