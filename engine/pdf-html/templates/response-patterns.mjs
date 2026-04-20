import { escapeHtml, formatPrompt } from './shared.mjs'

function buildLines(count, className) {
  return Array.from({ length: count }, () => `<div class="${className}"></div>`).join('\n')
}

function buildPrompt(prompt, includePrompt) {
  if (!includePrompt || !prompt) return ''
  return `<div class="pattern-prompt">${formatPrompt(prompt)}</div>`
}

function normalizeFieldLabel(field, fallbackIndex) {
  if (typeof field === 'string') return field
  if (field && typeof field.label === 'string') return field.label
  return `Field ${fallbackIndex + 1}`
}

function normalizeChoiceLabel(option, fallbackIndex) {
  if (typeof option === 'string') return option
  if (option && typeof option.label === 'string') return option.label
  return `Option ${fallbackIndex + 1}`
}

function normalizeTableRows(tableRows) {
  if (Array.isArray(tableRows)) return tableRows
  if (Number.isInteger(tableRows) && tableRows > 0) {
    return Array.from({ length: tableRows }, (_, index) => `Row ${index + 1}`)
  }
  return []
}

function buildOpenResponse({ prompt, lines, includePrompt }) {
  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-response-box">
  ${buildLines(lines, 'pattern-line')}
</div>`
}

function buildFillInBlank({ prompt, hints, lines, includePrompt }) {
  const prompts = Array.isArray(hints.blank_prompts) ? hints.blank_prompts : []
  if (prompts.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-fill-list">
  ${prompts.map((promptText) => `
    <div class="pattern-fill-row">
      <div class="pattern-fill-text">${escapeHtml(promptText)}</div>
      <div class="pattern-fill-line"></div>
    </div>`).join('\n')}
</div>`
}

function buildMultipleChoice({ prompt, hints, lines, includePrompt }) {
  const options = Array.isArray(hints.choice_options) ? hints.choice_options : []
  if (options.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-choice-grid">
  ${options.map((option, index) => `
    <div class="pattern-choice-option">
      <span class="pattern-choice-mark"></span>
      <span class="pattern-choice-label">${escapeHtml(normalizeChoiceLabel(option, index))}</span>
    </div>`).join('\n')}
</div>`
}

function buildPairedChoice({ prompt, hints, lines, includePrompt }) {
  const pairs = Array.isArray(hints.choice_pairs) ? hints.choice_pairs : []
  if (pairs.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-pair-table">
  ${pairs.map((pair) => `
    <div class="pattern-pair-row">
      <div class="pattern-pair-label">${escapeHtml(pair.label ?? '')}</div>
      <div class="pattern-pair-choice"><span class="pattern-choice-mark"></span><span>${escapeHtml(pair.left)}</span></div>
      <div class="pattern-pair-choice"><span class="pattern-choice-mark"></span><span>${escapeHtml(pair.right)}</span></div>
    </div>`).join('\n')}
</div>`
}

function buildMatching({ prompt, hints, lines, includePrompt }) {
  const columns = hints.matching_columns ?? {}
  const leftItems = Array.isArray(columns.left_items) ? columns.left_items : []
  const rightItems = Array.isArray(columns.right_items) ? columns.right_items : []
  if (leftItems.length === 0 && rightItems.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-matching-grid">
  <div class="pattern-matching-column">
    <div class="pattern-matching-label">${escapeHtml(columns.left_label ?? 'Left side')}</div>
    ${leftItems.map((item, index) => `
      <div class="pattern-match-item">
        <span class="pattern-match-key">${index + 1}.</span>
        <span>${escapeHtml(item)}</span>
      </div>`).join('\n')}
  </div>
  <div class="pattern-matching-column">
    <div class="pattern-matching-label">${escapeHtml(columns.right_label ?? 'Right side')}</div>
    ${rightItems.map((item, index) => `
      <div class="pattern-match-item">
        <span class="pattern-match-key">${String.fromCharCode(65 + index)}.</span>
        <span>${escapeHtml(item)}</span>
      </div>`).join('\n')}
  </div>
</div>`
}

function buildRecordFields({ prompt, hints, lines, includePrompt }) {
  const fields = Array.isArray(hints.record_fields) ? hints.record_fields : []
  if (fields.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-field-list">
  ${fields.map((field, index) => `
    <div class="pattern-field-row">
      <div class="pattern-field-label">${escapeHtml(normalizeFieldLabel(field, index))}</div>
      <div class="pattern-field-line"></div>
    </div>`).join('\n')}
</div>`
}

function buildTableRecord({ prompt, hints, lines, includePrompt }) {
  const columns = Array.isArray(hints.table_columns) ? hints.table_columns : []
  const rows = normalizeTableRows(hints.table_rows)
  const cellLines = Math.max(1, hints.table_cell_lines ?? 1)
  if (columns.length === 0 || rows.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  return `
${buildPrompt(prompt, includePrompt)}
<table class="pattern-table-record">
  <thead>
    <tr>
      <th class="pattern-table-corner"></th>
      ${columns.map((column) => `<th class="pattern-table-header">${escapeHtml(column)}</th>`).join('\n')}
    </tr>
  </thead>
  <tbody>
    ${rows.map((rowLabel) => `
      <tr>
        <th class="pattern-table-row-label">${escapeHtml(rowLabel)}</th>
        ${columns.map(() => `<td class="pattern-table-cell">${buildLines(cellLines, 'pattern-table-line')}</td>`).join('\n')}
      </tr>`).join('\n')}
  </tbody>
</table>`
}

function buildDiagramLabel({ prompt, hints, lines, includePrompt }) {
  const parts = Array.isArray(hints.diagram_parts) ? hints.diagram_parts : []
  if (parts.length === 0) return buildOpenResponse({ prompt, lines, includePrompt })

  const midpoint = Math.ceil(parts.length / 2)
  const leftParts = parts.slice(0, midpoint)
  const rightParts = parts.slice(midpoint)
  const diagramTitle = hints.diagram_title ?? 'Diagram'
  const diagramNote = hints.diagram_note ?? 'Use the label bank to place each term in the correct numbered spot.'

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-diagram-layout">
  <div class="pattern-diagram-column">
    ${leftParts.map((_, index) => `
      <div class="pattern-diagram-target">
        <span class="pattern-diagram-number">${index + 1}</span>
        <span class="pattern-diagram-line"></span>
      </div>`).join('\n')}
  </div>
  <div class="pattern-diagram-panel">
    <div class="pattern-diagram-title">${escapeHtml(diagramTitle)}</div>
    <div class="pattern-diagram-note">${escapeHtml(diagramNote)}</div>
  </div>
  <div class="pattern-diagram-column">
    ${rightParts.map((_, index) => `
      <div class="pattern-diagram-target">
        <span class="pattern-diagram-number">${midpoint + index + 1}</span>
        <span class="pattern-diagram-line"></span>
      </div>`).join('\n')}
  </div>
</div>
<div class="pattern-label-bank">
  <div class="pattern-label-bank-title">Label bank</div>
  <div class="pattern-label-chip-row">
    ${parts.map((part) => `<span class="pattern-label-chip">${escapeHtml(part)}</span>`).join('\n')}
  </div>
</div>`
}

function buildCalculationWorkspace({ prompt, hints, lines, includePrompt }) {
  const workspaceRows = Math.max(2, hints.workspace_rows ?? lines ?? 6)
  const answerLabel = hints.answer_label ?? 'Final answer'

  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-workspace-box">
  <div class="pattern-workspace-grid">
    ${buildLines(workspaceRows, 'pattern-workspace-line')}
  </div>
  <div class="pattern-workspace-answer">
    <span class="pattern-workspace-answer-label">${escapeHtml(answerLabel)}</span>
    <span class="pattern-workspace-answer-line"></span>
  </div>
</div>`
}

function buildCompactCheckpoint({ prompt, hints, lines, includePrompt }) {
  const count = Math.max(1, hints.lines ?? lines ?? 2)
  return `
${buildPrompt(prompt, includePrompt)}
<div class="pattern-compact-box">
  ${buildLines(count, 'pattern-compact-line')}
</div>`
}

export function buildResponsePatternBody({ prompt = '', hints = {}, lines = 4, includePrompt = true }) {
  const pattern = hints.response_pattern ?? 'open_response'

  switch (pattern) {
    case 'fill_in_blank':
      return buildFillInBlank({ prompt, hints, lines, includePrompt })
    case 'choice_select':
    case 'multiple_choice':
      return buildMultipleChoice({ prompt, hints, lines, includePrompt })
    case 'paired_choice':
      return buildPairedChoice({ prompt, hints, lines, includePrompt })
    case 'matching':
      return buildMatching({ prompt, hints, lines, includePrompt })
    case 'record_fields':
      return buildRecordFields({ prompt, hints, lines, includePrompt })
    case 'table_record':
      return buildTableRecord({ prompt, hints, lines, includePrompt })
    case 'diagram_label':
      return buildDiagramLabel({ prompt, hints, lines, includePrompt })
    case 'calculation_workspace':
      return buildCalculationWorkspace({ prompt, hints, lines, includePrompt })
    case 'compact_checkpoint':
      return buildCompactCheckpoint({ prompt, hints, lines, includePrompt })
    case 'open_response':
    default:
      return buildOpenResponse({ prompt, lines, includePrompt })
  }
}

export const responsePatternCss = `
.pattern-prompt {
  border-left: 4pt solid #111827;
  background: #F3F4F6;
  padding: 10pt 14pt;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1F2937;
}

.pattern-response-box,
.pattern-compact-box,
.pattern-workspace-box {
  margin-top: 7pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 2pt 10pt 6pt;
}

.pattern-line,
.pattern-workspace-line,
.pattern-compact-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.pattern-line:last-child,
.pattern-workspace-line:last-child,
.pattern-compact-line:last-child,
.pattern-table-line:last-child {
  border-bottom: none;
}

.pattern-fill-list,
.pattern-field-list,
.pattern-choice-grid,
.pattern-pair-table,
.pattern-matching-grid,
.pattern-table-record,
.pattern-label-bank {
  margin-top: 8pt;
}

.pattern-fill-row,
.pattern-field-row {
  margin-bottom: 10pt;
}

.pattern-fill-row:last-child,
.pattern-field-row:last-child {
  margin-bottom: 0;
}

.pattern-fill-text,
.pattern-field-label {
  font-size: 10pt;
  color: #374151;
  margin-bottom: 4pt;
}

.pattern-fill-line,
.pattern-field-line {
  border-bottom: 1pt solid #D1D5DB;
  height: 12pt;
}

.pattern-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8pt 12pt;
}

.pattern-choice-option,
.pattern-pair-choice {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 8pt 10pt;
}

.pattern-choice-mark {
  width: 11pt;
  height: 11pt;
  border: 1.4pt solid #374151;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1pt;
}

.pattern-choice-label {
  color: #1F2937;
}

.pattern-pair-table {
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  overflow: hidden;
}

.pattern-pair-row {
  display: grid;
  grid-template-columns: 0.9fr 1fr 1fr;
  gap: 0;
  border-top: 1pt solid #D1D5DB;
}

.pattern-pair-row:first-child {
  border-top: none;
}

.pattern-pair-label {
  padding: 9pt 10pt;
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6B7280;
  background: #F9FAFB;
}

.pattern-pair-row .pattern-pair-choice {
  border: none;
  border-left: 1pt solid #D1D5DB;
  border-radius: 0;
  min-height: 100%;
}

.pattern-matching-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14pt;
}

.pattern-matching-column {
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  padding: 10pt 12pt;
}

.pattern-matching-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 8pt;
}

.pattern-match-item {
  display: flex;
  gap: 8pt;
  margin-bottom: 8pt;
  color: #1F2937;
}

.pattern-match-item:last-child {
  margin-bottom: 0;
}

.pattern-match-key {
  font-weight: 700;
  color: #374151;
  width: 18pt;
  flex-shrink: 0;
}

.pattern-table-record {
  width: 100%;
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  overflow: hidden;
  border-collapse: collapse;
}

.pattern-table-record th,
.pattern-table-record td {
  border: 1pt solid #D1D5DB;
  min-height: 44pt;
}

.pattern-table-header {
  background: #F9FAFB;
  padding: 8pt 10pt;
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #374151;
}

.pattern-table-corner {
  background: #F9FAFB;
}

.pattern-table-row-label {
  padding: 8pt 10pt;
  font-size: 9.5pt;
  font-weight: 600;
  color: #374151;
}

.pattern-table-cell {
  padding: 6pt 8pt 4pt;
  vertical-align: top;
}

.pattern-table-line {
  height: 7mm;
  border-bottom: 1pt solid #D1D5DB;
}

.pattern-diagram-layout {
  display: grid;
  grid-template-columns: 1fr minmax(180pt, 1.2fr) 1fr;
  gap: 12pt;
  align-items: stretch;
  margin-top: 8pt;
}

.pattern-diagram-column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10pt;
}

.pattern-diagram-target {
  display: flex;
  align-items: center;
  gap: 8pt;
}

.pattern-diagram-number {
  width: 18pt;
  height: 18pt;
  border: 1.4pt solid #374151;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8.5pt;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}

.pattern-diagram-line {
  flex: 1;
  border-bottom: 1.2pt solid #D1D5DB;
  height: 12pt;
}

.pattern-diagram-panel {
  border: 1.5pt dashed #9CA3AF;
  border-radius: 8pt;
  min-height: 170pt;
  padding: 16pt;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: #F9FAFB;
}

.pattern-diagram-title {
  font-size: 11pt;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8pt;
}

.pattern-diagram-note {
  font-size: 9.5pt;
  line-height: 1.45;
  color: #6B7280;
}

.pattern-label-bank {
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  padding: 10pt 12pt;
  background: #FFFFFF;
}

.pattern-label-bank-title {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 8pt;
}

.pattern-label-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8pt;
}

.pattern-label-chip {
  display: inline-flex;
  align-items: center;
  border: 1pt solid #D1D5DB;
  border-radius: 999pt;
  padding: 5pt 10pt;
  font-size: 9pt;
  color: #374151;
  background: #F9FAFB;
}

.pattern-workspace-answer {
  display: flex;
  align-items: center;
  gap: 8pt;
  margin-top: 8pt;
}

.pattern-workspace-answer-label {
  font-size: 9pt;
  font-weight: 700;
  color: #374151;
  white-space: nowrap;
}

.pattern-workspace-answer-line {
  flex: 1;
  border-bottom: 1pt solid #D1D5DB;
  height: 12pt;
}
`
