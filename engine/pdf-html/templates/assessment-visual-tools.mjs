import { escapeHtml } from './shared.mjs'

const LAYOUT_IDS = new Set([
  'bc_rubric',
  'student_self_assessment',
  'self_assessment',
  'assessment_rubric',
  'rubric_feedback',
])

const ALIASES = {
  rubric: 'bc_rubric',
  bc_proficiency_rubric: 'bc_rubric',
  proficiency_rubric: 'bc_rubric',
  student_reflection_assessment: 'student_self_assessment',
  self_reflection: 'student_self_assessment',
  self_assess: 'student_self_assessment',
}

function normalizeLayoutId(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const normalized = raw.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s.-]+/g, '_').toLowerCase()
  return ALIASES[normalized] ?? normalized
}

export function isAssessmentVisualToolLayout(value) {
  const normalized = normalizeLayoutId(value)
  return normalized ? LAYOUT_IDS.has(normalized) : false
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value, fallback = []) {
  if (!Array.isArray(value)) return fallback
  const normalized = value.map((item) => String(item ?? '').trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : fallback
}

function objectList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) : []
}

function lines(count = 2) {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => '<div class="avt-line"></div>').join('')
}

function checkboxRows(items) {
  return list(items).map((item) => `<label class="avt-check"><span></span><b>${escapeHtml(item)}</b></label>`).join('')
}

function criteria(section) {
  const fromObjects = objectList(section.criteria ?? section.rubric_criteria ?? section.success_criteria).map((item) => ({
    name: text(item.name ?? item.criterion ?? item.label ?? item, ''),
    emerging: text(item.emerging ?? item.beginning ?? item.description, ''),
    developing: text(item.developing ?? item.approaching, ''),
    proficient: text(item.proficient ?? item.meeting, ''),
    extending: text(item.extending ?? item.exceeding, ''),
  })).filter((item) => item.name)
  if (fromObjects.length > 0) return fromObjects
  return list(section.success_criteria, [
    'Uses evidence or examples',
    'Explains thinking clearly',
    'Uses vocabulary accurately',
  ]).map((name) => ({ name, emerging: '', developing: '', proficient: '', extending: '' }))
}

function shell(pkg, section, title, subtitle, body, fontFaceCSS, designCSS) {
  const subject = text(section?.metadata_subject ?? pkg?.subject, '')
  const grade = text(pkg?.grade, '')
  const topic = text(section?.metadata_topic ?? pkg?.topic, '')
  const meta = [subject, grade ? `Grade ${grade}` : '', topic].filter(Boolean).join(' · ')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body class="avt-body"><main class="avt-page"><div class="avt-name-date"><span><strong>Name:</strong><i></i></span><span><strong>Date:</strong><i></i></span></div><header class="avt-title"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${meta ? `<div class="avt-meta">${escapeHtml(meta)}</div>` : ''}</header>${body}<footer class="avt-footer">Assessment is evidence, reflection, and a next step.</footer></main></body></html>`
}

function css() {
  return `
@page { size: letter; margin:0; }
*, *::before, *::after { box-sizing:border-box; }
.avt-body { margin:0; background:#fff; color:#1E2738; font-family:Arial,system-ui,sans-serif; font-size:9.8pt; line-height:1.25; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.avt-page { width:8.5in; height:11in; position:relative; padding:.29in .50in .28in; overflow:hidden; }
.avt-page::before { content:""; position:absolute; left:0; right:0; top:0; height:4pt; background:#7B4FBE; }
.avt-name-date { display:flex; justify-content:space-between; gap:22pt; margin:0 0 11pt; font-size:9pt; font-weight:700; }
.avt-name-date span { display:flex; align-items:center; gap:8pt; flex:1; }
.avt-name-date span:first-child { max-width:2.75in; } .avt-name-date span:last-child { max-width:1.7in; }
.avt-name-date i { display:block; height:0; flex:1; border-bottom:1.1pt solid #1E2738; }
.avt-title { text-align:center; margin:0 0 10pt; }
.avt-title h1 { color:#161C2D; font-size:18.5pt; line-height:1.08; margin:0 0 3pt; font-weight:700; }
.avt-title p { margin:0; color:#78879C; font-size:9.8pt; }
.avt-meta { color:#78879C; font-size:7.6pt; letter-spacing:.16em; text-transform:uppercase; margin-top:4pt; }
.avt-panel { border:1pt solid #D8DDE8; border-radius:4pt; background:#fff; overflow:hidden; margin-bottom:7pt; }
.avt-panel-head { min-height:24pt; display:flex; align-items:center; gap:7pt; padding:5.5pt 9pt; background:#F5F6F8; border-bottom:1pt solid #D8DDE8; color:#161C2D; font-weight:700; font-size:10pt; }
.avt-badge { width:18pt; height:18pt; min-width:18pt; border:1.15pt solid #1E2738; border-radius:999px; background:#fff; color:#1E2738; display:inline-flex; align-items:center; justify-content:center; font-size:6.4pt; font-weight:700; line-height:1; }
.avt-panel-body { padding:7pt 9pt; }
.avt-line { height:.18in; border-bottom:1pt solid #CBD2DB; }
.avt-footer { margin-top:6pt; border-top:1pt solid #D8DDE8; color:#78879C; font-size:7.5pt; padding-top:4pt; text-align:center; }
.avt-proficiency-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:5pt; margin:0 0 8pt; }
.avt-prof { border:1pt solid #D8DDE8; border-radius:4pt; padding:6pt 7pt; min-height:.43in; }
.avt-prof strong { display:block; color:#161C2D; font-size:8.7pt; text-transform:uppercase; letter-spacing:.07em; }
.avt-prof span { color:#1E2738; font-size:8.1pt; }
.avt-emerging { background:#F9E8E6; border-color:#E7B9B4; }
.avt-developing { background:#FFF3CF; border-color:#E7D18D; }
.avt-proficient { background:#E5F0E7; border-color:#ACCDB2; }
.avt-extending { background:#E7ECFA; border-color:#B5C0E4; }
.avt-rubric { width:100%; border-collapse:collapse; table-layout:fixed; font-size:8.1pt; margin-bottom:7pt; }
.avt-rubric th, .avt-rubric td { border:1pt solid #D8DDE8; vertical-align:top; padding:5pt 6pt; }
.avt-rubric th { background:#F5F6F8; color:#161C2D; font-size:7.8pt; text-transform:uppercase; letter-spacing:.06em; }
.avt-rubric th:first-child, .avt-rubric td:first-child { width:1.35in; font-weight:700; color:#161C2D; }
.avt-rubric td { height:.58in; }
.avt-feedback-grid { display:grid; grid-template-columns:1fr 1fr; gap:7pt; }
.avt-check { display:grid; grid-template-columns:12pt 1fr; gap:7pt; align-items:start; margin-bottom:5pt; font-size:8.8pt; }
.avt-check span { width:10pt; height:10pt; border:1.15pt solid #1E2738; margin-top:1pt; }
.avt-self-grid { display:grid; grid-template-columns:1fr 1fr; gap:7pt; }
.avt-scale-row { display:grid; grid-template-columns:1.35fr repeat(4,.5fr); gap:4pt; align-items:center; margin-bottom:5pt; font-size:8.4pt; }
.avt-scale-head { color:#78879C; font-size:7.3pt; text-transform:uppercase; letter-spacing:.05em; }
.avt-scale-bubble { height:18pt; border:1pt solid #D8DDE8; border-radius:999px; display:flex; align-items:center; justify-content:center; background:#fff; font-size:7.4pt; font-weight:700; }
`
}

function panel(title, body, badge = '') {
  return `<section class="avt-panel"><div class="avt-panel-head">${badge ? `<span class="avt-badge">${escapeHtml(badge)}</span>` : ''}<span>${escapeHtml(title)}</span></div><div class="avt-panel-body">${body}</div></section>`
}

function proficiencyStrip() {
  return `<div class="avt-proficiency-strip"><div class="avt-prof avt-emerging"><strong>Emerging</strong><span>Beginning to show the skill.</span></div><div class="avt-prof avt-developing"><strong>Developing</strong><span>Building consistency.</span></div><div class="avt-prof avt-proficient"><strong>Proficient</strong><span>Meets the learning target.</span></div><div class="avt-prof avt-extending"><strong>Extending</strong><span>Goes deeper or transfers skill.</span></div></div>`
}

function buildRubric(pkg, section, fontFaceCSS, designCSS) {
  const rows = criteria(section).slice(0, 5).map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.emerging || 'Needs support or more evidence.')}</td><td>${escapeHtml(item.developing || 'Shows partial understanding.')}</td><td>${escapeHtml(item.proficient || 'Clearly meets the target.')}</td><td>${escapeHtml(item.extending || 'Adds depth, precision, or transfer.')}</td></tr>`).join('')
  const body = `${proficiencyStrip()}${panel('Learning target', escapeHtml(text(section.learning_target, 'I can show my understanding with evidence and clear reasoning.')), 'LT')}<table class="avt-rubric"><thead><tr><th>Criteria</th><th>Emerging</th><th>Developing</th><th>Proficient</th><th>Extending</th></tr></thead><tbody>${rows}</tbody></table><div class="avt-feedback-grid">${panel('Evidence I noticed', lines(4), 'EVD')}${panel('Next step', lines(4), 'NEXT')}</div>`
  return shell(pkg, section, text(section.title, 'Assessment Rubric'), text(section.subtitle, 'BC proficiency scale, evidence, and next step'), body, fontFaceCSS, designCSS)
}

function buildSelfAssessment(pkg, section, fontFaceCSS, designCSS) {
  const items = list(section.reflection_items ?? section.success_criteria, [
    'I used evidence or examples.',
    'I explained my thinking clearly.',
    'I used vocabulary accurately.',
    'I revised or checked my work.',
  ])
  const scaleRows = items.slice(0, 5).map((item) => `<div class="avt-scale-row"><div>${escapeHtml(item)}</div><div class="avt-scale-bubble">E</div><div class="avt-scale-bubble">D</div><div class="avt-scale-bubble">P</div><div class="avt-scale-bubble">X</div></div>`).join('')
  const body = `${proficiencyStrip()}${panel('Before I hand this in', checkboxRows(items.slice(0, 5)), 'CHK')}<div class="avt-self-grid">${panel('My proficiency check', `<div class="avt-scale-row avt-scale-head"><div>Skill</div><div>E</div><div>D</div><div>P</div><div>X</div></div>${scaleRows}`, 'SELF')}${panel('Evidence from my work', `${lines(6)}`, 'EVD')}</div>${panel('My next step', `${lines(4)}`, 'NEXT')}`
  return shell(pkg, section, text(section.title, 'Student Self-Assessment'), text(section.subtitle, 'Evidence, reflection, and next step'), body, fontFaceCSS, designCSS)
}

export function buildAssessmentVisualToolHTML(pkg, section, fontFaceCSS, designCSS, layoutTemplateId) {
  const layout = normalizeLayoutId(layoutTemplateId ?? section?.layout_template_id ?? section?.template_id)
  if (layout === 'student_self_assessment' || layout === 'self_assessment') {
    return buildSelfAssessment(pkg, section, fontFaceCSS, designCSS)
  }
  return buildRubric(pkg, section, fontFaceCSS, designCSS)
}
