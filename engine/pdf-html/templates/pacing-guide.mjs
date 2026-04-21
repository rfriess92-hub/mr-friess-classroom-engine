import { escapeHtml } from './shared.mjs'

// Pacing Guide — single-page teacher reference for a timed lesson block.
// Visual bar shows phase proportions at a glance; cards below give teacher/student moves.

function phaseColors(index, total) {
  if (index === 0)           return { bg: '#1E3A5F', text: '#FFFFFF', bar: '#1E3A5F' }
  if (index === total - 1)   return { bg: '#78350F', text: '#FFFFFF', bar: '#92400E' }
  const workPalette = ['#1E40AF', '#065F46', '#5B21B6', '#075985']
  const c = workPalette[(index - 1) % workPalette.length]
  return { bg: c, text: '#FFFFFF', bar: c }
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

function buildCard(phase, index, total) {
  const { bg, text } = phaseColors(index, total)
  const checkpoint = phase.checkpoint ?? null
  return `
<div class="pg-card">
  <div class="pg-card-head" style="background:${bg};color:${text}">
    <span class="pg-card-label">${escapeHtml(phase.label)}</span>
    <span class="pg-card-dur">${phase.duration_min ?? 0} min</span>
  </div>
  <div class="pg-card-body">
    <div class="pg-move">
      <span class="pg-move-role">Teacher</span>
      <span class="pg-move-text">${escapeHtml(phase.teacher_move ?? '')}</span>
    </div>
    <div class="pg-move">
      <span class="pg-move-role">Students</span>
      <span class="pg-move-text">${escapeHtml(phase.student_move ?? '')}</span>
    </div>
    ${checkpoint ? `<div class="pg-checkpoint"><span class="pg-check-icon">✓</span>${escapeHtml(checkpoint)}</div>` : ''}
  </div>
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
  height: 30pt;
  border-radius: 4pt;
  overflow: hidden;
  margin-bottom: 16pt;
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

.pg-cards { display: flex; flex-direction: column; gap: 7pt; }

.pg-card {
  border: 1pt solid #E5E7EB;
  border-radius: 4pt;
  overflow: hidden;
  page-break-inside: avoid;
}
.pg-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5pt 11pt;
}
.pg-card-label { font-size: 10pt; font-weight: 700; }
.pg-card-dur   { font-size: 9pt; font-weight: 600; opacity: 0.85; }

.pg-card-body { padding: 9pt 11pt; display: flex; flex-direction: column; gap: 6pt; }

.pg-move { display: flex; gap: 9pt; align-items: flex-start; }
.pg-move-role {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6B7280;
  white-space: nowrap;
  width: 46pt;
  flex-shrink: 0;
  padding-top: 2pt;
}
.pg-move-text { font-size: 10pt; color: #111827; line-height: 1.4; flex: 1; }

.pg-checkpoint {
  background: #F0FDF4;
  border-left: 3pt solid #16A34A;
  padding: 5pt 9pt;
  font-size: 9pt;
  color: #15803D;
  border-radius: 0 3pt 3pt 0;
  display: flex;
  align-items: center;
  gap: 7pt;
}
.pg-check-icon { font-weight: 700; flex-shrink: 0; }

.pg-buffer {
  margin-top: 13pt;
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

  <div class="pg-cards">
    ${phases.map((p, i) => buildCard(p, i, phases.length)).join('\n')}
  </div>

  ${bufferNote ? `<div class="pg-buffer"><strong>If behind:</strong>${escapeHtml(bufferNote)}</div>` : ''}
</body>
</html>`
}
