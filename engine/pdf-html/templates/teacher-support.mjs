import { escapeHtml } from './shared.mjs'

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value, fallback = []) {
  if (Array.isArray(value)) {
    const normalized = value.map((item) => String(item ?? '').trim()).filter(Boolean)
    if (normalized.length > 0) return normalized
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return fallback
}

function objectList(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) : []
}

function css() {
  return `
@page { size: letter; margin:0; }
*, *::before, *::after { box-sizing:border-box; }
.tsup-body { margin:0; background:#fff; color:#1E2738; font-family:Arial,system-ui,sans-serif; font-size:9.8pt; line-height:1.28; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.tsup-page { width:8.5in; min-height:11in; position:relative; padding:.32in .50in .36in; overflow:hidden; }
.tsup-page::before { content:""; position:absolute; top:0; left:0; right:0; height:4pt; background:#7B4FBE; }
.tsup-title { text-align:center; margin:0 0 12pt; }
.tsup-title h1 { color:#161C2D; font-size:18.5pt; line-height:1.08; margin:0 0 3pt; }
.tsup-title p { margin:0; color:#78879C; font-size:9.4pt; }
.tsup-meta { color:#78879C; font-size:7.5pt; letter-spacing:.15em; text-transform:uppercase; margin-top:4pt; }
.tsup-panel { border:1pt solid #D8DDE8; border-radius:4pt; background:#fff; overflow:hidden; margin-bottom:8pt; }
.tsup-panel-head { background:#F5F6F8; border-bottom:1pt solid #D8DDE8; color:#161C2D; font-weight:700; padding:6pt 9pt; display:flex; align-items:center; gap:7pt; min-height:25pt; }
.tsup-badge { width:18pt; height:18pt; min-width:18pt; border:1.15pt solid #1E2738; border-radius:999px; background:#fff; color:#1E2738; display:inline-flex; align-items:center; justify-content:center; font-size:6.3pt; font-weight:700; }
.tsup-panel-body { padding:8pt 10pt; }
.tsup-list { margin:0; padding-left:15pt; }
.tsup-list li { margin-bottom:4pt; }
.tsup-grid { display:grid; grid-template-columns:1fr 1fr; gap:8pt; }
.tsup-table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:8.4pt; }
.tsup-table th, .tsup-table td { border:1pt solid #D8DDE8; vertical-align:top; padding:5pt 6pt; }
.tsup-table th { background:#F5F6F8; color:#161C2D; font-size:7.6pt; text-transform:uppercase; letter-spacing:.06em; }
.tsup-table td { min-height:.35in; }
.tsup-note { color:#1E2738; font-size:9pt; line-height:1.32; }
.tsup-footer { margin-top:7pt; border-top:1pt solid #D8DDE8; color:#78879C; font-size:7.5pt; padding-top:4pt; text-align:center; }
`
}

function shell(pkg, section, title, subtitle, body, fontFaceCSS, designCSS) {
  const subject = text(pkg?.subject, '')
  const grade = text(pkg?.grade, '')
  const topic = text(pkg?.topic, '')
  const meta = [subject, grade ? `Grade ${grade}` : '', topic].filter(Boolean).join(' · ')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body class="tsup-body"><main class="tsup-page"><header class="tsup-title"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${meta ? `<div class="tsup-meta">${escapeHtml(meta)}</div>` : ''}</header>${body}<footer class="tsup-footer">Teacher-facing planning support. Adapt pacing and prompts to the class in front of you.</footer></main></body></html>`
}

function panel(title, body, badge = '') {
  return `<section class="tsup-panel"><div class="tsup-panel-head">${badge ? `<span class="tsup-badge">${escapeHtml(badge)}</span>` : ''}<span>${escapeHtml(title)}</span></div><div class="tsup-panel-body">${body}</div></section>`
}

function bulletList(items) {
  return `<ul class="tsup-list">${list(items, ['No notes provided.']).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

export function buildTeacherGuideHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = text(section?.title, `${text(pkg?.topic, 'Unit')} Teacher Guide`)
  const body = [
    panel('Big idea', `<div class="tsup-note">${escapeHtml(text(section?.big_idea ?? pkg?.assignment_purpose, 'Use this guide to keep instruction focused and classroom-ready.'))}</div>`, 'BIG'),
    `<div class="tsup-grid">${panel('Learning goals', bulletList(section?.learning_goals ?? pkg?.success_criteria), 'GOAL')}${panel('Materials', bulletList(section?.materials), 'MAT')}</div>`,
    panel('Teacher moves', bulletList(section?.teacher_notes ?? pkg?.teacher_implementation_notes), 'MOVE'),
    panel('Look-fors', bulletList(section?.look_fors ?? pkg?.success_criteria), 'LOOK'),
    panel('Likely misconceptions', bulletList(pkg?.likely_misconceptions), 'MIS')
  ].join('')
  return shell(pkg, section, title, 'Planning notes, look-fors, and classroom moves', body, fontFaceCSS, designCSS)
}

export function buildLessonOverviewHTML(pkg, section, fontFaceCSS, designCSS) {
  const sequence = objectList(section?.sequence)
  const rows = sequence.length > 0
    ? sequence.map((item) => `<tr><td>${escapeHtml(text(item.day, ''))}</td><td>${escapeHtml(text(item.focus, ''))}</td><td>${escapeHtml(text(item.student_output ?? item.carryover, ''))}</td></tr>`).join('')
    : objectList(pkg?.days).map((item) => `<tr><td>${escapeHtml(text(item.day_label, ''))}</td><td>${escapeHtml(text(item.reading_focus, ''))}</td><td>${escapeHtml(text(item.carryover_note, ''))}</td></tr>`).join('')
  const body = [
    panel('Overview', `<div class="tsup-note">${escapeHtml(text(section?.overview ?? pkg?.unit_context, 'No overview provided.'))}</div>`, 'OVR'),
    panel('Essential question', `<div class="tsup-note"><strong>${escapeHtml(text(section?.essential_question, 'What should students understand by the end?'))}</strong></div>`, 'EQ'),
    panel('Sequence at a glance', `<table class="tsup-table"><thead><tr><th>Day</th><th>Focus</th><th>Student output</th></tr></thead><tbody>${rows}</tbody></table>`, 'SEQ'),
    panel('Integrity checks', bulletList(section?.integrity_checks), 'CHK')
  ].join('')
  return shell(pkg, section, text(section?.title, `${text(pkg?.topic, 'Unit')} Overview`), 'Unit arc, essential question, and day-by-day structure', body, fontFaceCSS, designCSS)
}
