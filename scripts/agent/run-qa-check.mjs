#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED_FILES = [
  'agents/phase-implementation.agent.md',
  'agents/qa-cleanup.agent.md',
  'agents/daily-implementation-intake.agent.md',
  'contracts/engine-expansion-contract.md',
  'contracts/page-role-contract.md',
  'contracts/package-render-contract.md',
  'contracts/classroom-content-contract.md',
  'roadmap/phase-backlog.json',
  'roadmap/phase-status.json',
]

const REQUIRED_QA_TERMS = ['teacher/student separation', 'page-role', 'render', 'fixture', 'contract']
const REQUIRED_DAILY_INTAKE_TERMS = ['daily implementation brief', 'implement_today', 'blocked', 'no_safe_task', 'draft pr', 'stop conditions']

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
}

function pass(message) {
  console.log(`PASS: ${message}`)
}

function text(path) {
  return readFileSync(resolve(path), 'utf8')
}

for (const path of REQUIRED_FILES) {
  if (!existsSync(resolve(path))) fail(`Missing required QA scaffold file: ${path}`)
  else pass(`Found ${path}`)
}

if (existsSync(resolve('agents/qa-cleanup.agent.md'))) {
  const qaAgent = text('agents/qa-cleanup.agent.md').toLowerCase()
  for (const term of REQUIRED_QA_TERMS) {
    if (!qaAgent.includes(term)) fail(`QA agent contract missing required concept: ${term}`)
  }
  if (!qaAgent.includes('status: pass / blocked')) fail('QA agent must include required PASS / BLOCKED report structure')
}

if (existsSync(resolve('agents/daily-implementation-intake.agent.md'))) {
  const dailyAgent = text('agents/daily-implementation-intake.agent.md').toLowerCase()
  for (const term of REQUIRED_DAILY_INTAKE_TERMS) {
    if (!dailyAgent.includes(term)) fail(`Daily implementation intake agent missing required concept: ${term}`)
  }
}

if (existsSync(resolve('contracts/page-role-contract.md'))) {
  const pageRole = text('contracts/page-role-contract.md')
  for (const role of ['completion_check', 'project_tools']) {
    if (!pageRole.includes(role)) fail(`Page role contract missing high-risk role: ${role}`)
  }
}

if (existsSync(resolve('contracts/classroom-content-contract.md'))) {
  const classroom = text('contracts/classroom-content-contract.md').toLowerCase()
  for (const phrase of ['bc alignment', 'differentiation', 'student-facing materials must not include']) {
    if (!classroom.includes(phrase)) fail(`Classroom content contract missing phrase: ${phrase}`)
  }
}

if (existsSync(resolve('package.json'))) {
  const pkg = JSON.parse(text('package.json'))
  const scripts = pkg.scripts || {}
  if (scripts['agent:phase-check'] !== 'node scripts/agent/run-phase-check.mjs') fail('package.json missing agent:phase-check script')
  if (scripts['agent:qa-check'] !== 'node scripts/agent/run-qa-check.mjs') fail('package.json missing agent:qa-check script')
}

if (process.exitCode) {
  console.error('QA agent check failed.')
  process.exit(process.exitCode)
}

console.log('QA agent check passed.')
