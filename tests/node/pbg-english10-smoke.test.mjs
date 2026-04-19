import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function pythonWithReportlabAvailable() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status !== 0) continue
    const rl = spawnSync(cmd, ['-c', 'import reportlab'], { stdio: 'ignore' })
    if (rl.status === 0) return true
  }
  return false
}

test('pbg_english10 fixture validates and routes cleanly', async () => {
  const { planPackageRoutes } = await import('../../engine/planner/output-router.mjs')
  const { loadJson } = await import('../../scripts/lib.mjs')
  const pkg = loadJson('fixtures/plan-build-grow/pbg_english10.json')
  const { validation, routes } = planPackageRoutes(pkg)
  assert.equal(validation.valid, true, `Validation failed: ${JSON.stringify(validation.errors)}`)
  assert.ok(routes.length > 0, 'Expected at least one route')
  const hasTaskSheet = routes.some(r => r.output_type === 'task_sheet')
  assert.ok(hasTaskSheet, 'Expected at least one task_sheet route')
})

test('pbg_english10 smoke renders when python path is available', { timeout: 60000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-pbg-english10-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--fixture', 'pbg_english10', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )
    assert.equal(
      result.status, 0,
      `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )
    assert.ok(existsSync(resolve(outDir, 'w1_task_sheet.pdf')), 'w1_task_sheet.pdf not found')
    assert.ok(existsSync(resolve(outDir, 'w1_exit.pdf')), 'w1_exit.pdf not found')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
