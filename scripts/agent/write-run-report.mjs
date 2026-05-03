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

function loadJsonIfPresent(path, fallback) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8'))
}

mkdirSync(outDir, { recursive: true })

const selection = loadJsonIfPresent(resolve(outDir, 'selected-task.json'), {
  selected: false,
  reason: 'selected_task_json_missing',
})

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

lines.push('## Human Next Step')
lines.push('')
if (selection.selected) {
  lines.push('Review the selected issue and validation status. If the task is safe, assign it to a human or upgrade the agent with a narrowly scoped write-mode PR.')
} else {
  lines.push('Add a small, specific issue using the Agent Task template.')
}
lines.push('')

writeFileSync(resolve(outDir, 'nightly-agent-report.md'), `${lines.join('\n')}\n`, 'utf8')
console.log(lines.join('\n'))
