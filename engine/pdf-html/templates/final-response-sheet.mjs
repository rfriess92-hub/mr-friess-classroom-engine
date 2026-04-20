import { escapeHtml, formatPrompt } from './shared.mjs'

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

function buildSuccessCriteria(items) {
  if (!Array.isArray(items) || items.length === 0) return ''

  return `
<div class="criteria-section">
  <div class="support-card-label">Quick check</div>
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

export function buildFinalResponseSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Final Response'
  const prompt = section.prompt ?? ''
  const responseLines = section.response_lines ?? section.n_lines ?? 12
  const planningLines = section.planning_lines ?? 0

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
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
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
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #374151;
  margin: 14pt 0 6pt;
  page-break-after: avoid;
}

.response-lines {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 2pt 10pt 6pt;
}

.response-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.response-line:last-child {
  border-bottom: none;
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

    <div class="prompt-box">
      <div class="prompt-box-label">Your prompt</div>
      <div class="prompt-text">${formatPrompt(prompt)}</div>
    </div>

    ${buildPlanningReminders(section.planning_reminders)}
    ${buildParagraphSupport(section.paragraph_support)}
    ${buildPlanningSpace(planningLines)}

    <div class="response-section-label">Write your response here</div>
    <div class="response-lines">
      ${buildResponseLines(responseLines)}
    </div>

    ${buildSuccessCriteria(section.success_criteria)}
  </div>
</body>
</html>`
}
