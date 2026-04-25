import { escapeHtml, formatPrompt } from './shared.mjs'

function cardsPerPage(section) {
  const configured = Number(section?.print_layout?.cards_per_page ?? 2)
  return [1, 2, 4].includes(configured) ? configured : 2
}

function gridColumns(count) {
  if (count === 4) return 2
  return 1
}

function cardClass(count) {
  if (count === 1) return 'station-card size-large'
  if (count === 4) return 'station-card size-compact'
  return 'station-card size-medium'
}

function buildInstructions(section) {
  if (!Array.isArray(section.instructions) || section.instructions.length === 0) return ''
  return `
<div class="station-instructions">
  <div class="section-kicker">Directions</div>
  <ul>
    ${section.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>
</div>`
}

export function buildStationCardsHTML(pkg, section, fontFaceCSS, designCSS) {
  const perPage = cardsPerPage(section)
  const columns = gridColumns(perPage)
  const cards = Array.isArray(section.cards) ? section.cards : []
  const showStationNumber = section?.print_layout?.show_station_number !== false
  const cutGuides = section?.print_layout?.cut_guides === true

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

@page { size: letter; margin: 0.5in 0.55in; }

body {
  background: #FFFFFF;
}

.station-wrap {
  display: flex;
  flex-direction: column;
  gap: 14pt;
}

.station-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12pt;
  align-items: baseline;
}

.station-directions-note {
  font-size: 9pt;
  color: #6B7280;
}

.station-instructions {
  border: 1pt solid #D1D5DB;
  border-radius: 4pt;
  background: #F9FAFB;
  padding: 10pt 12pt 10pt 18pt;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(${columns}, minmax(0, 1fr));
  gap: 12pt;
}

.station-card {
  border: 1.5pt solid #111827;
  border-radius: 8pt;
  padding: 14pt 14pt 16pt;
  page-break-inside: avoid;
  position: relative;
  background: #FFFFFF;
  ${cutGuides ? 'outline: 0.75pt dashed #D1D5DB;' : ''}
}

.station-card.size-large { min-height: 316pt; }
.station-card.size-medium { min-height: 236pt; }
.station-card.size-compact { min-height: 168pt; }

.station-number {
  display: inline-block;
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6B7280;
  margin-bottom: 6pt;
}

.station-card-title {
  font-size: ${perPage === 1 ? '24pt' : perPage === 2 ? '20pt' : '16pt'};
  font-weight: 700;
  line-height: 1.08;
  color: #111827;
  margin-bottom: 10pt;
}

.station-card-prompt {
  font-size: ${perPage === 4 ? '11pt' : '12.5pt'};
  line-height: 1.45;
  color: #1F2937;
}

.station-card-prompt p + p {
  margin-top: 7pt;
}

.station-task {
  margin-top: 14pt;
  border-top: 1pt solid #E5E7EB;
  padding-top: 10pt;
}

.station-task-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6B7280;
  margin-bottom: 4pt;
}

.station-task-text {
  font-size: ${perPage === 4 ? '11pt' : '12pt'};
  font-weight: 600;
  color: #111827;
  line-height: 1.35;
}
  </style>
</head>
<body>
  <div class="masthead">
    <span class="masthead-school">Mr. Friess - ${escapeHtml(pkg.subject ?? 'Subject')} - Grade ${escapeHtml(String(pkg.grade ?? ''))}</span>
    <span class="masthead-right">${escapeHtml(pkg.topic ?? '')}</span>
  </div>

  <div class="page-wrap station-wrap">
    <div class="station-title-row">
      <div>
        <div class="doc-eyebrow">Station Cards</div>
        <div class="doc-title">${escapeHtml(section.title ?? 'Station Cards')}</div>
      </div>
      <div class="station-directions-note">${cards.length} card${cards.length === 1 ? '' : 's'} · ${perPage} per page</div>
    </div>

    ${buildInstructions(section)}

    <div class="station-grid">
      ${cards.map((card) => `
        <div class="${cardClass(perPage)}">
          ${showStationNumber ? `<div class="station-number">Station ${escapeHtml(String(card.station_number ?? ''))}</div>` : ''}
          <div class="station-card-title">${escapeHtml(card.title ?? '')}</div>
          <div class="station-card-prompt">${formatPrompt(card.prompt ?? '')}</div>
          <div class="station-task">
            <div class="station-task-label">Task</div>
            <div class="station-task-text">${escapeHtml(card.task ?? '')}</div>
          </div>
        </div>
      `).join('\n')}
    </div>
  </div>
</body>
</html>`
}
