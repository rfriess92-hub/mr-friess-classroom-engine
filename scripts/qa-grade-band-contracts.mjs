import { existsSync } from 'node:fs'
import process from 'node:process'
import { validateGradeBandContractFit } from '../engine/generation/grade-band-contracts.mjs'
import { FIXTURE_MAP, argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('Grade-band contract QA is present.')
  console.log('Usage: pnpm run qa:grade-band -- --package path/to/package.json')
  console.log(`Fixture shortcuts: ${Object.keys(FIXTURE_MAP).map((key) => `--fixture ${key}`).join(' | ')}`)
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const result = validateGradeBandContractFit(pkg)
console.log(JSON.stringify({ grade_band_contract_qa: result }, null, 2))
if (result.judgment === 'block') process.exit(1)
