import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export const repoRoot = process.cwd()
export const repoPath = (...parts) => resolve(repoRoot, ...parts)

export const FIXTURE_MAP = {
  benchmark1: 'fixtures/core/benchmark-1.grade2-math.json',
  challenge7: 'fixtures/core/challenge-7.grade8-sequence.json',
  science8Ecosystems: 'fixtures/generated/science-8-human-impacts-ecosystems.grade8-science.json',
  ela8Argument: 'fixtures/generated/ela-8-community-issue-argument.grade8-ela.json',
  careers8Clusters: 'fixtures/generated/careers-8-career-clusters.grade8-careers.json',
  biology11Enzymes: 'fixtures/generated/biology-11-enzyme-activity-factors.grade11-biology.json',
  ela8ArgumentRev2: 'fixtures/generated/ela-8-community-issue-argument.grade8-ela.revision-v2.json',
  careers8ClustersEngagementV2: 'fixtures/generated/careers-8-career-clusters-engagement-v2.grade8-careers.json',
  careers8TechnologyUse: 'fixtures/generated/careers-8-technology-use-school-workplace.grade8-careers.json',
  ela8VariantProof: 'fixtures/generated/ela-8-community-issue-argument.variant-proof.json',
}

export function ensureExists(path, label = path) {
  if (!existsSync(path)) {
    console.error(`Missing required path: ${label}`)
    process.exit(1)
  }
}

export function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

export function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

export function hasFlag(flag) {
  return process.argv.includes(flag)
}

export function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function resolvePackageArg(packageArg, fixtureArg) {
  return fixtureArg ? FIXTURE_MAP[fixtureArg] : packageArg
}

function toGlobRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const glob = escaped.replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${glob}$`, 'i')
}

export function listFixtures() {
  return Object.entries(FIXTURE_MAP).sort(([a], [b]) => a.localeCompare(b))
}

export function printFixtureList() {
  console.log('Available fixture shortcuts:')
  for (const [key, path] of listFixtures()) {
    console.log(`  - ${key}: ${path}`)
  }
}

export function fail(message) {
  console.error(`ERROR: ${message}`)
  process.exit(1)
}

export function resolvePackageTargets(packageArg, fixtureArg, fixturePatternArg) {
  const hasPackage = Boolean(packageArg)
  const hasFixture = Boolean(fixtureArg)
  const hasPattern = Boolean(fixturePatternArg)
  const selected = [hasPackage, hasFixture, hasPattern].filter(Boolean).length

  if (selected > 1) {
    fail('Choose exactly one of --package, --fixture, or --fixture-pattern.')
  }

  if (hasPackage) {
    return [{ label: packageArg, path: packageArg, fixtureKey: null }]
  }

  if (hasFixture) {
    const fixturePath = FIXTURE_MAP[fixtureArg]
    if (!fixturePath) {
      fail(`Unknown fixture key "${fixtureArg}". Use --list-fixtures to view valid shortcuts.`)
    }
    return [{ label: fixtureArg, path: fixturePath, fixtureKey: fixtureArg }]
  }

  if (hasPattern) {
    const pattern = toGlobRegex(fixturePatternArg)
    const matched = listFixtures()
      .filter(([key]) => pattern.test(key))
      .map(([key, path]) => ({ label: key, path, fixtureKey: key }))
    if (matched.length === 0) {
      fail(`No fixture shortcuts matched pattern "${fixturePatternArg}". Use --list-fixtures to review keys.`)
    }
    return matched
  }

  return []
}
