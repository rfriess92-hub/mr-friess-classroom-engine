import { escapeHtml, formatPrompt } from './shared.mjs'

function buildBox(label, hint, minHeight) {
  return `
<div class="prep-box">
  <div class="prep-box-header">${escapeHtml(label)}</div>
  ${hint ? `<div class="prep-box-hint">${escapeHtml(hint)}</div>` : ''}
  <div class="prep-box-inner" style="min-height: ${minHeight}pt;"></div>
</div>`
}

function buildEvidenceBoxes(count) {
  return Array.from({ length: count }, (_, index) =>
    buildBox(`Evidence ${index + 1}`, 'Use a specific detail, example, or reason.', 78),
  ).join('\n')
}

function buildSuccessCriteria(items) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return `
<div class="criteria-box">
  <div class="section-kicker">Before the discussion</div>
  <ul>
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

export function buildDiscussionPrepSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Discussion Prep Sheet'
  const positionLabel = section.position_label ?? 'My position'
  const evidenceCount = Math.max(1, Math.min(4, section.evidence_count ?? 2))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

.discussion-question-box {
  border: 1.5pt solid #D1D5DB;
  border-left: 5pt solid #111827;
  border-radius: 4pt;
  background: #F9FAFB;
  padding: 12pt 16pt;
  margin-bottom: 18pt;
}

.discussion-question-kicker {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6B7280;
  margin-bottom: 7pt;
}

.discussion-question-text {
  font-size: 12pt;
  font-weight: 600;
  line-height: 1.45;
  color: #111827;
}

.prep-stack {
  display: flex;
  flex-direction: column;
  gap: 12pt;
}

.prep-box {
  border: 1.5pt solid #D1D5DB;
  border-radius: 5pt;
  overflow: hidden;
  page-break-inside: avoid;
}

.prep-box-header {
  background: #E5E7EB;
  padding: 6pt 12pt;
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #111827;
}

.prep-box-hint {
  font-size: 9pt;
  color: #6B7280;
  padding: 6pt 12pt 0;
  font-style: italic;
}

.prep-box-inner {
  min-height: inherit;
}

.criteria-box {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  padding: 10pt 12pt;
  margin-top: 16pt;
}

.criteria-box ul {
  padding-left: 18pt;
}

.criteria-box li {
  margin-bottom: 4pt;
  color: #374151;
}

.criteria-box li:last-child {
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

    <div class="doc-eyebrow">Discussion Prep Sheet</div>
    <div class="doc-title">${escapeHtml(title)}</div>

    <div class="discussion-question-box">
      <div class="discussion-question-kicker">Discussion question</div>
      <div class="discussion-question-text">${formatPrompt(section.discussion_prompt ?? '')}</div>
    </div>

    <div class="prep-stack">
      ${buildBox(positionLabel, 'Write the clearest version of your position.', 72)}
      ${buildEvidenceBoxes(evidenceCount)}
      ${section.include_question ? buildBox('Question to bring', 'Write one real question you still want to ask.', 62) : ''}
      ${section.include_counterargument ? buildBox('Counterargument or other side', 'Show what the other side might say before you respond.', 78) : ''}
    </div>

    ${buildSuccessCriteria(section.success_criteria)}
  </div>
</body>
</html>`
}
