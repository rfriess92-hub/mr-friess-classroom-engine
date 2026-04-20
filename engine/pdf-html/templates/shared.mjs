import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dir, '..', '..', '..')

// Fillers loaded from fillers.json — edit that file to add/change riddles.
// Riddles only: no attributed quotes avoids misattribution risk.
const PAGE_FILLERS = JSON.parse(
  readFileSync(resolve(__dir, '..', 'fillers.json'), 'utf-8')
)

export function buildPageFiller(dayLabel) {
  if (!dayLabel) return ''
  const index = [...dayLabel].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % PAGE_FILLERS.length
  const filler = PAGE_FILLERS[index]

  return `
<div class="page-filler">
  <div class="filler-rule"></div>
  <span class="filler-riddle-label">${escapeHtml(filler.prompt)}</span>
  <span class="filler-riddle-text">${escapeHtml(filler.text)}</span>
  <span class="filler-riddle-answer">${escapeHtml(filler.answer)}</span>
</div>`
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatPrompt(text) {
  const paragraphs = String(text ?? '').split(/\n{2,}/)
  return paragraphs
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

function loadWoff2Base64(weight) {
  const path = resolve(repoRoot, 'node_modules', '@fontsource', 'lexend', 'files', `lexend-latin-${weight}-normal.woff2`)
  if (!existsSync(path)) {
    throw new Error(
      `Lexend font file not found at ${path}.\n` +
      'Run: pnpm install && npx playwright install chromium'
    )
  }
  return readFileSync(path).toString('base64')
}

export function buildFontFaceCSS() {
  return [400, 600, 700]
    .map(w => {
      const b64 = loadWoff2Base64(w)
      return `@font-face { font-family: 'Lexend'; font-weight: ${w}; src: url('data:font/woff2;base64,${b64}') format('woff2'); }`
    })
    .join('\n')
}

export function buildDesignSystemCSS() {
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Lexend', system-ui, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #111827;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@page {
  size: letter;
  margin: 0.5in 0.65in;
}

p { margin: 0; }
p + p { margin-top: 5pt; }

/* ── Page structure ── */

.page-wrap {
  padding-bottom: 0;
}

/* ── Masthead — stretches edge-to-edge by compensating for @page margin ── */

.masthead {
  background: #E5E7EB;
  color: #111827;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10pt 0.65in;
  margin: -0.5in -0.65in 18pt;
}

.masthead-school {
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.masthead-right {
  font-size: 8.5pt;
  font-weight: 400;
  color: #374151;
  text-align: right;
}

/* ── Doc identity ── */

.doc-title {
  font-size: 26pt;
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
  margin-bottom: 6pt;
}

.doc-subtitle {
  font-size: 10pt;
  color: #6B7280;
  margin-bottom: 16pt;
}

/* ── Name / date row ── */

.name-date-row {
  display: flex;
  gap: 20pt;
  font-size: 10pt;
  color: #374151;
  margin-bottom: 24pt;
  padding-bottom: 2pt;
}

.name-slot {
  flex: 2;
  display: flex;
  align-items: flex-end;
  gap: 6pt;
  border-bottom: 1.5pt solid #374151;
  padding-bottom: 3pt;
}

.date-slot {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 6pt;
  border-bottom: 1.5pt solid #374151;
  padding-bottom: 3pt;
}

.slot-label {
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Day section headers ── */

.day-section-header {
  background: #E5E7EB;
  color: #111827;
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 5pt 12pt;
  border-radius: 4pt;
  margin: 26pt 0 16pt;
  page-break-after: avoid;
}

.day-section-header.first {
  margin-top: 0;
}

/* ── Task blocks ── */

.task-header-block {
  margin-bottom: 6pt;
}

.task-label-row {
  margin-bottom: 8pt;
  page-break-after: avoid;
}

.task-badge {
  display: inline-block;
  border: 1.5pt solid #111827;
  color: #111827;
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3pt 10pt;
  border-radius: 3pt;
}

.task-instruction {
  border-left: 4pt solid #111827;
  background: #F3F4F6;
  padding: 10pt 14pt;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1F2937;
}

/* ── Response area ── */

.response-area {
  margin-top: 6pt;
  margin-bottom: 22pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 2pt 10pt 6pt;
}

.response-line {
  height: 9.5mm;
  border-bottom: 1pt solid #D1D5DB;
}

.response-line:last-child {
  border-bottom: none;
}

/* ── Page filler — quote or riddle in remaining whitespace ── */

.page-filler {
  margin-top: 28pt;
  padding-top: 12pt;
  color: #9CA3AF;
  font-size: 9pt;
  page-break-inside: avoid;
}

.filler-rule {
  border-top: 1pt dashed #D1D5DB;
  margin-bottom: 10pt;
}

.filler-quote {
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 3pt;
}

.filler-attribution {
  font-weight: 600;
  font-size: 8.5pt;
}

.filler-riddle-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 8pt;
  margin-right: 6pt;
}

.filler-riddle-text {
  font-style: italic;
}

.filler-riddle-answer {
  display: block;
  margin-top: 4pt;
  font-size: 8.5pt;
  color: #D1D5DB;
}
`
}
