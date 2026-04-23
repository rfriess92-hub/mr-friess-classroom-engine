import { existsSync } from 'node:fs'
import process from 'node:process'
import { selectActivityFamilyFromActivity } from '../engine/activity-family/family-selector.mjs'
import { ACTIVITY_FIXTURE_MAP, argValue, loadJson, repoPath, resolveActivityArg } from './lib.mjs'

const activityArg = argValue('--activity')
const fixtureArg = argValue('--fixture')
const resolvedActivityArg = resolveActivityArg(activityArg, fixtureArg)

if (!resolvedActivityArg) {
  console.log('Classroom activity family selector is present.')
  console.log('Usage: pnpm run select:activity-family -- --activity fixtures/activities/example.classroom-activity.json')
  console.log(`Fixture shortcuts: ${Object.keys(ACTIVITY_FIXTURE_MAP).map((key) => `--fixture ${key}`).join(' | ')}`)
  process.exit(0)
}

const activityPath = repoPath(resolvedActivityArg)
if (!existsSync(activityPath)) {
  console.error(`Activity file not found: ${resolvedActivityArg}`)
  process.exit(1)
}

const activity = loadJson(activityPath)
const selection = selectActivityFamilyFromActivity(activity)
console.log(JSON.stringify(selection, null, 2))
process.exit(selection.valid ? 0 : 1)
