import { escapeHtml, formatPrompt } from './shared.mjs'
import { buildResponsePatternBody, responsePatternCss } from './response-patterns.mjs'

function buildResponseLines(count) {
  return Array.from({ length: count }, () => '<div class="ws-line"></div>').join('\n')
}

function buildLegacyLabeledResponses(labels, lineCount = 2) {
  return `
    <div class="legacy-response-stack">
      ${labels.map((label) => `
        <div class="legacy-response-block">
          <div class="legacy-response-label">${escapeHtml(label)}</div>
          <div class="ws-lines">${buildResponseLines(lineCount)}</div>
        </div>`).join('\n')}
    </div>`
}

function buildLegacyWorksheetResponse(question) {
  const labels = Array.isArray(question.response_labels) ? question.response_labels : []
  const responseMode = question.response_mode ?? 'generic'

  switch (responseMode) {
    case 'two_choice_explanations':
      return buildLegacyLabeledResponses(labels.length > 0 ? labels : ['Choice 1', 'Choice 2'], 2)
    case 'two_reasons':
      return buildLegacyLabeledResponses(labels.length > 0 ? labels : ['Reason 1', 'Reason 2'], 2)
    case 'example_explanation':
      return buildLegacyLabeledResponses(labels.length > 0 ? labels : ['Example', 'Why it matters'], 2)
    case 'judgment_reasoning':
      return buildLegacyLabeledResponses(labels.length > 0 ? labels : ['Judgment', 'Reasoning'], 2)
    case 'generic':
    default:
      return `<div class="ws-lines">${buildResponseLines(question.n_lines ?? 3)}</div>`
  }
}

function buildQuestion(question, index) {
  const qNumber = question.q_num ?? index + 1
  const questionText = question.q_text ?? question.prompt ?? ''
  const subQuestions = Array.isArray(question.sub_questions) ? question.sub_questions : []
  const pointLabel = question.points ? `<div class="question-points">${escapeHtml(String(question.points))} pt${question.points === 1 ? '' : 's'}</div>` : ''
  const hints = question.render_hints ?? {}

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
    : hints.response_pattern
      ? buildResponsePatternBody({
          prompt: questionText,
          hints,
          lines: hints.lines ?? question.n_lines ?? 3,
          includePrompt: false,
        })
      : buildLegacyWorksheetResponse(question)

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

const TIER_CONFIG = {
  scaffolded: { label: 'Scaffolded Support', color: '#166534', bg: '#DCFCE7', border: '#86EFAC' },
  core:       { label: null },
  extension:  { label: 'Challenge Extension', color: '#4C1D95', bg: '#EDE9FE', border: '#C4B5FD' },
}

function buildWordBank(terms) {
  if (!Array.isArray(terms) || terms.length === 0) return ''
  return `
<div class="tier-word-bank">
  <div class="tier-box-label">Word Bank</div>
  <div class="tier-word-list">${terms.map((t) => `<span class="tier-word">${escapeHtml(t)}</span>`).join('')}</div>
</div>`
}

function buildSentenceStarters(starters) {
  if (!Array.isArray(starters) || starters.length === 0) return ''
  return `
<div class="tier-starters">
  <div class="tier-box-label">Sentence Starters</div>
  <ul class="tier-starter-list">${starters.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
</div>`
}

function buildChallengeExtension(text) {
  if (!text) return ''
  return `
<div class="tier-challenge">
  <div class="tier-box-label">Go Deeper</div>
  <div class="tier-challenge-text">${escapeHtml(text)}</div>
  <div class="ws-lines">${buildResponseLines(4)}</div>
</div>`
}

export function buildWorksheetHTML(pkg, section, fontFaceCSS, designCSS, tier = null) {
  const title = section.title ?? 'Worksheet'
  const standards = Array.isArray(pkg.standards) ? pkg.standards : []

  const tierData = (tier && section.tiers?.[tier]) ? section.tiers[tier] : null
  const activeQuestions = tierData?.questions ?? section.questions ?? []
  const activeTip = tierData?.tip ?? section.tip
  const tierCfg = tier ? (TIER_CONFIG[tier] ?? TIER_CONFIG.core) : null

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
${responsePatternCss}

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

.legacy-response-stack {
  margin-top: 8pt;
}

.legacy-response-block {
  margin-bottom: 10pt;
}

.legacy-response-block:last-child {
  margin-bottom: 0;
}

.legacy-response-label {
  font-size: 9.5pt;
  font-weight: 700;
  color: #374151;
  margin-bottom: 4pt;
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

.tier-badge {
  display: inline-block;
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2pt 8pt;
  border-radius: 3pt;
  border: 1pt solid;
  margin-bottom: 10pt;
}

.tier-word-bank,
.tier-starters,
.tier-challenge {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin-bottom: 14pt;
}

.tier-word-bank { background: #F0FDF4; border-color: #86EFAC; }
.tier-starters  { background: #F0F9FF; border-color: #7DD3FC; }
.tier-challenge { background: #FAF5FF; border-color: #C4B5FD; }

.tier-box-label {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 6pt;
}

.tier-word-list { display: flex; flex-wrap: wrap; gap: 5pt; }
.tier-word {
  font-size: 9.5pt;
  font-weight: 600;
  background: #FFFFFF;
  border: 1pt solid #86EFAC;
  border-radius: 2pt;
  padding: 1pt 6pt;
  color: #166534;
}

.tier-starter-list {
  margin: 0;
  padding-left: 14pt;
  font-size: 9.5pt;
  color: #1E40AF;
  line-height: 1.6;
  font-style: italic;
}

.tier-challenge-text {
  font-size: 10.5pt;
  line-height: 1.5;
  color: #4C1D95;
  margin-bottom: 8pt;
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

    ${tierCfg?.label ? `<span class="tier-badge" style="color:${tierCfg.color};background:${tierCfg.bg};border-color:${tierCfg.border}">${tierCfg.label}</span>` : ''}

    ${activeTip ? `<div class="tip-box"><div class="section-kicker">Tip</div><div>${escapeHtml(activeTip)}</div></div>` : ''}
    ${buildChecklist('Keep in mind', section.anchor, 'anchor-box')}

    ${tier === 'scaffolded' ? buildWordBank(tierData?.word_bank) : ''}
    ${tier === 'scaffolded' ? buildSentenceStarters(tierData?.sentence_starters) : ''}

    ${activeQuestions.map(buildQuestion).join('\n')}

    ${tier === 'extension' ? buildChallengeExtension(tierData?.challenge_extension) : ''}

    ${buildChecklist('Quick self-check', section.self_check, 'self-check-box')}

    ${standards.length > 0 ? `<div class="standards-footer"><span class="standards-footer-label">Standards: </span>${escapeHtml(standards.join(' · '))}</div>` : ''}
  </div>
</body>
</html>`
}
