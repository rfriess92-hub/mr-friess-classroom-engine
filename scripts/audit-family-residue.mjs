#!/usr/bin/env node
// audit-family-residue.mjs
// Scans the codebase for remaining import references to engine/family/* (compatibility residue).
// Run with: node scripts/audit-family-residue.mjs
// When this script reports zero results, engine/family/* is safe to remove.

import { execSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

const patterns = [
  "engine/family/",
  "from '../family/",
  'from "../family/',
  "require('./family/",
  'require("./family/',
]

let found = false

for (const pattern of patterns) {
  let result
  try {
    result = execSync(
      `grep -rn --include="*.mjs" --include="*.js" --include="*.ts" --include="*.py" "${pattern}" "${ROOT}/engine" "${ROOT}/scripts" "${ROOT}/tests"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
  } catch {
    // grep exits non-zero when no matches — that's a success
    continue
  }

  if (result.trim()) {
    if (!found) {
      console.log('engine/family/* residue — remaining call sites:\n')
      found = true
    }
    console.log(result.trim())
    console.log('')
  }
}

if (found) {
  console.log('Retire the above callers before removing engine/family/*.')
  process.exit(1)
} else {
  console.log('No engine/family/* call sites found. Safe to remove compatibility residue.')
  process.exit(0)
}
