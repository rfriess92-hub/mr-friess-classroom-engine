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
import { buildClassroomWorksheetTemplateHTML, isClassroomTemplateLayout } from './templates/classroom-worksheet-system.mjs'
import { buildLiteracyVocabularyToolHTML, isLiteracyVocabularyToolLayout } from './templates/literacy-vocabulary-tools.mjs'
import { buildPlanterVolumeDecisionHTML, isPlanterVolumeDecisionLayout } from './templates/planter-volume-decision.mjs'

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

function mrFriessVisualShellCSS() {
  return `
:root {
  --mf-accent:#7B4FBE;
  --mf-accent-light:#EDE5F8;
  --mf-navy:#161C2D;
  --mf-dark:#1E2738;
  --mf-muted:#78879C;
  --mf-border:#D8DDE8;
  --mf-section-bg:#F5F6F8;
  --mf-line:#CBD2DB;
}
.cws-body {
  color:var(--mf-dark);
  font-family:Arial,system-ui,sans-serif;
  font-size:10.4pt;
  line-height:1.28;
}
.cws-page {
  position:relative;
  padding:.29in .50in .34in;
  border:0;
  overflow:hidden;
}
.cws-page::before {
  content:"";
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:4pt;
  background:var(--mf-accent);
}
.cws-name-date {
  margin:0 0 13pt;
  gap:22pt;
  font-size:9pt;
  color:var(--mf-dark);
}
.cws-name-date span:first-child { max-width:2.75in; }
.cws-name-date span:last-child { max-width:1.7in; }
.cws-name-date strong { font-weight:700; }
.cws-name-date i { border-bottom:1.1pt solid var(--mf-dark); }
.cws-title-block {
  margin:0 0 12pt;
  text-align:center;
}
.cws-title-block h1 {
  color:var(--mf-navy);
  font-size:19pt;
  line-height:1.08;
  letter-spacing:0;
  margin:0 0 3pt;
  font-weight:700;
}
.cws-title-block p {
  color:var(--mf-muted);
  font-size:10pt;
  line-height:1.25;
}
.cws-meta {
  color:var(--mf-muted);
  font-size:7.8pt;
  letter-spacing:.16em;
  margin-top:4pt;
}
.cws-grid { gap:8pt; }
.cws-stack { gap:8pt; }
.cws-info-box,
.cws-box,
.cws-response-box,
.cws-mini-card,
.cws-panel,
.cws-rule-box,
.cws-cornell {
  border:1pt solid var(--mf-border);
  border-radius:4pt;
  background:#fff;
}
.cws-info-box {
  min-height:.62in;
  grid-template-columns:.36in 1fr;
  gap:7pt;
  background:var(--mf-section-bg);
  padding:8pt 10pt;
}
.cws-info-title {
  color:var(--mf-navy);
  font-size:10.2pt;
  font-weight:700;
}
.cws-info-body {
  color:var(--mf-dark);
  font-size:9pt;
  line-height:1.35;
}
.cws-icon,
.cws-number {
  width:18pt;
  height:18pt;
  min-width:18pt;
  border:1.15pt solid var(--mf-dark);
  background:#fff;
  color:var(--mf-dark);
  font-size:6.8pt;
  line-height:1;
  letter-spacing:0;
}
.cws-number {
  background:#fff;
  color:var(--mf-dark);
}
.cws-box-header {
  min-height:25pt;
  background:var(--mf-section-bg);
  border-bottom:1pt solid var(--mf-border);
  color:var(--mf-navy);
  gap:7pt;
  padding:6pt 9pt;
  font-size:10.3pt;
  font-weight:700;
}
.cws-box-header .cws-icon {
  width:18pt;
  height:18pt;
  font-size:6.5pt;
}
.cws-box-body { padding:8pt 10pt; }
.cws-response-box {
  padding:8pt 10pt;
  min-height:.78in;
}
.cws-response-head {
  gap:7pt;
  margin-bottom:5pt;
}
.cws-response-head strong {
  color:var(--mf-navy);
  font-size:10.4pt;
}
.cws-response-head span:not(.cws-icon):not(.cws-number) {
  color:var(--mf-muted);
  font-size:8.1pt;
  line-height:1.25;
}
.cws-line,
.cws-fill-line {
  border-bottom:1pt solid var(--mf-line);
}
.cws-line { height:.23in; }
.cws-line.short { height:.17in; }
.cws-check-row,
.cws-radio-row {
  grid-template-columns:12pt 1fr;
  gap:7pt;
  font-size:8.9pt;
  line-height:1.25;
  margin-bottom:5pt;
}
.cws-checkbox,
.cws-radio {
  border:1.15pt solid var(--mf-dark);
}
.cws-vocab-row {
  border-bottom:1pt solid var(--mf-line);
  color:var(--mf-dark);
  font-size:8.8pt;
}
.cws-vocab-row strong { color:var(--mf-accent); }
.cws-matrix {
  border-collapse:collapse;
  font-size:8.8pt;
}
.cws-matrix th,
.cws-matrix td {
  border:1pt solid var(--mf-border);
}
.cws-matrix th {
  background:var(--mf-section-bg);
  color:var(--mf-navy);
  font-weight:700;
}
.cws-organizer-table {
  font-size:9pt;
}
.cws-organizer-table td {
  height:.56in;
}
.cws-cornell {
  min-height:5.45in;
  border-color:var(--mf-border);
}
.cws-cornell-cues {
  background:var(--mf-accent-light);
  border-right:1.2pt solid var(--mf-accent);
}
.cws-cornell-label {
  color:var(--mf-accent);
  font-size:8.1pt;
  letter-spacing:.16em;
}
.cws-cue-chip {
  border:1pt solid var(--mf-border);
  color:var(--mf-navy);
}
.cws-footer-banner {
  border:1pt solid var(--mf-border);
  background:var(--mf-section-bg);
  color:var(--mf-navy);
  font-size:9.5pt;
}
.cws-tight .cws-title-block h1 { font-size:17pt; }
.cws-tight .cws-title-block { margin-bottom:8pt; }
`
}

function applyMrFriessVisualShell(html) {
  if (!html.includes('</style>')) return html
  return html.replace('</style>', `${mrFriessVisualShellCSS()}\n</style>`)
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
  const usesLiteracyVocabularyTool = isLiteracyVocabularyToolLayout(layoutTemplateId)
  const usesClassroomTemplate = isClassroomTemplateLayout(layoutTemplateId)
  const html = isPlanterVolumeDecisionLayout(layoutTemplateId)
    ? buildPlanterVolumeDecisionHTML(pkg, section, getFontFaceCSS(), getDesignCSS())
    : usesLiteracyVocabularyTool
      ? buildLiteracyVocabularyToolHTML(pkg, section, getFontFaceCSS(), getDesignCSS(), layoutTemplateId)
      : usesClassroomTemplate
        ? applyMrFriessVisualShell(buildClassroomWorksheetTemplateHTML(pkg, section, getFontFaceCSS(), getDesignCSS(), layoutTemplateId))
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
