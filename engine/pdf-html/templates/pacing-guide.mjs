import { escapeHtml } from './shared.mjs'

// Pacing Guide — single-page teacher agenda showing phase sequence and timing.
// Timing bar gives proportional overview; rows below are a scannable lesson plan.

function phaseColors(index, total) {
  if (index === 0)           return { bar: '#1E3A5F', accent: '#1E3A5F' }
  if (index === total - 1)   return { bar: '#92400E', accent: '#78350F' }
  const palette = ['#1E40AF', '#065F46', '#5B21B6', '#075985']
  const c = palette[(index - 1) % palette.length]
  return { bar: c, accent: c }
}

function buildBar(phases) {
  const total = phases.reduce((s, p) => s + (p.duration_min ?? 0), 0)
  return phases.map((phase, i) => {
    const pct = total > 0 ? ((phase.duration_min ?? 0) / total * 100).toFixed(1) : 0
    const { bar } = phaseColors(i, phases.length)
    return `<div class="pg-bar-seg" style="width:${pct}%;background:${bar}">
  <span class="pg-bar-name">${escapeHtml(phase.label)}</span>
  <span class="pg-bar-time">${phase.duration_min ?? 0}m</span>
</div>`
  }).join('')
}

function buildRow(phase, index, total) {
  const { accent } = phaseColors(index, total)
  const activity = phase.teacher_move ?? ''
  const studentNote = phase.student_move ?? ''
  const checkpoint = phase.checkpoint ?? null

  return `
<div class="pg-row" style="border-left-color:${accent}">
  <div class="pg-row-head">
    <span class="pg-phase-name">${escapeHtml(phase.label)}</span>
    <span class="pg-phase-dur">${phase.duration_min ?? 0} min</span>
  </div>
  ${activity ? `<div class="pg-activity">${escapeHtml(activity)}</div>` : ''}
  ${studentNote ? `<div class="pg-student-note">${escapeHtml(studentNote)}</div>` : ''}
  ${checkpoint ? `<div class="pg-checkpoint"><span class="pg-check-icon">✓</span>${escapeHtml(checkpoint)}</div>` : ''}
</div>`
}

export function buildPacingGuideHTML(pkg, section, fontFaceCSS, designCSS) {
  const phases = Array.isArray(section.phases) ? section.phases : []
  const bufferNote = section.buffer_note ?? null
  const totalMin = phases.reduce((s, p) => s + (p.duration_min ?? 0), 0)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.45in 0.60in; }

.pg-masthead {
  background: #111827;
  color: #F9FAFB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10pt 0.60in;
  margin: -0.45in -0.60in 18pt;
}
.pg-masthead-left { font-size: 10pt; font-weight: 700; }
.pg-masthead-right { font-size: 8.5pt; color: #9CA3AF; text-align: right; }

.pg-title { font-size: 19pt; font-weight: 700; color: #111827; margin-bottom: 3pt; }
.pg-meta  { font-size: 9pt; color: #6B7280; margin-bottom: 14pt; }

.pg-bar {
  display: flex;
  width: 100%;
  height: 28pt;
  border-radius: 4pt;
  overflow: hidden;
  margin-bottom: 18pt;
  gap: 2pt;
}
.pg-bar-seg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
}
.pg-bar-name {
  font-size: 7pt;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 4pt;
}
.pg-bar-time { font-size: 6pt; color: rgba(255,255,255,0.72); }

.pg-rows { display: flex; flex-direction: column; gap: 0; }

.pg-row {
  border-left: 4pt solid #E5E7EB;
  padding: 9pt 0 9pt 14pt;
  border-bottom: 0.75pt solid #F3F4F6;
  page-break-inside: avoid;
}
.pg-row:last-child { border-bottom: none; }

.pg-row-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4pt;
}

.pg-phase-name {
  font-size: 11pt;
  font-weight: 700;
  color: #111827;
}

.pg-phase-dur {
  font-size: 9pt;
  font-weight: 700;
  color: #6B7280;
  white-space: nowrap;
  padding-left: 12pt;
}

.pg-activity {
  font-size: 10pt;
  color: #1F2937;
  line-height: 1.45;
}

.pg-student-note {
  font-size: 8.5pt;
  color: #9CA3AF;
  line-height: 1.4;
  margin-top: 3pt;
  font-style: italic;
}

.pg-checkpoint {
  margin-top: 5pt;
  display: flex;
  align-items: center;
  gap: 6pt;
  font-size: 8.5pt;
  color: #15803D;
  font-weight: 600;
}
.pg-check-icon { flex-shrink: 0; }

.pg-buffer {
  margin-top: 16pt;
  background: #FEF3C7;
  border-left: 3pt solid #D97706;
  padding: 6pt 11pt;
  font-size: 9pt;
  color: #92400E;
  border-radius: 0 3pt 3pt 0;
}
.pg-buffer strong { font-weight: 700; margin-right: 4pt; }
  </style>
</head>
<body>
  <div class="pg-masthead">
    <span class="pg-masthead-left">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? '')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? ''))}</span>
    <span class="pg-masthead-right">Pacing Guide &nbsp;·&nbsp; ${totalMin} min total</span>
  </div>

  <div class="pg-title">${escapeHtml(pkg.topic ?? 'Lesson')}</div>
  <div class="pg-meta">${phases.length} phase${phases.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ${totalMin} minutes</div>

  <div class="pg-bar">${buildBar(phases)}</div>

  <div class="pg-rows">
    ${phases.map((p, i) => buildRow(p, i, phases.length)).join('\n')}
  </div>

  ${bufferNote ? `<div class="pg-buffer"><strong>If behind:</strong> ${escapeHtml(bufferNote)}</div>` : ''}
</body>
</html>`
}
