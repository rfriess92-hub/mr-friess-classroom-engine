import { escapeHtml } from './shared.mjs'

const LAYOUT_IDS = new Set([
  'frayer_vocabulary',
  'frayer_model',
  'vocabulary_cards',
  'vocab_cards',
  'prefix_root_word_study',
  'prefix_root_study',
  'morphology_cards',
])

const ALIASES = {
  frayer: 'frayer_vocabulary',
  frayer_template: 'frayer_vocabulary',
  frayer_vocabulary_tool: 'frayer_vocabulary',
  vocab_card: 'vocabulary_cards',
  vocabulary_card: 'vocabulary_cards',
  word_cards: 'vocabulary_cards',
  prefix_root: 'prefix_root_word_study',
  prefix_root_template: 'prefix_root_word_study',
  word_study_prefix_root: 'prefix_root_word_study',
}

function normalizeLayoutId(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const normalized = raw.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[\s.-]+/g, '_').toLowerCase()
  return ALIASES[normalized] ?? normalized
}

export function isLiteracyVocabularyToolLayout(value) {
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

function lines(count = 2, className = '') {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => `<div class="lvt-line ${className}"></div>`).join('')
}

function checkboxList(items) {
  const normalized = list(items)
  const rows = normalized.length > 0
    ? normalized.map((item) => `<label class="lvt-check-row"><span class="lvt-checkbox"></span><span>${escapeHtml(item)}</span></label>`)
    : Array.from({ length: 3 }, () => '<label class="lvt-check-row"><span class="lvt-checkbox"></span><span class="lvt-fill-line"></span></label>')
  return rows.join('')
}

function words(section) {
  const fromObjects = objectList(section.words ?? section.vocabulary ?? section.vocabulary_support)
    .map((entry) => ({
      word: text(entry.word ?? entry.term, 'Word'),
      definition: text(entry.definition ?? entry.meaning, ''),
      example: text(entry.example ?? entry.sentence, ''),
      prefix: text(entry.prefix, ''),
      root: text(entry.root, ''),
    }))
  if (fromObjects.length > 0) return fromObjects
  return list(section.word_list ?? section.terms, ['Word 1', 'Word 2', 'Word 3', 'Word 4']).map((word) => ({
    word,
    definition: '',
    example: '',
    prefix: '',
    root: '',
  }))
}

function buildShell(pkg, section, title, subtitle, body, fontFaceCSS, designCSS) {
  const subject = text(section?.metadata_subject ?? pkg?.subject, '')
  const grade = text(pkg?.grade, '')
  const topic = text(section?.metadata_topic ?? pkg?.topic, '')
  const meta = [subject, grade ? `Grade ${grade}` : '', topic].filter(Boolean).join(' · ')
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title><style>${fontFaceCSS}\n${designCSS}\n${css()}</style></head><body class="lvt-body"><main class="lvt-page"><div class="lvt-name-date"><span><strong>Name:</strong><i></i></span><span><strong>Date:</strong><i></i></span></div><header class="lvt-title-block"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>${meta ? `<div class="lvt-meta">${escapeHtml(meta)}</div>` : ''}</header><section class="lvt-content">${body}</section><footer class="lvt-footer">Vocabulary tools for noticing, breaking apart, and using words accurately.</footer></main></body></html>`
}

function css() {
  return `
@page { size: letter; margin: 0; }
*, *::before, *::after { box-sizing:border-box; }
.lvt-body { margin:0; background:#fff; color:#1E2738; font-family:Arial,system-ui,sans-serif; font-size:10.2pt; line-height:1.28; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.lvt-page { position:relative; width:8.5in; height:11in; padding:.29in .50in .24in; overflow:hidden; }
.lvt-page::before { content:""; position:absolute; top:0; left:0; right:0; height:4pt; background:#7B4FBE; }
.lvt-content { display:block; }
.lvt-name-date { display:flex; justify-content:space-between; gap:22pt; margin:0 0 11pt; font-size:9pt; font-weight:700; }
.lvt-name-date span { display:flex; align-items:center; gap:8pt; flex:1; }
.lvt-name-date span:first-child { max-width:2.75in; } .lvt-name-date span:last-child { max-width:1.7in; }
.lvt-name-date i { display:block; height:0; flex:1; border-bottom:1.1pt solid #1E2738; }
.lvt-title-block { text-align:center; margin:0 0 10pt; }
.lvt-title-block h1 { color:#161C2D; font-size:18pt; line-height:1.08; margin:0 0 3pt; font-weight:700; }
.lvt-title-block p { color:#78879C; font-size:9.6pt; line-height:1.25; margin:0; }
.lvt-meta { color:#78879C; font-size:7.6pt; letter-spacing:.16em; text-transform:uppercase; margin-top:4pt; }
.lvt-panel { border:1pt solid #D8DDE8; border-radius:4pt; background:#fff; overflow:hidden; }
.lvt-panel-head { min-height:24pt; display:flex; align-items:center; gap:7pt; padding:5.5pt 9pt; background:#F5F6F8; border-bottom:1pt solid #D8DDE8; color:#161C2D; font-weight:700; font-size:10.1pt; }
.lvt-badge { width:18pt; height:18pt; min-width:18pt; border:1.15pt solid #1E2738; border-radius:999px; background:#fff; color:#1E2738; display:inline-flex; align-items:center; justify-content:center; font-size:6.5pt; font-weight:700; line-height:1; }
.lvt-panel-body { padding:7pt 9pt; }
.lvt-grid { display:grid; gap:7pt; }
.lvt-two { grid-template-columns:1fr 1fr; }
.lvt-three { grid-template-columns:repeat(3,1fr); }
.lvt-directions { margin-bottom:7pt; }
.lvt-directions .lvt-panel-body { font-size:8.8pt; }
.lvt-line { height:.20in; border-bottom:1pt solid #CBD2DB; }
.lvt-line.short { height:.145in; }
.lvt-fill-line { display:inline-block; flex:1; height:10pt; border-bottom:1pt solid #CBD2DB; }
.lvt-check-row { display:grid; grid-template-columns:12pt 1fr; gap:7pt; align-items:start; font-size:8.7pt; line-height:1.22; margin-bottom:4pt; }
.lvt-checkbox { width:10pt; height:10pt; border:1.15pt solid #1E2738; margin-top:1pt; }
.lvt-footer { margin-top:6pt; border-top:1pt solid #D8DDE8; color:#78879C; font-size:7.5pt; padding-top:4pt; text-align:center; }
.lvt-frayer-grid { display:grid; grid-template-columns:1fr 1fr; gap:7pt; margin-top:7pt; }
.lvt-frayer-card { min-height:2.04in; }
.lvt-frayer-card .lvt-panel-body { min-height:1.70in; }
.lvt-word-center { display:flex; align-items:center; justify-content:center; min-height:.62in; border:2pt solid #7B4FBE; border-radius:5pt; background:#EDE5F8; color:#161C2D; font-size:17pt; font-weight:700; margin:7pt 0; text-align:center; }
.lvt-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:7pt; margin-top:7pt; }
.lvt-vocab-card { min-height:2.02in; border:1pt solid #D8DDE8; border-radius:5pt; overflow:hidden; page-break-inside:avoid; }
.lvt-vocab-title { background:#EDE5F8; border-bottom:1pt solid #D8DDE8; color:#161C2D; font-size:12.2pt; font-weight:700; padding:6pt 8pt; }
.lvt-vocab-body { padding:7pt 8pt; display:grid; gap:4pt; }
.lvt-card-label { color:#7B4FBE; font-weight:700; font-size:7.8pt; text-transform:uppercase; letter-spacing:.08em; }
.lvt-prefix-grid { display:grid; grid-template-columns:1fr 1fr 1.15fr; gap:7pt; margin-top:7pt; }
.lvt-word-row { border:1pt solid #D8DDE8; border-radius:5pt; overflow:hidden; margin-bottom:5pt; }
.lvt-word-row-head { display:grid; grid-template-columns:1.1fr 1fr 1fr; background:#F5F6F8; border-bottom:1pt solid #D8DDE8; font-weight:700; color:#161C2D; }
.lvt-word-row-head span, .lvt-word-row-body div { padding:5pt 6pt; border-right:1pt solid #D8DDE8; }
.lvt-word-row-head span:last-child, .lvt-word-row-body div:last-child { border-right:0; }
.lvt-word-row-body { display:grid; grid-template-columns:1.1fr 1fr 1fr; min-height:.43in; }
.lvt-so-what { margin-top:7pt; }
`
}

function panel(title, body, badge = '') {
  return `<section class="lvt-panel"><div class="lvt-panel-head">${badge ? `<span class="lvt-badge">${escapeHtml(badge)}</span>` : ''}<span>${escapeHtml(title)}</span></div><div class="lvt-panel-body">${body}</div></section>`
}

function directions(section, fallback) {
  const body = escapeHtml(text(section.directions ?? section.prompt, fallback))
  return `<div class="lvt-directions">${panel('Directions', body, 'DIR')}</div>`
}

function buildFrayer(pkg, section, fontFaceCSS, designCSS) {
  const entries = words(section)
  const focus = text(section.focus_word ?? section.word ?? entries[0]?.word, 'Focus word')
  const body = `${directions(section, 'Use each box to define, describe, and test your understanding of the focus word.')}<div class="lvt-word-center">${escapeHtml(focus)}</div><div class="lvt-frayer-grid">${panel('Definition in my own words', lines(5), 'DEF')}${panel('Characteristics / parts', lines(5), 'PART')}${panel('Examples', lines(5), 'EX')}${panel('Non-examples', lines(5), 'NO')}</div><div class="lvt-so-what">${panel('Use the word accurately', `<div>Write one clear sentence that proves you understand the word.</div>${lines(1)}`, 'USE')}</div>${section.success_criteria ? `<div style="margin-top:7pt;">${panel('Before you move on', checkboxList(section.success_criteria), 'CHK')}</div>` : ''}`
  return buildShell(pkg, section, text(section.title, 'Frayer Vocabulary Organizer'), text(section.subtitle, 'Define, describe, test, and use one word'), body, fontFaceCSS, designCSS)
}

function buildVocabularyCards(pkg, section, fontFaceCSS, designCSS) {
  const entries = words(section).slice(0, 6)
  const cards = entries.map((entry, index) => `<article class="lvt-vocab-card"><div class="lvt-vocab-title">${escapeHtml(entry.word || `Word ${index + 1}`)}</div><div class="lvt-vocab-body"><div><div class="lvt-card-label">Meaning</div>${entry.definition ? escapeHtml(entry.definition) : lines(2, 'short')}</div><div><div class="lvt-card-label">Word parts / clue</div>${entry.prefix || entry.root ? escapeHtml([entry.prefix, entry.root].filter(Boolean).join(' + ')) : lines(1, 'short')}</div><div><div class="lvt-card-label">My sentence</div>${entry.example ? escapeHtml(entry.example) : lines(2, 'short')}</div></div></article>`).join('')
  const body = `${directions(section, 'Cut apart or fold these cards. Add a meaning, word-part clue, and original sentence for each word.')}<div class="lvt-card-grid">${cards}</div>${section.success_criteria ? `<div style="margin-top:7pt;">${panel('Check your cards', checkboxList(section.success_criteria), 'CHK')}</div>` : ''}`
  return buildShell(pkg, section, text(section.title, 'Vocabulary Cards'), text(section.subtitle, 'Meaning, word parts, and sentence practice'), body, fontFaceCSS, designCSS)
}

function buildPrefixRootStudy(pkg, section, fontFaceCSS, designCSS) {
  const entries = words(section).slice(0, 6)
  const rows = entries.map((entry, index) => `<div class="lvt-word-row"><div class="lvt-word-row-head"><span>Word ${index + 1}</span><span>Prefix</span><span>Root / base</span></div><div class="lvt-word-row-body"><div>${entry.word && !entry.word.startsWith('Word ') ? escapeHtml(entry.word) : ''}</div><div>${entry.prefix ? escapeHtml(entry.prefix) : ''}</div><div>${entry.root ? escapeHtml(entry.root) : ''}</div></div></div>`).join('')
  const body = `${directions(section, 'Break each word into parts before guessing the meaning. Then use one word accurately in a sentence.')}<div class="lvt-grid lvt-two"><section>${rows}</section>${panel('Meaning predictions', `<div class="lvt-card-label">Use prefix + root clues.</div>${lines(8)}`, 'MEAN')}</div><div class="lvt-so-what">${panel('Use one word', `<div>Choose one word and write a sentence that shows its meaning.</div>${lines(1)}`, 'USE')}</div>${section.success_criteria ? `<div style="margin-top:7pt;">${panel('Before you move on', checkboxList(section.success_criteria), 'CHK')}</div>` : ''}`
  return buildShell(pkg, section, text(section.title, 'Word Study: Prefix + Root'), text(section.subtitle, 'Break the word before guessing the meaning'), body, fontFaceCSS, designCSS)
}

export function buildLiteracyVocabularyToolHTML(pkg, section, fontFaceCSS, designCSS, layoutTemplateId) {
  const layout = normalizeLayoutId(layoutTemplateId ?? section?.layout_template_id ?? section?.template_id)
  if (layout === 'frayer_vocabulary' || layout === 'frayer_model') {
    return buildFrayer(pkg, section, fontFaceCSS, designCSS)
  }
  if (layout === 'vocabulary_cards' || layout === 'vocab_cards' || layout === 'morphology_cards') {
    return buildVocabularyCards(pkg, section, fontFaceCSS, designCSS)
  }
  return buildPrefixRootStudy(pkg, section, fontFaceCSS, designCSS)
}
