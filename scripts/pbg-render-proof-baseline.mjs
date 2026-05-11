import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { spawnSync } from 'node:child_process'
import { repoPath } from './lib.mjs'

const outDir = repoPath('output', 'pbg-render-proof-baseline')
const summaryPath = `${outDir}/baseline-summary.json`
const reportPath = `${outDir}/baseline-summary.md`
const failurePath = `${outDir}/baseline-failure.md`
const outputTailLength = 12000

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

const results = []

function tail(text = '') {
  if (text.length <= outputTailLength) return text
  return text.slice(-outputTailLength)
}

function renderMarkdownSummary() {
  const failure = results.find((result) => result.status !== 0 || result.signal || result.error)
  const lines = [
    '# PBG render proof baseline summary',
    '',
    `Status: ${failure ? 'failed' : 'passed'}`,
    `Completed checks: ${results.filter((result) => result.status === 0 && !result.signal && !result.error).length}/${packages.length * checks.length}`,
    '',
    '## Checks',
    '',
    '| Package | Check | Status | Exit | Duration ms |',
    '| --- | --- | ---: | ---: | ---: |',
  ]

  for (const result of results) {
    lines.push(`| ${result.packageName} | ${result.checkName} | ${result.status === 0 && !result.signal && !result.error ? 'pass' : 'fail'} | ${result.status ?? result.signal ?? 'error'} | ${result.durationMs} |`)
  }

  if (failure) {
    lines.push(
      '',
      '## First failure',
      '',
      `Package: ${failure.packagePath}`,
      `Check: ${failure.checkName}`,
      `Command: \`${failure.commandLine}\``,
      `Exit: ${failure.status ?? 'null'}`,
      `Signal: ${failure.signal ?? 'none'}`,
      `Error: ${failure.error ?? 'none'}`,
      '',
      '### Stdout tail',
      '',
      '```text',
      failure.stdoutTail || '(empty)',
      '```',
      '',
      '### Stderr tail',
      '',
      '```text',
      failure.stderrTail || '(empty)',
      '```',
    )
  }

  return `${lines.join('\n')}\n`
}

function writeSummaryFiles() {
  const payload = {
    status: results.some((result) => result.status !== 0 || result.signal || result.error) ? 'failed' : 'passed',
    expectedChecks: packages.length * checks.length,
    completedChecks: results.filter((result) => result.status === 0 && !result.signal && !result.error).length,
    results,
  }

  writeFileSync(summaryPath, `${JSON.stringify(payload, null, 2)}\n`)
  writeFileSync(reportPath, renderMarkdownSummary())

  const failure = results.find((result) => result.status !== 0 || result.signal || result.error)
  if (failure) {
    writeFileSync(failurePath, renderMarkdownSummary())
  }
}

function run({ packageName, packagePath, checkName, command, args }) {
  const commandLine = [command, ...args].join(' ')
  console.log(`\n===== ${packageName} ${checkName} =====`)
  console.log(commandLine)

  const startedAt = Date.now()
  const result = spawnSync(command, args, {
    cwd: repoPath('.'),
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 20,
    shell: process.platform === 'win32',
  })
  const durationMs = Date.now() - startedAt

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  const record = {
    packageName,
    packagePath,
    checkName,
    commandLine,
    status: result.status,
    signal: result.signal,
    error: result.error ? result.error.message : null,
    durationMs,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr),
  }
  results.push(record)
  writeSummaryFiles()

  if (result.status !== 0 || result.signal || result.error) {
    throw new Error(`${packageName} ${checkName} failed; see ${failurePath}`)
  }
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
writeSummaryFiles()

for (const packagePath of packages) {
  const packageName = basename(packagePath, '.json')
  const packageOutDir = `${outDir}/${packageName}`
  mkdirSync(packageOutDir, { recursive: true })

  for (const [checkName, baseCommand] of checks) {
    const [command, ...baseArgs] = baseCommand
    const args = [...baseArgs, '--', '--package', packagePath]
    if (checkName === 'route') args.push('--print-routes')
    if (['render', 'bundle-qa', 'qa-report'].includes(checkName)) args.push('--out', packageOutDir)
    run({ packageName, packagePath, checkName, command, args })
  }
}

writeSummaryFiles()
console.log('\nPBG render proof baseline passed.')
