import { buildPageFiller, escapeHtml, formatPrompt } from './shared.mjs'
import { extractDayLabel, getDaysFromSection, stripDayPrefix } from '../task-sheet-packaging.mjs'

function buildResponseLines(count, lineClass = 'response-line') {
  return Array.from({ length: count }, () => `<div class="${lineClass}"></div>`).join('\n')
}

function normalizeFieldLabel(field, fallbackIndex) {
  if (typeof field === 'string') return field
  if (field && typeof field.label === 'string') return field.label
  return `Field ${fallbackIndex + 1}`
}

function buildTaskHeading(task, hints) {
  const heading = hints.heading ?? stripDayPrefix(task.label ?? '')
  const help = hints.help ? `<div class="task-help">${escapeHtml(hints.help)}</div>` : ''
  return `
<div class="task-label-row">
  <span class="task-badge">${escapeHtml(heading || 'Task')}</span>
</div>
${help}`
}

function buildOpenResponseBody(task, hints) {
  const lines = hints.lines ?? task.lines ?? task.n_lines ?? 4
  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="response-area">
  ${buildResponseLines(lines)}
</div>`
}

function buildFillInBlankBody(task, hints) {
  const prompts = Array.isArray(hints.blank_prompts) ? hints.blank_prompts : []
  if (prompts.length === 0) return buildOpenResponseBody(task, hints)

  const rows = prompts.map((promptText) => `
    <div class="fill-row">
      <div class="fill-text">${escapeHtml(promptText)}</div>
      <div class="fill-line"></div>
    </div>`).join('\n')

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="fill-blank-list">
  ${rows}
</div>`
}

function buildChoiceSelectBody(task, hints) {
  const options = Array.isArray(hints.choice_options) ? hints.choice_options : []
  if (options.length === 0) return buildOpenResponseBody(task, hints)

  const items = options.map((option) => {
    const label = typeof option === 'string' ? option : option?.label
    return `
      <div class="choice-option">
        <span class="choice-mark"></span>
        <span class="choice-label">${escapeHtml(label ?? 'Option')}</span>
      </div>`
  }).join('\n')

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="choice-grid">
  ${items}
</div>`
}

function buildPairedChoiceBody(task, hints) {
  const pairs = Array.isArray(hints.choice_pairs) ? hints.choice_pairs : []
  if (pairs.length === 0) return buildOpenResponseBody(task, hints)

  const rows = pairs.map((pair) => `
    <div class="pair-row">
      <div class="pair-label">${escapeHtml(pair.label ?? '')}</div>
      <div class="pair-choice"><span class="choice-mark"></span><span>${escapeHtml(pair.left)}</span></div>
      <div class="pair-choice"><span class="choice-mark"></span><span>${escapeHtml(pair.right)}</span></div>
    </div>`).join('\n')

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="pair-table">
  ${rows}
</div>`
}

function buildMatchingBody(task, hints) {
  const columns = hints.matching_columns ?? {}
  const leftItems = Array.isArray(columns.left_items) ? columns.left_items : []
  const rightItems = Array.isArray(columns.right_items) ? columns.right_items : []
  if (leftItems.length === 0 && rightItems.length === 0) return buildOpenResponseBody(task, hints)

  const leftHtml = leftItems.map((item, index) => `
    <div class="match-item">
      <span class="match-key">${index + 1}.</span>
      <span>${escapeHtml(item)}</span>
    </div>`).join('\n')

  const rightHtml = rightItems.map((item, index) => `
    <div class="match-item">
      <span class="match-key">${String.fromCharCode(65 + index)}.</span>
      <span>${escapeHtml(item)}</span>
    </div>`).join('\n')

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="matching-grid">
  <div class="matching-column">
    <div class="matching-label">${escapeHtml(columns.left_label ?? 'Left side')}</div>
    ${leftHtml}
  </div>
  <div class="matching-column">
    <div class="matching-label">${escapeHtml(columns.right_label ?? 'Right side')}</div>
    ${rightHtml}
  </div>
</div>`
}

function buildRecordFieldsBody(task, hints) {
  const fields = Array.isArray(hints.record_fields) ? hints.record_fields : []
  if (fields.length === 0) return buildOpenResponseBody(task, hints)

  const rows = fields.map((field, index) => `
    <div class="field-row">
      <div class="field-label">${escapeHtml(normalizeFieldLabel(field, index))}</div>
      <div class="field-line"></div>
    </div>`).join('\n')

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="field-list">
  ${rows}
</div>`
}

function buildCalculationWorkspaceBody(task, hints) {
  const workspaceRows = hints.workspace_rows ?? task.lines ?? 6
  const answerLabel = hints.answer_label ?? 'Final answer'

  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="workspace-box">
  <div class="workspace-grid">
    ${buildResponseLines(workspaceRows, 'workspace-line')}
  </div>
  <div class="workspace-answer">
    <span class="workspace-answer-label">${escapeHtml(answerLabel)}</span>
    <span class="workspace-answer-line"></span>
  </div>
</div>`
}

function buildCompactCheckpointBody(task, hints) {
  const lines = hints.lines ?? task.lines ?? 2
  return `
<div class="task-prompt">${formatPrompt(task.prompt)}</div>
<div class="checkpoint-box">
  ${buildResponseLines(lines, 'checkpoint-line')}
</div>`
}

function buildTaskBody(task) {
  const hints = task.render_hints ?? {}
  const responsePattern = hints.response_pattern ?? 'open_response'

  switch (responsePattern) {
    case 'fill_in_blank':
      return buildFillInBlankBody(task, hints)
    case 'choice_select':
      return buildChoiceSelectBody(task, hints)
    case 'paired_choice':
      return buildPairedChoiceBody(task, hints)
    case 'matching':
      return buildMatchingBody(task, hints)
    case 'record_fields':
      return buildRecordFieldsBody(task, hints)
    case 'calculation_workspace':
      return buildCalculationWorkspaceBody(task, hints)
    case 'compact_checkpoint':
      return buildCompactCheckpointBody(task, hints)
    case 'open_response':
    default:
      return buildOpenResponseBody(task, hints)
  }
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

function buildDaySection(group, isFirst, suppressHeader = false) {
  const header = group.dayLabel && !suppressHeader
    ? `<div class="day-section-header${isFirst ? ' first' : ''}">${escapeHtml(group.dayLabel)}</div>`
    : ''

  return `${header}\n${group.tasks.map(buildTaskBlock).join('\n')}`
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
  const bodyContent = groups.map((group, index) => buildDaySection(group, index === 0, singleDay)).join('\n')
  const filler = buildPageFiller(dayLabel)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

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

.task-prompt {
  border-left: 4pt solid #111827;
  background: #F3F4F6;
  padding: 10pt 14pt;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1F2937;
}

.response-area,
.checkpoint-box,
.workspace-box {
  margin-top: 7pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 2pt 10pt 6pt;
}

.response-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.response-line:last-child,
.workspace-line:last-child,
.checkpoint-line:last-child {
  border-bottom: none;
}

.fill-blank-list,
.field-list,
.choice-grid,
.pair-table,
.matching-grid {
  margin-top: 8pt;
}

.fill-row,
.field-row {
  margin-bottom: 10pt;
}

.fill-row:last-child,
.field-row:last-child {
  margin-bottom: 0;
}

.fill-text,
.field-label {
  font-size: 10pt;
  color: #374151;
  margin-bottom: 4pt;
}

.fill-line,
.field-line {
  border-bottom: 1pt solid #D1D5DB;
  height: 12pt;
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8pt 12pt;
}

.choice-option,
.pair-choice {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 8pt 10pt;
}

.choice-mark {
  width: 11pt;
  height: 11pt;
  border: 1.4pt solid #374151;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1pt;
}

.choice-label {
  color: #1F2937;
}

.pair-table {
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  overflow: hidden;
}

.pair-row {
  display: grid;
  grid-template-columns: 0.9fr 1fr 1fr;
  gap: 0;
  border-top: 1pt solid #D1D5DB;
}

.pair-row:first-child {
  border-top: none;
}

.pair-label {
  padding: 9pt 10pt;
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6B7280;
  background: #F9FAFB;
}

.pair-row .pair-choice {
  border: none;
  border-left: 1pt solid #D1D5DB;
  border-radius: 0;
  min-height: 100%;
}

.matching-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14pt;
}

.matching-column {
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  padding: 10pt 12pt;
}

.matching-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 8pt;
}

.match-item {
  display: flex;
  gap: 8pt;
  margin-bottom: 7pt;
  color: #1F2937;
}

.match-item:last-child {
  margin-bottom: 0;
}

.match-key {
  font-weight: 700;
  min-width: 14pt;
}

.workspace-grid {
  padding-top: 2pt;
}

.workspace-line,
.checkpoint-line {
  height: 8mm;
  border-bottom: 1pt solid #D1D5DB;
}

.workspace-answer {
  display: flex;
  align-items: center;
  gap: 8pt;
  border-top: 1pt solid #D1D5DB;
  padding-top: 10pt;
  margin-top: 10pt;
}

.workspace-answer-label {
  font-size: 9.5pt;
  font-weight: 700;
  color: #374151;
}

.workspace-answer-line {
  flex: 1;
  border-bottom: 1pt solid #374151;
  height: 12pt;
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
    ${filler}
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
