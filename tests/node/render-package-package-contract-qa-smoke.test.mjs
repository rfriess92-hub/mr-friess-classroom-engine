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
    const weeklyPacketTrace = JSON.parse(readFileSync(resolve(outDir, 'weekly_task_sheet.trace.json'), 'utf-8'))
    const checkpointTrace = JSON.parse(readFileSync(resolve(outDir, 'day4_checkpoint_sheet.trace.json'), 'utf-8'))
    const day1SlidesTrace = JSON.parse(readFileSync(resolve(outDir, 'day1_slides.trace.json'), 'utf-8'))
    const finalResponseTrace = JSON.parse(readFileSync(resolve(outDir, 'day5_final_response_sheet.trace.json'), 'utf-8'))

    assert.equal(packageQa.qa_scope, 'package_contract')
    assert.equal(packageQa.package_contract_family, 'week_sequence_packet_system')
    assert.equal(packageQa.judgment, 'pass')
    assert.equal(packageQa.check_count, 10)

    assert.equal(weeklyPacketTrace.artifact_class, 'week_sequence_packet')
    assert.equal(weeklyPacketTrace.template_family, 'WEEK_SEQUENCE_PACKET')

    assert.equal(checkpointTrace.artifact_class, 'teacher_checkpoint_gate')
    assert.equal(checkpointTrace.template_family, 'WEEK_SEQUENCE_CHECKPOINT_GATE')

    assert.equal(day1SlidesTrace.artifact_class, 'week_sequence_day_slides')
    assert.equal(day1SlidesTrace.render_intent, 'launch_frame')
    assert.deepEqual(day1SlidesTrace.page_roles, ['launch_frame'])

    assert.equal(finalResponseTrace.artifact_class, 'week_sequence_final_response')
    assert.equal(finalResponseTrace.template_family, 'WEEK_SEQUENCE_FINAL_RESPONSE')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
