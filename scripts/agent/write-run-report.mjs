#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outDir = resolve(process.env.AGENT_OUTPUT_DIR || 'agent-output')
const dryRun = process.env.AGENT_DRY_RUN !== 'false'
const taskLabel = process.env.AGENT_TASK_LABEL || 'agent:nightly'
const auditStatus = process.env.AGENT_AUDIT_STATUS || 'not_run'
const testStatus = process.env.AGENT_TEST_STATUS || 'not_run'
const workflowName = process.env.GITHUB_WORKFLOW || 'Nightly Repo Agent'
const runId = process.env.GITHUB_RUN_ID || 'local'
const repo = process.env.GITHUB_REPOSITORY || 'local'
const generatedAt = new Date().toISOString()

function loadJsonIfPresent(path, fallback) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8'))
}

function statusPassed(status) {
  return status === 'success'
}

function buildDailyBriefPayload(selection) {
  const selectedTask = selection.selected ? selection.selected_task : null
  const validationPassed = statusPassed(auditStatus) && statusPassed(testStatus)
  const blockingReasons = []

  if (!selectedTask) {
    blockingReasons.push(selection.reason || 'no_safe_task')
  }

  if (!statusPassed(auditStatus)) {
    blockingReasons.push(`contract_audit_${auditStatus}`)
  }

  if (!statusPassed(testStatus)) {
    blockingReasons.push(`test_suite_${testStatus}`)
  }

  const decision = selectedTask && validationPassed
    ? 'IMPLEMENT_TODAY'
    : selectedTask
      ? 'BLOCKED'
      : 'NO_SAFE_TASK'

  return {
    schema_version: 1,
    decision,
    source: {
      repository: repo,
      workflow: workflowName,
      run_id: runId,
      generated_at: generatedAt,
      dry_run: dryRun,
      task_label: taskLabel,
    },
    selected_work: selectedTask
      ? {
          issue_number: selectedTask.number,
          title: selectedTask.title,
          url: selectedTask.url,
          labels: selectedTask.labels || [],
          body_excerpt: selectedTask.body_excerpt || '',
        }
      : null,
    validation: {
      contract_audit: auditStatus,
      test_suite: testStatus,
      all_required_checks_passed: validationPassed,
    },
    daily_intake: {
      may_implement: decision === 'IMPLEMENT_TODAY',
      handoff_target: decision === 'IMPLEMENT_TODAY'
        ? 'Daily Implementation Intake Agent'
        : 'Human triage',
      blocking_reasons: blockingReasons,
      next_step: decision === 'IMPLEMENT_TODAY'
        ? 'Convert this selected work into one bounded implementation task with allowed paths, protected paths, required checks, and stop conditions.'
        : 'Do not implement from this brief. Resolve the blocking reasons or provide a specific phase card / labelled issue.',
    },
    constraints: {
      allowed_modes: [
        'specific labelled issue',
        'approved phase card',
        'narrow docs/tests/contract alignment',
      ],
      hard_limits: [
        'nightly workflow must not edit implementation files',
        'do not push directly to main',
        'do not merge pull requests',
        'do not make broad rewrites',
        'do not weaken tests',
        'do not bypass teacher/student separation',
      ],
      stop_conditions: [
        'selected work is vague',
        'required checks failed',
        'protected paths are needed without explicit approval',
        'classroom content direction requires human judgment',
        'render proof cannot be produced',
      ],
    },
  }
}

function writeNightlyReport(selection) {
  const lines = []
  lines.push('# Nightly Repo Agent Report')
  lines.push('')
  lines.push(`Repository: \`${repo}\``)
  lines.push(`Workflow: \`${workflowName}\``)
  lines.push(`Run ID: \`${runId}\``)
  lines.push(`Dry run: \`${dryRun}\``)
  lines.push(`Task label: \`${taskLabel}\``)
  lines.push('')

  lines.push('## Selected Task')
  lines.push('')
  if (selection.selected) {
    const task = selection.selected_task
    lines.push(`- Issue: #${task.number} — ${task.title}`)
    lines.push(`- URL: ${task.url}`)
    lines.push(`- Labels: ${(task.labels || []).map((label) => `\`${label}\``).join(', ') || 'none'}`)
    lines.push('')
    lines.push('### Body excerpt')
    lines.push('')
    lines.push('```text')
    lines.push(task.body_excerpt || '(empty)')
    lines.push('```')
  } else {
    lines.push(`No eligible task selected. Reason: \`${selection.reason || 'unknown'}\``)
  }
  lines.push('')

  if (selection.rejected?.length) {
    lines.push('## Rejected Tasks')
    lines.push('')
    for (const rejected of selection.rejected) {
      lines.push(`- #${rejected.number} — ${rejected.title}: \`${rejected.reason}\``)
    }
    lines.push('')
  }

  lines.push('## Validation Summary')
  lines.push('')
  lines.push(`- Contract audit: \`${auditStatus}\``)
  lines.push(`- Test suite: \`${testStatus}\``)
  lines.push('')

  lines.push('## Agent Decision')
  lines.push('')
  if (!selection.selected) {
    lines.push('No repo changes should be attempted. Create or relabel a specific issue with `agent:nightly` to give the agent work.')
  } else if (dryRun) {
    lines.push('Dry run only. The agent selected a task and reported validation status, but did not modify code or open a PR.')
  } else {
    lines.push('Write mode is not implemented in this scaffold. The workflow should still behave as reporting-only until a later explicit upgrade.')
  }
  lines.push('')

  lines.push('## Daily Implementation Handoff')
  lines.push('')
  lines.push('The nightly report is not the endpoint. It now also writes a filtered daily implementation brief:')
  lines.push('')
  lines.push('- `agent-output/daily-implementation-brief.md`')
  lines.push('- `agent-output/daily-implementation-brief.json`')
  lines.push('')
  lines.push('The daily brief may recommend `IMPLEMENT_TODAY`, but it does not authorize direct nightly edits. A daily implementation intake must still confirm scope, allowed paths, protected paths, required checks, and stop conditions before any branch or draft PR work.')
  lines.push('')

  lines.push('## Human Next Step')
  lines.push('')
  if (selection.selected) {
    lines.push('Review the selected issue, validation status, and daily implementation brief. If the brief says `IMPLEMENT_TODAY`, route it through the Daily Implementation Intake Agent or a human-controlled implementation workflow.')
  } else {
    lines.push('Add a small, specific issue using the Agent Task template.')
  }
  lines.push('')

  return `${lines.join('\n')}\n`
}

function writeDailyBriefMarkdown(payload) {
  const lines = []
  const selected = payload.selected_work
  lines.push('# Daily Implementation Brief')
  lines.push('')
  lines.push(`Decision: \`${payload.decision}\``)
  lines.push('')
  lines.push('This is an intake artifact. It does not authorize the nightly workflow to edit implementation files, push branches, open PRs, or merge work.')
  lines.push('')
  lines.push('## Source')
  lines.push('')
  lines.push(`- Repository: \`${payload.source.repository}\``)
  lines.push(`- Workflow: \`${payload.source.workflow}\``)
  lines.push(`- Run ID: \`${payload.source.run_id}\``)
  lines.push(`- Generated at: \`${payload.source.generated_at}\``)
  lines.push(`- Dry run: \`${payload.source.dry_run}\``)
  lines.push(`- Task label: \`${payload.source.task_label}\``)
  lines.push('')

  lines.push('## Selected Work')
  lines.push('')
  if (selected) {
    lines.push(`- Issue: #${selected.issue_number} — ${selected.title}`)
    lines.push(`- URL: ${selected.url}`)
    lines.push(`- Labels: ${selected.labels.map((label) => `\`${label}\``).join(', ') || 'none'}`)
    lines.push('')
    lines.push('### Body excerpt')
    lines.push('')
    lines.push('```text')
    lines.push(selected.body_excerpt || '(empty)')
    lines.push('```')
  } else {
    lines.push('- None')
  }
  lines.push('')

  lines.push('## Validation')
  lines.push('')
  lines.push(`- Contract audit: \`${payload.validation.contract_audit}\``)
  lines.push(`- Test suite: \`${payload.validation.test_suite}\``)
  lines.push(`- All required checks passed: \`${payload.validation.all_required_checks_passed}\``)
  lines.push('')

  lines.push('## Daily Intake Decision')
  lines.push('')
  lines.push(`- May implement: \`${payload.daily_intake.may_implement}\``)
  lines.push(`- Handoff target: ${payload.daily_intake.handoff_target}`)
  lines.push(`- Next step: ${payload.daily_intake.next_step}`)
  if (payload.daily_intake.blocking_reasons.length) {
    lines.push(`- Blocking reasons: ${payload.daily_intake.blocking_reasons.map((reason) => `\`${reason}\``).join(', ')}`)
  } else {
    lines.push('- Blocking reasons: none')
  }
  lines.push('')

  lines.push('## Required Implementation Filter')
  lines.push('')
  lines.push('Before any daily implementation work starts, confirm:')
  lines.push('')
  lines.push('- the work maps to one specific labelled issue or approved phase card')
  lines.push('- allowed paths are explicit')
  lines.push('- protected paths are explicit')
  lines.push('- required checks are known')
  lines.push('- stop conditions are known')
  lines.push('- teacher/student separation remains protected')
  lines.push('- the result can be handed to QA as a draft PR or blocked report')
  lines.push('')

  lines.push('## Stop Conditions')
  lines.push('')
  for (const condition of payload.constraints.stop_conditions) {
    lines.push(`- ${condition}`)
  }
  lines.push('')

  return `${lines.join('\n')}\n`
}

mkdirSync(outDir, { recursive: true })

const selection = loadJsonIfPresent(resolve(outDir, 'selected-task.json'), {
  selected: false,
  reason: 'selected_task_json_missing',
})

const dailyBriefPayload = buildDailyBriefPayload(selection)

writeFileSync(resolve(outDir, 'nightly-agent-report.md'), writeNightlyReport(selection), 'utf8')
writeFileSync(resolve(outDir, 'daily-implementation-brief.md'), writeDailyBriefMarkdown(dailyBriefPayload), 'utf8')
writeFileSync(resolve(outDir, 'daily-implementation-brief.json'), `${JSON.stringify(dailyBriefPayload, null, 2)}\n`, 'utf8')

console.log(writeNightlyReport(selection))
console.log(`Wrote ${resolve(outDir, 'daily-implementation-brief.md')}`)
console.log(`Wrote ${resolve(outDir, 'daily-implementation-brief.json')}`)
