import { escapeHtml, formatPrompt } from './shared.mjs'

// Makeup Packet — student-facing catch-up document for absent students.
// Warm, direct tone. Numbered steps, optional vocab table, exit task callout.

function buildCatchUpStep(step, index) {
  const num = index + 1
  const label = step.label ?? `Step ${num}`
  const instructions = step.instructions ?? ''
  const hint = step.hint ?? ''

  return `
<div class="mp-step">
  <div class="mp-step-head">
    <span class="mp-step-num">${num}</span>
    <span class="mp-step-label">${escapeHtml(label)}</span>
  </div>
  ${instructions ? `<div class="mp-step-instructions">${formatPrompt(instructions)}</div>` : ''}
  ${hint ? `<div class="mp-hint"><span class="mp-hint-label">Hint</span>${escapeHtml(hint)}</div>` : ''}
</div>`
}

function buildVocabTable(vocab) {
  if (!Array.isArray(vocab) || vocab.length === 0) return ''
  return `
<div class="mp-vocab">
  <div class="mp-section-label">Words to know</div>
  <table class="mp-vocab-table">
    ${vocab.map((entry) => `
    <tr>
      <td class="mp-vocab-term">${escapeHtml(entry.term ?? '')}</td>
      <td class="mp-vocab-def">${escapeHtml(entry.definition ?? '')}</td>
    </tr>`).join('')}
  </table>
</div>`
}

export function buildMakeupPacketHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Makeup Packet'
  const absentDayLabel = section.absent_day_label ?? null
  const whatWeDid = section.what_we_did ?? ''
  const steps = Array.isArray(section.catch_up_steps) ? section.catch_up_steps : []
  const vocab = Array.isArray(section.vocabulary) ? section.vocabulary : []
  const exitTask = section.exit_task ?? ''
  const returnBy = section.return_by ?? ''

  const eyebrow = absentDayLabel ? `Makeup Packet — ${absentDayLabel}` : 'Makeup Packet'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.5in 0.65in; }

.mp-step {
  border: 1pt solid #E5E7EB;
  border-radius: 5pt;
  overflow: hidden;
  margin-bottom: 10pt;
  page-break-inside: avoid;
}

.mp-step-head {
  background: #1E3A5F;
  color: #F0F9FF;
  display: flex;
  align-items: center;
  gap: 10pt;
  padding: 6pt 12pt;
}

.mp-step-num {
  width: 20pt;
  height: 20pt;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9pt;
  font-weight: 700;
  flex-shrink: 0;
}

.mp-step-label {
  font-size: 11pt;
  font-weight: 700;
}

.mp-step-instructions {
  padding: 9pt 12pt;
  font-size: 10.5pt;
  color: #111827;
  line-height: 1.5;
}

.mp-step-instructions p { margin: 0; }
.mp-step-instructions p + p { margin-top: 5pt; }

.mp-hint {
  margin: 0 12pt 9pt;
  background: #EFF6FF;
  border-left: 3pt solid #3B82F6;
  border-radius: 0 3pt 3pt 0;
  padding: 6pt 10pt;
  font-size: 9.5pt;
  color: #1E40AF;
  display: flex;
  gap: 8pt;
  align-items: flex-start;
}

.mp-hint-label {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #3B82F6;
  white-space: nowrap;
  padding-top: 2pt;
  flex-shrink: 0;
}

.mp-section-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #6B7280;
  margin-bottom: 7pt;
}

.mp-what-we-did {
  background: #F9FAFB;
  border: 1pt solid #E5E7EB;
  border-radius: 4pt;
  padding: 10pt 13pt;
  margin-bottom: 16pt;
}

.mp-what-we-did-text {
  font-size: 10.5pt;
  color: #1F2937;
  line-height: 1.5;
}

.mp-what-we-did-text p { margin: 0; }
.mp-what-we-did-text p + p { margin-top: 5pt; }

.mp-vocab {
  margin-bottom: 16pt;
}

.mp-vocab-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
}

.mp-vocab-table tr {
  border-bottom: 1pt solid #E5E7EB;
}

.mp-vocab-table tr:last-child {
  border-bottom: none;
}

.mp-vocab-term {
  font-weight: 700;
  color: #111827;
  padding: 5pt 10pt 5pt 0;
  width: 30%;
  vertical-align: top;
}

.mp-vocab-def {
  color: #374151;
  padding: 5pt 0;
  vertical-align: top;
}

.mp-exit-task {
  background: #F0FDF4;
  border: 1pt solid #BBF7D0;
  border-left: 4pt solid #16A34A;
  border-radius: 0 4pt 4pt 0;
  padding: 10pt 13pt;
  margin-top: 16pt;
  page-break-inside: avoid;
}

.mp-exit-task-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #15803D;
  margin-bottom: 5pt;
}

.mp-exit-task-text {
  font-size: 10.5pt;
  color: #14532D;
  line-height: 1.5;
}

.mp-return-by {
  margin-top: 8pt;
  font-size: 9pt;
  color: #6B7280;
  font-style: italic;
}

.mp-lines {
  margin-top: 10pt;
}

.mp-line {
  height: 9mm;
  border-bottom: 1pt solid #D1D5DB;
}

.mp-line:last-child {
  border-bottom: none;
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

    <div class="doc-eyebrow">${escapeHtml(eyebrow)}</div>
    <div class="doc-title">${escapeHtml(title)}</div>

    ${whatWeDid ? `
    <div class="mp-what-we-did">
      <div class="mp-section-label">What we did in class</div>
      <div class="mp-what-we-did-text">${formatPrompt(whatWeDid)}</div>
    </div>` : ''}

    ${buildVocabTable(vocab)}

    <div class="mp-section-label" style="margin-bottom:10pt;">How to catch up — follow these steps</div>
    ${steps.map((step, i) => buildCatchUpStep(step, i)).join('\n')}

    ${exitTask ? `
    <div class="mp-exit-task">
      <div class="mp-exit-task-label">What to complete and return</div>
      <div class="mp-exit-task-text">${escapeHtml(exitTask)}</div>
      ${returnBy ? `<div class="mp-return-by">Due: ${escapeHtml(returnBy)}</div>` : ''}
      <div class="mp-lines">
        ${Array.from({ length: 4 }, () => '<div class="mp-line"></div>').join('\n')}
      </div>
    </div>` : ''}
  </div>
</body>
</html>`
}
