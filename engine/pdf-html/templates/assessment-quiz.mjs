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
  return typeof q?.point_value === 'number' ? `${q.point_value} pt${q.point_value === 1 ? '' : 's'}` : ''
}

function lineRows(count = 3) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => '<div class="aq-line"></div>').join('')
}

function examInfoRow(pkg, section, variant) {
  const totalPoints = typeof section?.total_points === 'number' ? `${section.total_points}` : '—'
  const timeLimit = section?.time_limit_min ? `${section.time_limit_min} min` : '—'
  const typeLabel = variant === 'assessment' ? 'Assessment' : 'Quiz'
  return `<div class="aq-info-grid"><div><b>Course</b><span>${escapeHtml(text(pkg?.subject, 'Class'))}</span></div><div><b>Type</b><span>${escapeHtml(typeLabel)}</span></div><div><b>Time</b><span>${escapeHtml(timeLimit)}</span></div><div><b>Total</b><span>${escapeHtml(totalPoints)}</span></div></div>`
}

function candidateRow() {
  return `<div class="aq-candidate"><div><b>Name</b><i></i></div><div><b>Date</b><i></i></div><div><b>Score</b><i></i></div></div>`
}

function successCriteria(section) {
  const criteria = list(section?.success_criteria)
  if (criteria.length === 0) return ''
  return `<section class="aq-criteria"><div class="aq-section-label">Criteria being assessed</div><ul>${criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`
}

function choices(q) {
  const opts = list(q?.choices)
  if (opts.length === 0) return ''
  return `<ol class="aq-choices" type="A">${opts.map((choice) => `<li><span></span>${escapeHtml(choice)}</li>`).join('')}</ol>`
}

function trueFalseChoices() {
  return '<ol class="aq-choices aq-two" type="A"><li><span></span>True</li><li><span></span>False</li></ol>'
}

function fillInBlank(q) {
  return `<div class="aq-answer-line"><b>Answer</b><i></i></div>${lineRows(q?.n_lines ?? 1)}`
}

function matching(q) {
  const matchingColumns = q?.render_hints?.matching_columns
  const leftItems = list(matchingColumns?.left_items)
  const rightItems = list(matchingColumns?.right_items)
  if (leftItems.length === 0 && rightItems.length === 0) return lineRows(q?.n_lines ?? 4)

  return `<div class="aq-matching"><div><b>${escapeHtml(text(matchingColumns?.left_label, 'Item'))}</b>${leftItems.map((item, index) => `<p>${index + 1}. ${escapeHtml(item)}</p>`).join('')}</div><div><b>${escapeHtml(text(matchingColumns?.right_label, 'Match'))}</b>${rightItems.map((item, index) => `<p>${String.fromCharCode(65 + index)}. ${escapeHtml(item)}</p>`).join('')}</div></div><div class="aq-match-answer"><b>Answers</b>${lineRows(Math.max(leftItems.length, 2))}</div>`
}

function calculation(q) {
  return `<div class="aq-answer-line"><b>Final answer</b><i></i></div><div class="aq-workspace"><b>Workspace</b>${lineRows(q?.n_lines ?? 6)}</div>`
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
  const qType = text(q?.question_type, 'question').replaceAll('_', ' ')
  const pointText = points(q)
  return `<section class="aq-question"><div class="aq-qbar"><span>Question ${index + 1}</span>${pointText ? `<b>${escapeHtml(pointText)}</b>` : ''}</div><div class="aq-qbody"><div class="aq-qmeta">${escapeHtml(qType)}</div><p class="aq-prompt">${escapeHtml(text(q?.q_text, 'Question'))}</p>${responseForQuestion(q)}</div></section>`
}

function buildAssessmentQuizHTML(pkg, section, fontFaceCSS, designCSS, variant) {
  const isAssessment = variant === 'assessment'
  const title = text(section?.title, isAssessment ? 'Assessment' : 'Quiz')
  const instructions = text(section?.instructions, isAssessment ? 'Use complete sentences and show your thinking.' : 'Answer each question.')
  const q = questions(section)
  const label = isAssessment ? 'Formal Assessment' : 'Quiz'

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body><main class="aq-page ${isAssessment ? 'aq-assessment' : 'aq-quiz'}"><header class="aq-header"><div class="aq-label">${escapeHtml(label)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text(pkg?.topic, ''))}</p></header>${candidateRow()}${examInfoRow(pkg, section, variant)}<section class="aq-directions"><div class="aq-section-label">Instructions</div><p>${escapeHtml(instructions)}</p></section>${successCriteria(section)}<section class="aq-questions">${q.map((question, index) => questionCard(question, index)).join('')}</section><footer>${escapeHtml(text(pkg?.subject, 'Class'))} · Student copy · Answers not shown</footer></main></body></html>`
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
.aq-page { width:8.5in; min-height:11in; position:relative; padding:34px 54px 44px; overflow:hidden; }
.aq-page::before { content:""; position:absolute; top:0; left:0; right:0; height:7px; background:#111827; }
.aq-header { display:grid; grid-template-columns:1fr auto; grid-template-areas:"label label" "title title" "topic topic"; border-bottom:2px solid #111827; padding-bottom:12px; margin-bottom:12px; }
.aq-label { grid-area:label; color:#111827; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:2.5px; margin-bottom:4px; }
.aq-header h1 { grid-area:title; margin:0; color:#111827; font-size:24px; line-height:1.05; font-weight:700; }
.aq-header p { grid-area:topic; margin-top:4px; color:#4B5563; font-size:11px; }
.aq-candidate { display:grid; grid-template-columns:1.8fr 1fr .85fr; gap:12px; margin-bottom:10px; }
.aq-candidate div { display:grid; grid-template-columns:auto 1fr; gap:7px; align-items:end; min-height:24px; }
.aq-candidate b { font-size:10px; text-transform:uppercase; letter-spacing:1.2px; color:#374151; }
.aq-candidate i { display:block; height:18px; border-bottom:1.5px solid #111827; }
.aq-info-grid { display:grid; grid-template-columns:1.6fr .85fr .75fr .75fr; border:1.5px solid #111827; margin-bottom:10px; }
.aq-info-grid div { border-right:1px solid #111827; padding:6px 8px; min-height:36px; }
.aq-info-grid div:last-child { border-right:0; }
.aq-info-grid b { display:block; font-size:8.5px; color:#4B5563; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:2px; }
.aq-info-grid span { font-size:11px; font-weight:700; color:#111827; }
.aq-directions,.aq-criteria { border:1px solid #D1D5DB; background:#F9FAFB; padding:8px 10px; margin-bottom:10px; page-break-inside:avoid; }
.aq-section-label { color:#374151; font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.7px; margin-bottom:4px; }
.aq-directions p { font-size:11px; color:#111827; }
.aq-criteria ul { margin:4px 0 0 16px; padding:0; columns:2; column-gap:24px; }
.aq-criteria li { margin-bottom:2px; break-inside:avoid; }
.aq-question { border:1.2px solid #111827; margin-bottom:11px; page-break-inside:avoid; background:#fff; }
.aq-qbar { display:flex; justify-content:space-between; align-items:center; background:#111827; color:white; min-height:24px; padding:5px 9px; font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.4px; }
.aq-qbar b { color:white; font-size:9.5px; }
.aq-qbody { padding:9px 11px 11px; }
.aq-qmeta { color:#6B7280; font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:1.4px; margin-bottom:4px; }
.aq-prompt { font-size:11.5px; color:#111827; margin-bottom:8px; }
.aq-choices { display:grid; gap:5px; margin:0 0 0 23px; padding:0; }
.aq-choices.aq-two { grid-template-columns:1fr 1fr; }
.aq-choices li { padding-left:4px; font-size:11px; }
.aq-choices span { display:inline-block; width:13px; height:13px; border:1.4px solid #111827; border-radius:50%; margin:0 7px -2px 0; }
.aq-line { height:21px; border-bottom:1px solid #9CA3AF; }
.aq-answer-line { display:flex; align-items:flex-end; gap:8px; margin:5px 0 3px; }
.aq-answer-line b { white-space:nowrap; text-transform:uppercase; font-size:9px; letter-spacing:1.1px; color:#374151; }
.aq-answer-line i { flex:1; height:18px; border-bottom:1.4px solid #111827; }
.aq-matching { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.aq-matching div { border:1px solid #D1D5DB; padding:7px 9px; }
.aq-matching b { display:block; color:#111827; margin-bottom:5px; text-transform:uppercase; font-size:9px; letter-spacing:1.1px; }
.aq-matching p { margin-bottom:4px; }
.aq-match-answer { margin-top:7px; }
.aq-match-answer b { display:block; text-transform:uppercase; font-size:9px; letter-spacing:1.1px; color:#374151; }
.aq-workspace { border:1px solid #D1D5DB; padding:7px 9px; }
.aq-workspace b { display:block; color:#374151; font-size:9px; text-transform:uppercase; letter-spacing:1.4px; margin-bottom:4px; }
.aq-diagram { height:135px; border:1.5px dashed #9CA3AF; display:flex; align-items:center; justify-content:center; color:#6B7280; font-style:italic; }
.aq-parts { margin:7px 0 5px; color:#111827; }
footer { position:absolute; left:54px; right:54px; bottom:16px; border-top:1px solid #D1D5DB; padding-top:7px; text-align:center; color:#6B7280; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.8px; }
`
}
