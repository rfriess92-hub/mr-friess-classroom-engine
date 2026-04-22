import { buildOptionalExtension, escapeHtml } from './shared.mjs'
import { buildResponsePatternBody, responsePatternCss } from './response-patterns.mjs'
import { extractDayLabel, getDaysFromSection, stripDayPrefix } from '../task-sheet-packaging.mjs'

function buildTaskHeading(task, hints, isPrimary) {
  const heading = hints.heading ?? stripDayPrefix(task.label ?? '')
  const help = hints.help ? `<div class="task-help">${escapeHtml(hints.help)}</div>` : ''
  return `
<div class="task-label-row${isPrimary ? ' primary' : ' secondary'}">
  <span class="task-badge${isPrimary ? '' : ' secondary'}">${escapeHtml(heading || 'Task')}</span>
</div>
${help}`
}

function buildTaskBody(task) {
  const hints = task.render_hints ?? {}
  return buildResponsePatternBody({
    prompt: task.prompt ?? '',
    hints,
    lines: hints.lines ?? task.lines ?? task.n_lines ?? 4,
    includePrompt: true,
  })
}

function buildTaskBlock(task, index) {
  const hints = task.render_hints ?? {}
  const isPrimary = index === 0

  return `
<section class="task-block${isPrimary ? ' primary-task' : ' secondary-task'}">
  ${buildTaskHeading(task, hints, isPrimary)}
  ${buildTaskBody(task)}
</section>`
}

function groupTasksByDay(tasks) {
  const groups = []
  let currentDay = undefined
  let currentGroup = null

  for (const task of tasks) {
    const dayLabel = extractDayLabel(task?.label)
    if (dayLabel !== currentDay) {
      currentDay = dayLabel
      currentGroup = { dayLabel, tasks: [] }
      groups.push(currentGroup)
    }
    currentGroup.tasks.push(task)
  }

  return groups
}

function normalizeOptionalExtensions(section) {
  return Array.isArray(section?.optional_extensions)
    ? section.optional_extensions
    : []
}

function findOptionalExtension(section, dayLabel) {
  const normalizedDayLabel = String(dayLabel ?? '').trim().toLowerCase()

  return normalizeOptionalExtensions(section).find((extension) => {
    const extensionDay = String(extension?.day_label ?? '').trim().toLowerCase()
    return extensionDay && extensionDay === normalizedDayLabel
  }) ?? null
}

function buildDaySection(section, group, isFirst, suppressHeader = false) {
  const header = group.dayLabel && !suppressHeader
    ? `<div class="day-section-header${isFirst ? ' first' : ''}">${escapeHtml(group.dayLabel)}</div>`
    : ''
  const optionalExtension = buildOptionalExtension(findOptionalExtension(section, group.dayLabel))

  return `${header}
<div class="task-stack">
  ${group.tasks.map((task, index) => buildTaskBlock(task, index)).join('\n')}
</div>
${optionalExtension}`
}

function buildEntryStrip(items, label = '') {
  if (!Array.isArray(items) || items.length === 0) return ''
  const stripLabel = String(label ?? '').trim()

  return `
<div class="entry-strip">
  ${stripLabel ? `<div class="entry-strip-label">${escapeHtml(stripLabel)}</div>` : ''}
  <div class="entry-strip-items">
    ${items.map((item) => `<div class="entry-strip-item">${escapeHtml(item)}</div>`).join('\n')}
  </div>
</div>`
}

function buildPageToolPanel(items, label, kind) {
  if (!Array.isArray(items) || items.length === 0) return ''

  return `
<div class="page-tool-panel ${kind}">
  <div class="page-tool-label">${escapeHtml(label)}</div>
  <ul class="page-tool-list">
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

function buildPageToolsRow(section) {
  const supportPanel = buildPageToolPanel(section.embedded_supports, 'Keep in mind', 'support')
  const criteriaPanel = buildPageToolPanel(section.success_criteria, 'Check before you move on', 'success')

  if (!supportPanel && !criteriaPanel) return ''

  return `
<div class="page-tools-row">
  ${supportPanel}
  ${criteriaPanel}
</div>`
}

function shouldShowDailySplitPacketLevelCopy(section, flagName) {
  return section?.render_hints?.[flagName] === true
}

function buildTaskSheetPage(pkg, section, title, groups, fontFaceCSS, designCSS, { singleDay = false } = {}) {
  const showPacketPurpose = !singleDay || shouldShowDailySplitPacketLevelCopy(section, 'daily_split_show_purpose')
  const showPacketInstructions = !singleDay || shouldShowDailySplitPacketLevelCopy(section, 'daily_split_show_instructions')
  const showPacketTools = !singleDay || shouldShowDailySplitPacketLevelCopy(section, 'daily_split_show_page_tools')
  const showPacketStandards = !singleDay || shouldShowDailySplitPacketLevelCopy(section, 'daily_split_show_standards')
  const purposeLine = showPacketPurpose ? (section.purpose_line ?? section.render_hints?.purpose_line ?? '') : ''
  const instructions = showPacketInstructions ? buildEntryStrip(section.instructions) : ''
  const pageTools = showPacketTools ? buildPageToolsRow(section) : ''
  const bodyContent = groups.map((group, index) => buildDaySection(section, group, index === 0, singleDay)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
${responsePatternCss}

.task-stack {
  display: grid;
  gap: 16pt;
}

.task-block {
  page-break-inside: avoid;
}

.primary-task {
  border: 1pt solid #D1D5DB;
  border-left: 4pt solid #111827;
  border-radius: 10pt;
  padding: 12pt 14pt 14pt;
  background: #FFFFFF;
}

.secondary-task {
  padding-top: 10pt;
  border-top: 1pt solid #E5E7EB;
}

.task-label-row {
  margin-bottom: 8pt;
  page-break-after: avoid;
}

.task-label-row.primary {
  display: grid;
  gap: 4pt;
}

.task-badge {
  display: inline-block;
  border: 1.5pt solid #111827;
  color: #111827;
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  padding: 3pt 10pt;
  border-radius: 3pt;
}

.task-badge.secondary {
  border: none;
  padding: 0;
  font-size: 11pt;
  text-transform: none;
  letter-spacing: 0;
}

.task-help {
  font-size: 9pt;
  color: #6B7280;
  margin-bottom: 7pt;
}

.entry-strip {
  border-top: 1.5pt solid #111827;
  border-bottom: 1pt solid #D1D5DB;
  padding: 9pt 0 10pt;
  margin-bottom: 16pt;
}

.entry-strip-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #6B7280;
  margin-bottom: 7pt;
}

.entry-strip-items {
  display: grid;
  gap: 6pt;
}

.entry-strip-item {
  position: relative;
  padding-left: 12pt;
  color: #374151;
  font-size: 10pt;
  line-height: 1.45;
}

.entry-strip-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6pt;
  width: 5pt;
  height: 5pt;
  border-radius: 50%;
  background: #9CA3AF;
}

.page-tools-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10pt;
  margin-top: 18pt;
}

.page-tool-panel {
  border: 1pt solid #D1D5DB;
  border-radius: 10pt;
  padding: 10pt 12pt;
  page-break-inside: avoid;
}

.page-tool-panel.support {
  background: #FAFAF8;
}

.page-tool-panel.success {
  background: #FFFFFF;
}

.page-tool-label {
  font-size: 8.25pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #6B7280;
  margin-bottom: 6pt;
}

.page-tool-list {
  padding-left: 16pt;
}

.page-tool-list li {
  margin-bottom: 4pt;
  color: #4B5563;
  font-size: 9.25pt;
}

.page-tool-list li:last-child {
  margin-bottom: 0;
}

.task-block .pattern-prompt {
  border-left: none;
  background: transparent;
  padding: 0;
  font-size: 10.5pt;
  color: #1F2937;
}

.primary-task .pattern-prompt {
  border-left: 3pt solid #D1D5DB;
  background: #F9FAFB;
  border-radius: 8pt;
  padding: 9pt 12pt;
}

.task-block .pattern-response-box,
.task-block .pattern-compact-box,
.task-block .pattern-workspace-box,
.task-block .pattern-pair-table,
.task-block .pattern-matching-column,
.task-block .pattern-label-bank,
.task-block .pattern-table-record,
.task-block .pattern-diagram-panel {
  border-radius: 8pt;
}

@media print {
  .page-tools-row {
    page-break-inside: avoid;
  }
}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess - ${escapeHtml(pkg.subject ?? 'Subject')} - Grade ${escapeHtml(String(pkg.grade ?? ''))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    <div class="doc-title">${escapeHtml(title)}</div>
    ${purposeLine ? `<div class="purpose-line">${escapeHtml(purposeLine)}</div>` : ''}
    ${instructions}
    ${bodyContent}
    ${pageTools}
    ${(showPacketStandards && Array.isArray(pkg.standards) && pkg.standards.length > 0) ? `<div class="standards-footer"><span class="standards-footer-label">Standards: </span>${escapeHtml(pkg.standards.join(' · '))}</div>` : ''}
  </div>
</body>
</html>`
}

export function buildTaskSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Task Sheet'
  const tasks = Array.isArray(section.tasks) ? section.tasks : []
  const groups = groupTasksByDay(tasks)
  return buildTaskSheetPage(pkg, section, title, groups, fontFaceCSS, designCSS)
}

export function buildTaskSheetHTMLForDay(pkg, section, dayLabel, fontFaceCSS, designCSS) {
  const tasks = Array.isArray(section.tasks) ? section.tasks : []
  const dayTasks = tasks.filter((task) => extractDayLabel(task?.label) === dayLabel)
  const titleBase = section.title ?? 'Task Sheet'
  const title = `${titleBase} - ${dayLabel}`
  return buildTaskSheetPage(
    pkg,
    section,
    title,
    groupTasksByDay(dayTasks),
    fontFaceCSS,
    designCSS,
    { singleDay: true },
  )
}

export { getDaysFromSection }
