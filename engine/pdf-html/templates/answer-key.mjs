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

function cleanText(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function buildQuestionScoreGrid(count) {
  const questionCount = Math.max(1, count)
  const headers = Array.from({ length: questionCount }, (_, index) => `<th>Q${index + 1}</th>`).join('')
  const rows = Array.from({ length: 8 }, () => `
    <tr><td></td>${Array.from({ length: questionCount }, () => '<td></td>').join('')}<td></td></tr>
  `).join('\n')
  return `
    <section class="score-grid-wrap">
      <h2>Class score recording grid</h2>
      <table class="score-grid"><thead><tr><th>Student</th>${headers}<th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    </section>`
}

function buildAssessmentMarkingGuideHTML(pkg, section, fontFaceCSS, designCSS) {
  const questions = Array.isArray(section.questions) ? section.questions : []
  const totalPoints = typeof section.total_points === 'number'
    ? section.total_points
    : questions.reduce((sum, question) => sum + (typeof question.point_value === 'number' ? question.point_value : 0), 0)
  const teacherNotes = Array.isArray(section.teacher_notes)
    ? section.teacher_notes
    : cleanText(section.teacher_notes)
      ? [cleanText(section.teacher_notes)]
      : ['Use this teacher-only marking guide as the scoring reference.']

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
@page { size: letter; margin: 0.55in; }
body { color:#111827; font-family: Lexend, Arial, sans-serif; font-size:10pt; line-height:1.38; }
.mg-header { border-bottom:2pt solid #111827; padding-bottom:9pt; margin-bottom:12pt; }
.mg-kicker { font-size:8.5pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
.mg-header h1 { font-size:18pt; margin:4pt 0; }
.mg-header p { margin:0; color:#4B5563; }
.mg-summary { display:grid; grid-template-columns:1fr 1fr 1fr; border:1pt solid #111827; margin-bottom:11pt; }
.mg-summary div { padding:7pt 8pt; border-right:1pt solid #111827; }
.mg-summary div:last-child { border-right:0; }
.mg-summary b { display:block; font-size:8pt; text-transform:uppercase; color:#4B5563; }
.mg-notes { border:1pt solid #D1D5DB; background:#F9FAFB; padding:8pt 10pt; margin-bottom:12pt; }
.mg-notes ul { margin:4pt 0 0 16pt; padding:0; }
.mg-question { border:1pt solid #D1D5DB; margin-bottom:9pt; page-break-inside:avoid; }
.mg-question-head { display:flex; justify-content:space-between; background:#F3F4F6; border-bottom:1pt solid #D1D5DB; padding:6pt 8pt; font-weight:700; }
.mg-prompt { padding:8pt 9pt 4pt; margin:0; font-weight:700; }
.mg-answer, .mg-note { padding:6pt 9pt; border-top:1pt solid #E5E7EB; }
.score-grid-wrap { margin-top:14pt; page-break-inside:avoid; }
.score-grid-wrap h2 { font-size:10pt; text-transform:uppercase; letter-spacing:.08em; color:#4B5563; }
.score-grid { width:100%; border-collapse:collapse; table-layout:fixed; }
.score-grid th, .score-grid td { border:1pt solid #D1D5DB; height:22pt; padding:4pt; }
.score-grid th { background:#F3F4F6; font-size:8pt; }
.score-grid th:first-child, .score-grid td:first-child { width:28%; }
.score-grid th:last-child, .score-grid td:last-child { width:14%; }
  </style>
</head>
<body>
  <main>
    <header class="mg-header">
      <div class="mg-kicker">Marking Guide — Teacher Only</div>
      <h1>${escapeHtml(cleanText(section.title, 'Assessment Marking Guide'))}</h1>
      <p>${escapeHtml(cleanText(pkg.subject, 'Class'))} · ${escapeHtml(cleanText(pkg.topic, 'Assessment'))}</p>
    </header>

    <section class="mg-summary">
      <div><b>Total marks</b><span>____ / ${escapeHtml(String(totalPoints || '—'))}</span></div>
      <div><b>Time</b><span>${section.time_limit_min ? `${escapeHtml(String(section.time_limit_min))} min` : '—'}</span></div>
      <div><b>Questions</b><span>${questions.length}</span></div>
    </section>

    <section class="mg-notes">
      <b>Teacher notes</b>
      <ul>${teacherNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
    </section>

    ${questions.map((question, index) => `
      <article class="mg-question">
        <div class="mg-question-head"><span>Q${index + 1}</span><span>${typeof question.point_value === 'number' ? `${question.point_value} mark${question.point_value === 1 ? '' : 's'}` : 'marks —'}</span></div>
        <p class="mg-prompt">${escapeHtml(cleanText(question.q_text, 'Question'))}</p>
        <div class="mg-answer"><b>Answer:</b> ${escapeHtml(cleanText(question.answer_key, '—'))}</div>
        <div class="mg-note"><b>Marking notes:</b> ${escapeHtml(cleanText(question.marking_notes, '—'))}</div>
      </article>
    `).join('\n')}

    ${buildQuestionScoreGrid(questions.length)}
  </main>
</body>
</html>`
}

function buildGenericAnswerKeyHTML(pkg, section, fontFaceCSS, designCSS) {
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

export function buildAnswerKeyHTML(pkg, section, fontFaceCSS, designCSS) {
  if (Array.isArray(section?.questions)) {
    return buildAssessmentMarkingGuideHTML(pkg, section, fontFaceCSS, designCSS)
  }
  return buildGenericAnswerKeyHTML(pkg, section, fontFaceCSS, designCSS)
}
