import { escapeHtml, formatPrompt } from './shared.mjs'

// Worksheet — numbered questions with academic structure.
// Distinct from task_sheet: question numbers in circles, no day grouping,
// no task badges, optional point values, more formal academic feel.

function buildResponseLines(n) {
  return Array.from({ length: n }, () => '<div class="ws-line"></div>').join('\n')
}

function buildQuestion(question, index) {
  const n_lines = question.n_lines ?? 3
  const points = question.points ?? null
  const qText = question.q_text ?? question.prompt ?? ''
  const subQuestions = question.sub_questions ?? []

  const subQHTML = subQuestions.length > 0
    ? `<div class="sub-questions">${subQuestions.map((sq, i) => `
        <div class="sub-question">
          <span class="sub-label">${String.fromCharCode(97 + i)})</span>
          <div class="sub-content">
            <div class="sub-text">${escapeHtml(sq.q_text ?? sq.prompt ?? '')}</div>
            <div class="ws-lines">${buildResponseLines(sq.n_lines ?? 2)}</div>
          </div>
        </div>`).join('')}</div>`
    : `<div class="ws-lines">${buildResponseLines(n_lines)}</div>`

  return `
<div class="question-block">
  <div class="question-header">
    <span class="question-number">${index + 1}</span>
    <div class="question-body">
      <div class="question-text">${formatPrompt(qText)}</div>
      ${points ? `<div class="question-points">${points} pt${points !== 1 ? 's' : ''}</div>` : ''}
    </div>
  </div>
  ${subQHTML}
</div>`
}

export function buildWorksheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Worksheet'
  const questions = Array.isArray(section.questions) ? section.questions : []
  const tip = section.tip ?? null
  const anchor = section.anchor ?? []

  const tipHTML = tip
    ? `<div class="ws-tip"><span class="ws-tip-label">Tip:</span> ${escapeHtml(tip)}</div>`
    : ''

  const anchorHTML = anchor.length > 0
    ? `<div class="ws-anchor">
        <div class="ws-anchor-label">Keep in mind:</div>
        <ul>${anchor.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

/* ── Worksheet extras ── */

.doc-title {
  font-size: 22pt;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  margin-bottom: 14pt;
}

.ws-tip {
  background: #F3F4F6;
  border-left: 4pt solid #9CA3AF;
  padding: 8pt 12pt;
  font-size: 10pt;
  color: #374151;
  margin-bottom: 14pt;
  border-radius: 0 4pt 4pt 0;
}

.ws-tip-label {
  font-weight: 700;
}

.ws-anchor {
  background: #F3F4F6;
  border-left: 4pt solid #111827;
  padding: 8pt 12pt;
  font-size: 10pt;
  color: #374151;
  margin-bottom: 16pt;
  border-radius: 0 4pt 4pt 0;
}

.ws-anchor-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 5pt;
}

.ws-anchor ul {
  margin-left: 14pt;
  line-height: 1.6;
}

.question-block {
  margin-bottom: 18pt;
  page-break-inside: avoid;
}

.question-header {
  display: flex;
  align-items: flex-start;
  gap: 10pt;
  margin-bottom: 6pt;
}

.question-number {
  width: 20pt;
  height: 20pt;
  border: 1.5pt solid #111827;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9pt;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1pt;
}

.question-body {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8pt;
}

.question-text {
  font-size: 11pt;
  line-height: 1.5;
  color: #111827;
  flex: 1;
}

.question-points {
  font-size: 8.5pt;
  color: #6B7280;
  font-weight: 600;
  white-space: nowrap;
  padding-top: 2pt;
}

.ws-lines .ws-line {
  height: 9mm;
  border-bottom: 1pt solid #D1D5DB;
}

.sub-questions {
  margin-left: 30pt;
  margin-top: 6pt;
}

.sub-question {
  display: flex;
  gap: 8pt;
  margin-bottom: 10pt;
}

.sub-label {
  font-size: 9.5pt;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
  padding-top: 1pt;
}

.sub-content {
  flex: 1;
}

.sub-text {
  font-size: 10.5pt;
  line-height: 1.45;
  color: #374151;
  margin-bottom: 5pt;
}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? '')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? '8'))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    <div class="doc-title">${escapeHtml(title)}</div>

    ${tipHTML}
    ${anchorHTML}

    ${questions.map((q, i) => buildQuestion(q, i)).join('\n')}
  </div>
</body>
</html>`
}
