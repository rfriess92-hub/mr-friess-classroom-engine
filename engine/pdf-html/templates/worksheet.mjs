import { escapeHtml, formatPrompt } from './shared.mjs'

function buildResponseLines(count) {
  return Array.from({ length: count }, () => '<div class="ws-line"></div>').join('\n')
}

function buildQuestion(question, index) {
  const qNumber = question.q_num ?? index + 1
  const questionText = question.q_text ?? question.prompt ?? ''
  const subQuestions = Array.isArray(question.sub_questions) ? question.sub_questions : []
  const pointLabel = question.points ? `<div class="question-points">${escapeHtml(String(question.points))} pt${question.points === 1 ? '' : 's'}</div>` : ''

  const responseHtml = subQuestions.length > 0
    ? `
      <div class="sub-questions">
        ${subQuestions.map((subQuestion, subIndex) => `
          <div class="sub-question">
            <span class="sub-label">${String.fromCharCode(97 + subIndex)})</span>
            <div class="sub-content">
              <div class="sub-text">${escapeHtml(subQuestion.q_text ?? subQuestion.prompt ?? '')}</div>
              <div class="ws-lines">${buildResponseLines(subQuestion.n_lines ?? 2)}</div>
            </div>
          </div>`).join('\n')}
      </div>`
    : `<div class="ws-lines">${buildResponseLines(question.n_lines ?? 3)}</div>`

  return `
<section class="question-block">
  <div class="question-header">
    <span class="question-number">${escapeHtml(String(qNumber))}</span>
    <div class="question-body">
      <div class="question-text">${formatPrompt(questionText)}</div>
      ${pointLabel}
    </div>
  </div>
  ${responseHtml}
</section>`
}

function buildChecklist(title, items, className) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return `
<div class="${className}">
  <div class="section-kicker">${escapeHtml(title)}</div>
  <ul>
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

export function buildWorksheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Worksheet'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

.doc-title {
  margin-bottom: 14pt;
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
  line-height: 1.55;
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

.ws-lines {
  margin-top: 6pt;
}

.ws-line {
  height: 9mm;
  border-bottom: 1pt solid #D1D5DB;
}

.ws-line:last-child {
  border-bottom: none;
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

.sub-question:last-child {
  margin-bottom: 0;
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

.tip-box,
.anchor-box,
.self-check-box {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin-bottom: 14pt;
}

.tip-box,
.anchor-box {
  background: #F3F4F6;
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

    <div class="doc-eyebrow">Worksheet</div>
    <div class="doc-title">${escapeHtml(title)}</div>

    ${section.tip ? `<div class="tip-box"><div class="section-kicker">Tip</div><div>${escapeHtml(section.tip)}</div></div>` : ''}
    ${buildChecklist('Keep in mind', section.anchor, 'anchor-box')}

    ${(Array.isArray(section.questions) ? section.questions : []).map(buildQuestion).join('\n')}

    ${buildChecklist('Quick self-check', section.self_check, 'self-check-box')}
  </div>
</body>
</html>`
}
