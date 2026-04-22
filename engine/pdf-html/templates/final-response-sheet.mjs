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

function buildPrepPanels(section) {
  const planningReminders = Array.isArray(section.planning_reminders) ? section.planning_reminders : []
  const paragraphSupport = section.paragraph_support ?? {}
  const frameStrip = Array.isArray(paragraphSupport.frame_strip) ? paragraphSupport.frame_strip : []
  const reminderBox = String(paragraphSupport.reminder_box ?? '').trim()
  const content = []

  if (planningReminders.length > 0) {
    content.push(`
  <ul class="prep-list">
    ${planningReminders.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>`)
  }

  if (frameStrip.length > 0 || reminderBox) {
    content.push(`
  ${frameStrip.length > 0 ? `
    <div class="prep-chip-row">
      ${frameStrip.map((frame) => `<span class="prep-chip">${escapeHtml(frame)}</span>`).join('\n')}
    </div>
  ` : ''}
  ${reminderBox ? `<div class="prep-note">${escapeHtml(reminderBox)}</div>` : ''}`)
  }

  if (content.length === 0) return ''

  return `
<div class="prep-panel">
  ${content.join('\n')}
</div>`
}

function buildPlanningSpace(count) {
  if (!count || count <= 0) return ''

  return `
<div class="planning-block">
  <div class="planning-label">Plan first if helpful</div>
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

function buildSuccessCriteria(items, label = 'Quick check') {
  if (!Array.isArray(items) || items.length === 0) return ''

  return `
<div class="criteria-section">
  <div class="criteria-label">${escapeHtml(label)}</div>
  ${items.map((item) => `
    <div class="criteria-row">
      <span class="criteria-box"></span>
      <span class="criteria-text">${escapeHtml(item)}</span>
    </div>`).join('\n')}
</div>`
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
  margin-bottom: 12pt;
  border-bottom: 1pt solid #D1D5DB;
  padding-bottom: 8pt;
}

.prompt-box {
  border: 1pt solid #D1D5DB;
  border-radius: 10pt;
  padding: 12pt 14pt;
  margin-bottom: 12pt;
  background: #FBFAF7;
}

.prompt-box-label,
.prep-label,
.planning-label,
.criteria-label,
.structured-panel-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.01em;
  color: #6B7280;
  margin-bottom: 6pt;
}

.prompt-text {
  font-size: 10.8pt;
  line-height: 1.58;
  color: #111827;
}

.prep-panel {
  border: 1pt solid #E5E7EB;
  border-radius: 10pt;
  padding: 10pt 12pt;
  margin-bottom: 12pt;
  background: #FFFFFF;
}

.prep-list {
  padding-left: 16pt;
}

.prep-list li {
  margin-bottom: 4pt;
  color: #4B5563;
  font-size: 9.5pt;
}

.prep-list li:last-child {
  margin-bottom: 0;
}

.prep-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8pt;
}

.prep-chip {
  border: 1pt solid #D1D5DB;
  border-radius: 999pt;
  padding: 5pt 10pt;
  background: #F9FAFB;
  font-size: 9pt;
  color: #374151;
}

.prep-note {
  margin-top: 8pt;
  color: #6B7280;
  font-size: 9.25pt;
  line-height: 1.45;
}

.planning-block {
  border: 1pt dashed #D1D5DB;
  border-radius: 10pt;
  padding: 10pt 12pt 8pt;
  margin-bottom: 14pt;
  background: #FFFFFF;
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
  color: #374151;
  margin: 14pt 0 6pt;
  page-break-after: avoid;
}

.response-section-note {
  font-size: 9.25pt;
  color: #6B7280;
  margin-bottom: 8pt;
}

.response-shell {
  border: 1pt solid #CFC7BC;
  border-radius: 12pt;
  padding: 10pt 12pt 12pt;
  background: #FFFFFF;
}

.response-lines {
  padding: 2pt 2pt 4pt;
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

.structured-panel-lines {
  border: 1pt solid #D1D5DB;
  border-radius: 9pt;
  padding: 2pt 10pt 6pt;
  background: #FCFBF8;
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
  border-radius: 10pt;
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

.criteria-section {
  margin-top: 14pt;
  border-top: 1pt solid #E5E7EB;
  padding-top: 10pt;
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
  border: 1.4pt solid #6B7280;
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

    <div class="doc-title">${escapeHtml(title)}</div>
    ${purposeLine}

    <div class="prompt-box">
      ${promptLabel ? `<div class="prompt-box-label">${escapeHtml(promptLabel)}</div>` : ''}
      <div class="prompt-text">${formatPrompt(prompt)}</div>
    </div>

    ${buildPrepPanels(section)}
    ${buildPlanningSpace(planningLines)}

    <div class="response-section-label">${escapeHtml(responseStructure.responseLabel)}</div>
    ${buildResponseNote(responseStructure.responseNote)}
    <div class="response-shell">
      ${responseStructure.body}
    </div>

    ${buildSuccessCriteria(quickCheckItems, quickCheckLabel)}
  </div>
</body>
</html>`
}
