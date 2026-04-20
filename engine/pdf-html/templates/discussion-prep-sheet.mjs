import { escapeHtml, formatPrompt } from './shared.mjs'

// Discussion prep sheet — structured for position + evidence thinking.
// Distinct from task_sheet: no response lines, uses labelled boxes instead.
// Three-section stacked layout: position → evidence → counterargument.
// Students write inside bordered boxes rather than on blank lines.

function buildLabelledBox(label, subLabel, minHeight, hint) {
  return `
<div class="prep-box">
  <div class="prep-box-header">
    <span class="prep-box-label">${escapeHtml(label)}</span>
    ${subLabel ? `<span class="prep-box-sub">${escapeHtml(subLabel)}</span>` : ''}
  </div>
  ${hint ? `<div class="prep-box-hint">${escapeHtml(hint)}</div>` : ''}
  <div class="prep-box-inner" style="min-height: ${minHeight}"></div>
</div>`
}

export function buildDiscussionPrepSheetHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Discussion Prep'
  const discussionPrompt = section.discussion_prompt ?? ''
  const positionLabel = section.position_label ?? 'My position is...'
  const evidenceLabel = section.evidence_label ?? 'Evidence and reasoning'
  const counterLabel = section.counter_label ?? 'The other side might say...'
  const positionHint = section.position_hint ?? null
  const evidenceHint = section.evidence_hint ?? 'Use specific details, examples, or data.'
  const counterHint = section.counter_hint ?? 'How would you respond to that?'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

/* ── Discussion prep extras ── */

.doc-title {
  font-size: 22pt;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
  margin-bottom: 4pt;
}

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
  gap: 14pt;
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
  display: flex;
  align-items: baseline;
  gap: 10pt;
}

.prep-box-label {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #111827;
}

.prep-box-sub {
  font-size: 9pt;
  font-weight: 400;
  color: #6B7280;
  font-style: italic;
}

.prep-box-hint {
  font-size: 9pt;
  color: #6B7280;
  padding: 5pt 12pt 0;
  font-style: italic;
}

.prep-box-inner {
  min-height: inherit;
}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? 'Career Education')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? '8'))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap">
    <div class="name-date-row">
      <span class="name-slot"><span class="slot-label">Name:</span></span>
      <span class="date-slot"><span class="slot-label">Date:</span></span>
    </div>

    <div class="doc-title">${escapeHtml(title)}</div>

    <div class="discussion-question-box">
      <div class="discussion-question-kicker">Discussion question</div>
      <div class="discussion-question-text">${formatPrompt(discussionPrompt)}</div>
    </div>

    <div class="prep-stack">
      ${buildLabelledBox(positionLabel, 'Complete the sentence', '70pt', positionHint)}
      ${buildLabelledBox(evidenceLabel, '2–3 strong points', '130pt', evidenceHint)}
      ${buildLabelledBox(counterLabel, 'Steelman the other side', '90pt', counterHint)}
    </div>
  </div>
</body>
</html>`
}
