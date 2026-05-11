import { mkdirSync, rmSync } from 'node:fs'
import { basename } from 'node:path'
import { spawnSync } from 'node:child_process'
import { repoPath } from './lib.mjs'

const outDir = repoPath('output', 'pbg-render-proof-baseline')

const packages = [
  'fixtures/plan-build-grow/pbg_math8_complete_coverage_addon_v2.json',
  'fixtures/plan-build-grow/pbg_science8_ecosystems_garden_addon.json',
  'fixtures/plan-build-grow/pbg_ela8_community_garden_evidence_addon_v2.json',
  'fixtures/tests/a1-assessment-quiz.proof.json',
  'fixtures/generated/careers-8-career-clusters.grade8-careers.json',
  'fixtures/tests/task-sheet-response-patterns.workshop-session.json',
]

const checks = [
  ['schema', ['pnpm', 'run', 'schema:check']],
  ['route', ['pnpm', 'run', 'route:plan']],
  ['render', ['pnpm', 'run', 'render:package']],
  ['bundle-qa', ['pnpm', 'run', 'qa:bundle']],
  ['answer-leak-qa', ['pnpm', 'run', 'qa:assessment-answer-leak']],
  ['qa-report', ['pnpm', 'run', 'qa:report']],
]

function run(label, command, args) {
  console.log(`\n===== ${label} =====`)
  console.log([command, ...args].join(' '))
  const result = spawnSync(command, args, {
    cwd: repoPath('.'),
    encoding: 'utf-8',
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`)
  }
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const packagePath of packages) {
  const packageName = basename(packagePath, '.json')
  const packageOutDir = `${outDir}/${packageName}`
  mkdirSync(packageOutDir, { recursive: true })

  for (const [checkName, baseCommand] of checks) {
    const [command, ...baseArgs] = baseCommand
    const args = [...baseArgs, '--', '--package', packagePath]
    if (checkName === 'route') args.push('--print-routes')
    if (['render', 'bundle-qa', 'qa-report'].includes(checkName)) args.push('--out', packageOutDir)
    run(`${packageName} ${checkName}`, command, args)
  }
}

console.log('\nPBG render proof baseline passed.')
