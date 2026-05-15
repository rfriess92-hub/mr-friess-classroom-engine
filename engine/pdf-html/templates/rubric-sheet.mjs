import { escapeHtml, formatPrompt } from './shared.mjs'

function orderedScaleEntries(scale) {
  if (!scale || typeof scale !== 'object') return []
  return Object.entries(scale.labels ?? {})
    .sort(([left], [right]) => Number(left) - Number(right))
    .filter(([, label]) => String(label ?? '').trim())
}

function buildLegend(scale) {
  const entries = orderedScaleEntries(scale)
  if (entries.length === 0) return ''

  return `
<div class="rubric-legend">
  <div class="section-kicker">Scale</div>
  <div class="rubric-legend-grid">
    ${entries.map(([score, label]) => `
      <div class="rubric-legend-item">
        <span class="rubric-legend-score">${escapeHtml(score)}</span>
        <span class="rubric-legend-label">${escapeHtml(label)}</span>
      </div>
    `).join('\n')}
  </div>
</div>`
}

function levelDescriptorForCriterion(criterion, score, label) {
  const byScore = criterion.level_descriptors ?? criterion.levels ?? criterion.scale_descriptors
  if (byScore && typeof byScore === 'object' && !Array.isArray(byScore)) {
    const exact = byScore[String(score)] ?? byScore[String(label)] ?? byScore[String(label).toLowerCase()]
    if (exact) return String(exact).trim()
  }

  if (Array.isArray(byScore)) {
    const found = byScore.find((entry) => {
      if (!entry || typeof entry !== 'object') return false
      return String(entry.score ?? '') === String(score) || String(entry.label ?? '').toLowerCase() === String(label).toLowerCase()
    })
    if (found?.descriptor) return String(found.descriptor).trim()
  }

  return ''
}

function buildRatingCell(criterion, score, label) {
  const descriptor = levelDescriptorForCriterion(criterion, score, label)
  if (!descriptor) return '<td class="rating-cell empty-rating-cell"></td>'

  return `<td class="rating-cell"><div class="rating-cell-label">${escapeHtml(label)}</div><div>${escapeHtml(descriptor)}</div></td>`
}

function buildMatrix(section, subjectTitle) {
  const entries = orderedScaleEntries(section.scale)
  const columns = entries.length > 0 ? entries : [['', 'Rating']]
  const useFilledDescriptors = (Array.isArray(section.criteria) ? section.criteria : []).some((criterion) => criterion.level_descriptors || criterion.levels || criterion.scale_descriptors)

  return `
<div class="rubric-block">
  <div class="rubric-block-title">${escapeHtml(subjectTitle)}</div>
  <table class="rubric-table ${useFilledDescriptors ? 'rubric-table-filled' : ''}">
    <thead>
      <tr>
        <th class="criterion-col">Criteria</th>
        <th class="descriptor-col">What to look for</th>
        ${columns.map(([score, label]) => `<th class="scale-col"><span>${escapeHtml(score)}</span><small>${escapeHtml(label)}</small></th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${(Array.isArray(section.criteria) ? section.criteria : []).map((criterion) => `
        <tr>
          <td class="criterion-name">${escapeHtml(criterion.name)}</td>
          <td class="criterion-descriptor">${escapeHtml(criterion.descriptor)}</td>
          ${columns.map(([score, label]) => buildRatingCell(criterion, score, label)).join('')}
        </tr>
      `).join('\n')}
    </tbody>
  </table>
</div>`
}

function buildCommentFields(section) {
  const fields = Array.isArray(section.comment_fields) ? section.comment_fields : []
  if (fields.length === 0) return ''

  return `
<div class="comment-group">
  <div class="section-kicker">Comments</div>
  ${fields.map((field) => `
    <div class="comment-box">
      <div class="comment-label">${escapeHtml(field)}</div>
      <div class="comment-lines"></div>
    </div>
  `).join('\n')}
</div>`
}

function buildTeacherMeta(section) {
  const meta = section.teacher_meta_rubric
  if (!meta || typeof meta !== 'object') return ''

  return `
<div class="teacher-meta">
  <div class="section-kicker">${escapeHtml(meta.title ?? 'Teacher check')}</div>
  <ul>
    ${(Array.isArray(meta.levels) ? meta.levels : []).map((level) => `
      <li><strong>${escapeHtml(level.label)}:</strong> ${escapeHtml(level.descriptor)}</li>
    `).join('\n')}
  </ul>
</div>`
}

function buildSuccessCriteria(section) {
  if (!Array.isArray(section.success_criteria) || section.success_criteria.length === 0) return ''
  return `
<div class="criteria-box">
  <div class="section-kicker">Before you hand it in</div>
  <ul>
    ${section.success_criteria.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

export function buildRubricSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const repeatCount = Math.max(1, Number(section.repeat_for_subjects ?? 1))
  const subjectLabel = String(section.subject_label ?? 'Presenter').trim() || 'Presenter'
  const repeatedBlocks = Array.from({ length: repeatCount }, (_, index) => buildMatrix(section, `${subjectLabel} ${index + 1}`)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

.rubric-intro {
  border: 1pt solid #D1D5DB;
  border-left: 4pt solid #111827;
  border-radius: 4pt;
  background: #F9FAFB;
  padding: 12pt 14pt;
  margin-bottom: 14pt;
}

.rubric-intro p + p {
  margin-top: 6pt;
}

.rubric-legend {
  margin-bottom: 14pt;
}

.rubric-legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92pt, 1fr));
  gap: 8pt;
}

.rubric-legend-item {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 8pt 10pt;
  background: #FFFFFF;
}

.rubric-legend-score {
  display: block;
  font-size: 14pt;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2pt;
}

.rubric-legend-label {
  font-size: 9pt;
  color: #374151;
  line-height: 1.35;
}

.rubric-block {
  margin-bottom: 16pt;
  page-break-inside: avoid;
}

.rubric-block-title {
  font-size: 10pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #374151;
  margin-bottom: 7pt;
}

.rubric-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.rubric-table th,
.rubric-table td {
  border: 1pt solid #D1D5DB;
  vertical-align: top;
  padding: 7pt 8pt;
}

.rubric-table th {
  background: #F3F4F6;
  color: #111827;
  font-size: 8.5pt;
  font-weight: 700;
}

.criterion-col { width: 18%; }
.descriptor-col { width: 22%; }
.scale-col { width: 15%; text-align: center; }
.scale-col small { display: block; margin-top: 2pt; font-size: 7pt; color: #6B7280; line-height: 1.25; }

.criterion-name {
  font-size: 9.25pt;
  font-weight: 700;
  color: #111827;
}

.criterion-descriptor {
  font-size: 8.5pt;
  line-height: 1.35;
  color: #374151;
}

.rating-cell {
  min-height: 44pt;
  font-size: 7.4pt;
  line-height: 1.28;
  color: #374151;
}

.empty-rating-cell {
  min-height: 28pt;
}

.rating-cell-label {
  font-size: 6.6pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6B7280;
  margin-bottom: 3pt;
}

.comment-group {
  margin-top: 6pt;
  display: grid;
  gap: 10pt;
}

.comment-box {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 8pt 10pt 10pt;
  page-break-inside: avoid;
}

.comment-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6B7280;
  margin-bottom: 6pt;
}

.comment-lines {
  min-height: 42pt;
  background-image: linear-gradient(to bottom, transparent 0, transparent 13pt, #E5E7EB 13pt, #E5E7EB 14pt);
  background-size: 100% 14pt;
}

.signature-line {
  margin-top: 14pt;
  display: flex;
  justify-content: flex-end;
}

.signature-slot {
  min-width: 190pt;
  border-bottom: 1pt solid #374151;
  padding-bottom: 3pt;
  font-size: 9pt;
  color: #374151;
}

.criteria-box,
.teacher-meta {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin-top: 14pt;
}

.criteria-box ul,
.teacher-meta ul {
  padding-left: 18pt;
}

.criteria-box li,
.teacher-meta li {
  margin-bottom: 4pt;
  color: #374151;
}

.criteria-box li:last-child,
.teacher-meta li:last-child {
  margin-bottom: 0;
}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess - ${escapeHtml(pkg.subject ?? 'Subject')} - Grade ${escapeHtml(String(pkg.grade ?? ''))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    <div class="doc-eyebrow">Rubric Sheet</div>
    <div class="doc-title">${escapeHtml(section.title ?? 'Rubric Sheet')}</div>

    ${section.purpose_line ? `<div class="rubric-intro">${formatPrompt(section.purpose_line)}</div>` : ''}
    ${buildLegend(section.scale)}
    ${repeatedBlocks}
    ${buildCommentFields(section)}
    ${section.include_signature_line ? '<div class="signature-line"><div class="signature-slot">Reviewer signature</div></div>' : ''}
    ${buildSuccessCriteria(section)}
    ${buildTeacherMeta(section)}
  </div>
</body>
</html>`
}
