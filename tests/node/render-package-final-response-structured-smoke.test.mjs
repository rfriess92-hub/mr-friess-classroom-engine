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

test('render-package smoke renders structured final-response proof fixture when playwright is available', { timeout: 45000 }, (t) => {
  if (!playwrightAvailable()) {
    t.skip('Playwright is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-final-response-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/final-response-structured.multi-day-sequence.json', '--out', outDir, '--flat-out'],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
      },
    )

    assert.equal(
      result.status,
      0,
      `structured final-response render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )

    for (const dayId of ['day1', 'day2', 'day3', 'day4']) {
      assert.equal(existsSync(resolve(outDir, `${dayId}_final_response_sheet.pdf`)), true)
      assert.equal(existsSync(resolve(outDir, `${dayId}_final_response_sheet.grammar.json`)), true)
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
