#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { buildClassroomSlideHTML, buildClassroomSlideSemanticText } from './templates/classroom-slide-system.mjs'

function argValue(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}

function pickPython() {
  for (const cmd of ['python', 'python3', 'py']) {
    const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
    if (probe.status === 0) return cmd
  }
  return null
}

function applyClassroomReadabilityScale(html) {
  const override = `
    <style id="classroom-readability-scale">
      .title-h1 { font-size: 112px !important; line-height: 1 !important; }
      .title-subtitle { font-size: 28px !important; }
      .title-meta { font-size: 25px !important; line-height: 1.45 !important; }
      .title-bar h2 { font-size: 40px !important; }
      .breadcrumb { font-size: 22px !important; }
      .lesson-title-bar h2 { font-size: 39px !important; }
      .section-label { font-size: 21px !important; }
      .card-header span { font-size: 22px !important; }
      .key-term-box .term { font-size: 58px !important; }
      .key-term-box .definition { font-size: 25px !important; }
      .body-text { font-size: 32px !important; line-height: 1.22 !important; }
      .body-small { font-size: 27px !important; line-height: 1.23 !important; }
      .overview-title { font-size: 86px !important; }
      .overview-name { font-size: 34px !important; }
      .overview-header { font-size: 22px !important; }
      .overview-term { font-size: 56px !important; }
      .overview-def { font-size: 26px !important; line-height: 1.16 !important; }
      .overview-activity { font-size: 26px !important; line-height: 1.18 !important; }
      table.scope { font-size: 24px !important; }
      table.scope th { font-size: 21px !important; }
      table.scope td { font-size: 24px !important; line-height: 1.2 !important; }
      .how-section h3 { font-size: 32px !important; }
      .how-section p { font-size: 29px !important; line-height: 1.26 !important; }
    </style>
  `
  return html.replace('</head>', `${override}</head>`)
}

async function renderSlidesToImages(packet, tempDir) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new Error(`Playwright is not installed. Run: pnpm install && pnpm run fonts:install\n${error.message}`)
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
    const slides = Array.isArray(packet.slides) ? packet.slides : []
    const rendered = []
    for (let index = 0; index < slides.length; index += 1) {
      const slideSpec = slides[index] && typeof slides[index] === 'object' ? slides[index] : {}
      const html = applyClassroomReadabilityScale(buildClassroomSlideHTML(packet, slideSpec, index))
      const imagePath = join(tempDir, `slide-${String(index + 1).padStart(2, '0')}.png`)
      await page.setContent(html, { waitUntil: 'domcontentloaded' })
      await page.screenshot({ path: imagePath, type: 'png', fullPage: false })
      rendered.push({
        image_path: imagePath,
        semantic_text: buildClassroomSlideSemanticText(packet, slideSpec, index),
      })
    }
    return rendered
  } finally {
    await browser.close()
  }
}

const lesson = argValue('--lesson')
const outDir = argValue('--out') ?? 'output'

if (!lesson) {
  console.error('Usage: node engine/pptx/render-cli.mjs --lesson <path> --out <dir>')
  process.exit(1)
}

const lessonPath = resolve(process.cwd(), lesson)
if (!existsSync(lessonPath)) {
  console.error(`Lesson file not found: ${lesson}`)
  process.exit(1)
}

const pythonCmd = pickPython()
if (!pythonCmd) {
  console.error('No Python interpreter found on PATH.')
  process.exit(1)
}

const absoluteOutDir = resolve(process.cwd(), outDir)
mkdirSync(absoluteOutDir, { recursive: true })

const tempDir = mkdtempSync(join(tmpdir(), 'classroom-slides-'))
try {
  const packet = JSON.parse(readFileSync(lessonPath, 'utf-8'))
  const slides = await renderSlidesToImages(packet, tempDir)
  const manifestPath = join(tempDir, 'slide-manifest.json')
  writeFileSync(manifestPath, JSON.stringify({
    lesson_id: packet.lesson_id ?? 'lesson',
    slides,
  }, null, 2), 'utf-8')

  const scriptPath = resolve(process.cwd(), 'engine', 'pptx', 'renderer.py')
  const result = spawnSync(
    pythonCmd,
    [scriptPath, '--manifest', manifestPath, '--out', absoluteOutDir],
    { stdio: 'inherit' }
  )

  if (result.status !== 0) process.exit(result.status ?? 1)
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
