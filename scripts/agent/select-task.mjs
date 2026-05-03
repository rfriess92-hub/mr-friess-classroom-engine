#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = process.env.GITHUB_REPOSITORY
const token = process.env.GITHUB_TOKEN
const taskLabel = process.env.AGENT_TASK_LABEL || 'agent:nightly'
const maxTaskCount = Number(process.env.AGENT_MAX_TASK_COUNT || '1')
const outDir = resolve(process.env.AGENT_OUTPUT_DIR || 'agent-output')

const BLOCKING_LABELS = new Set(['agent:blocked'])
const VAGUE_PATTERNS = [
  /fix\s+(the\s+)?(whole\s+)?repo/i,
  /improve\s+(the\s+)?(repo|engine|everything)/i,
  /make\s+it\s+better/i,
  /add\s+all\s+missing/i,
  /do\s+everything/i,
]

function writeSelection(payload) {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'selected-task.json'), JSON.stringify(payload, null, 2), 'utf8')
}

function hasVagueScope(issue) {
  const text = `${issue.title || ''}\n${issue.body || ''}`
  return VAGUE_PATTERNS.some((pattern) => pattern.test(text))
}

function labelNames(issue) {
  return (issue.labels || []).map((label) => typeof label === 'string' ? label : label.name).filter(Boolean)
}

if (!repo || !token) {
  const payload = {
    selected: false,
    reason: 'missing_github_context',
    detail: 'GITHUB_REPOSITORY or GITHUB_TOKEN is not available. This script is intended for GitHub Actions.',
  }
  writeSelection(payload)
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

const queryUrl = new URL(`https://api.github.com/repos/${repo}/issues`)
queryUrl.searchParams.set('state', 'open')
queryUrl.searchParams.set('labels', taskLabel)
queryUrl.searchParams.set('sort', 'updated')
queryUrl.searchParams.set('direction', 'desc')
queryUrl.searchParams.set('per_page', String(Math.max(1, Math.min(10, maxTaskCount * 5))))

const response = await fetch(queryUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
})

if (!response.ok) {
  const payload = {
    selected: false,
    reason: 'github_api_error',
    detail: `GitHub API returned ${response.status}: ${await response.text()}`,
  }
  writeSelection(payload)
  console.log(JSON.stringify(payload, null, 2))
  process.exit(0)
}

const issues = (await response.json()).filter((issue) => !issue.pull_request)
const rejected = []
let selected = null

for (const issue of issues) {
  const labels = labelNames(issue)
  const blocking = labels.find((label) => BLOCKING_LABELS.has(label))
  if (blocking) {
    rejected.push({ number: issue.number, title: issue.title, reason: `blocked_by_${blocking}` })
    continue
  }

  if (hasVagueScope(issue)) {
    rejected.push({ number: issue.number, title: issue.title, reason: 'vague_scope' })
    continue
  }

  selected = {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    labels,
    body_excerpt: String(issue.body || '').slice(0, 1200),
  }
  break
}

const payload = selected
  ? {
      selected: true,
      task_label: taskLabel,
      selected_task: selected,
      rejected,
    }
  : {
      selected: false,
      task_label: taskLabel,
      reason: issues.length === 0 ? 'no_matching_issues' : 'no_eligible_issues',
      rejected,
    }

writeSelection(payload)
console.log(JSON.stringify(payload, null, 2))
