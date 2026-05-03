# Nightly Repo Agent Runbook

This runbook explains how the guarded nightly agent should be used in the Mr. Friess Classroom Engine repo.

## Purpose

The agent is for low-risk overnight repo maintenance. Its first job is to surface drift and prepare a clear report, not to autonomously rewrite the engine.

The safe workflow is:

```text
select labelled task
→ validate task scope
→ run repo checks
→ write run report
→ optionally open/update a tracking issue
→ stop
```

## Current implementation level

This scaffold is **dry-run first**.

It can:

- find one issue labelled `agent:nightly`
- reject blocked or vague issues
- run configured audit/validation commands in the workflow
- write `agent-output/nightly-agent-report.md`
- upload the report as a workflow artifact

It does not currently:

- call an AI coding model
- edit implementation files
- create branches with code changes
- create pull requests
- merge pull requests

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
```

The report should say:

- whether an eligible task was found
- which issue was selected
- why it was eligible or rejected
- what validation commands were run
- whether the run is safe to continue
- what a human should decide next

## Human review rule

The agent is not a replacement for review. Any future PR-creating version must open draft PRs only and must not merge itself.

## Upgrade path

Recommended sequence:

1. Keep dry-run task selection/reporting stable.
2. Add read-only issue comment summaries.
3. Add draft PR creation for docs/audit-only tasks.
4. Add limited code edits for tests and contract inventory.
5. Consider core-schema/render edits only after repeated clean runs.
