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

function pythonWithReportlabAvailable() {
  for (const cmd of ['python', 'python3', 'py']) {
    const versionProbe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (versionProbe.status !== 0) continue

    const reportlabProbe = spawnSync(cmd, ['-c', 'import reportlab'], { stdio: 'ignore' })
    if (reportlabProbe.status === 0) return true
  }
  return false
}

test('render-package smoke renders minimal pedagogy-faithful artifacts when playwright is available', { timeout: 60000 }, (t) => {
  if (!playwrightAvailable()) {
    t.skip('Playwright is not available in this environment')
    return
  }

  const cases = [
    {
      fixture: 'fixtures/tests/rubric-sheet.proof.json',
      artifact: 'rubric_sheet_main.pdf',
    },
    {
      fixture: 'fixtures/tests/station-cards.proof.json',
      artifact: 'station_cards_main.pdf',
    },
    {
      fixture: 'fixtures/tests/answer-key.proof.json',
      artifact: 'answer_key_main.pdf',
    },
  ]

  for (const testCase of cases) {
    const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-faithful-artifact-'))
    try {
      const result = spawnSync(
        process.execPath,
        ['scripts/render-package.mjs', '--package', testCase.fixture, '--out', outDir, '--flat-out'],
        {
          cwd: process.cwd(),
          encoding: 'utf-8',
        },
      )

      assert.equal(
        result.status,
        0,
        `render-package failed for ${testCase.fixture}\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
      )
      assert.equal(existsSync(resolve(outDir, testCase.artifact)), true)
      assert.equal(existsSync(resolve(outDir, testCase.artifact.replace('.pdf', '.grammar.json'))), true)
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }
})

test('render-package smoke renders the full station-rotation pedagogy proof when playwright and reportlab are available', { timeout: 90000 }, (t) => {
  if (!playwrightAvailable() || !pythonWithReportlabAvailable()) {
    t.skip('Playwright and Python with reportlab are required in this environment')
    return
  }

  const outDir = mkdtempSync(join(tmpdir(), 'classroom-engine-faithful-station-rotation-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/tests/station-rotation-rubric-cards-answer-key.proof.json', '--out', outDir, '--flat-out'],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
      },
    )

    assert.equal(
      result.status,
      0,
      `station-rotation render-package failed\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    )

    for (const artifactName of [
      'teacher_guide_main.pdf',
      'slides_main.pptx',
      'rubric_sheet_main.pdf',
      'station_cards_main.pdf',
      'graphic_organizer_main.pdf',
      'answer_key_main.pdf',
      'exit_ticket_main.pdf',
    ]) {
      assert.equal(existsSync(resolve(outDir, artifactName)), true, `missing ${artifactName}`)
    }
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
})
