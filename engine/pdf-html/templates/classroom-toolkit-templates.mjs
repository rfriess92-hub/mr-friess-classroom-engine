import { escapeHtml } from './shared.mjs'

const TOOLKIT_IDS = new Set([
  'kwhl_chart',
  'kwl_chart',
  'fishbone_diagram',
  'cause_effect_fishbone',
  'sentence_frame_card',
  'sentence_frames',
  'choice_board',
  'scaffolded_quiz',
  'quiz_template',
])

const ALIASES = {
  kwhl: 'kwhl_chart',
  kwl: 'kwhl_chart',
  kwl_chart: 'kwhl_chart',
  fishbone: 'fishbone_diagram',
  cause_and_effect: 'fishbone_diagram',
  cause_effect: 'fishbone_diagram',
  sentence_frames_card: 'sentence_frame_card',
  sentence_frames_reference: 'sentence_frame_card',
  differentiated_choice_board: 'choice_board',
  k_designation_choice_board: 'choice_board',
  quiz: 'scaffolded_quiz',
  low_stakes_check: 'scaffolded_quiz',
}

function norm(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const normalized = raw.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s.-]+/g, '_').toLowerCase()
  return ALIASES[normalized] ?? normalized
}

export function isClassroomToolkitLayout(value) {
  const id = norm(value)
  return id ? TOOLKIT_IDS.has(id) : false
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value, fallback = []) {
  if (!Array.isArray(value)) return fallback
  const out = value.map((item) => String(item ?? '').trim()).filter(Boolean)
  return out.length ? out : fallback
}

function objects(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) : []
}

function lines(count = 2, cls = 'ct-line') {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => `<div class="${cls}"></div>`).join('')
}

function badge(label) {
  return `<span class="ct-badge">${escapeHtml(label)}</span>`
}

function nameDate() {
  return `<div class="ct-name-date"><span><b>Name:</b><i></i></span><span><b>Date:</b><i></i></span></div>`
}

function shell(pkg, section, title, subtitle, metaLabel, body, fontFaceCSS, designCSS, options = {}) {
  const meta = text(metaLabel, [pkg?.subject, pkg?.grade ? `Grade ${pkg.grade}` : '', pkg?.topic].filter(Boolean).join(' · '))
  const compactClass = options.compact ? ' ct-compact' : ''
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body class="ct-body"><main class="ct-page${compactClass}"><div class="ct-top-rule"></div>${options.hideNameDate ? '' : nameDate()}<header class="ct-head"><div class="ct-doc-type">${escapeHtml(text(section.doc_type ?? section.document_type, options.docType ?? 'Reusable Classroom Tool'))}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${meta ? `<div class="ct-meta">${escapeHtml(meta)}</div>` : ''}</header>${body}<footer class="ct-footer">${escapeHtml(text(section.footer, 'All Classes · Mr. Friess · SD73 Kamloops'))}</footer></main></body></html>`
}

function infoBox(label, title, body) {
  return `<section class="ct-info"><div class="ct-info-title">${badge(label)}<strong>${escapeHtml(title)}</strong></div><p>${escapeHtml(body)}</p></section>`
}

function panel(title, body, label = '') {
  return `<section class="ct-panel"><div class="ct-panel-head">${label ? badge(label) : ''}<strong>${escapeHtml(title)}</strong></div><div class="ct-panel-body">${body}</div></section>`
}

function checklist(items) {
  return list(items, ['I completed the required parts.', 'I checked my work.', 'I can explain my thinking.'])
    .map((item) => `<label class="ct-check"><span></span><b>${escapeHtml(item)}</b></label>`).join('')
}

function css() {
  return `
@page { size: letter; margin:0; }
*, *::before, *::after { box-sizing:border-box; }
.ct-body { margin:0; background:#fff; color:#1E2738; font-family:Arial,system-ui,sans-serif; font-size:12px; line-height:1.28; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.ct-page { width:8.5in; height:11in; position:relative; padding:28px 48px 30px; overflow:hidden; }
.ct-top-rule { position:absolute; top:0; left:0; right:0; height:4px; background:var(--ct-accent,#7B4FBE); }
.ct-name-date { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:15px; }
.ct-name-date span { display:flex; align-items:flex-end; gap:6px; flex:1; max-width:230px; font-weight:700; }
.ct-name-date span:last-child { max-width:150px; }
.ct-name-date i { display:block; flex:1; height:16px; border-bottom:1.5px solid #1E2738; }
.ct-head { text-align:center; margin-bottom:13px; }
.ct-doc-type { font-size:10px; font-weight:700; color:var(--ct-accent,#7B4FBE); text-transform:uppercase; letter-spacing:3px; margin-bottom:5px; }
.ct-head h1 { margin:0; color:#161C2D; font-size:22px; line-height:1.08; }
.ct-head p { margin:3px 0 0; color:#78879C; font-size:12px; }
.ct-meta { margin-top:4px; color:#78879C; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
.ct-badge { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; min-width:24px; border:1.5px solid #1E2738; border-radius:999px; background:#fff; color:#1E2738; font-size:9px; font-weight:700; line-height:1; }
.ct-info-row { display:flex; gap:10px; margin-bottom:12px; }
.ct-info { flex:1; background:#F5F6F8; border:1px solid #D8DDE8; border-radius:4px; padding:9px 12px; }
.ct-info-title { display:flex; align-items:center; gap:8px; margin-bottom:4px; color:#161C2D; font-size:13px; }
.ct-info p { margin:0; font-size:12px; line-height:1.45; }
.ct-panel { border:1px solid #D8DDE8; border-radius:4px; overflow:hidden; margin-bottom:12px; background:#fff; }
.ct-panel-head { min-height:34px; background:#F5F6F8; border-bottom:1px solid #D8DDE8; display:flex; align-items:center; gap:8px; padding:7px 12px; color:#161C2D; font-size:13px; }
.ct-panel-body { padding:10px 14px; }
.ct-line { border-bottom:1px solid #CBD2DB; height:26px; }
.ct-line-tight { border-bottom:1px solid #CBD2DB; height:22px; }
.ct-footer { position:absolute; left:48px; right:48px; bottom:16px; border-top:1px solid #D8DDE8; padding-top:7px; text-align:center; color:#78879C; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
.ct-check { display:flex; align-items:flex-start; gap:8px; margin-bottom:5px; font-size:12px; }
.ct-check span { width:14px; height:14px; border:1.5px solid #1E2738; border-radius:2px; margin-top:1px; flex-shrink:0; }
.ct-topic label { display:block; color:var(--ct-accent,#7B4FBE); font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }
.ct-topic div { border-bottom:1.5px solid #1E2738; height:26px; }
.ct-kwhl-strip { display:flex; border:1px solid #D8DDE8; border-radius:4px; overflow:hidden; margin-bottom:12px; }
.ct-kwhl-strip div { flex:1; padding:7px 8px; text-align:center; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; border-right:1px solid #D8DDE8; }
.ct-kwhl-strip div:last-child { border-right:0; }
.ct-kwhl { width:100%; border-collapse:collapse; border:1.5px solid #1E2738; margin:12px 0; table-layout:fixed; }
.ct-kwhl th { color:white; text-align:left; padding:9px 10px; border:1px solid #1E2738; }
.ct-kwhl th span { display:block; font-size:18px; line-height:1; }
.ct-kwhl th small { font-size:10px; opacity:.9; }
.ct-kwhl td { height:220px; vertical-align:top; padding:10px; border:1px solid #D8DDE8; }
.ct-kwhl .k { background:#161C2D; } .ct-kwhl .w { background:#7B4FBE; } .ct-kwhl .h { background:#2D9E95; } .ct-kwhl .l { background:#E9A825; }
.ct-fish-problem { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.ct-fish-problem label { font-size:10px; color:#E05A5A; font-weight:700; letter-spacing:2px; text-transform:uppercase; white-space:nowrap; }
.ct-fish-problem div { flex:1; border:2px solid #E05A5A; border-radius:4px; background:#FEF5F5; height:38px; }
.ct-fish { border:1.5px solid #1E2738; border-radius:5px; overflow:hidden; margin-bottom:12px; }
.ct-fish-row { display:grid; grid-template-columns:repeat(3,1fr); }
.ct-cause { border-right:1px solid #D8DDE8; }
.ct-cause:last-child { border-right:0; }
.ct-cause h3 { margin:0; color:white; background:#7B4FBE; text-align:center; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; padding:6px 8px; }
.ct-cause:nth-child(2) h3 { background:#161C2D; } .ct-cause:nth-child(3) h3 { background:#78879C; }
.ct-cause-body { min-height:109px; padding:8px 10px; }
.ct-label-line { color:#78879C; font-size:10px; font-style:italic; height:22px; border-bottom:1px solid #D8DDE8; margin-bottom:5px; }
.ct-backbone { background:#1E2738; color:white; display:flex; justify-content:center; gap:10px; align-items:center; padding:5px; font-size:9px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
.ct-board-rule { background:#161C2D; color:white; text-align:center; font-size:12px; font-weight:700; padding:7px; border-radius:4px; margin:10px 0; letter-spacing:1px; }
.ct-board { width:100%; border-collapse:collapse; border:1.5px solid #1E2738; table-layout:fixed; }
.ct-board th { color:white; padding:8px; font-size:10px; text-transform:uppercase; letter-spacing:2px; border:1px solid #1E2738; }
.ct-board th:nth-child(1) { background:#78879C; } .ct-board th:nth-child(2) { background:#059669; } .ct-board th:nth-child(3) { background:#161C2D; }
.ct-board td { border:1px solid #1E2738; vertical-align:top; height:116px; padding:10px 12px; }
.ct-task-num { font-size:9px; font-weight:700; color:#78879C; letter-spacing:1px; text-transform:uppercase; margin-bottom:5px; }
.ct-task-title { color:#161C2D; font-weight:700; font-size:12px; margin-bottom:4px; }
.ct-task-desc { color:#78879C; font-size:11px; line-height:1.35; }
.ct-done { margin-top:8px; display:flex; gap:5px; align-items:center; font-size:10px; font-weight:700; color:#78879C; text-transform:uppercase; letter-spacing:1px; }
.ct-done span { width:14px; height:14px; border:1.5px solid #1E2738; border-radius:2px; }
.ct-free { background:#D1FAE5; text-align:center; }
.ct-free .ct-task-title { font-size:18px; color:#059669; }
.ct-frame-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.ct-frame-card { border:1.5px solid #1E2738; border-radius:5px; overflow:hidden; }
.ct-frame-card h2 { margin:0; color:white; background:#7B4FBE; padding:8px 12px; font-size:13px; display:flex; align-items:center; gap:8px; }
.ct-frame-card:nth-child(2) h2 { background:#161C2D; } .ct-frame-card:nth-child(3) h2 { background:#2D9E95; } .ct-frame-card:nth-child(4) h2 { background:#E9A825; } .ct-frame-card:nth-child(5) h2 { background:#E05A5A; } .ct-frame-card:nth-child(6) h2 { background:#059669; }
.ct-frame-body { padding:10px 12px; }
.ct-frame-item { border-bottom:1px solid #D8DDE8; padding-bottom:8px; margin-bottom:8px; }
.ct-frame-item:last-child { border-bottom:0; margin-bottom:0; padding-bottom:0; }
.ct-frame-use { color:#78879C; font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:3px; }
.ct-blank { display:inline-block; min-width:90px; height:15px; border-bottom:1.5px solid #1E2738; vertical-align:bottom; }
.ct-quiz-level { display:inline-block; background:#161C2D; color:white; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:3px 10px; border-radius:3px; margin-bottom:10px; }
.ct-word-bank { background:#F5F6F8; border:1px solid #D8DDE8; border-radius:4px; padding:8px 12px; margin-bottom:10px; }
.ct-word-bank strong { display:block; color:#78879C; font-size:9px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
.ct-pill { display:inline-block; border:1px solid #D8DDE8; border-radius:3px; padding:3px 8px; margin:2px; background:#fff; font-weight:700; font-size:12px; }
.ct-quiz-section h2 { background:#161C2D; color:white; padding:7px 12px; border-radius:4px 4px 0 0; font-size:12px; letter-spacing:1px; text-transform:uppercase; }
.ct-quiz-body { border:1px solid #D8DDE8; border-top:0; padding:10px 12px; margin-bottom:10px; }
.ct-q { border-bottom:1px solid #D8DDE8; padding-bottom:9px; margin-bottom:9px; }
.ct-q:last-child { border-bottom:0; margin-bottom:0; padding-bottom:0; }
.ct-q-num { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#7B4FBE; color:white; border-radius:50%; font-size:10px; font-weight:700; margin-right:6px; }
.ct-mcq { margin:6px 0 0 28px; display:grid; gap:4px; }
.ct-mcq label { display:grid; grid-template-columns:16px 18px 1fr; gap:6px; font-size:11.5px; }
.ct-mcq span:first-child { width:15px; height:15px; border:1.5px solid #1E2738; border-radius:50%; }
.ct-hint { margin:6px 0 7px 28px; background:#F5F6F8; border-left:3px solid #2D9E95; padding:6px 10px; color:#78879C; font-size:11px; font-style:italic; }
`
}

export function buildClassroomToolkitHTML(pkg, section, fontFaceCSS, designCSS, layoutTemplateId) {
  const id = norm(layoutTemplateId ?? section?.layout_template_id ?? section?.template_id)
  if (id === 'kwhl_chart') return buildKwhl(pkg, section, fontFaceCSS, designCSS)
  if (id === 'fishbone_diagram') return buildFishbone(pkg, section, fontFaceCSS, designCSS)
  if (id === 'sentence_frame_card') return buildSentenceFrames(pkg, section, fontFaceCSS, designCSS)
  if (id === 'choice_board') return buildChoiceBoard(pkg, section, fontFaceCSS, designCSS)
  return buildScaffoldedQuiz(pkg, section, fontFaceCSS, designCSS)
}

function buildKwhl(pkg, section, fontFaceCSS, designCSS) {
  const body = `<div class="ct-info-row">${infoBox('DIR', 'How to Use This', text(section.directions, 'Before: Fill in K and W. During: Add to H as you discover sources or strategies. After: Complete the L column.'))}${infoBox('LT', 'Learning Target', text(section.learning_target, ''))}</div><div class="ct-kwhl-strip"><div style="background:#F8F9FF;color:#161C2D;">Before — fill K + W</div><div style="background:#EDE5F8;color:#7B4FBE;">During — fill H</div><div style="background:#FFFBEB;color:#92400E;">After — fill L</div></div><div class="ct-topic"><label>Topic / Unit</label><div></div></div><table class="ct-kwhl"><thead><tr><th class="k"><span>K</span><small>What I Know</small></th><th class="w"><span>W</span><small>What I Want to know</small></th><th class="h"><span>H</span><small>How will I find out</small></th><th class="l"><span>L</span><small>What I Learned</small></th></tr></thead><tbody><tr><td>${lines(9)}</td><td>${lines(9)}</td><td>${lines(9)}</td><td>${lines(9)}</td></tr></tbody></table>${panel('Still wondering — Questions from W that were not answered today', lines(2), '→')}${panel('After the Lesson', checklist(section.checklist), 'CHK')}`
  return shell(pkg, section, text(section.title, 'KWHL Chart'), text(section.subtitle, 'Know — Want to know — How will I find out — Learned'), text(section.meta, 'Careers 8 · All classes · Reusable thinking tool'), body, fontFaceCSS, designCSS, { docType: 'Lesson Launch & Closure Tool' })
}

function buildFishbone(pkg, section, fontFaceCSS, designCSS) {
  const causes = list(section.cause_categories, ['Cause Category 1', 'Cause Category 2', 'Cause Category 3', 'Cause Category 4', 'Cause Category 5', 'Cause Category 6']).slice(0, 6)
  const causeBlock = (title) => `<div class="ct-cause"><h3>${escapeHtml(title)}</h3><div class="ct-cause-body"><div class="ct-label-line">Label: _______________</div>${lines(4, 'ct-line-tight')}</div></div>`
  const body = `<div class="ct-info-row">${infoBox('DIR', 'Directions', text(section.directions, 'Write the problem or effect in the box. Label each cause category, then fill in specific causes.'))}${infoBox('TIP', 'Strong Analysis', text(section.tip, 'Ask “Why did this happen?” for each cause you write.'))}</div><div class="ct-fish-problem"><label>Problem / Effect</label><div></div></div><div class="ct-fish"><div class="ct-fish-row">${causes.slice(0, 3).map(causeBlock).join('')}</div><div class="ct-backbone"><span>Causes</span><span>▶▶▶▶▶▶▶▶▶▶▶▶</span><span>Effect</span></div><div class="ct-fish-row">${causes.slice(3, 6).map(causeBlock).join('')}</div></div>${panel('Root Cause — Which cause is most significant, and why?', `<div style="background:#EDE5F8;border-left:3px solid #7B4FBE;padding:8px 12px;margin-bottom:8px;">The most significant cause is <span class="ct-blank"></span> because</div>${lines(2)}`, '●')}${panel('Before You Move On', checklist(section.checklist), 'CHK')}`
  return shell(pkg, section, text(section.title, 'Fishbone Diagram'), text(section.subtitle, 'Identify the causes that lead to a problem, event, or outcome.'), text(section.meta, 'Careers 8 · All classes · Reusable thinking tool'), body, fontFaceCSS, designCSS, { docType: 'Graphic Organizer — Cause & Effect Analysis' })
}

function buildChoiceBoard(pkg, section, fontFaceCSS, designCSS) {
  const tasks = objects(section.tasks)
  const defaults = ['Identify or list the key ideas.', 'Explain this in your own words.', 'Apply this to real life.', 'Sort or match vocabulary.', 'FREE CHOICE', 'Create a diagram, chart, or script.', 'Draw and label key parts.', 'Compare two things.', 'Evaluate the better option.']
  const getTask = (i) => tasks[i] ?? { label: i === 4 ? '★ FREE' : `Task ${String.fromCharCode(65 + (i % 3))}${Math.floor(i / 3) + 1}`, title: i === 4 ? 'Your Choice' : '[Name the task]', description: defaults[i] }
  const cell = (i) => { const t = getTask(i); return `<td class="${i === 4 ? 'ct-free' : ''}"><div class="ct-task-num">${escapeHtml(t.label ?? '')}</div><div class="ct-task-title">${escapeHtml(t.title ?? '')}</div><div class="ct-task-desc">${escapeHtml(t.description ?? '')}</div><div class="ct-done"><span></span>Done</div></td>` }
  const body = `<div class="ct-info-row">${infoBox('DIR', 'How This Works', text(section.directions, 'Choose 3 tasks that connect like a line — across, down, or diagonal.'))}${infoBox('LT', 'Learning Target', text(section.learning_target, ''))}</div><div class="ct-topic"><label>Unit / Topic</label><div></div></div><div class="ct-board-rule">▶ Pick 3 tasks in a row — across, down, or diagonal ◀</div><table class="ct-board"><thead><tr><th>Getting Started</th><th>Showing Understanding</th><th>Going Further</th></tr></thead><tbody><tr>${cell(0)}${cell(1)}${cell(2)}</tr><tr>${cell(3)}${cell(4)}${cell(5)}</tr><tr>${cell(6)}${cell(7)}${cell(8)}</tr></tbody></table>${panel('When You’re Done', checklist(section.checklist), 'CHK')}`
  return shell(pkg, section, text(section.title, 'Choice Board'), text(section.subtitle, 'Pick your tasks. Show what you know in the way that works best for you.'), text(section.meta, 'K-Designation · Work Readiness'), body, fontFaceCSS, designCSS, { docType: 'K-Designation · Differentiated Task Menu', compact: true })
}

function buildSentenceFrames(pkg, section, fontFaceCSS, designCSS) {
  const groups = objects(section.frame_groups).length ? objects(section.frame_groups) : [
    { code: 'EXP', title: 'Explaining Your Thinking', frames: ['I think _____ because _____.', 'One reason for this is _____.', 'This shows that _____.'] },
    { code: 'EV', title: 'Citing Evidence', frames: ['According to _____, _____.', 'The text / data shows that _____.', 'This evidence supports my idea because _____.'] },
    { code: 'CMP', title: 'Comparing & Contrasting', frames: ['Both _____ and _____ are _____.', 'Unlike _____, _____.'] },
    { code: 'DIS', title: 'Respectful Disagreement', frames: ['I see it differently because _____.', 'Another way to look at this is _____.'] },
    { code: 'CLR', title: 'Asking for Clarification', frames: ['Can you explain what you mean by _____?', 'Can you give an example of _____?'] },
    { code: 'REF', title: 'Reflecting on Learning', frames: ['One thing I learned today is _____.', 'I still have a question about _____.'] },
  ]
  const cards = groups.slice(0, 6).map((group) => `<section class="ct-frame-card"><h2>${badge(group.code ?? '')}<span>${escapeHtml(group.title ?? '')}</span></h2><div class="ct-frame-body">${list(group.frames).slice(0, 4).map((frame) => `<div class="ct-frame-item"><div class="ct-frame-use">Frame</div><div>${escapeHtml(frame).replaceAll('_____', '<span class="ct-blank"></span>')}</div></div>`).join('')}</div></section>`).join('')
  const body = `<div style="background:#161C2D;color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;text-align:center;padding:5px;margin-bottom:12px;border-radius:3px;">▶ Laminate this sheet and keep it on your desk or in your folder ◀</div><div class="ct-frame-grid">${cards}</div>`
  return shell(pkg, section, text(section.title, 'Sentence Frame Card'), text(section.subtitle, 'Use these frames to help explain thinking, support discussion, and write responses.'), text(section.meta, 'Careers 8 · Literacy Intervention · K-Designation · All classes'), body, fontFaceCSS, designCSS, { docType: 'EA & Student Reference Tool', hideNameDate: true, compact: true })
}

function buildScaffoldedQuiz(pkg, section, fontFaceCSS, designCSS) {
  const words = list(section.word_bank, ['MBTI', 'Big Five', 'personality', 'Barnum Effect', 'spectrum', 'stable', '16', 'confirmation bias', 'scientific', 'OCEAN'])
  const mcq = objects(section.multiple_choice).length ? objects(section.multiple_choice) : [
    { question: 'What is the best answer?', options: ['Option A', 'Option B', 'Option C', 'Option D'] },
    { question: 'Choose the strongest response.', options: ['Option A', 'Option B', 'Option C', 'Option D'] },
  ]
  const short = objects(section.short_answer).length ? objects(section.short_answer) : [{ question: 'Explain your thinking in complete sentences.', hint: 'Use evidence or an example.' }]
  const mcqBody = mcq.slice(0, 3).map((q, qi) => `<div class="ct-q"><div><span class="ct-q-num">${qi + 1}</span>${escapeHtml(q.question ?? '')}</div><div class="ct-mcq">${list(q.options, ['A', 'B', 'C', 'D']).slice(0, 4).map((opt, oi) => `<label><span></span><b>${String.fromCharCode(65 + oi)}</b><em>${escapeHtml(opt)}</em></label>`).join('')}</div></div>`).join('')
  const shortBody = short.slice(0, 3).map((q, qi) => `<div class="ct-q"><div><span class="ct-q-num">${qi + 4}</span>${escapeHtml(q.question ?? '')}</div>${q.hint ? `<div class="ct-hint">Hint: ${escapeHtml(q.hint)}</div>` : ''}${lines(4)}</div>`).join('')
  const body = `<div class="ct-quiz-level">${escapeHtml(text(section.support_label, 'Scaffolded Support — word bank & hints provided'))}</div><div class="ct-info-row">${infoBox('LT', 'Learning Target', text(section.learning_target, ''))}</div><div class="ct-word-bank"><strong>Word Bank</strong>${words.map((w) => `<span class="ct-pill">${escapeHtml(w)}</span>`).join('')}</div><section class="ct-quiz-section"><h2>A Multiple Choice — Circle the best answer</h2><div class="ct-quiz-body">${mcqBody}</div></section><section class="ct-quiz-section"><h2>B Short Answer — Write in complete sentences</h2><div class="ct-quiz-body">${shortBody}</div></section>`
  return shell(pkg, section, text(section.title, 'Unit Quiz'), text(section.subtitle, 'Low-stakes check'), text(section.meta, 'Careers 8 · Unit Check'), body, fontFaceCSS, designCSS, { docType: 'Low-Stakes Check', compact: true })
}
