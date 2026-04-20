import { escapeHtml, formatPrompt } from './shared.mjs'

// Exit ticket — compact, punchy, fits two per page.
// Distinct from task_sheet: no day grouping, no long prompts, stripped-back.
// Visually bold "EXIT TICKET" identity at the top, minimal chrome.
// Two tickets rendered per HTML page, separated by a dashed cut line.

function buildTicket(pkg, section, index) {
  const prompt = section.prompt ?? ''
  const n_lines = section.n_lines ?? 4
  const lines = Array.from({ length: n_lines }, () => '<div class="et-line"></div>').join('\n')

  return `
<div class="ticket">
  <div class="ticket-header">
    <div class="ticket-eyebrow">Exit Ticket</div>
    <div class="ticket-meta">
      <span class="ticket-class">Mr. Friess &nbsp;·&nbsp; ${escapeHtml(pkg.subject ?? '')}</span>
      <span class="ticket-namedate">Name: _________________________ &nbsp; Date: ___________</span>
    </div>
  </div>

  <div class="ticket-topic">${escapeHtml(pkg.topic ?? '')}</div>

  <div class="ticket-prompt-label">Before you leave:</div>
  <div class="ticket-prompt">${formatPrompt(prompt)}</div>

  <div class="et-lines">${lines}</div>
</div>`
}

function buildCutLine() {
  return `<div class="cut-line"><span class="cut-icon">✂</span></div>`
}

export function buildExitTicketHTML(pkg, section, fontFaceCSS, designCSS) {
  const ticket = buildTicket(pkg, section)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
${fontFaceCSS}
${designCSS}

/* ── Exit ticket extras — override @page to two-up layout ── */

@page {
  size: letter;
  margin: 0.4in 0.65in;
}

body { font-size: 10.5pt; }

.masthead { display: none; }
.page-wrap { padding: 0; }

.ticket {
  border: 1.5pt solid #D1D5DB;
  border-radius: 6pt;
  padding: 14pt 16pt 12pt;
  margin-bottom: 0;
  page-break-inside: avoid;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8pt;
  padding-bottom: 8pt;
  border-bottom: 1.5pt solid #E5E7EB;
}

.ticket-eyebrow {
  background: #E5E7EB;
  color: #111827;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 3pt 10pt;
  border-radius: 3pt;
  white-space: nowrap;
  align-self: center;
}

.ticket-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3pt;
}

.ticket-class {
  font-size: 8pt;
  font-weight: 600;
  color: #374151;
}

.ticket-namedate {
  font-size: 8pt;
  color: #6B7280;
}

.ticket-topic {
  font-size: 9pt;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10pt;
}

.ticket-prompt-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9CA3AF;
  margin-bottom: 5pt;
}

.ticket-prompt {
  border-left: 3pt solid #111827;
  background: #F3F4F6;
  padding: 8pt 12pt;
  font-size: 10.5pt;
  line-height: 1.5;
  color: #1F2937;
  margin-bottom: 10pt;
}

.et-lines .et-line {
  height: 9mm;
  border-bottom: 1pt solid #D1D5DB;
}

.cut-line {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 14pt 0;
  color: #9CA3AF;
  font-size: 9pt;
}

.cut-icon {
  margin-right: 6pt;
}

.cut-line::after {
  content: '';
  flex: 1;
  border-top: 1.5pt dashed #D1D5DB;
}
  </style>
</head>
<body>
  <div class="page-wrap">
    ${ticket}
    ${buildCutLine()}
    ${ticket}
  </div>
</body>
</html>`
}
