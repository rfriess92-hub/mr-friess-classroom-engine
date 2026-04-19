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

test('render-package emits a passing package contract QA sidecar for the live Week 1 package', { timeout: 120000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-package-contract-qa-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/generated/careers-8-mosaic-week-1-know-yourself.grade8-careers.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(
      result.status,
      0,
      `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )

    const packageQa = JSON.parse(readFileSync(resolve(outDir, 'package.qa.json'), 'utf-8'))

    assert.equal(packageQa.qa_scope, 'package_contract')
    assert.equal(packageQa.package_contract_family, 'week_sequence_packet_system')
    assert.equal(packageQa.judgment, 'pass')
    assert.equal(packageQa.check_count, 5)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
