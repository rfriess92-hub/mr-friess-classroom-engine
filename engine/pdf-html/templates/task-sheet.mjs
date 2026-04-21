import { buildOptionalExtension, escapeHtml } from './shared.mjs'
import { buildResponsePatternBody, responsePatternCss } from './response-patterns.mjs'
import { extractDayLabel, getDaysFromSection, stripDayPrefix } from '../task-sheet-packaging.mjs'

function buildTaskHeading(task, hints) {
  const heading = hints.heading ?? stripDayPrefix(task.label ?? '')
  const help = hints.help ? `<div class="task-help">${escapeHtml(hints.help)}</div>` : ''
  return `
<div class="task-label-row">
  <span class="task-badge">${escapeHtml(heading || 'Task')}</span>
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

function buildTaskBlock(task) {
  const hints = task.render_hints ?? {}
  return `
<section class="task-block">
  ${buildTaskHeading(task, hints)}
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

  return `${header}\n${group.tasks.map(buildTaskBlock).join('\n')}\n${optionalExtension}`
}

function buildInstructionBlock(items, label, className) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return `
<div class="${className}">
  <div class="section-kicker">${escapeHtml(label)}</div>
  <ul>
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

function buildTaskSheetPage(pkg, section, title, groups, fontFaceCSS, designCSS, { dayLabel = null, singleDay = false } = {}) {
  const purposeLine = section.purpose_line ?? section.render_hints?.purpose_line ?? ''
  const instructions = buildInstructionBlock(section.instructions, 'Use this sheet', 'instruction-list')
  const supports = buildInstructionBlock(section.embedded_supports, 'Helpful reminders', 'support-list')
  const criteria = buildInstructionBlock(section.success_criteria, 'Check before you move on', 'criteria-list')
  const bodyContent = groups.map((group, index) => buildDaySection(section, group, index === 0, singleDay)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
${responsePatternCss}

.task-block {
  margin-bottom: 20pt;
  page-break-inside: avoid;
}

.task-label-row {
  margin-bottom: 8pt;
  page-break-after: avoid;
}

.task-badge {
  display: inline-block;
  border: 1.5pt solid #111827;
  color: #111827;
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3pt 10pt;
  border-radius: 3pt;
}

.task-help {
  font-size: 9pt;
  color: #6B7280;
  margin-bottom: 7pt;
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

    <div class="doc-eyebrow">Task Sheet</div>
    <div class="doc-title">${escapeHtml(title)}</div>
    ${purposeLine ? `<div class="purpose-line">${escapeHtml(purposeLine)}</div>` : ''}
    ${instructions}
    ${bodyContent}
    ${supports}
    ${criteria}
    ${(Array.isArray(pkg.standards) && pkg.standards.length > 0) ? `<div class="standards-footer"><span class="standards-footer-label">Standards: </span>${escapeHtml(pkg.standards.join(' · '))}</div>` : ''}
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
    { dayLabel, singleDay: true },
  )
}

export { getDaysFromSection }
