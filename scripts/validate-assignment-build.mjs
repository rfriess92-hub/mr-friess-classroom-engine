import { existsSync } from 'node:fs'
import process from 'node:process'
import { validateAssignmentBuild } from '../engine/assignment-family/validate-build.mjs'
import { argValue, loadJson, repoPath } from './lib.mjs'

const inputArg = argValue('--input')
if (!inputArg) {
  console.log('Usage: node scripts/validate-assignment-build.mjs --input path/to/assignment-build.json')
  process.exit(0)
}

const inputPath = repoPath(inputArg)
if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputArg}`)
  process.exit(1)
}

const build = loadJson(inputPath)
const result = validateAssignmentBuild(build)
console.log(JSON.stringify({ assignment_build_validation: result }, null, 2))
if (result.judgment === 'block') process.exit(1)
