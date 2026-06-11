import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function playwrightCanLaunchChromium() {
  const probe = spawnSync(
    process.execPath,
    [
      '-e',
      "import('playwright').then(async ({ chromium }) => { const browser = await chromium.launch(); await browser.close(); }).catch(() => process.exit(1))",
    ],
    { stdio: 'ignore' },
  )
  return probe.status === 0
}

test('render-package renders Psychology foundations assessment proof and bundle QA sees it', { timeout: 90000 }, (t) => {
  if (!playwrightCanLaunchChromium()) {
    t.skip('Playwright Chromium is not available in this environment')
    return
  }

  const outBase = mkdtempSync(join(tmpdir(), 'psychology-foundations-assessment-render-'))
  const packageOutDir = resolve(outBase, 'psychology_foundations_assessment_proof')

  try {
    const renderResult = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/psychology/foundations-assessment.proof.json', '--out', outBase],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(renderResult.status, 0, `render-package failed\nSTDOUT:\n${renderResult.stdout ?? ''}\nSTDERR:\n${renderResult.stderr ?? ''}`)

    const studentPdf = resolve(packageOutDir, 'psychology_foundations_student_assessment.pdf')
    const teacherPdf = resolve(packageOutDir, 'psychology_foundations_teacher_marking_guide.pdf')
    assert.ok(existsSync(studentPdf), 'Missing rendered student assessment PDF')
    assert.ok(existsSync(teacherPdf), 'Missing rendered teacher marking guide PDF')

    const studentTrace = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_student_assessment.trace.json'), 'utf-8'))
    const teacherTrace = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_teacher_marking_guide.trace.json'), 'utf-8'))
    const studentBlocks = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_student_assessment.blocks.json'), 'utf-8'))
    const teacherBlocks = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_teacher_marking_guide.blocks.json'), 'utf-8'))

    assert.equal(studentTrace.output_type, 'assessment')
    assert.equal(studentTrace.audience, 'student')
    assert.equal(studentTrace.artifact_family, 'assessment')
    assert.equal(studentTrace.final_evidence_role, 'primary')
    assert.equal(studentTrace.mode, 'doc_mode')
    assert.equal(studentBlocks.blocks.some((block) => block.teacher_only === true), false)

    assert.equal(teacherTrace.output_type, 'answer_key')
    assert.equal(teacherTrace.audience, 'teacher')
    assert.equal(teacherTrace.artifact_family, 'answer_key')
    assert.equal(teacherTrace.artifact_class, 'teacher_answer_key')
    assert.equal(teacherTrace.mode, 'doc_mode')
    assert.ok(teacherBlocks.block_counts_by_type.answer_key_table >= 1)
    assert.ok(teacherBlocks.blocks.every((block) => block.teacher_only === true))

    const qaResult = spawnSync(
      process.execPath,
      ['scripts/qa-bundle.mjs', '--package', 'fixtures/psychology/foundations-assessment.proof.json', '--out', outBase],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(qaResult.status, 0, `qa-bundle failed\nSTDOUT:\n${qaResult.stdout ?? ''}\nSTDERR:\n${qaResult.stderr ?? ''}`)
    const bundleQa = JSON.parse(qaResult.stdout).bundle_qa
    assert.equal(bundleQa.package_id, 'psychology_foundations_assessment_proof')
    assert.equal(bundleQa.missing_artifacts.length, 0)
    assert.equal(bundleQa.package_answer_leak_qa.judgment, 'pass')
    assert.equal(bundleQa.package_answer_leak_qa.blockers.length, 0)
    assert.equal(bundleQa.primary_final_evidence_artifacts.length, 1)
  } finally {
    rmSync(outBase, { recursive: true, force: true })
  }
})
