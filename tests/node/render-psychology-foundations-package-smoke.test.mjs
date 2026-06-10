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

test('render-package renders Psychology foundations package proof', { timeout: 60000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'psychology-foundations-render-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/psychology/foundations-package.proof.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(result.status, 0, `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`)

    const studentTrace = JSON.parse(readFileSync(resolve(outDir, 'psychology_foundations_student_packet.trace.json'), 'utf-8'))
    const teacherTrace = JSON.parse(readFileSync(resolve(outDir, 'psychology_foundations_teacher_guide.trace.json'), 'utf-8'))
    const studentBlocks = JSON.parse(readFileSync(resolve(outDir, 'psychology_foundations_student_packet.blocks.json'), 'utf-8'))
    const teacherBlocks = JSON.parse(readFileSync(resolve(outDir, 'psychology_foundations_teacher_guide.blocks.json'), 'utf-8'))

    assert.equal(studentTrace.artifact_class, 'student_packet_multi_page')
    assert.ok(studentTrace.page_roles.includes('follow_along'))
    assert.ok(studentTrace.page_roles.includes('reference_bank'))
    assert.ok(studentTrace.page_roles.includes('completion_check'))
    assert.ok(studentBlocks.page_roles.includes('completion_check'))

    assert.equal(teacherTrace.artifact_class, 'teacher_guide_multi_page')
    assert.ok(teacherTrace.page_roles.includes('overview'))
    assert.ok(teacherTrace.page_roles.includes('sequence_map'))
    assert.ok(teacherTrace.page_roles.includes('teacher_model'))
    assert.ok(teacherTrace.page_roles.includes('assessment_reference'))
    assert.ok(teacherBlocks.page_roles.includes('teacher_model'))
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
