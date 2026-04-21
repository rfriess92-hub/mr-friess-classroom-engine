import { escapeHtml } from './shared.mjs'

// Sub Plan — teacher-facing document for substitute teachers.
// Each step shows explicit instructions, a verbatim script, and what students should be doing.

function buildStep(step, index) {
  const num = index + 1
  const label = step.label ?? `Step ${num}`
  const duration = step.duration_min ?? 0
  const whatToDo = step.what_to_do ?? ''
  const whatToSay = step.what_to_say ?? ''
  const whatStudentsDo = step.what_students_do ?? ''
  const materials = Array.isArray(step.materials) ? step.materials : []

  return `
<div class="sp-step">
  <div class="sp-step-head">
    <span class="sp-step-num">${num}</span>
    <div class="sp-step-meta">
      <span class="sp-step-label">${escapeHtml(label)}</span>
      <span class="sp-step-dur">${duration} min</span>
    </div>
  </div>
  <div class="sp-step-body">
    ${whatToDo ? `
    <div class="sp-row">
      <span class="sp-row-role">Do</span>
      <span class="sp-row-text">${escapeHtml(whatToDo)}</span>
    </div>` : ''}
    ${whatToSay ? `
    <div class="sp-script">
      <div class="sp-script-label">Say (word for word)</div>
      <div class="sp-script-text">"${escapeHtml(whatToSay)}"</div>
    </div>` : ''}
    ${whatStudentsDo ? `
    <div class="sp-row">
      <span class="sp-row-role">Students</span>
      <span class="sp-row-text">${escapeHtml(whatStudentsDo)}</span>
    </div>` : ''}
    ${materials.length > 0 ? `
    <div class="sp-row sp-row-materials">
      <span class="sp-row-role">Materials</span>
      <span class="sp-row-text">${escapeHtml(materials.join(', '))}</span>
    </div>` : ''}
  </div>
</div>`
}

export function buildSubPlanHTML(pkg, section, fontFaceCSS, designCSS) {
  const title = section.title ?? 'Sub Plan'
  const classContext = section.class_context ?? ''
  const materialsLocation = section.materials_location ?? ''
  const classroomNotes = section.classroom_notes ?? ''
  const ifStuck = section.if_stuck ?? ''
  const steps = Array.isArray(section.steps) ? section.steps : []
  const totalMin = steps.reduce((s, step) => s + (step.duration_min ?? 0), 0)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.45in 0.60in; }

.sp-masthead {
  background: #7F1D1D;
  color: #FEF2F2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10pt 0.60in;
  margin: -0.45in -0.60in 18pt;
}
.sp-masthead-left { font-size: 10pt; font-weight: 700; }
.sp-masthead-right { font-size: 8.5pt; color: #FECACA; text-align: right; }

.sp-title {
  font-size: 19pt;
  font-weight: 700;
  color: #111827;
  margin-bottom: 3pt;
}
.sp-meta {
  font-size: 9pt;
  color: #6B7280;
  margin-bottom: 16pt;
}

.sp-context-box {
  background: #FFFBEB;
  border: 1pt solid #FCD34D;
  border-left: 4pt solid #D97706;
  border-radius: 4pt;
  padding: 9pt 12pt;
  margin-bottom: 10pt;
}
.sp-context-label {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400E;
  margin-bottom: 4pt;
}
.sp-context-text {
  font-size: 10pt;
  color: #1F2937;
  line-height: 1.45;
}

.sp-info-row {
  display: flex;
  gap: 10pt;
  margin-bottom: 16pt;
}
.sp-info-block {
  flex: 1;
  background: #F9FAFB;
  border: 1pt solid #E5E7EB;
  border-radius: 4pt;
  padding: 8pt 11pt;
}
.sp-info-label {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6B7280;
  margin-bottom: 3pt;
}
.sp-info-text {
  font-size: 9.5pt;
  color: #111827;
  line-height: 1.4;
}

.sp-steps { display: flex; flex-direction: column; gap: 8pt; }

.sp-step {
  border: 1pt solid #E5E7EB;
  border-radius: 5pt;
  overflow: hidden;
  page-break-inside: avoid;
}

.sp-step-head {
  background: #1F2937;
  color: #F9FAFB;
  display: flex;
  align-items: center;
  gap: 10pt;
  padding: 6pt 12pt;
}
.sp-step-num {
  width: 20pt;
  height: 20pt;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9pt;
  font-weight: 700;
  flex-shrink: 0;
}
.sp-step-meta {
  display: flex;
  align-items: baseline;
  gap: 8pt;
  flex: 1;
}
.sp-step-label {
  font-size: 11pt;
  font-weight: 700;
}
.sp-step-dur {
  font-size: 8.5pt;
  color: #9CA3AF;
  font-weight: 400;
}

.sp-step-body {
  padding: 9pt 12pt;
  display: flex;
  flex-direction: column;
  gap: 7pt;
}

.sp-row {
  display: flex;
  gap: 9pt;
  align-items: flex-start;
}
.sp-row-role {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6B7280;
  white-space: nowrap;
  width: 50pt;
  flex-shrink: 0;
  padding-top: 2pt;
}
.sp-row-text {
  font-size: 10pt;
  color: #111827;
  line-height: 1.4;
  flex: 1;
}
.sp-row-materials .sp-row-text {
  color: #374151;
  font-size: 9pt;
}

.sp-script {
  background: #F0FDF4;
  border-left: 3pt solid #16A34A;
  border-radius: 0 3pt 3pt 0;
  padding: 7pt 11pt;
}
.sp-script-label {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #15803D;
  margin-bottom: 4pt;
}
.sp-script-text {
  font-size: 10.5pt;
  color: #14532D;
  line-height: 1.5;
  font-style: italic;
}

.sp-stuck {
  margin-top: 14pt;
  background: #FFF7ED;
  border-left: 3pt solid #EA580C;
  border-radius: 0 3pt 3pt 0;
  padding: 7pt 11pt;
  font-size: 9pt;
  color: #7C2D12;
  page-break-inside: avoid;
}
.sp-stuck strong { font-weight: 700; margin-right: 4pt; }
  </style>
</head>
<body>
  <div class="sp-masthead">
    <span class="sp-masthead-left">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? '')} &nbsp;·&nbsp; Grade ${escapeHtml(String(pkg.grade ?? ''))}</span>
    <span class="sp-masthead-right">Sub Plan &nbsp;·&nbsp; ${totalMin} min</span>
  </div>

  <div class="sp-title">${escapeHtml(title)}</div>
  <div class="sp-meta">${steps.length} step${steps.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ${totalMin} minutes &nbsp;·&nbsp; ${escapeHtml(pkg.topic ?? '')}</div>

  ${classContext ? `
  <div class="sp-context-box">
    <div class="sp-context-label">What this class has been working on</div>
    <div class="sp-context-text">${escapeHtml(classContext)}</div>
  </div>` : ''}

  ${(materialsLocation || classroomNotes) ? `
  <div class="sp-info-row">
    ${materialsLocation ? `
    <div class="sp-info-block">
      <div class="sp-info-label">Where to find materials</div>
      <div class="sp-info-text">${escapeHtml(materialsLocation)}</div>
    </div>` : ''}
    ${classroomNotes ? `
    <div class="sp-info-block">
      <div class="sp-info-label">Classroom notes</div>
      <div class="sp-info-text">${escapeHtml(classroomNotes)}</div>
    </div>` : ''}
  </div>` : ''}

  <div class="sp-steps">
    ${steps.map((step, i) => buildStep(step, i)).join('\n')}
  </div>

  ${ifStuck ? `<div class="sp-stuck"><strong>If something goes wrong:</strong>${escapeHtml(ifStuck)}</div>` : ''}
</body>
</html>`
}
