import { resolve as resolvePath } from 'node:path'
import { resolveSourceSection } from '../schema/source-section.mjs'
import { buildFontFaceCSS, buildDesignSystemCSS } from './templates/shared.mjs'
import { buildPackageDocumentHTML } from './templates/package-document.mjs'
import {
  renderStudentDoc as renderCoreStudentDoc,
  renderStudentDocDays,
  shouldRenderTaskSheetDays,
  supportsHtmlRender as coreSupportsHtmlRender,
} from './render.mjs'

const PACKAGE_DOCUMENT_OUTPUT_TYPES = new Set([
  'teacher_binder',
  'student_packet',
  'assessment_pack',
  'safety_source_pack',
  'notes_package',
  'graphic_organizer_set',
])

let cachedFontFaceCSS = null
let cachedDesignCSS = null

function getFontFaceCSS() {
  if (!cachedFontFaceCSS) cachedFontFaceCSS = buildFontFaceCSS()
  return cachedFontFaceCSS
}

function getDesignCSS() {
  if (!cachedDesignCSS) cachedDesignCSS = buildDesignSystemCSS()
  return cachedDesignCSS
}

async function renderHtmlToPdf(html, outPath) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new Error(`Playwright is not installed. Run: pnpm install && pnpm run fonts:install\n${error.message}`)
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.pdf({
      path: resolvePath(outPath),
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }
}

export function supportsHtmlRender(outputType) {
  return PACKAGE_DOCUMENT_OUTPUT_TYPES.has(outputType) || coreSupportsHtmlRender(outputType)
}

export async function renderStudentDoc(pkg, route, outPath) {
  if (PACKAGE_DOCUMENT_OUTPUT_TYPES.has(route.output_type)) {
    const section = resolveSourceSection(pkg, route.source_section)
    const html = buildPackageDocumentHTML(pkg, section ?? {}, getFontFaceCSS(), getDesignCSS(), null, route)
    await renderHtmlToPdf(html, outPath)
    return
  }

  await renderCoreStudentDoc(pkg, route, outPath)
}

export { renderStudentDocDays, shouldRenderTaskSheetDays }
