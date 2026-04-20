import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('render-package emits packet and daily task-sheet PDFs when packet_and_days is declared', { timeout: 90000 }, () => {
  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-task-sheet-day-split-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/task-sheet-day-split.workshop-session.json', '--out', outDir, '--flat-out'],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
      },
    )

    assert.equal(
      result.status,
      0,
      `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )
    assert.equal(existsSync(resolve(outDir, 'task_sheet_main.pdf')), true)
    assert.equal(existsSync(resolve(outDir, 'task_sheet_main_day_1.pdf')), true)
    assert.equal(existsSync(resolve(outDir, 'task_sheet_main_day_2.pdf')), true)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
