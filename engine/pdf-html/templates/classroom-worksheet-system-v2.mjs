import { escapeHtml } from './shared.mjs'

const CLASSROOM_TEMPLATE_IDS = new Set([
  'worksheet_template_system',
  'english_reading_response',
  'reading_response',
  'cross_curricular_cer',
  'cer_cross_curricular',
  'vocabulary_morphology',
  'vocabulary_and_morphology',
  'careers_decision',
  'careers_decision_making',
  'literacy_word_study',
  'graphic_organizer_pack',
  'exit_reflection',
  'exit_ticket_reflection',
  'generic_graphic_organizer',
])

const TEMPLATE_ALIASES = {
  reading_response_template: 'english_reading_response',
  english_8_reading_response: 'english_reading_response',
  cer_template: 'cross_curricular_cer',
  claim_evidence_reasoning: 'cross_curricular_cer',
  vocabulary_template: 'vocabulary_morphology',
  morphology_template: 'vocabulary_morphology',
  decision_making: 'careers_decision',
  careers_8_decision_making: 'careers_decision',
  word_study: 'literacy_word_study',
  graphic_organizer: 'graphic_organizer_pack',
  graphic_organizers: 'graphic_organizer_pack',
  exit_ticket: 'exit_reflection',
  reflection_ticket: 'exit_reflection',
}

function normalizeTemplateId(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const normalized = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .toLowerCase()
  return TEMPLATE_ALIASES[normalized] ?? normalized
}

export function isClassroomTemplateLayout(value) {
  const normalized = normalizeTemplateId(value)
  return normalized ? CLASSROOM_TEMPLATE_IDS.has(normalized) : false
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

function objectList(value, fallback = []) {
  if (!Array.isArray(value)) return fallback
  const normalized = value.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
  return normalized.length > 0 ? normalized : fallback
}

function lines(count = 2, className = '') {
  return Array.from({ length: Math.max(1, Number(count) || 1) }, () => `<div class="cws-line ${className}"></div>`).join('')
}

function icon(label = '') {
  return `<span class="cws-icon" aria-hidden="true">${escapeHtml(label)}</span>`
}

function headerBox(title, body, iconLabel = '') {
  return `
    <section class="cws-info-box">
      ${icon(iconLabel)}
      <div>
        <div class="cws-info-title">${escapeHtml(title)}</div>
        <div class="cws-info-body">${escapeHtml(body)}</div>
      </div>
    </section>`
}

function sectionBox(title, body, options = {}) {
  const iconHtml = options.icon ? icon(options.icon) : ''
  const className = options.className ? ` ${options.className}` : ''
  return `
    <section class="cws-box${className}">
      <div class="cws-box-header">${iconHtml}<span>${escapeHtml(title)}</span></div>
      <div class="cws-box-body">${body}</div>
    </section>`
}

function numberedSection(number, title, prompt, lineCount = 2, iconLabel = null) {
  const mark = iconLabel ? icon(iconLabel) : `<span class="cws-number">${escapeHtml(String(number))}</span>`
  return `
    <section class="cws-response-box">
      <div class="cws-response-head">${mark}<div><strong>${escapeHtml(title)}</strong>${prompt ? `<span>${escapeHtml(prompt)}</span>` : ''}</div></div>
      ${lines(lineCount)}
    </section>`
}

function checkboxList(items) {
  const normalized = list(items)
  const rows = normalized.length > 0
    ? normalized.map((item) => `<label class="cws-check-row"><span class="cws-checkbox"></span><span>${escapeHtml(item)}</span></label>`)
    : Array.from({ length: 4 }, () => `<label class="cws-check-row"><span class="cws-checkbox"></span><span class="cws-fill-line"></span></label>`)
  return rows.join('')
}

function wordDefinitionRows(words = []) {
  const normalized = objectList(words)
  const rows = normalized.length > 0
    ? normalized.slice(0, 5).map((entry) => `<div class="cws-vocab-row"><strong>${escapeHtml(entry.word ?? entry.term ?? '[Word]')}</strong><span> - ${escapeHtml(entry.definition ?? '[Definition]')}</span></div>`)
    : Array.from({ length: 4 }, () => `<div class="cws-vocab-row"><strong>[Word]</strong><span> - [Definition]</span></div>`)
  return rows.join('')
}

function templateTitle(section, fallback) {
  return text(section?.title, fallback)
}

function templateSubtitle(section, fallback) {
  return text(section?.subtitle, fallback)
}

function shellClass(section) {
  return section?.compact ? ' cws-tight' : ''
}

function buildShell(pkg, section, title, subtitle, body, fontFaceCSS, designCSS) {
  const subject = text(section?.metadata_subject ?? pkg?.subject, '')
  const grade = text(pkg?.grade, '')
  const topic = text(section?.metadata_topic ?? pkg?.topic, '')
  const pieces = [subject, grade ? `Grade ${grade}` : '', topic].filter(Boolean)
  const meta = section?.hide_metadata ? '' : pieces.join(' · ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
${fontFaceCSS}
${designCSS}
${classroomWorksheetCSS()}
  </style>
</head>
<body class="cws-body">
  <main class="cws-page${shellClass(section)}">
    <div class="cws-name-date">
      <span><strong>Name:</strong> <i></i></span>
      <span><strong>Date:</strong> <i></i></span>
    </div>
    <header class="cws-title-block">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      ${meta ? `<div class="cws-meta">${escapeHtml(meta)}</div>` : ''}
    </header>
    ${body}
  </main>
</body>
</html>`
}

function classroomWorksheetCSS() {
  return `
@page { size: letter; margin: 0; }
*, *::before, *::after { box-sizing: border-box; }

.cws-body {
  background: #fff;
  color: #0f172a;
  font-family: 'Lexend', system-ui, sans-serif;
  font-size: 10.2pt;
  line-height: 1.25;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.cws-page {
  width: 8.5in;
  height: 11in;
  padding: 0.34in 0.36in 0.34in;
  border: 2pt solid #111;
  overflow: hidden;
}

.cws-name-date {
  display: flex;
  justify-content: space-between;
  gap: 22pt;
  font-size: 12.5pt;
  font-weight: 700;
  margin: 0 0 12pt;
}

.cws-name-date span {
  display: flex;
  align-items: center;
  gap: 8pt;
  flex: 1;
}
.cws-name-date span:first-child { max-width: 3.2in; }
.cws-name-date span:last-child { max-width: 2.15in; }
.cws-name-date i { display: block; border-bottom: 1.6pt solid #111; flex: 1; height: 0; }

.cws-title-block { text-align: center; margin: 0 0 12pt; }
.cws-title-block h1 { font-size: 25pt; line-height: 1.02; letter-spacing: -0.025em; margin: 0 0 3pt; font-weight: 800; }
.cws-title-block p { font-size: 12.6pt; margin: 0; }
.cws-meta { font-size: 7.4pt; color: #4b5563; margin-top: 3pt; text-transform: uppercase; letter-spacing: 0.08em; }

.cws-grid { display: grid; gap: 8pt; }
.cws-grid.two { grid-template-columns: 1fr 1fr; }
.cws-grid.three { grid-template-columns: repeat(3, 1fr); }
.cws-grid.left-sidebar { grid-template-columns: minmax(0, 1fr) 2.15in; align-items: stretch; }
.cws-grid.sidebar-left { grid-template-columns: minmax(0, 1fr) 2.15in; align-items: stretch; }
.cws-grid.bottom-pair { grid-template-columns: 1.55fr 1fr; }
.cws-stack { display: grid; gap: 7pt; }

.cws-info-box,
.cws-box,
.cws-response-box,
.cws-mini-card,
.cws-panel {
  border: 1.35pt solid #111;
  border-radius: 8pt;
  background: #fff;
  overflow: hidden;
}

.cws-info-box { min-height: 0.7in; display: grid; grid-template-columns: 0.46in 1fr; gap: 7pt; align-items: center; padding: 7pt; }
.cws-info-title { font-weight: 800; font-size: 12.8pt; margin-bottom: 2pt; }
.cws-info-body { font-size: 9.4pt; }

.cws-icon { width: 0.34in; height: 0.34in; border: 1.35pt solid #111; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 7.6pt; flex: 0 0 auto; background: #fff; line-height: 1; letter-spacing: 0.02em; }
.cws-number { width: 0.25in; height: 0.25in; border-radius: 999px; background: #111; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 9.5pt; flex: 0 0 auto; }
.cws-box-header { min-height: 0.32in; background: #f1f5f9; border-bottom: 1.25pt solid #111; display: flex; align-items: center; gap: 7pt; padding: 5pt 8pt; font-weight: 800; font-size: 12pt; }
.cws-box-header .cws-icon { width: 0.28in; height: 0.28in; font-size: 7pt; }
.cws-box-body { padding: 7pt 9pt; }

.cws-response-box { padding: 8pt 10pt 8pt; min-height: 0.83in; }
.cws-response-head { display: flex; align-items: flex-start; gap: 8pt; margin-bottom: 5pt; }
.cws-response-head strong { display: block; font-size: 12.2pt; line-height: 1.1; }
.cws-response-head span:not(.cws-icon):not(.cws-number) { display: block; font-size: 8.7pt; margin-top: 1pt; color: #334155; }
.cws-line { border-bottom: 1.05pt solid #111; height: 0.25in; }
.cws-line.short { height: 0.18in; }
.cws-line.dotted { border-bottom-style: dotted; }
.cws-fill-line { display: inline-block; border-bottom: 1pt solid #111; height: 10pt; flex: 1; }

.cws-check-row,
.cws-radio-row { display: grid; grid-template-columns: 12pt 1fr; gap: 7pt; align-items: start; margin-bottom: 6pt; font-size: 8.9pt; }
.cws-checkbox { width: 10pt; height: 10pt; border: 1.2pt solid #111; margin-top: 1pt; }
.cws-radio { width: 12pt; height: 12pt; border: 1.2pt solid #111; border-radius: 50%; margin-top: 1pt; }
.cws-vocab-row { border-bottom: 1pt solid #111; padding: 4.5pt 0; font-size: 8.8pt; }
.cws-footer-banner { border: 1.5pt solid #111; background: #f8fafc; text-align: center; font-weight: 800; font-size: 11pt; padding: 7pt; margin-top: 8pt; }

.cws-template-rules { grid-template-columns: 1fr 1fr; margin-bottom: 9pt; }
.cws-rule-box { display: grid; grid-template-columns: 0.52in 1fr; gap: 8pt; align-items: center; border: 1.35pt solid #111; border-radius: 8pt; padding: 8pt; min-height: 0.7in; }
.cws-rule-title { font-size: 12pt; font-weight: 800; }
.cws-rule-body { font-size: 9.4pt; }
.cws-core-grid { display: grid; grid-template-columns: 1fr 1fr 0.95fr; gap: 7pt; }
.cws-core-wide { grid-column: 1 / span 2; }
.cws-core-tall { grid-row: span 2; }

.cws-organizer-grid { grid-template-columns: 1fr 1fr; gap: 8pt; }
.cws-organizer-grid .cws-box-body { min-height: 1.45in; }
.cws-venn { position: relative; height: 1.5in; }
.cws-venn-circle { position: absolute; top: 0.04in; width: 1.62in; height: 1.25in; border: 1.35pt solid #111; border-radius: 50%; text-align: center; font-size: 8pt; padding-top: 0.15in; background: transparent; }
.cws-venn-left { left: 0.03in; }
.cws-venn-right { right: 0.03in; }
.cws-venn-both { position: absolute; left: 50%; top: 0.48in; transform: translateX(-50%); width: 0.88in; min-height: 0.42in; border: 1pt solid #111; background: #fff; border-radius: 5pt; text-align: center; font-size: 7.8pt; padding: 4pt; }
.cws-blank-zone { height: 0.45in; border-top: 1pt dotted #111; margin: 6pt 12pt 0; }

.cws-web { position: relative; height: 1.48in; }
.cws-web-line { position: absolute; left: 50%; top: 50%; width: 1.55in; border-top: 1pt solid #111; transform-origin: left center; }
.cws-web-line.l1 { transform: rotate(28deg); }
.cws-web-line.l2 { transform: rotate(152deg); }
.cws-web-line.l3 { transform: rotate(-28deg); }
.cws-web-line.l4 { transform: rotate(-152deg); }
.cws-web-center,
.cws-web-node { position: absolute; border: 1.25pt solid #111; border-radius: 7pt; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8pt; background: #fff; padding: 3pt; }
.cws-web-center { left: 50%; top: 50%; transform: translate(-50%, -50%); width: 1.05in; height: 0.48in; font-weight: 800; }
.cws-web-node { width: 0.82in; height: 0.46in; }
.cws-web-node.n1 { left: 0.05in; top: 0.04in; }
.cws-web-node.n2 { right: 0.05in; top: 0.04in; }
.cws-web-node.n3 { left: 0.05in; bottom: 0.04in; }
.cws-web-node.n4 { right: 0.05in; bottom: 0.04in; }

.cws-flow { display: grid; grid-template-columns: 1fr 0.18in 1fr 0.18in 1fr; gap: 4pt; align-items: center; }
.cws-flow-card { min-height: 1.0in; border: 1.15pt solid #111; border-radius: 5pt; padding: 5pt; text-align: center; font-size: 8pt; }
.cws-arrow { text-align: center; font-weight: 800; font-size: 14pt; }
.cws-timeline { height: 1.36in; padding-top: 0.14in; }
.cws-timeline-line { height: 2pt; background: #111; margin: 0 0.08in; }
.cws-timeline-events { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4pt; margin-top: -6pt; }
.cws-event { text-align: center; font-size: 7.4pt; }
.cws-event-dot { width: 10pt; height: 10pt; border: 1.35pt solid #111; border-radius: 50%; background: #fff; margin: 0 auto 5pt; }
.cws-event-box { border: 1pt solid #111; border-radius: 5pt; min-height: 0.56in; padding: 4pt; }
.cws-problem { display: grid; gap: 5pt; text-align: center; }
.cws-problem-top,
.cws-problem-bottom { border: 1.15pt solid #111; border-radius: 5pt; padding: 5pt; min-height: 0.5in; font-size: 8pt; }
.cws-problem-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; }
.cws-question-web { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; }
.cws-question-web .cws-mini-prompt { border: 1pt solid #111; border-radius: 5pt; min-height: 0.48in; padding: 4pt; font-size: 7.8pt; }

.cws-frayer { position: relative; display: grid; grid-template-columns: 1fr 1fr; border: 1.35pt solid #111; border-radius: 8pt; overflow: hidden; min-height: 3.25in; margin-bottom: 8pt; }
.cws-frayer-cell { min-height: 1.6in; padding: 10pt 12pt; border-bottom: 1.15pt solid #111; border-right: 1.15pt solid #111; }
.cws-frayer-cell:nth-child(2n) { border-right: none; }
.cws-frayer-cell:nth-child(n+3) { border-bottom: none; }
.cws-frayer-title { font-size: 12.3pt; font-weight: 800; margin-bottom: 7pt; }
.cws-frayer-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 1.45in; height: 0.62in; border: 1.35pt solid #111; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11pt; text-align: center; }
.cws-morph-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7pt; }
.cws-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7pt; }
.cws-segmented-word { display: grid; grid-template-columns: repeat(3, 1fr); border: 1.2pt solid #111; border-radius: 5pt; overflow: hidden; height: 0.46in; margin-bottom: 3pt; }
.cws-segmented-word span { border-right: 1pt dotted #111; }
.cws-segmented-word span:last-child { border-right: none; }
.cws-option-grid { grid-template-columns: repeat(3, 1fr); }
.cws-option-card { border: 1.25pt solid #111; border-radius: 8pt; padding: 7pt; min-height: 2.62in; }
.cws-option-card h3 { text-align:center; font-size:11.4pt; margin:0 0 5pt; border-bottom:1.1pt solid #111; padding-bottom:4pt; }
.cws-field-label { font-weight: 800; font-size: 8.6pt; margin-top: 5pt; }
.cws-matrix { width:100%; border-collapse: collapse; font-size: 8.8pt; }
.cws-matrix th,
.cws-matrix td { border: 1.1pt solid #111; padding: 5pt; height: 0.34in; }
.cws-matrix th { background: #f1f5f9; font-weight: 800; }
.cws-sound-boxes { grid-template-columns: repeat(3, 1fr); gap: 6pt; }
.cws-mini-write { border:1.2pt solid #111; border-radius:7pt; padding:6pt; min-height:0.62in; }
.cws-sort-grid { grid-template-columns: repeat(3, 1fr); gap: 5pt; }
.cws-map-grid { grid-template-columns: repeat(2, 1fr); gap: 6pt; }
.cws-map-box { border: 1.2pt solid #111; border-radius: 6pt; min-height: 0.55in; }
.cws-readwrite { grid-template-columns: 1fr 1.55fr; }
.cws-handwriting .cws-line { border-bottom-style: solid; box-shadow: 0 -7pt 0 -6pt #666 inset; height: 0.22in; }
.cws-tight .cws-title-block h1 { font-size: 22pt; }
.cws-tight .cws-title-block { margin-bottom: 8pt; }
.cws-tight .cws-box-body { padding: 6pt 8pt; }
.cws-tight .cws-response-box { padding: 7pt 9pt 6pt; }
.cws-tight .cws-line { height: 0.2in; }
`
}

function buildTemplateSystem(pkg, section, fontFaceCSS, designCSS) {
  const rules = [
    ['Clear Header', 'Use one strong title and a simple subtitle.', 'H'],
    ['Simple Sections', 'Break the page into clear boxes with bold labels.', 'S'],
    ['Writable Space', 'Leave enough lines and blank areas for student thinking.', 'W'],
    ['Student Supports', 'Add vocabulary, checklist, or examples when needed.', 'SUP'],
    ['Consistent Icons', 'Use small label icons only to cue the section purpose.', 'I'],
    ['Print-Friendly', 'Keep everything high-contrast and uncluttered.', 'P'],
  ]
  const body = `
    <div class="cws-grid cws-template-rules">
      ${rules.map(([title, bodyText, iconLabel], index) => `
        <section class="cws-rule-box">
          ${icon(iconLabel)}
          <div><div class="cws-rule-title">${index + 1}. ${escapeHtml(title)}</div><div class="cws-rule-body">${escapeHtml(bodyText)}</div></div>
        </section>`).join('')}
    </div>
    ${sectionBox('Core Layout Blocks', `
      <div class="cws-core-grid">
        ${sectionBox('Learning Target', '[Learning Target]', { icon: 'LT' })}
        ${sectionBox('Directions', '[Directions]', { icon: 'DIR' })}
        ${sectionBox('Reading / Task', '[Insert short text / prompt here]', { icon: 'TXT', className: 'cws-core-tall' })}
        ${sectionBox('Answer Lines', `[Student response area]${lines(5)}`, { icon: 'WR', className: 'cws-core-wide' })}
        ${sectionBox('Checklist / Reflection', `[Success criteria / reflection]${checkboxList([])}`, { icon: 'CHK' })}
      </div>
    `)}
    <div class="cws-footer-banner">Built for English 8, Careers, Literacy Intervention, Science, and Social Studies</div>
  `
  return buildShell(pkg, { ...section, hide_metadata: true }, templateTitle(section, 'Worksheet Template System'), templateSubtitle(section, 'Reusable classroom layout for future handouts'), body, fontFaceCSS, designCSS)
}

function buildReadingResponse(pkg, section, fontFaceCSS, designCSS) {
  const vocab = section.vocabulary ?? section.vocabulary_support
  const success = list(section.success_criteria, [
    'I answered in complete sentences.',
    'I used details or ideas from the text.',
    'I explained my thinking clearly.',
    'I checked my work for spelling and grammar.',
  ])
  const body = `
    <div class="cws-grid two">
      ${headerBox('Learning Target', text(section.learning_target, '[I can ...]'), 'LT')}
      ${headerBox('Directions', text(section.directions, '[Read / think / respond]'), 'DIR')}
    </div>
    ${sectionBox('Text / Prompt', `<div>${escapeHtml(text(section.prompt, '[Insert passage, quotation, image prompt, or question here.]'))}</div>`, { icon: 'TXT' })}
    <div class="cws-grid left-sidebar" style="margin-top:8pt;">
      <div class="cws-stack">
        ${numberedSection(1, 'Main Idea', '[What is the text mostly about?]', 3)}
        ${numberedSection(2, 'Evidence', '[What detail supports your answer?]', 3)}
        ${numberedSection(3, 'Explain Your Thinking', '[How does your evidence connect?]', 3, 'WHY')}
        ${numberedSection(4, 'Personal / Text Connection', '[What does this make you think about?]', 2, 'CON')}
      </div>
      <aside class="cws-stack">
        ${sectionBox('Vocabulary Support', wordDefinitionRows(vocab), { icon: 'VOC' })}
        ${sectionBox('Success Criteria', checkboxList(success), { icon: 'CHK' })}
      </aside>
    </div>
    ${sectionBox('Reflection', `[What did you do well? What do you want to improve next time?]${lines(2)}`, { icon: 'REF' })}
  `
  return buildShell(pkg, section, templateTitle(section, 'English 8 - Reading Response Template'), templateSubtitle(section, 'Reusable close-reading and written-response layout'), body, fontFaceCSS, designCSS)
}

function buildCer(pkg, section, fontFaceCSS, designCSS) {
  const starters = list(section.sentence_starters, ['My claim is...', 'One piece of evidence is...', 'This shows...', 'Therefore...'])
  const checklist = list(section.success_criteria, [
    'My claim answers the question.',
    'I included strong evidence.',
    'I explained how my evidence supports my claim.',
    'I used complete sentences.',
    'I checked my work for clarity and spelling.',
  ])
  const body = `
    <div class="cws-grid three">
      ${headerBox('Question / Topic', text(section.question, '[What are you answering?]'), 'Q')}
      ${headerBox('Learning Target', text(section.learning_target, '[I can make a clear claim and support it.]'), 'LT')}
      ${headerBox('Directions', text(section.directions, '[Use evidence and explain your reasoning.]'), 'DIR')}
    </div>
    <div class="cws-grid sidebar-left" style="margin-top:8pt;">
      <div class="cws-stack">
        ${numberedSection(1, 'Claim', '[What is your answer or conclusion?]', 3, 'CL')}
        ${sectionBox('Evidence', `
          <div style="font-size:8.8pt;margin-bottom:5pt;">[What facts, examples, quotations, or observations support your claim?]</div>
          <table class="cws-matrix"><tbody>
            <tr><th style="width:.35in;">A</th><td></td></tr>
            <tr><th>B</th><td></td></tr>
            <tr><th>C</th><td></td></tr>
          </tbody></table>
        `, { icon: 'EV' })}
        ${numberedSection(3, 'Reasoning', '[How does your evidence support your claim?]', 4, 'WHY')}
      </div>
      <aside class="cws-stack">
        ${sectionBox('Sentence Starters', starters.map((starter) => `<div class="cws-vocab-row">- ${escapeHtml(starter)}</div>`).join(''), { icon: 'SS' })}
        ${sectionBox('Checklist', checkboxList(checklist), { icon: 'CHK' })}
      </aside>
    </div>
    ${sectionBox('Extension / Counterclaim', `[What could someone else say? How would you respond?]${lines(2)}`, { icon: 'EXT' })}
  `
  return buildShell(pkg, section, templateTitle(section, 'Cross-Curricular CER Template'), templateSubtitle(section, 'Claim - Evidence - Reasoning organizer for science, socials, and English'), body, fontFaceCSS, designCSS)
}

function buildVocabularyMorphology(pkg, section, fontFaceCSS, designCSS) {
  const targetWord = text(section.word ?? section.term ?? section.target_word, '[Target Word]')
  const body = `
    <div class="cws-grid two">
      ${headerBox('Word / Term', targetWord, 'WORD')}
      ${headerBox('Directions', text(section.directions, '[Use the boxes to break down and understand the word.]'), 'DIR')}
    </div>
    <div class="cws-frayer">
      <div class="cws-frayer-cell"><div class="cws-frayer-title">Definition</div>${lines(4)}</div>
      <div class="cws-frayer-cell"><div class="cws-frayer-title">Examples</div>${lines(4)}</div>
      <div class="cws-frayer-cell"><div class="cws-frayer-title">Non-Examples</div>${lines(4)}</div>
      <div class="cws-frayer-cell"><div class="cws-frayer-title">Characteristics</div>${lines(4)}</div>
      <div class="cws-frayer-center">${escapeHtml(targetWord)}</div>
    </div>
    ${sectionBox('Morphology Breakdown', `
      <div class="cws-morph-grid">
        <div><strong>Prefix / Root / Suffix</strong><div class="cws-segmented-word"><span></span><span></span><span></span></div><div style="display:flex;justify-content:space-around;font-size:8pt;"><span>Prefix</span><span>Root</span><span>Suffix</span></div></div>
        <div><strong>Meaning of Parts</strong>${lines(3)}</div>
        <div><strong>What the Whole Word Means</strong>${lines(3)}</div>
      </div>
    `, { icon: 'MOR' })}
    <div class="cws-grid two">
      ${sectionBox('Use It in a Sentence', lines(3), { icon: 'WR' })}
      ${sectionBox('Sketch / Memory Clue', '<div style="height:1.0in;"></div>', { icon: 'SK' })}
    </div>
  `
  return buildShell(pkg, section, templateTitle(section, 'Vocabulary & Morphology Template'), templateSubtitle(section, 'Reusable word-study page for English, science, socials, and literacy intervention'), body, fontFaceCSS, designCSS)
}

function buildCareersDecision(pkg, section, fontFaceCSS, designCSS) {
  const body = `
    <div class="cws-grid three">
      ${headerBox('Scenario / Task', text(section.scenario, '[Insert situation or decision]'), 'SC')}
      ${headerBox('Goal', text(section.goal, '[What am I trying to do?]'), 'GO')}
      ${headerBox('Directions', text(section.directions, '[Think, sort, choose, explain.]'), 'DIR')}
    </div>
    ${sectionBox('Option Planner', `
      <div class="cws-grid cws-option-grid">
        ${[1, 2, 3].map((num) => `
          <div class="cws-option-card">
            <h3>Option ${num}</h3>
            <div class="cws-field-label">What is it?</div>${lines(2, 'short')}
            <div class="cws-field-label">Benefits</div>${lines(2, 'short')}
            <div class="cws-field-label">Challenges</div>${lines(2, 'short')}
            <div class="cws-field-label">What might happen next?</div>${lines(2, 'short')}
          </div>`).join('')}
      </div>
    `)}
    ${sectionBox('What Matters Most?', `
      <table class="cws-matrix">
        <thead><tr><th></th><th>Option 1</th><th>Option 2</th><th>Option 3</th></tr></thead>
        <tbody><tr><th>Time</th><td></td><td></td><td></td></tr><tr><th>Importance</th><td></td><td></td><td></td></tr><tr><th>Effort</th><td></td><td></td><td></td></tr><tr><th>Impact</th><td></td><td></td><td></td></tr></tbody>
      </table>
    `)}
    <div class="cws-grid bottom-pair">
      ${sectionBox('My Choice', `[Which option makes the most sense right now? Why?]${lines(3)}`, { icon: 'DEC' })}
      ${sectionBox('Decision Checklist', checkboxList(['I considered more than one option.', 'I looked at benefits and challenges.', 'I thought about what matters most.', 'I explained my reason clearly.']), { icon: 'CHK' })}
    </div>
  `
  return buildShell(pkg, section, templateTitle(section, 'Careers 8 - Decision-Making Template'), templateSubtitle(section, 'Reusable planning and prioritizing worksheet'), body, fontFaceCSS, designCSS)
}

function buildLiteracyWordStudy(pkg, section, fontFaceCSS, designCSS) {
  const body = `
    <div class="cws-grid three">
      ${headerBox('Skill Focus', text(section.skill_focus, '[ch / sh / syllable type / suffix / etc.]'), 'SK')}
      ${headerBox('Learning Target', text(section.learning_target, '[I can ...]'), 'LT')}
      ${headerBox('Directions', text(section.directions, '[Read, sort, build, write.]'), 'DIR')}
    </div>
    ${sectionBox('Sound / Pattern Practice', `
      <div class="cws-grid two">${headerBox('Target Pattern', text(section.target_pattern, '[Insert pattern]'), 'PAT')}${headerBox('Key Sound / Rule', text(section.key_rule, '[Insert rule]'), 'RULE')}</div>
      <div class="cws-grid cws-sound-boxes" style="margin-top:7pt;">${Array.from({ length: 6 }, (_, i) => `<div class="cws-mini-write"><span class="cws-number">${i + 1}</span>${lines(2, 'dotted short')}</div>`).join('')}</div>
    `)}
    <div class="cws-grid two">
      ${sectionBox('Sort It', `<div class="cws-grid cws-sort-grid">${['[Category A]','[Category B]','[Category C]'].map((label) => `<div class="cws-mini-write"><strong>${escapeHtml(label)}</strong>${lines(5, 'short')}</div>`).join('')}</div>`)}
      ${sectionBox('Tap / Map / Mark', `<div class="cws-grid cws-map-grid">${Array.from({ length: 4 }, () => '<div class="cws-map-box"></div>').join('')}</div>`)}
    </div>
  `
  return buildShell(pkg, section, templateTitle(section, 'Literacy Intervention - Word Study Template'), templateSubtitle(section, 'Reusable decoding, spelling, and word-analysis page'), body, fontFaceCSS, designCSS)
}

function buildGraphicOrganizerPack(pkg, section, fontFaceCSS, designCSS) {
  const body = `
    <div class="cws-grid cws-organizer-grid">
      ${sectionBox('1 Compare & Contrast', `<div class="cws-venn"><div class="cws-venn-circle cws-venn-left">[Idea A]<div class="cws-blank-zone"></div></div><div class="cws-venn-circle cws-venn-right">[Idea B]<div class="cws-blank-zone"></div></div><div class="cws-venn-both">Both</div></div>`, { icon: 'CMP' })}
      ${sectionBox('2 Main Idea + Details', `<div class="cws-web"><div class="cws-web-line l1"></div><div class="cws-web-line l2"></div><div class="cws-web-line l3"></div><div class="cws-web-line l4"></div><div class="cws-web-center">Main Idea</div><div class="cws-web-node n1">Detail</div><div class="cws-web-node n2">Detail</div><div class="cws-web-node n3">Detail</div><div class="cws-web-node n4">Detail</div></div>`, { icon: 'WEB' })}
      ${sectionBox('3 Cause and Effect', `<div class="cws-flow"><div class="cws-flow-card">Cause${lines(2, 'short')}</div><div class="cws-arrow">></div><div class="cws-flow-card">Effect${lines(2, 'short')}</div><div class="cws-arrow">></div><div class="cws-flow-card">Next Effect${lines(2, 'short')}</div></div>`, { icon: 'C/E' })}
      ${sectionBox('4 Timeline', `<div class="cws-timeline"><div class="cws-timeline-line"></div><div class="cws-timeline-events">${Array.from({ length: 5 }, () => `<div class="cws-event"><div class="cws-event-dot"></div><div class="cws-event-box">Event${lines(1, 'short')}</div></div>`).join('')}</div></div>`, { icon: 'TIME' })}
      ${sectionBox('5 Problem / Solution', `<div class="cws-problem"><div class="cws-problem-top">Problem${lines(2, 'short')}</div><div class="cws-problem-pair"><div class="cws-problem-bottom">Possible Solution${lines(1, 'short')}</div><div class="cws-problem-bottom">Best Solution${lines(1, 'short')}</div></div></div>`, { icon: 'SOL' })}
      ${sectionBox('6 Question Web', `<div class="cws-question-web"><div class="cws-mini-prompt">Big Question${lines(1, 'short')}</div><div class="cws-mini-prompt">Who / What?</div><div class="cws-mini-prompt">Why?</div><div class="cws-mini-prompt">How?</div><div class="cws-mini-prompt">Evidence</div><div class="cws-mini-prompt">Connection</div></div>`, { icon: 'Q' })}
    </div>
    <div class="cws-footer-banner">Use these layouts to organize ideas before writing, speaking, or discussing.</div>
  `
  return buildShell(pkg, { ...section, compact: true, hide_metadata: true }, templateTitle(section, 'Graphic Organizer Template Pack'), templateSubtitle(section, 'Reusable thinking tools for English, science, socials, and Careers'), body, fontFaceCSS, designCSS)
}

function buildExitReflection(pkg, section, fontFaceCSS, designCSS) {
  const body = `
    <div class="cws-grid two">
      ${headerBox('Today’s Topic', text(section.topic_prompt ?? section.topic, '[Insert topic]'), 'TOP')}
      ${headerBox('Learning Target', text(section.learning_target, '[I can ...]'), 'LT')}
    </div>
    <div class="cws-grid left-sidebar" style="margin-top:8pt;">
      <div class="cws-stack">
        ${numberedSection(1, 'One thing I learned', '', 3)}
        ${numberedSection(2, 'One question I still have', '', 3)}
        ${numberedSection(3, 'Show what you know', '[Explain, solve, or summarize.]', 3)}
        ${numberedSection(4, 'Next step', '[What should you do next?]', 2)}
      </div>
      <aside class="cws-stack">
        ${sectionBox('Self-Assessment', ['I need help', 'I am getting there', 'I understand', 'I could teach this'].map((label) => `<label class="cws-radio-row"><span class="cws-radio"></span><span>${escapeHtml(label)}</span></label>`).join(''), { icon: 'SELF' })}
        ${sectionBox('Teacher Feedback', '<div style="height:2.25in;"></div>', { icon: 'FB' })}
      </aside>
    </div>
    ${sectionBox('Reflection', `[How did you participate or use your time today?]${lines(2)}`, { icon: 'REF' })}
  `
  return buildShell(pkg, section, templateTitle(section, 'Exit Ticket + Reflection Template'), templateSubtitle(section, 'Reusable quick-check page for any subject'), body, fontFaceCSS, designCSS)
}

function buildGenericGraphicOrganizer(pkg, section, fontFaceCSS, designCSS) {
  const columns = list(section.columns, ['Side A', 'Side B'])
  const rowCount = Math.max(3, Number(section.rows) || 4)
  const colCount = Math.max(2, Math.min(columns.length, 4))
  const body = `
    ${section.prompt ? sectionBox('Directions', escapeHtml(section.prompt), { icon: 'DIR' }) : ''}
    ${sectionBox('Organizer', `
      <table class="cws-matrix">
        <thead><tr>${Array.from({ length: colCount }, (_, i) => `<th>${escapeHtml(columns[i] ?? `Column ${i + 1}`)}</th>`).join('')}</tr></thead>
        <tbody>${Array.from({ length: rowCount }, () => `<tr>${Array.from({ length: colCount }, () => '<td style="height:.58in;"></td>').join('')}</tr>`).join('')}</tbody>
      </table>
    `)}
    ${section.success_criteria ? sectionBox('Before you move on', checkboxList(section.success_criteria), { icon: 'CHK' }) : ''}
  `
  return buildShell(pkg, section, templateTitle(section, 'Graphic Organizer'), templateSubtitle(section, 'Reusable thinking tool'), body, fontFaceCSS, designCSS)
}

export function buildClassroomWorksheetTemplateHTML(pkg, section, fontFaceCSS, designCSS, layoutId = null) {
  const normalized = normalizeTemplateId(layoutId ?? section?.layout_template_id ?? section?.template_id ?? section?.template)
    ?? (section?.organizer_type ? 'generic_graphic_organizer' : 'worksheet_template_system')

  switch (normalized) {
    case 'worksheet_template_system':
      return buildTemplateSystem(pkg, section, fontFaceCSS, designCSS)
    case 'english_reading_response':
    case 'reading_response':
      return buildReadingResponse(pkg, section, fontFaceCSS, designCSS)
    case 'cross_curricular_cer':
    case 'cer_cross_curricular':
      return buildCer(pkg, section, fontFaceCSS, designCSS)
    case 'vocabulary_morphology':
    case 'vocabulary_and_morphology':
      return buildVocabularyMorphology(pkg, section, fontFaceCSS, designCSS)
    case 'careers_decision':
    case 'careers_decision_making':
      return buildCareersDecision(pkg, section, fontFaceCSS, designCSS)
    case 'literacy_word_study':
      return buildLiteracyWordStudy(pkg, section, fontFaceCSS, designCSS)
    case 'graphic_organizer_pack':
      return buildGraphicOrganizerPack(pkg, section, fontFaceCSS, designCSS)
    case 'exit_reflection':
    case 'exit_ticket_reflection':
      return buildExitReflection(pkg, section, fontFaceCSS, designCSS)
    case 'generic_graphic_organizer':
    default:
      return buildGenericGraphicOrganizer(pkg, section, fontFaceCSS, designCSS)
  }
}
