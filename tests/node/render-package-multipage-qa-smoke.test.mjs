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

test('render-package emits passing multipage QA sidecars for the proof fixture', { timeout: 60000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-multipage-qa-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/multipage-classifier-page-roles.proof.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(
      result.status,
      0,
      `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )

    const studentTrace = JSON.parse(readFileSync(resolve(outDir, 'student_packet_main.trace.json'), 'utf-8'))
    const teacherTrace = JSON.parse(readFileSync(resolve(outDir, 'teacher_guide_main.trace.json'), 'utf-8'))
    const studentQa = JSON.parse(readFileSync(resolve(outDir, 'student_packet_main.qa.json'), 'utf-8'))
    const teacherQa = JSON.parse(readFileSync(resolve(outDir, 'teacher_guide_main.qa.json'), 'utf-8'))

    assert.equal(studentTrace.artifact_class, 'student_packet_multi_page')
    assert.equal(studentTrace.template_family, 'SP_MULTIPAGE_PACKET')
    assert.equal(studentQa.judgment, 'pass')
    assert.equal(studentQa.check_count, 4)

    assert.equal(teacherTrace.artifact_class, 'teacher_guide_multi_page')
    assert.equal(teacherTrace.template_family, 'TG_MULTIPAGE_GUIDE')
    assert.equal(teacherQa.judgment, 'pass')
    assert.equal(teacherQa.check_count, 6)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
