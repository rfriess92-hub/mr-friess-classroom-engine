import { escapeHtml, formatPrompt } from './shared.mjs'

function buildLines(count, className) {
  return Array.from({ length: count }, () => `<div class="${className}"></div>`).join('\n')
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

function normalizeLabels(labels, fallbackLabels) {
  if (!Array.isArray(labels) || labels.length === 0) return fallbackLabels

  const cleaned = labels
    .map((label) => String(label ?? '').trim())
    .filter(Boolean)

  if (cleaned.length === 0) return fallbackLabels

  return fallbackLabels.map((fallbackLabel, index) => cleaned[index] ?? fallbackLabel)
}

function normalizeTableRows(tableRows, fallbackRows) {
  if (Array.isArray(tableRows) && tableRows.length > 0) {
    return tableRows.map((row) => String(row ?? '').trim()).filter(Boolean)
  }

  if (Number.isInteger(tableRows) && tableRows > 0) {
    return Array.from({ length: tableRows }, (_, index) => `Row ${index + 1}`)
  }

  return fallbackRows
}

function buildPlanningReminders(items) {
  if (!Array.isArray(items) || items.length === 0) return ''

  return `
<div class="support-card">
  <div class="support-card-label">Use your notes</div>
  <ul class="support-list-inline">
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

function buildParagraphSupport(paragraphSupport) {
  if (!paragraphSupport) return ''

  const frameStrip = Array.isArray(paragraphSupport.frame_strip) ? paragraphSupport.frame_strip : []
  const reminderBox = paragraphSupport.reminder_box ? `
    <div class="frame-reminder">${escapeHtml(paragraphSupport.reminder_box)}</div>
  ` : ''

  if (frameStrip.length === 0 && !reminderBox) return ''

  return `
<div class="frame-card">
  <div class="support-card-label">Helpful structure</div>
  ${frameStrip.length > 0 ? `
    <div class="frame-strip">
      ${frameStrip.map((frame) => `<div class="frame-chip">${escapeHtml(frame)}</div>`).join('\n')}
    </div>
  ` : ''}
  ${reminderBox}
</div>`
}

function buildSuccessCriteria(items, label = 'Quick check') {
  if (!Array.isArray(items) || items.length === 0) return ''

  return `
<div class="criteria-section">
  <div class="support-card-label">${escapeHtml(label)}</div>
  ${items.map((item) => `
    <div class="criteria-row">
      <span class="criteria-box"></span>
      <span class="criteria-text">${escapeHtml(item)}</span>
    </div>`).join('\n')}
</div>`
}

function buildPlanningSpace(count) {
  if (!count || count <= 0) return ''
  return `
<div class="planning-block">
  <div class="support-card-label">Rough planning</div>
  <div class="planning-lines">
    ${Array.from({ length: count }, () => '<div class="planning-line"></div>').join('\n')}
  </div>
</div>`
}

function buildResponseLines(count) {
  return Array.from({ length: count }, () => '<div class="response-line"></div>').join('\n')
}

function buildResponseNote(note) {
  if (!note) return ''

  return `<div class="response-section-note">${escapeHtml(note)}</div>`
}

function buildFieldPanel(label, lineCount) {
  return `
<div class="structured-panel">
  <div class="structured-panel-label">${escapeHtml(label)}</div>
  <div class="structured-panel-lines">
    ${buildLines(lineCount, 'structured-line')}
  </div>
</div>`
}

function buildClaimEvidenceAction(hints, lineCount) {
  const labels = normalizeLabels(hints.structured_labels, ['Claim', 'Evidence', 'Action or next step'])
  return `
<div class="structured-stack">
  ${labels.map((label) => buildFieldPanel(label, lineCount)).join('\n')}
</div>`
}

function buildChainExplanation(hints, lineCount) {
  const labels = normalizeLabels(hints.structured_labels, ['What happened', 'Why it happened', 'What this means'])

  return `
<div class="chain-flow">
  ${labels.map((label, index) => `
    <div class="chain-step-wrap">
      ${buildFieldPanel(label, lineCount)}
      ${index < labels.length - 1 ? '<div class="chain-connector">Next</div>' : ''}
    </div>`).join('\n')}
</div>`
}

function buildMatrix(hints, lineCount) {
  const columns = Array.isArray(hints.table_columns) && hints.table_columns.length > 0
    ? hints.table_columns
    : ['Notice', 'Connection', 'Meaning']
  const rows = normalizeTableRows(hints.table_rows, ['Part 1', 'Part 2', 'Part 3'])
  const tableCellLines = clamp(hints.table_cell_lines ?? Math.max(1, lineCount - 1), 1, 3)

  return `
<table class="response-matrix">
  <thead>
    <tr>
      <th class="response-matrix-corner"></th>
      ${columns.map((column) => `<th class="response-matrix-header">${escapeHtml(column)}</th>`).join('\n')}
    </tr>
  </thead>
  <tbody>
    ${rows.map((rowLabel) => `
      <tr>
        <th class="response-matrix-row-label">${escapeHtml(rowLabel)}</th>
        ${columns.map(() => `
          <td class="response-matrix-cell">
            ${buildLines(tableCellLines, 'response-matrix-line')}
          </td>`).join('\n')}
      </tr>`).join('\n')}
  </tbody>
</table>`
}

function buildRoleNeedResponse(hints, lineCount) {
  const labels = normalizeLabels(
    hints.structured_labels,
    ['Need or risk', 'Who is affected', 'Who helps respond', 'Why this response matters'],
  )

  return `
<div class="role-response-grid">
  ${labels.map((label) => buildFieldPanel(label, lineCount)).join('\n')}
</div>`
}

function buildResponseStructure(section) {
  const hints = section.render_hints ?? {}
  const responsePattern = hints.response_pattern ?? 'open_response'
  const responseLabel = hints.response_label ?? 'Write your response here'
  const responseNote = hints.response_note ?? ''
  const structuredLineCount = clamp(section.response_lines ?? section.n_lines ?? 3, 2, 4)

  switch (responsePattern) {
    case 'claim_evidence_action':
      return {
        responseLabel,
        responseNote,
        body: buildClaimEvidenceAction(hints, structuredLineCount),
      }
    case 'chain_explanation':
      return {
        responseLabel,
        responseNote,
        body: buildChainExplanation(hints, structuredLineCount),
      }
    case 'map_or_matrix':
      return {
        responseLabel,
        responseNote,
        body: buildMatrix(hints, structuredLineCount),
      }
    case 'role_need_response':
      return {
        responseLabel,
        responseNote,
        body: buildRoleNeedResponse(hints, structuredLineCount),
      }
    case 'open_response':
    default:
      return {
        responseLabel,
        responseNote,
        body: `
<div class="response-lines">
  ${buildResponseLines(section.response_lines ?? section.n_lines ?? 12)}
</div>`,
      }
  }
}

export function buildFinalResponseSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const hints = section.render_hints ?? {}
  const title = section.title ?? 'Final Response'
  const prompt = section.prompt ?? ''
  const planningLines = section.planning_lines ?? 0
  const promptLabel = hints.prompt_label ?? 'Your prompt'
  const purposeLine = hints.purpose_line ? `<div class="doc-subtitle">${escapeHtml(hints.purpose_line)}</div>` : ''
  const quickCheckItems = Array.isArray(hints.quick_check_items) && hints.quick_check_items.length > 0
    ? hints.quick_check_items
    : section.success_criteria
  const quickCheckLabel = hints.quick_check_label ?? 'Quick check'
  const responseStructure = buildResponseStructure(section)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

.doc-title {
  margin-bottom: 14pt;
  border-bottom: 2pt solid #111827;
  padding-bottom: 10pt;
}

.prompt-box {
  border: 1.5pt solid #D1D5DB;
  border-left: 5pt solid #111827;
  border-radius: 4pt;
  padding: 14pt 16pt;
  margin-bottom: 12pt;
  background: #F9FAFB;
}

.prompt-box-label,
.support-card-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #4B5563;
  margin-bottom: 8pt;
}

.prompt-text {
  font-size: 11pt;
  line-height: 1.6;
  color: #111827;
}

.support-card,
.frame-card,
.planning-block,
.criteria-section {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin-bottom: 12pt;
  page-break-inside: avoid;
}

.support-card,
.frame-card {
  background: #FFFFFF;
}

.support-list-inline {
  padding-left: 16pt;
}

.support-list-inline li {
  color: #374151;
  margin-bottom: 4pt;
}

.support-list-inline li:last-child {
  margin-bottom: 0;
}

.frame-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8pt;
}

.frame-chip {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 6pt 8pt;
  background: #F9FAFB;
  font-size: 9.5pt;
  color: #374151;
}

.frame-reminder {
  margin-top: 10pt;
  font-size: 9.5pt;
  color: #6B7280;
}

.planning-line {
  height: 7mm;
  border-bottom: 1pt dashed #D1D5DB;
}

.planning-line:last-child {
  border-bottom: none;
}

.response-section-label {
  font-size: 9pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #374151;
  margin: 14pt 0 6pt;
  page-break-after: avoid;
}

.response-section-note {
  font-size: 9.25pt;
  color: #6B7280;
  margin-bottom: 8pt;
}

.response-lines,
.structured-panel-lines {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 2pt 10pt 6pt;
}

.response-line,
.structured-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.response-line:last-child,
.structured-line:last-child,
.response-matrix-line:last-child {
  border-bottom: none;
}

.structured-stack,
.chain-flow,
.role-response-grid,
.response-matrix {
  page-break-inside: avoid;
}

.structured-stack {
  display: grid;
  gap: 10pt;
}

.structured-panel {
  margin-bottom: 0;
}

.structured-panel-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #4B5563;
  margin-bottom: 5pt;
}

.chain-flow {
  display: grid;
  gap: 8pt;
}

.chain-step-wrap {
  display: grid;
  gap: 6pt;
}

.chain-connector {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  text-align: center;
}

.role-response-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10pt 12pt;
}

.response-matrix {
  width: 100%;
  border-collapse: collapse;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  overflow: hidden;
}

.response-matrix th,
.response-matrix td {
  border: 1pt solid #D1D5DB;
}

.response-matrix-header,
.response-matrix-corner {
  background: #F9FAFB;
}

.response-matrix-header {
  padding: 8pt 10pt;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #374151;
}

.response-matrix-row-label {
  padding: 8pt 10pt;
  font-size: 9pt;
  font-weight: 600;
  color: #374151;
  width: 22%;
}

.response-matrix-cell {
  vertical-align: top;
  padding: 5pt 8pt 4pt;
}

.response-matrix-line {
  height: 7mm;
  border-bottom: 1pt solid #D1D5DB;
}

.criteria-row {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
  margin-bottom: 6pt;
  font-size: 9.75pt;
  color: #374151;
}

.criteria-row:last-child {
  margin-bottom: 0;
}

.criteria-box {
  width: 10pt;
  height: 10pt;
  border: 1.5pt solid #374151;
  border-radius: 2pt;
  flex-shrink: 0;
  margin-top: 1pt;
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

    <div class="doc-eyebrow">Final Response Sheet</div>
    <div class="doc-title">${escapeHtml(title)}</div>
    ${purposeLine}

    <div class="prompt-box">
      <div class="prompt-box-label">${escapeHtml(promptLabel)}</div>
      <div class="prompt-text">${formatPrompt(prompt)}</div>
    </div>

    ${buildPlanningReminders(section.planning_reminders)}
    ${buildParagraphSupport(section.paragraph_support)}
    ${buildPlanningSpace(planningLines)}

    <div class="response-section-label">${escapeHtml(responseStructure.responseLabel)}</div>
    ${buildResponseNote(responseStructure.responseNote)}
    ${responseStructure.body}

    ${buildSuccessCriteria(quickCheckItems, quickCheckLabel)}
  </div>
</body>
</html>`
}
