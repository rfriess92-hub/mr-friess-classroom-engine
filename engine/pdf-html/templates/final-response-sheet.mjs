import { escapeHtml, formatPrompt } from './shared.mjs'

// Final response sheet — the culminating document.
// Distinct from task_sheet: single featured prompt, optional planning space,
// then a continuous ruled response area. Feels like an assessment, not a packet.

function buildSuccessCriteria(items) {
  if (!items || items.length === 0) return ''
  const rows = items.map(item => `
    <div class="criteria-row">
      <span class="criteria-box"></span>
      <span class="criteria-text">${escapeHtml(item)}</span>
    </div>`).join('\n')
  return `
    <div class="criteria-section">
      <div class="criteria-label">Before you submit, check:</div>
      ${rows}
    </div>`
}

function buildPlanningSpace(n) {
  if (!n || n <= 0) return ''
  const lines = Array.from({ length: n }, () => '<div class="plan-line"></div>').join('\n')
  return `
    <div class="planning-block">
      <div class="planning-label">Planning Space &nbsp;—&nbsp; rough notes only, not graded</div>
      <div class="planning-lines">${lines}</div>
    </div>`
}

function buildResponseLines(n) {
  return Array.from({ length: n }, () => '<div class="response-line"></div>').join('\n')
}

export function buildFinalResponseSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Final Response'
  const prompt = section.prompt ?? ''
  const n_lines = section.response_lines ?? section.n_lines ?? 20
  const planning_lines = section.planning_lines ?? 0
  const planning_reminders = section.planning_reminders ?? []
  const success_criteria = section.success_criteria ?? []

  const remindersHTML = planning_reminders.length > 0
    ? `<ul class="reminder-list">${planning_reminders.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

/* ── Final response sheet extras ── */

.doc-eyebrow {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6B7280;
  margin-bottom: 4pt;
}

.doc-title {
  font-size: 24pt;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  margin-bottom: 16pt;
  border-bottom: 2pt solid #111827;
  padding-bottom: 10pt;
}

.prompt-box {
  border: 1.5pt solid #D1D5DB;
  border-left: 5pt solid #111827;
  border-radius: 4pt;
  padding: 14pt 16pt;
  margin-bottom: 6pt;
  background: #F9FAFB;
}

.prompt-box .prompt-kicker {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6B7280;
  margin-bottom: 8pt;
}

.prompt-box .prompt-text {
  font-size: 11.5pt;
  line-height: 1.55;
  color: #111827;
  font-weight: 400;
}

.reminder-list {
  margin: 10pt 0 0 16pt;
  font-size: 9.5pt;
  color: #374151;
  line-height: 1.6;
}

.planning-block {
  margin: 16pt 0;
  page-break-inside: avoid;
}

.planning-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  margin-bottom: 4pt;
}

.planning-lines .plan-line {
  height: 7mm;
  border-bottom: 1pt dashed #D1D5DB;
}

.response-section-label {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #374151;
  margin-bottom: 6pt;
  margin-top: 16pt;
  page-break-after: avoid;
}

.response-lines .response-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.criteria-section {
  margin-top: 20pt;
  border-top: 1pt solid #D1D5DB;
  padding-top: 12pt;
  page-break-inside: avoid;
}

.criteria-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 8pt;
}

.criteria-row {
  display: flex;
  align-items: flex-start;
  gap: 8pt;
  margin-bottom: 6pt;
  font-size: 10pt;
  color: #374151;
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
    <span class="masthead-school">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? 'Career Education')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? '8'))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    <div class="doc-eyebrow">Culminating Task</div>
    <div class="doc-title">${escapeHtml(title)}</div>

    <div class="prompt-box">
      <div class="prompt-kicker">Your prompt</div>
      <div class="prompt-text">${formatPrompt(prompt)}</div>
      ${remindersHTML}
    </div>

    ${buildPlanningSpace(planning_lines)}
    ${buildSuccessCriteria(success_criteria)}

    <div class="response-section-label">Your response</div>
    <div class="response-lines">
      ${buildResponseLines(n_lines)}
    </div>
  </div>
</body>
</html>`
}
