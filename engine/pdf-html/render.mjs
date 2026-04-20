import { chromium } from 'playwright'
import { resolveSourceSection } from '../schema/source-section.mjs'
import { buildFontFaceCSS, buildDesignSystemCSS } from './templates/shared.mjs'
import { buildTaskSheetHTML, buildTaskSheetHTMLForDay, getDaysFromSection } from './templates/task-sheet.mjs'
import { buildFinalResponseSheetHTML } from './templates/final-response-sheet.mjs'
import { buildExitTicketHTML } from './templates/exit-ticket.mjs'
import { buildDiscussionPrepSheetHTML } from './templates/discussion-prep-sheet.mjs'
import { buildWorksheetHTML } from './templates/worksheet.mjs'

const TEMPLATE_MAP = {
  task_sheet: buildTaskSheetHTML,
  final_response_sheet: buildFinalResponseSheetHTML,
  exit_ticket: buildExitTicketHTML,
  discussion_prep_sheet: buildDiscussionPrepSheetHTML,
  worksheet: buildWorksheetHTML,
}

let _fontFaceCSS = null
let _designCSS = null

function getFontFaceCSS() {
  if (!_fontFaceCSS) _fontFaceCSS = buildFontFaceCSS()
  return _fontFaceCSS
}

function getDesignCSS() {
  if (!_designCSS) _designCSS = buildDesignSystemCSS()
  return _designCSS
}

async function renderHtmlToPdf(html, outPath) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }
}

export function supportsHtmlRender(outputType) {
  return outputType in TEMPLATE_MAP
}

export async function renderStudentDoc(pkg, route, outPath) {
  const buildTemplate = TEMPLATE_MAP[route.output_type]
  if (!buildTemplate) {
    throw new Error(`No HTML template registered for output_type '${route.output_type}'.`)
  }
  const section = resolveSourceSection(pkg, route.source_section)
  const html = buildTemplate(pkg, section, getFontFaceCSS(), getDesignCSS())
  await renderHtmlToPdf(html, outPath)
}

// For task_sheet: render one PDF per day. Returns array of written file paths.
export async function renderStudentDocDays(pkg, route, outDir) {
  const { resolve } = await import('node:path')
  const section = resolveSourceSection(pkg, route.source_section)
  const days = getDaysFromSection(section)

  if (days.length === 0) {
    // No day labels found — fall back to single document
    const outPath = resolve(outDir, `${route.output_id}.pdf`)
    await renderStudentDoc(pkg, route, outPath)
    return [outPath]
  }

  const written = []
  for (const day of days) {
    const slug = day.toLowerCase().replace(/\s+/g, '_')
    const outPath = resolve(outDir, `${route.output_id}_${slug}.pdf`)
    const html = buildTaskSheetHTMLForDay(pkg, section, day, getFontFaceCSS(), getDesignCSS())
    await renderHtmlToPdf(html, outPath)
    console.log(`  → ${outPath}`)
    written.push(outPath)
  }
  return written
}
