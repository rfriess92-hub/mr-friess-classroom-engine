#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED_AGENT_FILES = ['agents/phase-implementation.agent.md', 'agents/qa-cleanup.agent.md']
const REQUIRED_CONTRACT_FILES = [
  'contracts/engine-expansion-contract.md',
  'contracts/page-role-contract.md',
  'contracts/package-render-contract.md',
  'contracts/classroom-content-contract.md',
]
const REQUIRED_ROADMAP_FILES = ['roadmap/phase-backlog.json', 'roadmap/phase-status.json']

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
}

function pass(message) {
  console.log(`PASS: ${message}`)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'))
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`)
    return null
  }
}

function checkExists(path) {
  if (!existsSync(resolve(path))) {
    fail(`Missing required file: ${path}`)
    return false
  }
  pass(`Found ${path}`)
  return true
}

for (const path of [...REQUIRED_AGENT_FILES, ...REQUIRED_CONTRACT_FILES, ...REQUIRED_ROADMAP_FILES]) checkExists(path)

const backlog = readJson('roadmap/phase-backlog.json')
const status = readJson('roadmap/phase-status.json')

if (backlog) {
  if (backlog.schema_version !== 1) fail('roadmap/phase-backlog.json must use schema_version 1')
  if (!Array.isArray(backlog.phases) || backlog.phases.length === 0) {
    fail('roadmap/phase-backlog.json must include at least one phase')
  } else {
    const ids = new Set()
    for (const phase of backlog.phases) {
      if (!phase.id) fail('Every phase must include id')
      if (ids.has(phase.id)) fail(`Duplicate phase id: ${phase.id}`)
      ids.add(phase.id)
      if (!phase.title) fail(`${phase.id} missing title`)
      if (!phase.goal) fail(`${phase.id} missing goal`)
      if (!phase.type) fail(`${phase.id} missing type`)
      if (!Array.isArray(phase.allowed_areas) || phase.allowed_areas.length === 0) fail(`${phase.id} must declare allowed_areas`)
      if (!Array.isArray(phase.protected_areas)) fail(`${phase.id} must declare protected_areas`)
      if (!Array.isArray(phase.required_checks) || phase.required_checks.length === 0) fail(`${phase.id} must declare required_checks`)
    }
    pass(`Validated ${backlog.phases.length} phase card(s)`)
  }
}

if (status) {
  if (status.schema_version !== 1) fail('roadmap/phase-status.json must use schema_version 1')
  if (!status.phases || typeof status.phases !== 'object') fail('roadmap/phase-status.json must include phases object')
}

if (backlog && status && Array.isArray(backlog.phases) && status.phases) {
  for (const phase of backlog.phases) {
    if (!status.phases[phase.id]) fail(`phase-status.json missing phase id from backlog: ${phase.id}`)
  }
  pass('Phase backlog and status tracker are aligned')
}

if (process.exitCode) {
  console.error('Phase agent check failed.')
  process.exit(process.exitCode)
}

console.log('Phase agent check passed.')
