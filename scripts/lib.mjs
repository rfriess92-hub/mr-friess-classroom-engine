import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

export const repoRoot = process.cwd()
export const repoPath = (...parts) => resolve(repoRoot, ...parts)

export const FIXTURE_MAP = {
  benchmark1: 'fixtures/core/benchmark-1.grade2-math.json',
  challenge7: 'fixtures/core/challenge-7.grade8-sequence.json',
  biology11: 'fixtures/generated/biology-11-enzyme-activity-factors.grade11-biology.json',
  careers8_w1: 'fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json',
  careers8_w2: 'fixtures/generated/careers-8-mosaic-week-2-bias-and-decision-making.grade8-careers.json',
  careers8_w3: 'fixtures/generated/careers-8-mosaic-week-3-community-and-meaning.grade8-careers.json',
  careers8_w4: 'fixtures/generated/careers-8-mosaic-week-4-technology-and-identity.grade8-careers.json',
  careers8_bias: 'fixtures/generated/careers-8-bias-and-decision-making.grade8-careers.json',
  careers8_clusters: 'fixtures/generated/careers-8-career-clusters.grade8-careers.json',
  careers8_clusters_v2: 'fixtures/generated/careers-8-career-clusters-engagement-v2.grade8-careers.json',
  careers8_tech: 'fixtures/generated/careers-8-technology-use-school-workplace.grade8-careers.json',
  ela8: 'fixtures/generated/ela-8-community-issue-argument.grade8-ela.json',
  ela8_v2: 'fixtures/generated/ela-8-community-issue-argument.grade8-ela.revision-v2.json',
  ela8_proof: 'fixtures/generated/ela-8-community-issue-argument.variant-proof.json',
  science8: 'fixtures/generated/science-8-human-impacts-ecosystems.grade8-science.json',
  pbg_day1_launch: 'fixtures/plan-build-grow/pbg_day1_launch.json',
  pbg_week1_shared: 'fixtures/plan-build-grow/pbg_week1_shared.json',
  pbg_week1_english: 'fixtures/plan-build-grow/pbg_week1_english.json',
  pbg_week1_math: 'fixtures/plan-build-grow/pbg_week1_math.json',
  pbg_day1_ws_english: 'fixtures/plan-build-grow/pbg_day1_ws_english.json',
  pbg_day1_ws_math: 'fixtures/plan-build-grow/pbg_day1_ws_math.json',
  pbg_english10: 'fixtures/plan-build-grow/pbg_english10.json',
  pbg_english11: 'fixtures/plan-build-grow/pbg_english11.json',
  pbg_english12: 'fixtures/plan-build-grow/pbg_english12.json',
  pbg_math8: 'fixtures/plan-build-grow/pbg_math8.json',
  pbg_workplace_math10: 'fixtures/plan-build-grow/pbg_workplace_math10.json',
  seminar_proof: 'fixtures/tests/seminar-discussion-prep.proof.json',
  station_rotation_proof: 'fixtures/tests/station-rotation-graphic-organizer.proof.json',
  rubric_sheet_proof: 'fixtures/tests/rubric-sheet.proof.json',
  station_cards_proof: 'fixtures/tests/station-cards.proof.json',
  answer_key_proof: 'fixtures/tests/answer-key.proof.json',
  station_rotation_faithful_proof: 'fixtures/tests/station-rotation-rubric-cards-answer-key.proof.json',
  task_sheet_patterns: 'fixtures/tests/task-sheet-response-patterns.workshop-session.json',
}

export const ACTIVITY_FIXTURE_MAP = {
  morphology_prefix_corners: 'fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json',
  bridge_chunk_to_meaning: 'fixtures/activities/bridge-chunk-to-meaning.classroom-activity.json',
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
  if (result.error) {
    console.error(`Failed to run ${cmd}: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

export function argValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

export function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function resolvePackageArg(packageArg, fixtureArg) {
  return fixtureArg ? FIXTURE_MAP[fixtureArg] : packageArg
}

export function resolveActivityArg(activityArg, fixtureArg) {
  return fixtureArg ? ACTIVITY_FIXTURE_MAP[fixtureArg] : activityArg
}
