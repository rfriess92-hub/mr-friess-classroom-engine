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

function nameDateRow() {
  return '<div class="aq-name-date"><span><b>Name:</b><i></i></span><span><b>Date:</b><i></i></span></div>'
}

function metaBits(section, variant) {
  const bits = []
  if (section?.time_limit_min) bits.push(`${section.time_limit_min} min`)
  if (typeof section?.total_points === 'number') bits.push(`${section.total_points} points`)
  if (variant === 'assessment' && section?.proficiency_scale) bits.push('BC proficiency scale')
  return bits
}

function successCriteria(section) {
  const criteria = list(section?.success_criteria)
  if (criteria.length === 0) return ''
  return `<section class="aq-criteria"><div class="aq-kicker">Success criteria</div><ul>${criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`
}

function choices(q) {
  const opts = list(q?.choices)
  if (opts.length === 0) return ''
  return `<div class="aq-choices">${opts.map((choice, index) => `<label><span></span><b>${String.fromCharCode(65 + index)}</b><em>${escapeHtml(choice)}</em></label>`).join('')}</div>`
}

function trueFalseChoices() {
  return '<div class="aq-choices aq-two"><label><span></span><b>T</b><em>True</em></label><label><span></span><b>F</b><em>False</em></label></div>'
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
  return `<div class="aq-answer-line"><b>Final answer:</b><i></i></div><div class="aq-workspace"><b>Workspace</b>${lineRows(q?.n_lines ?? 6)}</div>`
}

function diagramLabel(q) {
  const parts = list(q?.render_hints?.diagram_parts)
  return `<div class="aq-diagram"><span>${escapeHtml(text(q?.render_hints?.diagram_title, 'Diagram / visual'))}</span></div>${parts.length ? `<div class="aq-parts"><b>Label these parts:</b> ${escapeHtml(parts.join(', '))}</div>` : ''}${lineRows(q?.n_lines ?? 4)}`
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
  return `<section class="aq-question"><div class="aq-qhead"><span class="aq-qnum">${index + 1}</span><div><div class="aq-qmeta">${escapeHtml(qType)}${pointText ? ` · ${escapeHtml(pointText)}` : ''}</div><p>${escapeHtml(text(q?.q_text, 'Question'))}</p></div></div>${responseForQuestion(q)}</section>`
}

function buildAssessmentQuizHTML(pkg, section, fontFaceCSS, designCSS, variant) {
  const isAssessment = variant === 'assessment'
  const title = text(section?.title, isAssessment ? 'Assessment' : 'Quiz')
  const instructions = text(section?.instructions, isAssessment ? 'Use complete sentences and show your thinking.' : 'Answer each question.')
  const q = questions(section)
  const bits = metaBits(section, variant)
  const eyebrow = isAssessment ? 'Assessment' : 'Quiz'
  const subtitle = isAssessment
    ? 'Formal evidence of learning — answers belong on this student copy.'
    : 'Low-stakes check — answers belong on this student copy.'

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body><main class="aq-page"><div class="aq-rule"></div>${nameDateRow()}<header class="aq-head"><div class="aq-eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${bits.length ? `<div class="aq-meta">${escapeHtml(bits.join(' · '))}</div>` : ''}</header><section class="aq-instructions"><div class="aq-kicker">Instructions</div><p>${escapeHtml(instructions)}</p></section>${successCriteria(section)}<section class="aq-questions">${q.map((question, index) => questionCard(question, index)).join('')}</section><footer>${escapeHtml(text(pkg?.subject, 'Class'))} · ${escapeHtml(text(pkg?.topic, 'Assessment'))}</footer></main></body></html>`
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
body { margin:0; background:white; color:#1E2738; font-family:Lexend,Arial,system-ui,sans-serif; font-size:12px; line-height:1.35; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.aq-page { width:8.5in; min-height:11in; position:relative; padding:28px 52px 42px; overflow:hidden; }
.aq-rule { position:absolute; top:0; left:0; right:0; height:4px; background:#7B4FBE; }
.aq-name-date { display:flex; justify-content:space-between; gap:22px; margin-bottom:16px; }
.aq-name-date span { display:flex; gap:6px; align-items:flex-end; flex:1; max-width:300px; font-weight:700; }
.aq-name-date span:last-child { max-width:170px; }
.aq-name-date i { display:block; flex:1; height:18px; border-bottom:1.5px solid #1E2738; }
.aq-head { text-align:center; margin-bottom:12px; }
.aq-eyebrow,.aq-kicker { color:#7B4FBE; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:2px; }
.aq-head h1 { margin:4px 0 3px; color:#161C2D; font-size:22px; line-height:1.08; }
.aq-head p { color:#78879C; font-size:12px; margin:0; }
.aq-meta { margin-top:5px; color:#78879C; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; }
.aq-instructions,.aq-criteria { border:1px solid #D8DDE8; background:#F5F6F8; border-radius:4px; padding:9px 12px; margin-bottom:10px; }
.aq-instructions p { margin-top:4px; }
.aq-criteria ul { margin:5px 0 0 16px; padding:0; }
.aq-criteria li { margin-bottom:2px; }
.aq-question { border:1px solid #D8DDE8; border-radius:5px; margin-bottom:10px; padding:10px 12px; page-break-inside:avoid; }
.aq-qhead { display:grid; grid-template-columns:28px 1fr; gap:8px; align-items:start; margin-bottom:7px; }
.aq-qnum { display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:#7B4FBE; color:white; font-size:11px; font-weight:700; }
.aq-qmeta { color:#78879C; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.3px; margin-bottom:3px; }
.aq-qhead p { font-size:12px; color:#1E2738; }
.aq-choices { display:grid; gap:5px; margin-left:36px; }
.aq-choices.aq-two { grid-template-columns:1fr 1fr; }
.aq-choices label { display:grid; grid-template-columns:16px 18px 1fr; gap:6px; align-items:start; font-size:11.5px; }
.aq-choices span { width:15px; height:15px; border:1.5px solid #1E2738; border-radius:50%; margin-top:1px; }
.aq-choices em { font-style:normal; }
.aq-line { height:22px; border-bottom:1px solid #CBD2DB; }
.aq-answer-line { display:flex; align-items:flex-end; gap:8px; margin:7px 0 3px 36px; }
.aq-answer-line b { white-space:nowrap; }
.aq-answer-line i { flex:1; height:19px; border-bottom:1.5px solid #1E2738; }
.aq-matching { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-left:36px; }
.aq-matching div { border:1px solid #D8DDE8; border-radius:4px; padding:8px 10px; }
.aq-matching b { display:block; color:#161C2D; margin-bottom:5px; }
.aq-matching p { margin-bottom:4px; }
.aq-match-answer { margin:7px 0 0 36px; }
.aq-workspace { margin-left:36px; border:1px solid #D8DDE8; border-radius:4px; padding:8px 10px; }
.aq-workspace b { display:block; color:#78879C; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px; }
.aq-diagram { margin-left:36px; height:135px; border:1.5px dashed #CBD2DB; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#78879C; font-style:italic; }
.aq-parts { margin:7px 0 5px 36px; color:#1E2738; }
footer { position:absolute; left:52px; right:52px; bottom:16px; border-top:1px solid #D8DDE8; padding-top:7px; text-align:center; color:#78879C; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; }
`
}
