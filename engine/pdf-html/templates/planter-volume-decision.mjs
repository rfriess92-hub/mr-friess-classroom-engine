import { escapeHtml } from './shared.mjs'

function text(value, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function list(value, fallback = []) {
  if (!Array.isArray(value)) return fallback
  const normalized = value.map((item) => String(item ?? '').trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : fallback
}

function lineRows(count = 2) {
  return Array.from({ length: count }, () => '<div class="pvd-line"></div>').join('')
}

function checkRows(items) {
  return list(items).map((item) => `<label class="pvd-check"><span></span>${escapeHtml(item)}</label>`).join('')
}

function section(title, body, className = '') {
  return `<section class="pvd-card ${className}"><h2>${escapeHtml(title)}</h2>${body}</section>`
}

export function isPlanterVolumeDecisionLayout(value) {
  return String(value ?? '').trim().replace(/[\s.-]+/g, '_').toLowerCase() === 'planter_volume_decision'
}

export function buildPlanterVolumeDecisionHTML(pkg, sectionData, fontFaceCSS, designCSS) {
  const title = text(sectionData?.title, 'Planter Box Volume Decision Sheet')
  const subtitle = text(sectionData?.subtitle, 'Soil, water, and materials estimate')
  const prompt = text(
    sectionData?.prompt,
    'Our class is filling planter boxes. Use volume to estimate how much soil and water we need, then make a practical buying decision.',
  )
  const successCriteria = list(sectionData?.success_criteria, [
    'I used length × width × height to estimate volume.',
    'I included units in my calculations.',
    'I explained what we should actually buy or prepare.',
    'I checked whether my answer is reasonable.',
  ])

  const soilBagVolume = text(sectionData?.soil_bag_volume, '1 soil bag = ______ L')
  const wateringCanVolume = text(sectionData?.watering_can_volume, '1 watering can = ______ L')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>${fontFaceCSS}\n${designCSS}\n${css()}</style>
</head>
<body class="pvd-body">
  <main class="pvd-page">
    <div class="pvd-name-date"><span><strong>Name:</strong><i></i></span><span><strong>Date:</strong><i></i></span></div>
    <header class="pvd-header">
      <div>
        <p class="pvd-kicker">Math 8 · Volume in the garden</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="pvd-formula">V = l × w × h</div>
    </header>

    ${section('The real task', `<p>${escapeHtml(prompt)}</p>`, 'pvd-task')}

    <div class="pvd-grid pvd-two">
      ${section('1. Sketch the planter', `
        <div class="pvd-planter">
          <div class="pvd-box-face pvd-front">front</div>
          <div class="pvd-box-face pvd-side">side</div>
          <div class="pvd-box-face pvd-top">top</div>
        </div>
        <div class="pvd-dims">
          <label>Length: <span></span></label>
          <label>Width: <span></span></label>
          <label>Height / soil depth: <span></span></label>
        </div>
      `)}

      ${section('2. Estimate volume', `
        <div class="pvd-calc-row"><strong>Length</strong><span></span><em>×</em><strong>Width</strong><span></span></div>
        <div class="pvd-calc-row"><em>×</em><strong>Height</strong><span></span><em>=</em><strong>Volume</strong><span></span></div>
        <p class="pvd-note">Use cm³ or convert to litres if your class has learned that step.</p>
        ${lineRows(3)}
      `)}
    </div>

    <div class="pvd-grid pvd-two pvd-mid">
      ${section('3. Soil decision', `
        <p class="pvd-given">${escapeHtml(soilBagVolume)}</p>
        <p>How many bags should we plan for?</p>
        ${lineRows(3)}
        <div class="pvd-answer">We should get ______ bags because ____________________________.</div>
      `)}

      ${section('4. Water decision', `
        <p class="pvd-given">${escapeHtml(wateringCanVolume)}</p>
        <p>How many full watering cans would fill or water the planter?</p>
        ${lineRows(3)}
        <div class="pvd-answer">We need about ______ cans because __________________________.</div>
      `)}
    </div>

    ${section('5. Final classroom recommendation', `
      <div class="pvd-recommend-grid">
        <div><strong>What we should buy / prepare</strong>${lineRows(3)}</div>
        <div><strong>What I checked</strong>${lineRows(3)}</div>
      </div>
      <p class="pvd-sentence">My recommendation is reasonable because ________________________________________________.</p>
    `, 'pvd-final')}

    <footer class="pvd-footer">
      <div><strong>Success criteria</strong>${checkRows(successCriteria)}</div>
      <div class="pvd-teacher-note"><strong>Teacher check:</strong><br>units · setup · calculation · realistic decision</div>
    </footer>
  </main>
</body>
</html>`
}

function css() {
  return `
@page { size: letter; margin: 0; }
*, *::before, *::after { box-sizing: border-box; }
.pvd-body { margin:0; background:#fff; color:#111827; font-family:'Lexend',system-ui,sans-serif; font-size:10pt; line-height:1.25; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.pvd-page { width:8.5in; height:11in; padding:.36in .38in; border:2pt solid #111; overflow:hidden; }
.pvd-name-date { display:flex; justify-content:space-between; gap:28pt; margin-bottom:10pt; font-size:12pt; font-weight:700; }
.pvd-name-date span { display:flex; align-items:center; gap:7pt; flex:1; }
.pvd-name-date i { border-bottom:1.5pt solid #111; flex:1; height:0; }
.pvd-header { display:grid; grid-template-columns:1fr 1.75in; gap:12pt; align-items:center; border:1.6pt solid #111; border-radius:12pt; padding:10pt 12pt; margin-bottom:9pt; }
.pvd-kicker { margin:0 0 3pt; font-size:8pt; text-transform:uppercase; letter-spacing:.08em; color:#475569; font-weight:800; }
.pvd-header h1 { font-size:25pt; line-height:1.02; margin:0 0 3pt; letter-spacing:-.03em; }
.pvd-header p { margin:0; font-size:11.5pt; }
.pvd-formula { border:1.5pt solid #111; border-radius:10pt; min-height:.72in; display:flex; align-items:center; justify-content:center; text-align:center; font-size:20pt; font-weight:900; background:#f8fafc; }
.pvd-card { border:1.35pt solid #111; border-radius:10pt; padding:8pt 9pt; margin-bottom:8pt; break-inside:avoid; }
.pvd-card h2 { margin:0 0 6pt; font-size:13.8pt; line-height:1.08; }
.pvd-card p { margin:0 0 6pt; }
.pvd-task { background:#f8fafc; }
.pvd-grid { display:grid; gap:8pt; }
.pvd-two { grid-template-columns:1fr 1fr; }
.pvd-mid { margin-top:0; }
.pvd-planter { position:relative; height:1.28in; margin:.02in .08in .08in; }
.pvd-box-face { position:absolute; border:1.35pt solid #111; background:#fff; display:flex; align-items:center; justify-content:center; font-size:8pt; color:#475569; }
.pvd-front { left:.55in; top:.44in; width:1.75in; height:.58in; }
.pvd-side { left:2.05in; top:.26in; width:.72in; height:.58in; transform:skewY(-18deg); }
.pvd-top { left:.72in; top:.1in; width:1.75in; height:.48in; transform:skewX(-28deg); }
.pvd-dims { display:grid; gap:5pt; font-size:9pt; }
.pvd-dims label { display:flex; gap:5pt; align-items:center; }
.pvd-dims span,.pvd-calc-row span { border-bottom:1.1pt solid #111; height:12pt; flex:1; }
.pvd-calc-row { display:grid; grid-template-columns:auto 1fr auto auto 1fr; gap:5pt; align-items:center; margin-bottom:6pt; }
.pvd-note,.pvd-given { font-size:8.6pt; color:#334155; }
.pvd-given { border:1.1pt solid #111; border-radius:6pt; padding:5pt; background:#f8fafc; font-weight:800; }
.pvd-line { height:.24in; border-bottom:1pt solid #111; }
.pvd-answer { margin-top:6pt; border:1.1pt solid #111; border-radius:6pt; padding:6pt; min-height:.35in; font-size:8.8pt; }
.pvd-recommend-grid { display:grid; grid-template-columns:1fr 1fr; gap:10pt; }
.pvd-sentence { margin-top:7pt !important; font-weight:700; }
.pvd-final { margin-bottom:7pt; }
.pvd-footer { display:grid; grid-template-columns:1fr 1.8in; gap:9pt; align-items:stretch; }
.pvd-footer > div { border:1.25pt solid #111; border-radius:9pt; padding:7pt; }
.pvd-check { display:grid; grid-template-columns:11pt 1fr; gap:6pt; align-items:start; margin-top:4pt; font-size:8.4pt; }
.pvd-check span { width:10pt; height:10pt; border:1.2pt solid #111; margin-top:1pt; }
.pvd-teacher-note { font-size:8.5pt; background:#f8fafc; }
`
}
