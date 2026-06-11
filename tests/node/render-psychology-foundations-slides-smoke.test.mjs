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

function pythonCanImportPptx() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['-c', 'import pptx'], { stdio: 'ignore' })
    if (probe.status === 0) return true
  }
  return false
}

test('render-package renders Psychology foundations slide proof to PPTX', { timeout: 120000 }, (t) => {
  if (!playwrightCanLaunchChromium()) {
    t.skip('Playwright Chromium is not available in this environment')
    return
  }
  if (!pythonCanImportPptx()) {
    t.skip('python-pptx is not available in this environment')
    return
  }

  const outBase = mkdtempSync(join(tmpdir(), 'psychology-foundations-slides-render-'))
  const packageOutDir = resolve(outBase, 'psychology_foundations_slides_proof')

  try {
    const renderResult = spawnSync(
      process.execPath,
      ['scripts/render-package.mjs', '--package', 'fixtures/psychology/foundations-slides.proof.json', '--out', outBase],
      { cwd: process.cwd(), encoding: 'utf-8' },
    )

    assert.equal(renderResult.status, 0, `render-package failed\nSTDOUT:\n${renderResult.stdout ?? ''}\nSTDERR:\n${renderResult.stderr ?? ''}`)

    const deckPath = resolve(packageOutDir, 'psychology_foundations_l1_slides.pptx')
    assert.ok(existsSync(deckPath), 'Missing rendered Cycle A L1 slide deck')

    const trace = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_l1_slides.trace.json'), 'utf-8'))
    const blocks = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_l1_slides.blocks.json'), 'utf-8'))
    const grammar = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_l1_slides.grammar.json'), 'utf-8'))
    const visuals = JSON.parse(readFileSync(resolve(packageOutDir, 'psychology_foundations_l1_slides.visual.json'), 'utf-8'))

    assert.equal(trace.output_type, 'slides')
    assert.equal(trace.audience, 'shared_view')
    assert.equal(trace.artifact_family, 'slides')
    assert.equal(trace.artifact_class, 'mini_lesson_slides')
    assert.equal(trace.mode, 'slide_mode')
    assert.equal(grammar.selected_template, trace.selected_template)
    assert.ok(blocks.block_total >= 30)
    assert.equal(blocks.blocks.some((block) => block.teacher_only === true), false)
    assert.equal(Array.isArray(visuals.visual_plan?.pages), true)
  } finally {
    rmSync(outBase, { recursive: true, force: true })
  }
})
