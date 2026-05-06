import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { buildFontFaceCSS, buildDesignSystemCSS } from '../engine/pdf-html/templates/shared.mjs'
import { buildClassroomToolkitHTML } from '../engine/pdf-html/templates/classroom-toolkit-templates.mjs'

const packagePath = process.argv.includes('--package')
  ? process.argv[process.argv.indexOf('--package') + 1]
  : 'fixtures/generated/classroom-toolkit-sample.grade8-all.json'
const outDir = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'output/classroom-toolkit-sample'

const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
const fontFaceCSS = buildFontFaceCSS()
const designCSS = buildDesignSystemCSS()

const sections = [
  ['kwhl_chart', 'kwhl_chart.pdf'],
  ['fishbone_diagram', 'fishbone_diagram.pdf'],
  ['sentence_frame_card', 'sentence_frame_card.pdf'],
  ['choice_board', 'choice_board.pdf'],
  ['scaffolded_quiz', 'scaffolded_quiz.pdf'],
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
try {
  for (const [sectionKey, filename] of sections) {
    const section = pkg[sectionKey]
    if (!section) throw new Error(`Missing section '${sectionKey}' in ${packagePath}`)
    const html = buildClassroomToolkitHTML(pkg, section, fontFaceCSS, designCSS, section.layout_template_id)
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    const outPath = resolve(outDir, filename)
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    await page.close()
    console.log(`rendered ${outPath}`)
  }
} finally {
  await browser.close()
}
