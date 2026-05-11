import test from 'node:test'
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const packagePath = 'fixtures/generated/planter-box-growth-tracking.grade8-science-adst.json'
const outDir = 'output/planter-box-growth-tracking-smoke'

function pythonWithReportlabAvailable() {
  for (const cmd of ['python', 'python3', 'py']) {
    const versionProbe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (versionProbe.status !== 0) continue
    const reportlabProbe = spawnSync(cmd, ['-c', 'import reportlab'], { stdio: 'ignore' })
    if (reportlabProbe.status === 0) return true
  }
  return false
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
  })
  assert.equal(
    result.status,
    0,
    `${args.join(' ')} failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
  )
  return result
}

test('planter box growth tracking package renders through the repo engine', { timeout: 120000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  rmSync(outDir, { recursive: true, force: true })

  runNode(['scripts/schema-check.mjs', '--package', packagePath])
  const routePlan = runNode(['scripts/route-plan.mjs', '--package', packagePath, '--print-routes'])

  assert.match(routePlan.stdout, /teacher_guide/)
  assert.match(routePlan.stdout, /task_sheet/)
  assert.match(routePlan.stdout, /graphic_organizer/)
  assert.match(routePlan.stdout, /slides/)

  runNode(['scripts/render-package.mjs', '--package', packagePath, '--out', outDir])
  runNode(['scripts/qa-bundle.mjs', '--package', packagePath, '--out', outDir])
})
