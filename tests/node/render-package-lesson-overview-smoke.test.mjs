import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
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

test('render-package smoke renders lesson-overview proof fixture when python path is available', { timeout: 45000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-lesson-overview-smoke-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/lesson-overview.proof.json', '--out', outDir, '--flat-out'],
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
    assert.equal(existsSync(resolve(outDir, 'lesson_overview_main.pdf')), true, 'lesson_overview PDF artifact should be produced')
    assert.equal(existsSync(resolve(outDir, 'lesson_overview_main.grammar.json')), true, 'grammar sidecar should be present')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
