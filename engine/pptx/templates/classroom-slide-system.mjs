const ACCENTS = new Set(['teal', 'teal2', 'amber', 'red', 'purple'])

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function text(value, fallback = '') {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim()
  return normalized || fallback
}

function htmlLines(value) {
  return escapeHtml(String(value ?? '')).replace(/\n/g, '<br>')
}

function accent(value, fallback = 'teal') {
  const normalized = text(value, fallback).toLowerCase().replace(/[^a-z0-9]/g, '')
  return ACCENTS.has(normalized) ? normalized : fallback
}

function termBox(value, fallbackAccent = 'teal') {
  const normalized = text(value).toLowerCase().replace(/_/g, '-')
  if (normalized.includes('amber')) return 'term-amber'
  if (normalized.includes('red')) return 'term-red'
  if (normalized.includes('purple')) return 'term-purple'
  if (normalized.includes('teal')) return 'term-teal'
  return `term-${fallbackAccent === 'teal2' ? 'teal' : fallbackAccent}`
}

function flattenItems(value, limit = 6) {
  const out = []
  const visit = (entry) => {
    if (out.length >= limit || entry == null) return
    if (typeof entry === 'string' || typeof entry === 'number') {
      const normalized = text(entry)
      if (normalized) out.push(normalized)
      return
    }
    if (Array.isArray(entry)) {
      for (const item of entry) visit(item)
      return
    }
    if (typeof entry === 'object') {
      if (entry.text != null) return visit(entry.text)
      if (entry.body != null) return visit(entry.body)
      if (entry.bold != null || entry.rest != null) {
        const joined = [entry.bold, entry.rest].map((item) => text(item)).filter(Boolean).join(' ')
        if (joined) out.push(joined)
        return
      }
      if (entry.head != null || entry.heading != null || entry.title != null) {
        const joined = [entry.head ?? entry.heading ?? entry.title, entry.body].map((item) => text(item)).filter(Boolean).join(' — ')
        if (joined) out.push(joined)
        return
      }
      const pieces = Object.values(entry)
        .filter((item) => typeof item === 'string' || typeof item === 'number')
        .map((item) => text(item))
        .filter(Boolean)
      if (pieces.length > 0) out.push(pieces.join(' — '))
    }
  }
  visit(value)
  return out.slice(0, limit)
}

function subjectLabel(packet) {
  return [packet.subject, packet.grade].map((item) => text(item)).filter(Boolean).join(' ')
}

function slideVisualPage(packet, slideIndex) {
  const pages = packet?.visual?.pages
  if (!Array.isArray(pages)) return null
  const page = pages[slideIndex]
  return page && typeof page === 'object' ? page : null
}

function normalizeSlide(packet, slideSpec, slideIndex) {
  const rawType = text(slideSpec?.type).toLowerCase()
  const layout = text(slideSpec?.layout).toLowerCase()
  const content = slideSpec?.content && typeof slideSpec.content === 'object' ? slideSpec.content : {}
  const page = slideVisualPage(packet, slideIndex)
  const visualPlan = page?.content_plan && typeof page.content_plan === 'object' ? page.content_plan : null

  if (rawType === 'title' || layout === 'hero' || rawType === 'title_slide') {
    return {
      type: 'title',
      accent: accent(slideSpec?.accent ?? packet.accent ?? packet.theme, 'teal'),
      title: text(slideSpec?.title ?? visualPlan?.title ?? packet.topic, 'Classroom Deck'),
      subtitle: text(slideSpec?.subtitle ?? content.subtitle ?? visualPlan?.subtitle ?? packet.topic, ''),
      meta: Array.isArray(slideSpec?.meta)
        ? slideSpec.meta
        : [subjectLabel(packet), text(packet.lesson_label ?? packet.topic)],
    }
  }

  if (rawType === 'unit_overview') return { ...slideSpec, type: 'unit_overview' }
  if (rawType === 'scope_sequence') return { ...slideSpec, type: 'scope_sequence' }
  if (rawType === 'how_it_works') return { ...slideSpec, type: 'how_it_works' }
  if (rawType === 'lesson_day3') return { ...slideSpec, type: 'lesson_day3' }
  if (rawType === 'lesson_days12') return { ...slideSpec, type: 'lesson_days12' }

  if (layout.includes('compare') || layout === 'two_column') {
    const columns = Array.isArray(content.columns) ? content.columns : []
    const left = columns[0] && typeof columns[0] === 'object'
      ? columns[0]
      : { title: 'First idea', items: [content.left ?? columns[0] ?? ''] }
    const right = columns[1] && typeof columns[1] === 'object'
      ? columns[1]
      : { title: 'Second idea', items: [content.right ?? columns[1] ?? ''] }
    return {
      type: 'lesson_days12',
      accent: accent(packet.theme, 'teal'),
      breadcrumb: text(packet.lesson_label, 'CLASSROOM VIEW'),
      title: text(slideSpec?.title, 'Compare ideas'),
      left_card: {
        label: text(left.title, 'FIRST IDEA'),
        term: text(left.title, 'FIRST IDEA'),
        definition: '',
        secondary_label: 'KEY DETAILS',
        content: flattenItems(left.items ?? content.left, 5).join('\n'),
      },
      right_cards: [{ label: text(right.title, 'SECOND IDEA'), content: flattenItems(right.items ?? content.right, 5).join('\n') }],
    }
  }

  const prompts = flattenItems(content.prompts ?? content.goals ?? content.rows ?? content.items ?? visualPlan?.prompts, 5)
  return {
    type: layout === 'reflect' || rawType === 'reflect' ? 'lesson_day3' : 'lesson_days12',
    accent: accent(packet.theme, 'teal'),
    breadcrumb: text(packet.lesson_label, 'CLASSROOM VIEW'),
    title: text(slideSpec?.title, 'Classroom task'),
    left_card: {
      label: layout === 'reflect' ? 'REFLECTION' : 'CLASSROOM ANCHOR',
      term: text(content.term ?? visualPlan?.term ?? slideSpec?.title, 'FOCUS'),
      definition: text(content.definition ?? content.subtitle ?? visualPlan?.subtitle, ''),
      secondary_label: 'START HERE',
      content: text(content.task ?? content.scenario ?? content.model ?? visualPlan?.prompt ?? slideSpec?.title, ''),
    },
    right_cards: prompts.length > 0
      ? [{ label: 'PROMPTS', content: prompts.join('\n') }]
      : [{ label: 'SUPPORT', content: flattenItems(content.supports ?? content.rows, 4).join('\n') }],
  }
}

function css() {
  return `
    :root {
      --bg-dark:#161C2D; --bg-light:#F0F2F5; --card-dark:#222B3A; --card-light:#FFFFFF; --navy-bar:#1B2235;
      --teal:#2D9E95; --teal2:#1E7A72; --amber:#E9A825; --red:#E05A5A; --purple:#7B4FBE;
      --white:#FFFFFF; --dark:#1E2738; --muted:#78879C; --muted-dk:#8892A4; --border:#D8DDE8;
      --term-teal:#E8F5F3; --term-amber:#FDF6DC; --term-red:#FDE8E8; --term-purple:#EDE5F8;
    }
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0a0a0a; font-family: Arial, Helvetica, sans-serif; }
    .slide { position: relative; width: 1600px; height: 900px; overflow: hidden; font-family: Arial, Helvetica, sans-serif; }
    .slide-dark { background: var(--bg-dark); }
    .slide-light { background: var(--bg-light); }
    .accent-bar { position: absolute; left: 0; right: 0; height: 10px; }
    .accent-bar.top { top: 0; } .accent-bar.bottom { bottom: 0; }
    .bg-teal { background: var(--teal); } .bg-teal2 { background: var(--teal2); } .bg-amber { background: var(--amber); } .bg-red { background: var(--red); } .bg-purple { background: var(--purple); }
    .c-teal { color: var(--teal); } .c-teal2 { color: var(--teal2); } .c-amber { color: var(--amber); } .c-red { color: var(--red); } .c-purple { color: var(--purple); }
    .title-h1 { position: absolute; left: 70px; top: 70px; width: 900px; height: 250px; font-size: 88px; line-height: 1.05; font-weight: 700; color: var(--white); white-space: pre-line; letter-spacing: -2px; }
    .title-subtitle { position: absolute; left: 70px; top: 345px; width: 1260px; height: 40px; font-size: 13px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
    .title-rule { position: absolute; left: 70px; top: 395px; width: 280px; height: 7px; }
    .title-meta { position: absolute; left: 70px; top: 415px; width: 900px; color: var(--muted-dk); font-size: 13px; line-height: 1.65; }
    .title-bar { position:absolute; left:0; right:0; top:0; height:75px; background:var(--navy-bar); display:flex; align-items:center; padding:0 40px; }
    .title-bar h2 { color: var(--white); font-size:22px; font-weight:700; text-transform:uppercase; }
    .title-bar-underline { position:absolute; left:0; right:0; top:75px; height:4px; }
    .breadcrumb { position:absolute; left:0; right:0; top:79px; height:28px; display:flex; align-items:center; padding:0 40px; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
    .lesson-title-bar { position:absolute; left:0; right:0; top:107px; height:65px; display:flex; align-items:center; padding:0 40px; }
    .lesson-title-bar h2 { color: var(--white); font-size:20px; font-weight:700; }
    .card { position:absolute; background:var(--card-light); border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,.07); overflow:hidden; }
    .card-dark { background:var(--card-dark); border:none; }
    .card-pad { padding:18px 20px; }
    .card-header { height:42px; display:flex; align-items:center; padding:0 16px; }
    .card-header span { font-size:10px; font-weight:700; color:var(--white); text-transform:uppercase; letter-spacing:3px; }
    .section-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:3px; margin-bottom:8px; }
    .key-term-box { border-radius:2px; padding:10px 16px; text-align:center; margin-bottom:10px; }
    .key-term-box .term { font-size:28px; font-weight:700; line-height:1.1; }
    .key-term-box .definition { font-size:12px; font-style:italic; color:var(--muted); margin-top:6px; }
    .body-text { font-size:13px; line-height:1.5; color:var(--dark); white-space:pre-line; }
    .body-small { font-size:12px; line-height:1.45; color:var(--dark); white-space:pre-line; }
    .muted { color:var(--muted); }
    .overview-title { position:absolute; left:50px; top:30px; color:var(--white); font-size:62px; font-weight:700; }
    .overview-name { position:absolute; left:50px; top:125px; color:var(--muted-dk); font-size:16px; }
    .overview-col { position:absolute; top:188px; width:456px; }
    .overview-header { height:55px; display:flex; align-items:center; justify-content:center; color:var(--white); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
    .overview-card { height:280px; background:var(--card-dark); display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:32px 20px 20px; }
    .overview-term { font-size:30px; font-weight:700; line-height:1.08; text-align:center; margin-bottom:10px; }
    .overview-def { color:var(--muted-dk); font-size:12px; line-height:1.25; text-align:center; font-style:italic; min-height:58px; }
    .overview-activity { color:var(--muted-dk); font-size:12px; line-height:1.35; text-align:center; margin-top:24px; }
    table.scope { position:absolute; top:110px; left:30px; width:1504px; border-collapse:collapse; font-size:12px; color:var(--dark); }
    table.scope th { color:var(--white); padding:10px 12px; text-align:left; font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    table.scope td { background:var(--card-light); border-bottom:1px solid var(--border); padding:14px 12px; line-height:1.35; vertical-align:top; }
    .how-card { position:absolute; top:107px; width:728px; height:672px; }
    .how-body { position:absolute; left:0; top:55px; width:728px; height:617px; background:var(--card-light); border:1px solid var(--border); padding:24px 32px; }
    .how-section { margin-bottom:28px; }
    .how-section h3 { color:var(--dark); font-size:13px; font-weight:700; margin-bottom:8px; }
    .how-section p { color:var(--muted); font-size:12px; line-height:1.5; }
  `
}

function htmlDoc(inner) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${inner}</body></html>`
}

function accentBackgroundStyle(accentKey, alpha = 0.12) {
  const rgb = {
    teal: '45,158,149', teal2: '30,122,114', amber: '233,168,37', red: '224,90,90', purple: '123,79,190',
  }[accentKey] ?? '45,158,149'
  return `background:rgba(${rgb},${alpha});`
}

function renderTitle(slide) {
  const a = accent(slide.accent, 'teal')
  const meta = Array.isArray(slide.meta) ? slide.meta : []
  return htmlDoc(`<div class="slide slide-dark">
    <div class="accent-bar top bg-${a}"></div><div class="accent-bar bottom bg-${a}"></div>
    <div class="title-h1">${htmlLines(slide.title)}</div>
    <div class="title-subtitle c-${a}">${escapeHtml(text(slide.subtitle).toUpperCase())}</div>
    <div class="title-rule bg-${a}"></div>
    <div class="title-meta">${meta.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}</div>
  </div>`)
}

function renderHowItWorks(slide) {
  const a = accent(slide.accent, 'teal')
  const cards = Array.isArray(slide.cards) ? slide.cards.slice(0, 2) : []
  const renderedCards = cards.map((card, index) => {
    const x = index === 0 ? 30 : 824
    const ca = accent(card.accent, index === 0 ? a : 'amber')
    const sections = Array.isArray(card.sections) ? card.sections : []
    return `<div class="how-card" style="left:${x}px;"><div class="card-header bg-${ca}" style="height:55px;"><span>${escapeHtml(text(card.label).toUpperCase())}</span></div><div class="how-body">${sections.map((section) => `<div class="how-section"><h3>${escapeHtml(text(section.heading ?? section.head))}</h3><p>${escapeHtml(text(section.body))}</p></div>`).join('')}</div></div>`
  }).join('')
  return htmlDoc(`<div class="slide slide-light"><div class="title-bar"><h2>${escapeHtml(text(slide.title, 'HOW THIS DECK WORKS'))}</h2></div><div class="title-bar-underline bg-${a}"></div>${renderedCards}<div style="position:absolute;left:30px;right:30px;top:845px;text-align:center;color:var(--muted);font-size:11px;">${escapeHtml(text(slide.footer))}</div></div>`)
}

function renderScopeSequence(slide) {
  const a = accent(slide.accent, 'teal')
  const columns = Array.isArray(slide.columns) ? slide.columns : ['#', 'Unit', 'Key Concept', 'Core Activities', 'Assessment']
  const rows = Array.isArray(slide.rows) ? slide.rows : []
  const widths = Array.isArray(slide.col_widths) ? slide.col_widths : [0.05, 0.16, 0.29, 0.30, 0.20]
  const total = widths.reduce((sum, value) => sum + Number(value || 0), 0) || columns.length
  const header = columns.map((col, index) => `<th style="width:${Math.round((Number(widths[index]) || 1) * 100 / total)}%">${escapeHtml(col)}</th>`).join('')
  const body = rows.map((row) => `<tr>${columns.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`).join('')
  return htmlDoc(`<div class="slide slide-light"><div class="title-bar"><h2>${escapeHtml(text(slide.title, 'SCOPE & SEQUENCE'))}</h2></div><div class="title-bar-underline bg-${a}"></div><table class="scope"><thead><tr class="bg-${a}">${header}</tr></thead><tbody>${body}</tbody></table></div>`)
}

function renderUnitOverview(slide) {
  const a = accent(slide.accent, 'teal')
  const cols = Array.isArray(slide.columns) ? slide.columns.slice(0, 3) : []
  const positions = [25, 561, 1097]
  const renderedCols = cols.map((col, index) => {
    const ca = accent(col.accent, index === 2 ? 'amber' : a)
    return `<div class="overview-col" style="left:${positions[index]}px;"><div class="overview-header bg-${ca}">${escapeHtml(text(col.label).toUpperCase())}</div><div class="overview-card"><div class="overview-term c-${ca}">${htmlLines(col.term)}</div><div class="overview-def">${htmlLines(col.definition)}</div><div class="overview-activity">${htmlLines(col.activity)}</div></div></div>`
  }).join('')
  return htmlDoc(`<div class="slide slide-dark"><div class="accent-bar bottom bg-${a}"></div><div class="overview-title">UNIT ${escapeHtml(text(slide.unit_number ?? slide.unit, '1'))}</div><div class="overview-name">${escapeHtml(text(slide.unit_name, 'Unit Overview'))}</div>${renderedCols}</div>`)
}

function renderLeftCard(card, a, day3 = false) {
  const termAccent = accent(card.term_accent, a)
  const boxClass = termBox(card.term_box, termAccent)
  const highlight = text(card.highlight_instruction) ? `<div class="body-small c-${a}" style="font-style:italic;margin:4px 0 12px;">${htmlLines(card.highlight_instruction)}</div>` : ''
  return `<div class="card card-pad" style="left:30px;top:185px;width:728px;height:568px;">
    <div class="section-label c-${a}">${escapeHtml(text(card.label, day3 ? 'REVIEW' : 'VOCABULARY ANCHOR').toUpperCase())}</div>
    <div class="key-term-box" style="background:var(--${boxClass});"><div class="term c-${termAccent}">${htmlLines(card.term)}</div>${text(card.definition) ? `<div class="definition">${htmlLines(card.definition)}</div>` : ''}</div>
    ${highlight}
    <div class="section-label ${day3 ? 'muted' : `c-${a}`}">${escapeHtml(text(card.secondary_label, 'START HERE').toUpperCase())}</div>
    <div class="body-text" style="margin-top:8px;">${htmlLines(card.content)}</div>
  </div>`
}

function renderRightCards(cards, a, day3 = false) {
  const list = Array.isArray(cards) && cards.length > 0 ? cards.slice(0, 2) : [{ label: 'SUPPORT', content: '' }]
  const heights = list.length === 1 ? [568] : [268, 278]
  const tops = list.length === 1 ? [185] : [185, 475]
  return list.map((card, index) => {
    const ca = accent(card.accent, day3 ? (index === 0 ? 'red' : 'purple') : a)
    if (day3) {
      return `<div class="card" style="left:824px;top:${tops[index]}px;width:728px;height:${heights[index]}px;"><div class="card-header bg-${ca}"><span>${escapeHtml(text(card.label).toUpperCase())}</span></div><div style="padding:22px 32px;"><div class="body-text">${htmlLines(card.content)}</div></div></div>`
    }
    return `<div class="card card-pad" style="left:824px;top:${tops[index]}px;width:728px;height:${heights[index]}px;"><div class="section-label c-${a}">${escapeHtml(text(card.label).toUpperCase())}</div><div class="body-text">${htmlLines(card.content)}</div></div>`
  }).join('')
}

function renderLesson(slide, day3 = false) {
  const a = day3 ? 'amber' : accent(slide.accent, 'teal')
  const title = text(slide.title, day3 ? 'Review + Extension' : 'Lesson')
  const breadcrumb = text(slide.breadcrumb, day3 ? `UNIT ${text(slide.unit, '1')} • DAY 3` : `UNIT ${text(slide.unit, '1')} • DAYS 1 & 2`)
  return htmlDoc(`<div class="slide slide-light"><div class="accent-bar top bg-${a}"></div><div class="breadcrumb c-${a}" style="${accentBackgroundStyle(a)}">${escapeHtml(breadcrumb.toUpperCase())}</div><div class="lesson-title-bar bg-${a}"><h2>${escapeHtml(title)}</h2></div>${renderLeftCard(slide.left_card ?? {}, a, day3)}${renderRightCards(slide.right_cards, a, day3)}</div>`)
}

export function buildClassroomSlideHTML(packet, slideSpec, slideIndex) {
  const slide = normalizeSlide(packet, slideSpec, slideIndex)
  if (slide.type === 'title') return renderTitle(slide)
  if (slide.type === 'unit_overview') return renderUnitOverview(slide)
  if (slide.type === 'scope_sequence') return renderScopeSequence(slide)
  if (slide.type === 'how_it_works') return renderHowItWorks(slide)
  if (slide.type === 'lesson_day3') return renderLesson(slide, true)
  return renderLesson(slide, false)
}

export function buildClassroomSlideSemanticText(packet, slideSpec, slideIndex) {
  const slide = normalizeSlide(packet, slideSpec, slideIndex)
  const pieces = [packet.subject, packet.grade, packet.topic, slide.type, slide.title, slide.subtitle, slide.breadcrumb, slide.unit_name]
  if (Array.isArray(slide.meta)) pieces.push(...slide.meta)
  if (Array.isArray(slide.columns)) {
    for (const col of slide.columns) pieces.push(col.label, col.term, col.definition, col.activity)
  }
  if (slide.left_card) pieces.push(slide.left_card.label, slide.left_card.term, slide.left_card.definition, slide.left_card.secondary_label, slide.left_card.content)
  if (Array.isArray(slide.right_cards)) {
    for (const card of slide.right_cards) pieces.push(card.label, card.content)
  }
  if (Array.isArray(slide.rows)) {
    for (const row of slide.rows) pieces.push(...row)
  }
  return pieces.map((item) => text(item)).filter(Boolean).join(' · ')
}
