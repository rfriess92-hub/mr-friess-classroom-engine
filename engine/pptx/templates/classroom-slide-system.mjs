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

function capWords(value, maxWords = 72) {
  const normalized = text(value)
  const words = normalized.match(/\b[\w'-]+\b/g) ?? []
  if (words.length <= maxWords) return normalized
  return `${words.slice(0, maxWords).join(' ')}…`
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
      if (entry.head != null || entry.heading != null || entry.title != null || entry.label != null) {
        const joined = [entry.head ?? entry.heading ?? entry.title ?? entry.label, entry.body ?? entry.content]
          .map((item) => text(item))
          .filter(Boolean)
          .join(' — ')
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

function genericColumns(content) {
  if (Array.isArray(content.columns) && content.columns.length > 0) return content.columns
  const left = flattenItems(content.left, 4)
  const right = flattenItems(content.right, 4)
  if (left.length || right.length) {
    return [
      { title: 'First idea', items: left },
      { title: 'Second idea', items: right },
    ]
  }
  const prompts = flattenItems(content.prompts ?? content.goals ?? content.items ?? content.rows, 8)
  if (prompts.length > 0) {
    const midpoint = Math.ceil(prompts.length / 2)
    return [
      { title: 'Start here', items: prompts.slice(0, midpoint) },
      { title: 'Use this next', items: prompts.slice(midpoint) },
    ]
  }
  return []
}

function genericRows(slideSpec, content) {
  if (Array.isArray(slideSpec.rows)) return slideSpec.rows
  if (Array.isArray(content.rows)) return content.rows
  const items = flattenItems(content.items ?? content.prompts ?? content.goals, 6)
  return items.map((item, index) => [String(index + 1), item])
}

function sectionsFromItems(items, fallbackHeading = 'Classroom move') {
  const normalized = flattenItems(items, 3)
  if (normalized.length === 0) return [{ heading: fallbackHeading, body: 'Use the slide prompt to set up the class task.' }]
  return normalized.map((item, index) => {
    const [heading, ...bodyParts] = item.split(/\s+[—:-]\s+/)
    return {
      heading: bodyParts.length > 0 ? heading : `${fallbackHeading} ${index + 1}`,
      body: bodyParts.length > 0 ? bodyParts.join(' — ') : item,
    }
  })
}

function howItWorksFromGeneric(packet, slideSpec, content) {
  const columns = genericColumns(content)
  const left = columns[0] ?? { title: 'Days 1 & 2', items: flattenItems(content.prompts ?? content.goals ?? content.items, 3) }
  const right = columns[1] ?? { title: 'Day 3', items: flattenItems(content.supports ?? content.rows ?? content.items, 3) }
  return {
    type: 'how_it_works',
    title: text(slideSpec.title, 'HOW THIS DECK WORKS'),
    accent: accent(slideSpec.accent ?? packet.accent ?? packet.theme, 'teal'),
    cards: [
      {
        label: text(left.label ?? left.title, 'DAYS 1 & 2 — CONCEPT DEVELOPMENT'),
        accent: 'teal',
        sections: sectionsFromItems(left.items ?? left.body ?? left.content, 'Classroom move'),
      },
      {
        label: text(right.label ?? right.title, 'DAY 3 — APPLICATION & EXTENSION'),
        accent: 'amber',
        sections: sectionsFromItems(right.items ?? right.body ?? right.content, 'Application move'),
      },
    ],
    footer: text(content.footer, 'Use the deck to move from concept development into application.'),
  }
}

function scopeSequenceFromGeneric(packet, slideSpec, content) {
  const rows = genericRows(slideSpec, content)
  const columns = Array.isArray(slideSpec.columns) ? slideSpec.columns : ['#', 'Focus', 'Key idea', 'Classroom work', 'Evidence']
  const normalizedRows = rows.length > 0
    ? rows.map((row, index) => {
        const values = Array.isArray(row) ? row : flattenItems(row, 4)
        return columns.map((_, colIndex) => text(values[colIndex], colIndex === 0 ? String(index + 1) : ''))
      })
    : [["1", text(slideSpec.title, packet.topic), text(content.prompt), flattenItems(content.items, 2).join('; '), 'Class discussion']]
  return {
    type: 'scope_sequence',
    title: text(slideSpec.title, 'SCOPE & SEQUENCE'),
    accent: accent(slideSpec.accent ?? packet.accent ?? packet.theme, 'teal'),
    columns,
    col_widths: slideSpec.col_widths ?? [0.4, 1.5, 2.8, 2.9, 1.8],
    rows: normalizedRows.slice(0, 5),
  }
}

function unitOverviewFromGeneric(packet, slideSpec, content) {
  const columns = Array.isArray(slideSpec.columns) && slideSpec.columns.length > 0
    ? slideSpec.columns
    : genericColumns(content).slice(0, 3)
  const items = columns.length > 0 ? columns : flattenItems(content.prompts ?? content.goals ?? content.items ?? content.rows, 3)
  const overviewColumns = items.slice(0, 3).map((entry, index) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const itemTexts = flattenItems(entry.items ?? entry.body ?? entry.content, 3)
      return {
        label: text(entry.label ?? entry.title, index === 0 ? 'VOCABULARY' : index === 1 ? 'CORE CONCEPT' : 'DAY 3 REVIEW'),
        accent: accent(entry.accent, index === 2 ? 'amber' : index === 1 ? 'teal2' : 'teal'),
        term: text(entry.term ?? entry.title ?? entry.label, index === 0 ? 'FOCUS' : index === 1 ? 'CONNECT' : 'APPLY'),
        definition: text(entry.definition ?? itemTexts[0], ''),
        activity: text(entry.activity ?? itemTexts.slice(1).join('\n'), ''),
      }
    }
    return {
      label: index === 0 ? 'VOCABULARY' : index === 1 ? 'CORE CONCEPT' : 'DAY 3 REVIEW',
      accent: index === 2 ? 'amber' : index === 1 ? 'teal2' : 'teal',
      term: text(entry, index === 0 ? 'FOCUS' : index === 1 ? 'CONNECT' : 'APPLY'),
      definition: '',
      activity: '',
    }
  })
  while (overviewColumns.length < 3) {
    overviewColumns.push({ label: 'CLASSROOM', accent: overviewColumns.length === 2 ? 'amber' : 'teal', term: 'NEXT STEP', definition: '', activity: '' })
  }
  return {
    type: 'unit_overview',
    title: text(slideSpec.title, 'Unit Overview'),
    unit_number: text(slideSpec.unit_number ?? slideSpec.unit, ''),
    unit_name: text(slideSpec.unit_name ?? slideSpec.title, packet.topic),
    accent: accent(slideSpec.accent ?? packet.accent ?? packet.theme, 'teal'),
    columns: overviewColumns,
  }
}

function lessonFromGeneric(packet, slideSpec, content, visualPlan, day3 = false) {
  const columns = genericColumns(content)
  const left = columns[0] && typeof columns[0] === 'object' ? columns[0] : null
  const right = columns[1] && typeof columns[1] === 'object' ? columns[1] : null
  const prompts = flattenItems(content.prompts ?? content.goals ?? content.rows ?? content.items ?? visualPlan?.prompts, 5)
  const supportItems = flattenItems(right?.items ?? right?.body ?? right?.content ?? content.supports ?? content.rows ?? content.items, 5)
  return {
    type: day3 ? 'lesson_day3' : 'lesson_days12',
    accent: accent(slideSpec.accent ?? packet.accent ?? packet.theme, 'teal'),
    breadcrumb: text(slideSpec.breadcrumb ?? packet.lesson_label, day3 ? 'APPLICATION & EXTENSION' : 'CONCEPT DEVELOPMENT'),
    title: text(slideSpec.title, day3 ? 'Review + Extension' : 'Classroom Task'),
    left_card: {
      label: text(slideSpec.left_card?.label ?? left?.label ?? left?.title, day3 ? 'REVIEW' : 'VOCABULARY ANCHOR'),
      term: text(slideSpec.left_card?.term ?? content.term ?? visualPlan?.term ?? left?.title ?? slideSpec.title, 'FOCUS'),
      term_accent: day3 ? 'amber' : 'teal',
      term_box: day3 ? 'term_amber' : 'term_teal',
      definition: text(slideSpec.left_card?.definition ?? content.definition ?? content.subtitle ?? visualPlan?.subtitle, ''),
      highlight_instruction: text(slideSpec.left_card?.highlight_instruction, ''),
      secondary_label: text(slideSpec.left_card?.secondary_label, day3 ? 'AFTER READING:' : 'START HERE:'),
      content: text(slideSpec.left_card?.content ?? content.task ?? content.scenario ?? content.model ?? content.prompt ?? visualPlan?.prompt ?? prompts[0] ?? slideSpec.title, ''),
    },
    right_cards: Array.isArray(slideSpec.right_cards) && slideSpec.right_cards.length > 0
      ? slideSpec.right_cards.slice(0, 2)
      : [
          { label: text(right?.label ?? right?.title, day3 ? 'APPLICATION' : 'SUPPORT'), accent: day3 ? 'red' : 'teal', content: supportItems.join('\n') || prompts.slice(1).join('\n') },
          ...(day3 ? [{ label: 'ENRICHMENT', accent: 'purple', content: prompts.slice(1).join('\n') || text(content.takeaway, '') }] : []),
        ].filter((card) => text(card.content)),
  }
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

  const rows = genericRows(slideSpec, content)
  const columns = genericColumns(content)

  if (layout === 'rows' && rows.length >= 3) return scopeSequenceFromGeneric(packet, slideSpec, content)
  if (layout === 'three_rows' || columns.length >= 3) return unitOverviewFromGeneric(packet, slideSpec, content)
  if (slideIndex === 1 && (layout === 'two_column' || layout === 'planner_model' || layout === 'summary_rows' || columns.length >= 2)) {
    return howItWorksFromGeneric(packet, slideSpec, content)
  }
  if (layout === 'reflect' || rawType === 'reflect') return lessonFromGeneric(packet, slideSpec, content, visualPlan, true)
  if (layout === 'summary_rows' && rows.length >= 3) return scopeSequenceFromGeneric(packet, slideSpec, content)
  if (layout === 'bullet_focus' || layout === 'planner_model') return lessonFromGeneric(packet, slideSpec, content, visualPlan, false)
  if (layout.includes('compare') || layout === 'two_column') return lessonFromGeneric(packet, slideSpec, content, visualPlan, false)
  if (slideIndex > 0 && slideIndex % 4 === 0) return lessonFromGeneric(packet, slideSpec, content, visualPlan, true)
  return lessonFromGeneric(packet, slideSpec, content, visualPlan, false)
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
    .title-h1 { position: absolute; left: 70px; top: 70px; width: 980px; height: 280px; font-size: 104px; line-height: 1.02; font-weight: 700; color: var(--white); white-space: pre-line; letter-spacing: -3px; }
    .title-subtitle { position: absolute; left: 70px; top: 365px; width: 1260px; height: 54px; font-size: 24px; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; }
    .title-rule { position: absolute; left: 70px; top: 430px; width: 310px; height: 9px; }
    .title-meta { position: absolute; left: 70px; top: 455px; width: 1000px; color: var(--muted-dk); font-size: 22px; line-height: 1.5; }
    .title-bar { position:absolute; left:0; right:0; top:0; height:90px; background:var(--navy-bar); display:flex; align-items:center; padding:0 44px; }
    .title-bar h2 { color: var(--white); font-size:34px; font-weight:700; text-transform:uppercase; }
    .title-bar-underline { position:absolute; left:0; right:0; top:90px; height:6px; }
    .breadcrumb { position:absolute; left:0; right:0; top:96px; height:40px; display:flex; align-items:center; padding:0 44px; font-size:18px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
    .lesson-title-bar { position:absolute; left:0; right:0; top:136px; height:82px; display:flex; align-items:center; padding:0 44px; }
    .lesson-title-bar h2 { color: var(--white); font-size:32px; font-weight:700; }
    .card { position:absolute; background:var(--card-light); border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,.07); overflow:hidden; }
    .card-dark { background:var(--card-dark); border:none; }
    .card-pad { padding:26px 30px; }
    .card-header { height:58px; display:flex; align-items:center; padding:0 24px; }
    .card-header span { font-size:18px; font-weight:700; color:var(--white); text-transform:uppercase; letter-spacing:3px; }
    .section-label { font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:3px; margin-bottom:14px; }
    .key-term-box { border-radius:2px; padding:18px 22px; text-align:center; margin-bottom:18px; }
    .key-term-box .term { font-size:48px; font-weight:700; line-height:1.05; }
    .key-term-box .definition { font-size:21px; font-style:italic; color:var(--muted); margin-top:10px; }
    .body-text { font-size:27px; line-height:1.28; color:var(--dark); white-space:pre-line; }
    .body-small { font-size:22px; line-height:1.3; color:var(--dark); white-space:pre-line; }
    .muted { color:var(--muted); }
    .overview-title { position:absolute; left:50px; top:40px; color:var(--white); font-size:78px; font-weight:700; }
    .overview-name { position:absolute; left:50px; top:145px; color:var(--muted-dk); font-size:30px; }
    .overview-col { position:absolute; top:230px; width:456px; }
    .overview-header { height:70px; display:flex; align-items:center; justify-content:center; color:var(--white); font-size:18px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
    .overview-card { height:370px; background:var(--card-dark); display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:42px 28px 28px; }
    .overview-term { font-size:48px; font-weight:700; line-height:1.06; text-align:center; margin-bottom:18px; }
    .overview-def { color:var(--muted-dk); font-size:22px; line-height:1.22; text-align:center; font-style:italic; min-height:72px; }
    .overview-activity { color:var(--muted-dk); font-size:22px; line-height:1.25; text-align:center; margin-top:28px; }
    table.scope { position:absolute; top:126px; left:30px; width:1504px; border-collapse:collapse; font-size:20px; color:var(--dark); }
    table.scope th { color:var(--white); padding:16px 14px; text-align:left; font-size:17px; letter-spacing:1px; text-transform:uppercase; }
    table.scope td { background:var(--card-light); border-bottom:1px solid var(--border); padding:18px 14px; line-height:1.28; vertical-align:top; }
    .how-card { position:absolute; top:128px; width:728px; height:675px; }
    .how-body { position:absolute; left:0; top:70px; width:728px; height:605px; background:var(--card-light); border:1px solid var(--border); padding:34px 38px; }
    .how-section { margin-bottom:34px; }
    .how-section h3 { color:var(--dark); font-size:27px; font-weight:700; margin-bottom:12px; }
    .how-section p { color:var(--muted); font-size:24px; line-height:1.36; }
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
    return `<div class="how-card" style="left:${x}px;"><div class="card-header bg-${ca}" style="height:70px;"><span>${escapeHtml(text(card.label).toUpperCase())}</span></div><div class="how-body">${sections.map((section) => `<div class="how-section"><h3>${escapeHtml(text(section.heading ?? section.head))}</h3><p>${escapeHtml(text(section.body))}</p></div>`).join('')}</div></div>`
  }).join('')
  return htmlDoc(`<div class="slide slide-light"><div class="title-bar"><h2>${escapeHtml(text(slide.title, 'HOW THIS DECK WORKS'))}</h2></div><div class="title-bar-underline bg-${a}"></div>${renderedCards}<div style="position:absolute;left:30px;right:30px;top:845px;text-align:center;color:var(--muted);font-size:20px;">${escapeHtml(text(slide.footer))}</div></div>`)
}

function renderScopeSequence(slide) {
  const a = accent(slide.accent, 'teal')
  const columns = Array.isArray(slide.columns) ? slide.columns : ['#', 'Focus', 'Key idea', 'Classroom work', 'Evidence']
  const rows = Array.isArray(slide.rows) ? slide.rows : []
  const widths = Array.isArray(slide.col_widths) ? slide.col_widths : [0.4, 1.5, 2.8, 2.9, 1.8]
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
  return htmlDoc(`<div class="slide slide-dark"><div class="accent-bar bottom bg-${a}"></div><div class="overview-title">${text(slide.unit_number) ? `UNIT ${escapeHtml(text(slide.unit_number))}` : escapeHtml(text(slide.title, 'UNIT OVERVIEW'))}</div><div class="overview-name">${escapeHtml(text(slide.unit_name, 'Unit Overview'))}</div>${renderedCols}</div>`)
}

function renderLeftCard(card, a, day3 = false) {
  const termAccent = accent(card.term_accent, a)
  const boxClass = termBox(card.term_box, termAccent)
  const highlight = text(card.highlight_instruction) ? `<div class="body-small c-${a}" style="font-style:italic;margin:4px 0 18px;">${htmlLines(card.highlight_instruction)}</div>` : ''
  return `<div class="card card-pad" style="left:30px;top:240px;width:728px;height:568px;">
    <div class="section-label c-${a}">${escapeHtml(text(card.label, day3 ? 'REVIEW' : 'VOCABULARY ANCHOR').toUpperCase())}</div>
    <div class="key-term-box" style="background:var(--${boxClass});"><div class="term c-${termAccent}">${htmlLines(card.term)}</div>${text(card.definition) ? `<div class="definition">${htmlLines(card.definition)}</div>` : ''}</div>
    ${highlight}
    <div class="section-label ${day3 ? 'muted' : `c-${a}`}">${escapeHtml(text(card.secondary_label, 'START HERE').toUpperCase())}</div>
    <div class="body-text" style="margin-top:10px;">${htmlLines(card.content)}</div>
  </div>`
}

function renderRightCards(cards, a, day3 = false) {
  const list = Array.isArray(cards) && cards.length > 0 ? cards.slice(0, 2) : [{ label: 'SUPPORT', content: '' }]
  const heights = list.length === 1 ? [568] : [268, 278]
  const tops = list.length === 1 ? [240] : [240, 530]
  return list.map((card, index) => {
    const ca = accent(card.accent, day3 ? (index === 0 ? 'red' : 'purple') : a)
    if (day3) {
      return `<div class="card" style="left:824px;top:${tops[index]}px;width:728px;height:${heights[index]}px;"><div class="card-header bg-${ca}"><span>${escapeHtml(text(card.label).toUpperCase())}</span></div><div style="padding:28px 36px;"><div class="body-text">${htmlLines(card.content)}</div></div></div>`
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
  const semanticText = pieces.map((item) => text(item)).filter(Boolean).join(' · ')
  return capWords(semanticText, 72)
}
