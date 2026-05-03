import { resolve as resolvePath } from 'node:path'
import { resolveSourceSection } from '../schema/source-section.mjs'
import { getTaskSheetOutputPackaging, getDaysFromSection, slugifyDayLabel } from './task-sheet-packaging.mjs'
import { buildFontFaceCSS, buildDesignSystemCSS } from './templates/shared.mjs'
import { buildTaskSheetHTML, buildTaskSheetHTMLForDay } from './templates/task-sheet.mjs'
import { buildFinalResponseSheetHTML } from './templates/final-response-sheet.mjs'
import { buildExitTicketHTML } from './templates/exit-ticket.mjs'
import { buildDiscussionPrepSheetHTML } from './templates/discussion-prep-sheet.mjs'
import { buildWorksheetHTML } from './templates/worksheet.mjs'
import { buildRubricSheetHTML } from './templates/rubric-sheet.mjs'
import { buildStationCardsHTML } from './templates/station-cards.mjs'
import { buildAnswerKeyHTML } from './templates/answer-key.mjs'
import { buildPacingGuideHTML } from './templates/pacing-guide.mjs'
import { buildSubPlanHTML } from './templates/sub-plan.mjs'
import { buildMakeupPacketHTML } from './templates/makeup-packet.mjs'
import { buildClassroomWorksheetTemplateHTML, isClassroomTemplateLayout } from './templates/classroom-worksheet-system-v2.mjs'

const TEMPLATE_MAP = {
  task_sheet: buildTaskSheetHTML,
  final_response_sheet: buildFinalResponseSheetHTML,
  exit_ticket: buildExitTicketHTML,
  discussion_prep_sheet: buildDiscussionPrepSheetHTML,
  worksheet: buildWorksheetHTML,
  graphic_organizer: buildClassroomWorksheetTemplateHTML,
  rubric_sheet: buildRubricSheetHTML,
  station_cards: buildStationCardsHTML,
  answer_key: buildAnswerKeyHTML,
  pacing_guide: buildPacingGuideHTML,
  sub_plan: buildSubPlanHTML,
  makeup_packet: buildMakeupPacketHTML,
}

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
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }
}

function resolveLayoutTemplateId(route, section) {
  return route?.layout_template_id ?? section?.layout_template_id ?? section?.template_id ?? section?.template ?? null
}

export function supportsHtmlRender(outputType) {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_MAP, outputType)
}

export function shouldRenderTaskSheetDays(section) {
  return getTaskSheetOutputPackaging(section) === 'packet_and_days' && getDaysFromSection(section).length > 0
}

export async function renderStudentDoc(pkg, route, outPath) {
  const buildTemplate = TEMPLATE_MAP[route.output_type]
  if (!buildTemplate) {
    throw new Error(`No HTML template registered for output_type '${route.output_type}'.`)
  }

  const section = resolveSourceSection(pkg, route.source_section)
  const tier = route.variant_group === 'tiers' ? route.variant_role : null
  const layoutTemplateId = resolveLayoutTemplateId(route, section)
  const html = isClassroomTemplateLayout(layoutTemplateId)
    ? buildClassroomWorksheetTemplateHTML(pkg, section, getFontFaceCSS(), getDesignCSS(), layoutTemplateId)
    : buildTemplate(pkg, section, getFontFaceCSS(), getDesignCSS(), tier)

  await renderHtmlToPdf(html, outPath)
}

export async function renderStudentDocDays(pkg, route, outDir) {
  const section = resolveSourceSection(pkg, route.source_section)
  const dayLabels = getDaysFromSection(section)

  if (route.output_type !== 'task_sheet' || dayLabels.length === 0) {
    return []
  }

  const written = []
  for (const dayLabel of dayLabels) {
    const outPath = resolvePath(outDir, `${route.output_id}_${slugifyDayLabel(dayLabel)}.pdf`)
    const html = buildTaskSheetHTMLForDay(pkg, section, dayLabel, getFontFaceCSS(), getDesignCSS())
    await renderHtmlToPdf(html, outPath)
    written.push(outPath)
  }

  return written
}
