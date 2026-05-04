import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

function playwrightAvailable() {
  const probe = spawnSync(
    process.execPath,
    ['-e', "import('playwright').then(() => process.exit(0)).catch(() => process.exit(1))"],
    { cwd: process.cwd(), stdio: 'ignore' },
  )
  return probe.status === 0
}

test('render-package renders classroom worksheet template system proof PDFs', { timeout: 90000 }, (t) => {
  if (!playwrightAvailable()) {
    t.skip('Playwright is not available in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-worksheet-templates-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/worksheet-template-system.proof.json', '--out', outDir, '--flat-out'],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(result.status, 0, `render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`)

    for (const outputId of [
      'reading_response_template',
      'cer_template',
      'organizer_template',
      'exit_reflection_template',
    ]) {
      assert.equal(existsSync(resolve(outDir, `${outputId}.pdf`)), true, `${outputId}.pdf should exist`)
      const grammar = JSON.parse(readFileSync(resolve(outDir, `${outputId}.grammar.json`), 'utf-8'))
      assert.equal(grammar.template_family, 'CLASSROOM_WORKSHEET')
    }

    const organizerTrace = JSON.parse(readFileSync(resolve(outDir, 'organizer_template.trace.json'), 'utf-8'))
    assert.equal(organizerTrace.artifact_class, 'student_graphic_organizer')
    assert.equal(organizerTrace.selected_template, 'CWS_GRAPHIC_ORGANIZER')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
