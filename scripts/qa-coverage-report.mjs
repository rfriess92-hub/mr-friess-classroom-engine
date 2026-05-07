#!/usr/bin/env node
// qa-coverage-report.mjs
// Cross-references declared architectures and output types against current fixture coverage.
// Run with: node scripts/qa-coverage-report.mjs
// Prints a gap table showing which declared surfaces lack fixture coverage.

const DECLARED_ARCHITECTURES = [
  'single_period_full',
  'multi_day_sequence',
  'three_day_sequence',
  'workshop_session',
  'lab_investigation',
  'seminar',
  'project_sprint',
  'station_rotation',
]

const DECLARED_OUTPUT_TYPES = [
  'teacher_guide',
  'lesson_overview',
  'slides',
  'worksheet',
  'task_sheet',
  'checkpoint_sheet',
  'exit_ticket',
  'final_response_sheet',
  'graphic_organizer',
  'discussion_prep_sheet',
  'pacing_guide',
  'sub_plan',
  'makeup_packet',
]

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const FIXTURES_DIR = path.join(ROOT, 'fixtures')

function collectJsonFiles(dir) {
  let results = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) results = results.concat(collectJsonFiles(full))
      else if (entry.name.endsWith('.json')) results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

const files = collectJsonFiles(FIXTURES_DIR)

const seenArchitectures = new Set()
const seenOutputTypes = new Set()

for (const file of files) {
  try {
    const content = readFileSync(file, 'utf8')
    const json = JSON.parse(content)
    if (json.architecture) seenArchitectures.add(json.architecture)
    if (Array.isArray(json.outputs)) {
      for (const out of json.outputs) {
        if (out.type) seenOutputTypes.add(out.type)
      }
    }
  } catch {
    // skip malformed fixtures
  }
}

console.log('\n=== Architecture Coverage ===')
for (const arch of DECLARED_ARCHITECTURES) {
  const status = seenArchitectures.has(arch) ? '✓ covered' : '✗ NO FIXTURE'
  console.log(`  ${status.padEnd(12)} ${arch}`)
}

console.log('\n=== Output Type Coverage ===')
for (const type of DECLARED_OUTPUT_TYPES) {
  const status = seenOutputTypes.has(type) ? '✓ covered' : '✗ NO FIXTURE'
  console.log(`  ${status.padEnd(12)} ${type}`)
}

console.log('')
