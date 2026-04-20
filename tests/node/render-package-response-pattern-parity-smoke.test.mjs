import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function playwrightAvailable() {
  const probe = spawnSync(
    process.execPath,
    ['-e', "import('playwright').then(() => process.exit(0)).catch(() => process.exit(1))"],
    { stdio: 'ignore' },
  )
  return probe.status === 0
}

test('render-package smoke renders worksheet and task-sheet parity proof fixtures when playwright is available', { timeout: 45000 }, (t) => {
  if (!playwrightAvailable()) {
    t.skip('Playwright is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-response-parity-'))
  try {
    const worksheetResult = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/response-pattern-parity.single-period-full.json', '--out', outDir, '--flat-out'],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
      },
    )

    assert.equal(
      worksheetResult.status,
      0,
      `worksheet render-package failed\nSTDOUT:\n${worksheetResult.stdout ?? ''}\nSTDERR:\n${worksheetResult.stderr ?? ''}`,
    )
    assert.equal(existsSync(resolve(outDir, 'worksheet_main.pdf')), true)
    assert.equal(existsSync(resolve(outDir, 'worksheet_main.grammar.json')), true)

    const taskSheetResult = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/task-sheet-response-patterns.workshop-session.json', '--out', outDir, '--flat-out'],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
      },
    )

    assert.equal(
      taskSheetResult.status,
      0,
      `task-sheet render-package failed\nSTDOUT:\n${taskSheetResult.stdout ?? ''}\nSTDERR:\n${taskSheetResult.stderr ?? ''}`,
    )
    assert.equal(existsSync(resolve(outDir, 'task_sheet_main.grammar.json')), true)
    assert.equal(existsSync(resolve(outDir, 'task_sheet_main.pdf')), true)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
