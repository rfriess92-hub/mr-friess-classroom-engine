import { escapeHtml, formatPrompt } from './shared.mjs'

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function titleize(key) {
  return String(key ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function renderList(items) {
  const list = asArray(items).map((item) => text(item)).filter(Boolean)
  if (list.length === 0) return ''
  return `<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}</ul>`
}

function renderObjectTable(rows) {
  const objects = asArray(rows).filter((row) => row && typeof row === 'object' && !Array.isArray(row))
  if (objects.length === 0) return ''
  const columns = Array.from(new Set(objects.flatMap((row) => Object.keys(row))))
  return `<table class="pkg-table"><thead><tr>${columns.map((column) => `<th>${escapeHtml(titleize(column))}</th>`).join('')}</tr></thead><tbody>${objects.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(text(row[column]))}</td>`).join('')}</tr>`).join('\n')}</tbody></table>`
}

function renderSectionValue(key, value) {
  if (value == null || key === 'title') return ''
  if (typeof value === 'string') return `<section class="pkg-section"><h2>${escapeHtml(titleize(key))}</h2>${formatPrompt(value)}</section>`
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return `<section class="pkg-section"><h2>${escapeHtml(titleize(key))}</h2>${renderList(value)}</section>`
  }
  if (Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    return `<section class="pkg-section page-break-ok"><h2>${escapeHtml(titleize(key))}</h2>${renderObjectTable(value)}</section>`
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return `<section class="pkg-section"><h2>${escapeHtml(titleize(key))}</h2>${Object.entries(value).map(([childKey, childValue]) => renderSectionValue(childKey, childValue)).join('\n')}</section>`
  }
  return ''
}

function renderDeclaredSections(section) {
  const declared = asArray(section.sections)
  if (declared.length === 0) return ''
  return declared.map((entry, index) => {
    if (typeof entry === 'string') {
      return `<section class="pkg-section"><h2>${escapeHtml(`Section ${index + 1}`)}</h2>${formatPrompt(entry)}</section>`
    }
    if (entry && typeof entry === 'object') {
      const heading = text(entry.title ?? entry.label ?? entry.section_id, `Section ${index + 1}`)
      const body = [entry.body, entry.description, entry.prompt].map((item) => text(item)).filter(Boolean).map(formatPrompt).join('\n')
      const lists = ['items', 'bullets', 'look_fors', 'success_criteria', 'required_sections']
        .map((key) => entry[key] ? `<div class="pkg-subblock"><h3>${escapeHtml(titleize(key))}</h3>${renderList(entry[key])}</div>` : '')
        .join('\n')
      return `<section class="pkg-section"><h2>${escapeHtml(heading)}</h2>${body}${lists}</section>`
    }
    return ''
  }).join('\n')
}

function defaultSectionOrder(section) {
  return Object.entries(section ?? {}).filter(([key]) => !['sections', 'title'].includes(key))
}

function audienceLabel(routeOutputType) {
  switch (routeOutputType) {
    case 'teacher_binder': return 'Teacher Binder'
    case 'student_packet': return 'Student Packet'
    case 'notes_package': return 'Notes Package'
    case 'assessment_pack': return 'Assessment Pack'
    case 'safety_source_pack': return 'Safety and Source Pack'
    case 'graphic_organizer_set': return 'Graphic Organizer Set'
    default: return 'Package Document'
  }
}

export function buildPackageDocumentHTML(pkg, section = {}, fontFaceCSS, designCSS, _tier = null, route = {}) {
  const docLabel = audienceLabel(route.output_type)
  const title = text(section.title, `${text(pkg.topic, 'Unit')} — ${docLabel}`)
  const declaredSections = renderDeclaredSections(section)
  const body = declaredSections || defaultSectionOrder(section).map(([key, value]) => renderSectionValue(key, value)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}
@page { size: letter; margin: 0.55in 0.62in; }
body { font-family: Lexend, Arial, sans-serif; color: #111827; font-size: 10pt; line-height: 1.45; }
.pkg-masthead { background:#111827; color:#F9FAFB; display:flex; justify-content:space-between; align-items:center; padding:10pt 0.62in; margin:-0.55in -0.62in 18pt; }
.pkg-masthead-left { font-size:9pt; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
.pkg-masthead-right { font-size:8pt; color:#D1D5DB; text-align:right; }
.pkg-title { font-size:22pt; font-weight:700; line-height:1.1; margin-bottom:4pt; }
.pkg-subtitle { font-size:9pt; color:#6B7280; margin-bottom:18pt; }
.pkg-section { border-top:1pt solid #E5E7EB; padding-top:10pt; margin-top:12pt; page-break-inside:avoid; }
.pkg-section h2 { font-size:13pt; color:#111827; margin-bottom:6pt; }
.pkg-section h3 { font-size:9pt; color:#4B5563; text-transform:uppercase; letter-spacing:.06em; margin:8pt 0 4pt; }
.pkg-section p { margin-bottom:6pt; }
.pkg-section ul { margin:0 0 6pt 16pt; }
.pkg-section li { margin-bottom:3pt; }
.pkg-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:6pt; page-break-inside:auto; }
.pkg-table th, .pkg-table td { border:1pt solid #D1D5DB; padding:6pt 7pt; vertical-align:top; font-size:8.5pt; }
.pkg-table th { background:#F3F4F6; font-weight:700; color:#374151; }
.pkg-subblock { margin-top:6pt; }
  </style>
</head>
<body>
  <div class="pkg-masthead"><span class="pkg-masthead-left">${escapeHtml(docLabel)}</span><span class="pkg-masthead-right">${escapeHtml(text(pkg.subject, 'Course'))} · Grade ${escapeHtml(text(pkg.grade, ''))}</span></div>
  <main>
    <div class="pkg-title">${escapeHtml(title)}</div>
    <div class="pkg-subtitle">${escapeHtml(text(pkg.topic, ''))}</div>
    ${body || '<section class="pkg-section"><h2>Missing content</h2><p>This package-document output has no authored section content.</p></section>'}
  </main>
</body>
</html>`
}
