import { escapeHtml } from './shared.mjs'

// Weekly Overview — cross-package teacher reference showing a full week at a glance.
// One card per day: topic, timing bar, learning goals, materials, evidence type.

const DAY_COLORS = ['#1E3A5F', '#1E40AF', '#065F46', '#5B21B6', '#075985']

function dayColor(index) {
  return DAY_COLORS[index % DAY_COLORS.length]
}

function buildTimingBar(phases) {
  if (!Array.isArray(phases) || phases.length === 0) return ''
  const total = phases.reduce((s, p) => s + (p.duration_min ?? 0), 0)
  if (total === 0) return ''

  const segments = phases.map((phase, i) => {
    const pct = ((phase.duration_min ?? 0) / total * 100).toFixed(1)
    const color = DAY_COLORS[i % DAY_COLORS.length]
    return `<div class="wo-bar-seg" style="width:${pct}%;background:${color}" title="${escapeHtml(phase.label)} (${phase.duration_min}m)">
      <span class="wo-bar-label">${escapeHtml(phase.label)}</span>
    </div>`
  }).join('')

  return `<div class="wo-bar">${segments}</div>`
}

function buildArtifactBadges(declaredOutputs) {
  const BADGE_LABELS = {
    slides: 'Slides',
    worksheet: 'Worksheet',
    task_sheet: 'Task Sheet',
    exit_ticket: 'Exit Ticket',
    final_response_sheet: 'Final Response',
    checkpoint_sheet: 'Checkpoint',
    graphic_organizer: 'Organizer',
    discussion_prep_sheet: 'Discussion Prep',
  }
  const EVIDENCE_TYPES = new Set(['exit_ticket', 'checkpoint_sheet', 'final_response_sheet'])

  const badges = []
  for (const type of (declaredOutputs ?? [])) {
    const label = BADGE_LABELS[type]
    if (!label) continue
    const isEvidence = EVIDENCE_TYPES.has(type)
    badges.push(`<span class="wo-badge${isEvidence ? ' wo-badge-evidence' : ''}">${label}</span>`)
  }
  return badges.join('')
}

function buildDayCard(summary, index) {
  const color = dayColor(index)
  const goals = Array.isArray(summary.learning_goals) ? summary.learning_goals.slice(0, 3) : []
  const materials = Array.isArray(summary.materials) ? summary.materials : []
  const totalMin = Array.isArray(summary.phases)
    ? summary.phases.reduce((s, p) => s + (p.duration_min ?? 0), 0)
    : 0
  const timingBar = buildTimingBar(summary.phases)
  const badges = buildArtifactBadges(summary.declared_outputs)

  return `
<div class="wo-day-card">
  <div class="wo-day-head" style="background:${color}">
    <div class="wo-day-ident">
      <span class="wo-day-num">Day ${index + 1}</span>
      <span class="wo-day-topic">${escapeHtml(summary.topic ?? 'Lesson')}</span>
    </div>
    ${totalMin > 0 ? `<span class="wo-day-min">${totalMin} min</span>` : ''}
  </div>

  ${timingBar ? `<div class="wo-timing">${timingBar}</div>` : ''}

  <div class="wo-day-body">
    ${goals.length > 0 ? `
    <div class="wo-section">
      <div class="wo-section-label">Learning goals</div>
      <ul class="wo-goals">
        ${goals.map((g) => `<li>${escapeHtml(g)}</li>`).join('\n')}
      </ul>
    </div>` : ''}

    ${materials.length > 0 ? `
    <div class="wo-section">
      <div class="wo-section-label">Materials</div>
      <div class="wo-materials">${escapeHtml(materials.join(' · '))}</div>
    </div>` : ''}

    ${badges ? `<div class="wo-badges">${badges}</div>` : ''}
  </div>
</div>`
}

function buildMasterMaterialsList(summaries) {
  const seen = new Set()
  const all = []
  for (const summary of summaries) {
    for (const m of (summary.materials ?? [])) {
      const key = m.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        all.push(m)
      }
    }
  }
  if (all.length === 0) return ''
  return `
<div class="wo-footer-section">
  <div class="wo-footer-label">Materials needed this week</div>
  <div class="wo-footer-text">${escapeHtml(all.join(' · '))}</div>
</div>`
}

function buildStandardsFooter(summaries) {
  const seen = new Set()
  const all = []
  for (const summary of summaries) {
    for (const s of (summary.standards ?? [])) {
      if (!seen.has(s)) { seen.add(s); all.push(s) }
    }
  }
  if (all.length === 0) return ''
  return `
<div class="wo-footer-section">
  <div class="wo-footer-label">Standards this week</div>
  <div class="wo-footer-text">${escapeHtml(all.join(' · '))}</div>
</div>`
}

export function buildWeeklyOverviewHTML(summaries, weekLabel, fontFaceCSS, designCSS) {
  const firstSummary = summaries[0] ?? {}
  const subject = firstSummary.subject ?? 'Subject'
  const grade = firstSummary.grade != null ? `Grade ${firstSummary.grade}` : ''
  const headerRight = [subject, grade].filter(Boolean).join(' · ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.45in 0.55in; }

.wo-masthead {
  background: #111827;
  color: #F9FAFB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10pt 0.55in;
  margin: -0.45in -0.55in 16pt;
}
.wo-masthead-left { font-size: 10pt; font-weight: 700; }
.wo-masthead-right { font-size: 8.5pt; color: #9CA3AF; text-align: right; }

.wo-days { display: flex; flex-direction: column; gap: 8pt; }

.wo-day-card {
  border: 1pt solid #E5E7EB;
  border-radius: 5pt;
  overflow: hidden;
  page-break-inside: avoid;
}

.wo-day-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7pt 12pt;
  color: #FFFFFF;
}
.wo-day-ident { display: flex; align-items: baseline; gap: 10pt; flex: 1; min-width: 0; }
.wo-day-num {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.8;
  white-space: nowrap;
  flex-shrink: 0;
}
.wo-day-topic { font-size: 12pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wo-day-min { font-size: 8.5pt; opacity: 0.75; white-space: nowrap; flex-shrink: 0; }

.wo-timing { padding: 0; }
.wo-bar {
  display: flex;
  width: 100%;
  height: 16pt;
  gap: 1pt;
}
.wo-bar-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
}
.wo-bar-label {
  font-size: 6pt;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4pt;
}

.wo-day-body {
  padding: 8pt 12pt;
  display: flex;
  flex-direction: column;
  gap: 6pt;
}

.wo-section { display: flex; gap: 8pt; align-items: flex-start; }
.wo-section-label {
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  white-space: nowrap;
  width: 68pt;
  flex-shrink: 0;
  padding-top: 2pt;
}
.wo-goals {
  margin: 0;
  padding-left: 12pt;
  font-size: 9pt;
  color: #111827;
  line-height: 1.4;
  flex: 1;
}
.wo-goals li { margin-bottom: 2pt; }
.wo-goals li:last-child { margin-bottom: 0; }

.wo-materials {
  font-size: 9pt;
  color: #374151;
  line-height: 1.4;
  flex: 1;
}

.wo-badges { display: flex; flex-wrap: wrap; gap: 4pt; padding-top: 2pt; }
.wo-badge {
  font-size: 7pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2pt 7pt;
  border-radius: 3pt;
  background: #F3F4F6;
  color: #374151;
  border: 1pt solid #E5E7EB;
}
.wo-badge-evidence {
  background: #F0FDF4;
  color: #15803D;
  border-color: #BBF7D0;
}

.wo-footer {
  margin-top: 12pt;
  border-top: 0.75pt solid #E5E7EB;
  padding-top: 8pt;
  display: flex;
  flex-direction: column;
  gap: 5pt;
}
.wo-footer-section { display: flex; gap: 8pt; align-items: flex-start; }
.wo-footer-label {
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  white-space: nowrap;
  width: 120pt;
  flex-shrink: 0;
  padding-top: 1pt;
}
.wo-footer-text { font-size: 8pt; color: #6B7280; line-height: 1.4; flex: 1; }
  </style>
</head>
<body>
  <div class="wo-masthead">
    <span class="wo-masthead-left">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(headerRight)}</span>
    <span class="wo-masthead-right">Week Overview${weekLabel ? ` &nbsp;·&nbsp; ${escapeHtml(weekLabel)}` : ''} &nbsp;·&nbsp; ${summaries.length} day${summaries.length !== 1 ? 's' : ''}</span>
  </div>

  <div class="wo-days">
    ${summaries.map((s, i) => buildDayCard(s, i)).join('\n')}
  </div>

  <div class="wo-footer">
    ${buildMasterMaterialsList(summaries)}
    ${buildStandardsFooter(summaries)}
  </div>
</body>
</html>`
}
