import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildHtmlDocument } from './document.mjs'
import { buildRouteVisualPlan } from '../visual/plan-visuals.mjs'
import { resolveSourceSection } from '../schema/source-section.mjs'

export async function renderDocToPdf(pkg, route, outPath) {
  const sourceSection = resolveSourceSection(pkg, route.source_section)
  const visualBundle = buildRouteVisualPlan(pkg, route, sourceSection)
  const { pages = [] } = visualBundle.visual_plan

  if (pages.length === 0) return true  // signal: skipped, no visual plan for this type

  const html = buildHtmlDocument(visualBundle.visual_plan)

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.pdf({
      path: resolve(outPath),
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }

  return false  // signal: rendered
}

export function renderDocToPdfSync(pkg, route, outPath) {
  const sourceSection = resolveSourceSection(pkg, route.source_section)
  const visualBundle = buildRouteVisualPlan(pkg, route, sourceSection)
  const html = buildHtmlDocument(visualBundle.visual_plan)

  const htmlPath = outPath.replace(/\.pdf$/, '.html')
  writeFileSync(htmlPath, html, 'utf-8')

  return { htmlPath, visualBundle }
}
