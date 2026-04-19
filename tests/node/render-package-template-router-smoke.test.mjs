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

test('render-package emits template family and selected template for multipage proof routes', { timeout: 60000 }, (t) => {
  if (!pythonWithReportlabAvailable()) {
    t.skip('Python with reportlab is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-template-router-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/multipage-classifier-page-roles.proof.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(result.status, 0, `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`)

    const studentTrace = JSON.parse(readFileSync(resolve(outDir, 'student_packet_main.trace.json'), 'utf-8'))
    const teacherTrace = JSON.parse(readFileSync(resolve(outDir, 'teacher_guide_main.trace.json'), 'utf-8'))
    const studentGrammar = JSON.parse(readFileSync(resolve(outDir, 'student_packet_main.grammar.json'), 'utf-8'))
    const teacherGrammar = JSON.parse(readFileSync(resolve(outDir, 'teacher_guide_main.grammar.json'), 'utf-8'))

    assert.equal(studentTrace.template_family, 'SP_MULTIPAGE_PACKET')
    assert.equal(studentTrace.selected_template, 'SP_OPEN_FOLLOW_ALONG')
    assert.ok(studentTrace.template_sequence.includes('SP_RESEARCH_PLANNER'))
    assert.equal(studentGrammar.template_family, 'SP_MULTIPAGE_PACKET')

    assert.equal(teacherTrace.template_family, 'TG_MULTIPAGE_GUIDE')
    assert.equal(teacherTrace.selected_template, 'TG_OVERVIEW_ENTRY')
    assert.ok(teacherTrace.template_sequence.includes('TG_PROJECT_TOOLS'))
    assert.equal(teacherGrammar.template_family, 'TG_MULTIPAGE_GUIDE')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
