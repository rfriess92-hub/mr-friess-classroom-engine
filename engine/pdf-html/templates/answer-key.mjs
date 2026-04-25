import { escapeHtml } from './shared.mjs'

function buildVariants(entry) {
  if (!Array.isArray(entry.acceptable_variants) || entry.acceptable_variants.length === 0) return '—'
  return escapeHtml(entry.acceptable_variants.join(', '))
}

function buildScoringGuidance(section) {
  if (!Array.isArray(section.scoring_guidance) || section.scoring_guidance.length === 0) return ''
  return `
<div class="answer-key-guidance">
  <div class="section-kicker">Scoring guidance</div>
  <ul>
    ${section.scoring_guidance.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

export function buildAnswerKeyHTML(pkg, section, fontFaceCSS, designCSS) {
  const entries = Array.isArray(section.entries) ? section.entries : []

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.5in 0.55in; }

.teacher-masthead {
  background: #111827;
  color: #F9FAFB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10pt 0.55in;
  margin: -0.5in -0.55in 18pt;
}

.teacher-masthead-left {
  font-size: 9.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.teacher-masthead-right {
  font-size: 8.5pt;
  color: #D1D5DB;
}

.answer-key-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 14pt;
}

.answer-key-table th,
.answer-key-table td {
  border: 1pt solid #D1D5DB;
  vertical-align: top;
  padding: 8pt 9pt;
}

.answer-key-table th {
  background: #F3F4F6;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4B5563;
}

.answer-key-table td {
  font-size: 9pt;
  line-height: 1.45;
  color: #111827;
}

.artifact-col { width: 16%; }
.expected-col { width: 28%; }
.variants-col { width: 23%; }
.note-col { width: 33%; }

.answer-key-guidance {
  margin-top: 16pt;
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  background: #F9FAFB;
}

.answer-key-guidance ul {
  padding-left: 18pt;
}

.answer-key-guidance li {
  margin-bottom: 4pt;
  color: #374151;
}

.answer-key-guidance li:last-child {
  margin-bottom: 0;
}
  </style>
</head>
<body>
  <div class="teacher-masthead">
    <span class="teacher-masthead-left">Teacher Reference</span>
    <span class="teacher-masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="doc-eyebrow">Answer Key</div>
    <div class="doc-title">${escapeHtml(section.title ?? 'Answer Key')}</div>
    <div class="purpose-line">Use this answer key as a quick scoring and facilitation reference.</div>

    <table class="answer-key-table">
      <thead>
        <tr>
          <th class="artifact-col">Artifact</th>
          <th class="expected-col">Expected answer</th>
          <th class="variants-col">Acceptable variants</th>
          <th class="note-col">Teacher note</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry) => `
          <tr>
            <td>${escapeHtml(entry.artifact_ref ?? '')}</td>
            <td>${escapeHtml(entry.expected_answer ?? '')}</td>
            <td>${buildVariants(entry)}</td>
            <td>${escapeHtml(entry.teacher_note ?? '—')}</td>
          </tr>
        `).join('\n')}
      </tbody>
    </table>

    ${buildScoringGuidance(section)}
  </div>
</body>
</html>`
}
