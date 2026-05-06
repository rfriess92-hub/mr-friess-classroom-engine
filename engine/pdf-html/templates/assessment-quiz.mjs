import { escapeHtml } from './shared.mjs'

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value) {
  return Array.isArray(value) ? value.map((item) => String(item ?? '').trim()).filter(Boolean) : []
}

function questions(section) {
  return Array.isArray(section?.questions) ? section.questions.filter((q) => q && typeof q === 'object') : []
}

function points(q) {
  return typeof q?.point_value === 'number' ? `${q.point_value} mark${q.point_value === 1 ? '' : 's'}` : ''
}

function lineRows(count = 3) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => '<div class="aq-line"></div>').join('')
}

function metaLine(pkg, section, variant) {
  const parts = [text(pkg?.subject, 'Class')]
  parts.push(variant === 'assessment' ? 'Assessment' : 'Quiz')
  if (section?.time_limit_min) parts.push(`${section.time_limit_min} minutes`)
  if (typeof section?.total_points === 'number') parts.push(`${section.total_points} marks`)
  return parts.join('   |   ')
}

function candidateRow() {
  return `<div class="aq-candidate"><div><b>Name:</b><i></i></div><div><b>Date:</b><i></i></div><div><b>Score:</b><i></i></div></div>`
}

function successCriteria(section) {
  const criteria = list(section?.success_criteria)
  if (criteria.length === 0) return ''
  return `<section class="aq-criteria"><b>Criteria:</b><ul>${criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`
}

function choices(q) {
  const opts = list(q?.choices)
  if (opts.length === 0) return ''
  return `<ol class="aq-choices" type="A">${opts.map((choice) => `<li>${escapeHtml(choice)}</li>`).join('')}</ol>`
}

function trueFalseChoices() {
  return '<ol class="aq-choices aq-two" type="A"><li>True</li><li>False</li></ol>'
}

function fillInBlank(q) {
  return `<div class="aq-answer-line"><b>Answer:</b><i></i></div>${lineRows(q?.n_lines ?? 1)}`
}

function matching(q) {
  const matchingColumns = q?.render_hints?.matching_columns
  const leftItems = list(matchingColumns?.left_items)
  const rightItems = list(matchingColumns?.right_items)
  if (leftItems.length === 0 && rightItems.length === 0) return lineRows(q?.n_lines ?? 4)

  return `<div class="aq-matching"><div><b>${escapeHtml(text(matchingColumns?.left_label, 'Item'))}</b>${leftItems.map((item, index) => `<p>${index + 1}. ${escapeHtml(item)}</p>`).join('')}</div><div><b>${escapeHtml(text(matchingColumns?.right_label, 'Match'))}</b>${rightItems.map((item, index) => `<p>${String.fromCharCode(65 + index)}. ${escapeHtml(item)}</p>`).join('')}</div></div><div class="aq-match-answer"><b>Answers:</b>${lineRows(Math.max(leftItems.length, 2))}</div>`
}

function calculation(q) {
  return `<div class="aq-answer-line"><b>Final answer:</b><i></i></div><div class="aq-workspace"><b>Workspace:</b>${lineRows(q?.n_lines ?? 6)}</div>`
}

function diagramLabel(q) {
  const parts = list(q?.render_hints?.diagram_parts)
  return `<div class="aq-diagram"><span>${escapeHtml(text(q?.render_hints?.diagram_title, 'Diagram / visual'))}</span></div>${parts.length ? `<div class="aq-parts"><b>Label:</b> ${escapeHtml(parts.join(', '))}</div>` : ''}${lineRows(q?.n_lines ?? 4)}`
}

function responseForQuestion(q) {
  switch (q?.question_type) {
    case 'multiple_choice': return choices(q)
    case 'true_false': return trueFalseChoices()
    case 'fill_in_blank': return fillInBlank(q)
    case 'matching': return matching(q)
    case 'calculation': return calculation(q)
    case 'diagram_label': return diagramLabel(q)
    case 'extended_response': return lineRows(q?.n_lines ?? 8)
    case 'short_answer': return lineRows(q?.n_lines ?? 3)
    default: return lineRows(q?.n_lines ?? 3)
  }
}

function questionCard(q, index) {
  const pointText = points(q)
  return `<section class="aq-question"><div class="aq-question-line"><span class="aq-number">${index + 1}.</span><p>${escapeHtml(text(q?.q_text, 'Question'))}</p>${pointText ? `<span class="aq-points">[${escapeHtml(pointText)}]</span>` : ''}</div>${responseForQuestion(q)}</section>`
}

function buildAssessmentQuizHTML(pkg, section, fontFaceCSS, designCSS, variant) {
  const isAssessment = variant === 'assessment'
  const title = text(section?.title, isAssessment ? 'Assessment' : 'Quiz')
  const instructions = text(section?.instructions, isAssessment ? 'Use complete sentences and show your thinking.' : 'Answer each question.')
  const q = questions(section)

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body><main class="aq-page"><header class="aq-header"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(metaLine(pkg, section, variant))}</p></header>${candidateRow()}<section class="aq-directions"><b>Instructions:</b> ${escapeHtml(instructions)}</section>${successCriteria(section)}<section class="aq-questions">${q.map((question, index) => questionCard(question, index)).join('')}</section><footer>${escapeHtml(text(pkg?.subject, 'Class'))} · Student copy</footer></main></body></html>`
}

export function buildAssessmentHTML(pkg, section, fontFaceCSS, designCSS) {
  return buildAssessmentQuizHTML(pkg, section, fontFaceCSS, designCSS, 'assessment')
}

export function buildQuizHTML(pkg, section, fontFaceCSS, designCSS) {
  return buildAssessmentQuizHTML(pkg, section, fontFaceCSS, designCSS, 'quiz')
}

function css() {
  return `
@page { size: letter; margin:0; }
*, *::before, *::after { box-sizing:border-box; }
body { margin:0; background:white; color:#111827; font-family:Lexend,Arial,system-ui,sans-serif; font-size:11.5px; line-height:1.35; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.aq-page { width:8.5in; min-height:11in; position:relative; padding:38px 58px 44px; overflow:hidden; }
.aq-header { text-align:center; border-bottom:1.5px solid #111827; padding-bottom:10px; margin-bottom:14px; }
.aq-header h1 { margin:0 0 5px; color:#111827; font-size:21px; line-height:1.1; font-weight:700; }
.aq-header p { margin:0; color:#374151; font-size:10.5px; }
.aq-candidate { display:grid; grid-template-columns:1.75fr 1fr .85fr; gap:16px; margin-bottom:12px; }
.aq-candidate div { display:grid; grid-template-columns:auto 1fr; gap:6px; align-items:end; min-height:24px; }
.aq-candidate b { font-size:10.5px; color:#111827; }
.aq-candidate i { display:block; height:18px; border-bottom:1.2px solid #111827; }
.aq-directions { border:1px solid #9CA3AF; padding:7px 9px; margin-bottom:10px; font-size:10.8px; page-break-inside:avoid; }
.aq-criteria { border:1px solid #D1D5DB; padding:7px 9px; margin-bottom:11px; font-size:10.5px; page-break-inside:avoid; }
.aq-criteria ul { margin:4px 0 0 18px; padding:0; }
.aq-criteria li { margin-bottom:1px; }
.aq-question { margin-bottom:13px; page-break-inside:avoid; }
.aq-question-line { display:grid; grid-template-columns:24px 1fr auto; gap:7px; align-items:start; margin-bottom:6px; }
.aq-number { font-weight:700; font-size:12px; color:#111827; }
.aq-question-line p { font-size:11.5px; color:#111827; }
.aq-points { white-space:nowrap; font-size:10px; color:#374151; }
.aq-choices { display:grid; gap:4px; margin:0 0 0 50px; padding:0; }
.aq-choices.aq-two { grid-template-columns:1fr 1fr; }
.aq-choices li { padding-left:4px; font-size:11px; }
.aq-line { height:21px; border-bottom:1px solid #9CA3AF; margin-left:31px; }
.aq-answer-line { display:flex; align-items:flex-end; gap:8px; margin:4px 0 3px 31px; }
.aq-answer-line b { white-space:nowrap; font-size:10px; color:#111827; }
.aq-answer-line i { flex:1; height:18px; border-bottom:1.2px solid #111827; }
.aq-matching { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-left:31px; }
.aq-matching div { border:1px solid #D1D5DB; padding:7px 9px; }
.aq-matching b { display:block; color:#111827; margin-bottom:5px; font-size:10px; }
.aq-matching p { margin-bottom:4px; }
.aq-match-answer { margin:7px 0 0 31px; }
.aq-match-answer b { display:block; font-size:10px; color:#111827; }
.aq-workspace { margin-left:31px; border:1px solid #D1D5DB; padding:7px 9px; }
.aq-workspace b { display:block; color:#111827; font-size:10px; margin-bottom:4px; }
.aq-diagram { margin-left:31px; height:135px; border:1.2px dashed #9CA3AF; display:flex; align-items:center; justify-content:center; color:#6B7280; font-style:italic; }
.aq-parts { margin:7px 0 5px 31px; color:#111827; }
footer { position:absolute; left:58px; right:58px; bottom:16px; border-top:1px solid #D1D5DB; padding-top:7px; text-align:center; color:#6B7280; font-size:9px; }
`
}
