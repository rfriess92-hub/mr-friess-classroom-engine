import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function pythonWithReportlabAvailable() {
  for (const cmd of ['python', 'python3', 'py']) {
    const versionProbe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (versionProbe.status !== 0) continue
    const reportlabProbe = spawnSync(cmd, ['-c', 'import reportlab'], { stdio: 'ignore' })
    if (reportlabProbe.status === 0) return true
  }
  return false
}

test('render-package emits typed block sidecar and block counts in trace', { timeout: 45000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-typed-blocks-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/task-sheet-affordance-polish.workshop-session.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(
      result.status,
      0,
      `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )

    const trace = JSON.parse(readFileSync(resolve(outDir, 'task_sheet_main.trace.json'), 'utf-8'))
    const blocks = JSON.parse(readFileSync(resolve(outDir, 'task_sheet_main.blocks.json'), 'utf-8'))

    assert.equal(trace.artifact_class, 'task_sheet')
    assert.equal(trace.mode, 'doc_mode')
    assert.ok(trace.block_total > 0)
    assert.ok(Object.keys(trace.block_counts_by_type ?? {}).length > 0)
    assert.equal(blocks.output_id, 'task_sheet_main')
    assert.ok(Array.isArray(blocks.blocks))
    assert.ok(blocks.blocks.length > 0)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
