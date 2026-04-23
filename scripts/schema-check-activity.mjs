import { existsSync } from 'node:fs'
import process from 'node:process'
import { validateClassroomActivity } from '../engine/activity-family/preflight.mjs'
import { ACTIVITY_FIXTURE_MAP, argValue, loadJson, repoPath, resolveActivityArg } from './lib.mjs'

const activityArg = argValue('--activity')
const fixtureArg = argValue('--fixture')
const resolvedActivityArg = resolveActivityArg(activityArg, fixtureArg)

if (!existsSync(repoPath('schemas', 'classroom-activity.schema.json')) || !existsSync(repoPath('schemas', 'activity-bank.schema.json'))) {
  console.error('Missing classroom activity schemas under /schemas.')
  process.exit(1)
}

if (!resolvedActivityArg) {
  console.log('Classroom activity schema check is present.')
  console.log('Usage: pnpm run schema:check:activity -- --activity fixtures/activities/example.classroom-activity.json')
  console.log(`Fixture shortcuts: ${Object.keys(ACTIVITY_FIXTURE_MAP).map((key) => `--fixture ${key}`).join(' | ')}`)
  process.exit(0)
}

const activityPath = repoPath(resolvedActivityArg)
if (!existsSync(activityPath)) {
  console.error(`Activity file not found: ${resolvedActivityArg}`)
  process.exit(1)
}

const activity = loadJson(activityPath)
const validation = validateClassroomActivity(activity)

console.log(`Activity: ${activity.activity_id ?? '(missing activity_id)'}`)
console.log(`Family: ${activity.activity_family ?? '(missing activity_family)'}`)
console.log(`Subtype: ${activity.activity_subtype ?? '(missing activity_subtype)'}`)
console.log(`Validation status: ${validation.valid ? 'PASS' : 'FAIL'}`)
console.log(`Errors: ${validation.errors.length}`)
console.log(`Warnings: ${validation.warnings.length}`)

for (const error of validation.errors) {
  console.log(`ERROR [${error.code}] ${error.message}${error.path ? ` @ ${error.path}` : ''}`)
}
for (const warning of validation.warnings) {
  console.log(`WARN  [${warning.code}] ${warning.message}${warning.path ? ` @ ${warning.path}` : ''}`)
}

process.exit(validation.valid ? 0 : 1)
