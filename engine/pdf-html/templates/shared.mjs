import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dir, '..', '..', '..')

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatPrompt(text) {
  const paragraphs = String(text ?? '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return ''

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

function loadWoff2Base64(weight) {
  const path = resolve(repoRoot, 'node_modules', '@fontsource', 'lexend', 'files', `lexend-latin-${weight}-normal.woff2`)
  if (!existsSync(path)) {
    throw new Error(
      `Lexend font file not found at ${path}.\n`
      + 'Run: pnpm install && pnpm run fonts:install',
    )
  }
  return readFileSync(path).toString('base64')
}

export function buildFontFaceCSS() {
  return [400, 600, 700]
    .map((weight) => {
      const base64 = loadWoff2Base64(weight)
      return `@font-face { font-family: 'Lexend'; font-style: normal; font-weight: ${weight}; src: url('data:font/woff2;base64,${base64}') format('woff2'); }`
    })
    .join('\n')
}

export function buildOptionalExtension(extension) {
  if (!extension || typeof extension !== 'object') return ''

  const label = String(extension.label ?? '').trim()
  const body = String(extension.body ?? '').trim()
  if (!label || !body) return ''

  return `
<div class="page-extension">
  <div class="page-extension-rule"></div>
  <div class="page-extension-label">${escapeHtml(label)}</div>
  <div class="page-extension-body">${escapeHtml(body)}</div>
</div>`
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
ul, ol { margin: 0; padding-left: 18pt; }

.page-wrap {
  padding-bottom: 0;
}

.masthead {
  background: #E5E7EB;
  color: #111827;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14pt;
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

.name-date-row {
  display: flex;
  gap: 20pt;
  font-size: 10pt;
  color: #374151;
  margin-bottom: 22pt;
  padding-bottom: 2pt;
}

.name-slot,
.date-slot {
  display: flex;
  align-items: flex-end;
  gap: 6pt;
  border-bottom: 1.5pt solid #374151;
  padding-bottom: 3pt;
}

.name-slot {
  flex: 2;
}

.date-slot {
  flex: 1;
}

.slot-label {
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.doc-eyebrow {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6B7280;
  margin-bottom: 5pt;
}

.doc-title {
  font-size: 24pt;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  margin-bottom: 8pt;
}

.doc-subtitle,
.purpose-line {
  font-size: 10.5pt;
  color: #374151;
  line-height: 1.55;
  margin-bottom: 14pt;
}

.day-section-header {
  background: #E5E7EB;
  color: #111827;
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 5pt 12pt;
  border-radius: 4pt;
  margin: 24pt 0 14pt;
  page-break-after: avoid;
}

.day-section-header.first {
  margin-top: 0;
}

.instruction-list,
.support-list,
.criteria-list,
.anchor-list {
  margin-bottom: 16pt;
  border: 1pt solid #D1D5DB;
  border-radius: 5pt;
  padding: 10pt 12pt 10pt 18pt;
}

.instruction-list {
  background: #F9FAFB;
}

.support-list,
.criteria-list {
  background: #FFFFFF;
}

.section-kicker {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 7pt;
}

.instruction-list li,
.support-list li,
.criteria-list li,
.anchor-list li {
  margin-bottom: 4pt;
  color: #374151;
}

.instruction-list li:last-child,
.support-list li:last-child,
.criteria-list li:last-child,
.anchor-list li:last-child {
  margin-bottom: 0;
}

.page-extension {
  margin-top: 28pt;
  padding-top: 12pt;
  font-size: 9.25pt;
  page-break-inside: avoid;
}

.page-extension-rule {
  border-top: 1pt dashed #D1D5DB;
  margin-bottom: 10pt;
}

.page-extension-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 8pt;
  color: #6B7280;
  margin-bottom: 5pt;
}

.page-extension-body {
  color: #4B5563;
  line-height: 1.45;
}
`
}
