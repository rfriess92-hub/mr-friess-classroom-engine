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

function words(value) {
  return text(value).match(/\b[\w'-]+\b/g) ?? []
}

function clamp(value, maxWords = 18) {
  const tokenized = words(value)
  if (tokenized.length <= maxWords) return text(value)
  return `${tokenized.slice(0, maxWords).join(' ')}…`
}

function flattenItems(value, limit = 4) {
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
      if (entry.title != null && entry.items != null) {
        out.push([text(entry.title), ...flattenItems(entry.items, 2)].filter(Boolean).join(' — '))
        return
      }
      const pieces = Object.values(entry).filter((item) => typeof item === 'string' || typeof item === 'number').map((item) => text(item)).filter(Boolean)
      if (pieces.length > 0) out.push(pieces.join(' — '))
    }
  }
  visit(value)
  return out.slice(0, limit)
}

function slideVisualPage(packet, slideIndex) {
  const pages = packet?.visual?.pages
  if (!Array.isArray(pages)) return null
  const page = pages[slideIndex]
  return page && typeof page === 'object' ? page : null
}

function contentPlan(packet, slideSpec, slideIndex) {
  const page = slideVisualPage(packet, slideIndex)
  if (page?.content_plan && typeof page.content_plan === 'object') return page.content_plan

  const content = slideSpec?.content && typeof slideSpec.content === 'object' ? slideSpec.content : {}
  const layout = text(slideSpec?.layout, 'prompt').toLowerCase()
  const title = text(slideSpec?.title, 'Classroom slide')

  if (layout === 'hero') return { title, subtitle: text(content.subtitle) }

  if (layout.includes('compare') || layout === 'two_column') {
    const columns = Array.isArray(content.columns) ? content.columns : []
    if (columns.length >= 2) {
      const left = typeof columns[0] === 'object' ? columns[0] : { title: 'First idea', items: [columns[0]] }
      const right = typeof columns[1] === 'object' ? columns[1] : { title: 'Second idea', items: [columns[1]] }
      return {
        left_title: text(left.title, 'First idea'),
        left_body: flattenItems(left.items, 3).join(' · '),
        right_title: text(right.title, 'Second idea'),
        right_body: flattenItems(right.items, 3).join(' · '),
        takeaway: text(content.takeaway),
      }
    }
    return {
      left_title: 'First idea',
      left_body: text(content.left),
      right_title: 'Second idea',
      right_body: text(content.right),
      takeaway: text(content.takeaway),
    }
  }

  if (layout === 'reflect' || layout === 'reflection') {
    return {
      invitation: text(content.task ?? content.headline, title),
      prompts: flattenItems(content.prompts ?? content.goals, 2),
    }
  }

  if (layout === 'planner_model' || layout === 'summary_rows' || layout === 'bullet_focus') {
    return {
      model: text(content.model ?? content.headline ?? content.task, title),
      support: flattenItems(content.supports ?? content.items ?? content.rows, 3).join(' · '),
    }
  }

  return {
    prompt: text(content.task ?? content.scenario ?? content.headline, title),
    prompts: flattenItems(content.prompts ?? content.rows ?? content.items ?? content.goals, 3),
  }
}

function slideFamily(packet, slideSpec, slideIndex) {
  const page = slideVisualPage(packet, slideIndex)
  if (page?.layout_id) return text(page.layout_id)
  const layout = text(slideSpec?.layout, 'prompt').toLowerCase()
  if (layout === 'hero') return 'S_HERO'
  if (layout.includes('compare') || layout === 'two_column') return 'S_COMPARE'
  if (layout === 'reflect' || layout === 'reflection') return 'S_REFLECT'
  if (layout === 'planner_model' || layout === 'summary_rows' || layout === 'bullet_focus') return 'S_MODEL'
  return 'S_PROMPT'
}

function theme(packet) {
  const subject = text(packet.subject).toLowerCase()
  const declared = text(packet.theme).toLowerCase()
  if (declared.includes('ela') || subject.includes('english')) return { name: 'ela', accent: '#6d28d9', accent2: '#2563eb', support: '#b45309' }
  if (declared.includes('career') || subject.includes('career')) return { name: 'careers', accent: '#2563eb', accent2: '#b45309', support: '#15803d' }
  if (declared.includes('math') || subject.includes('math')) return { name: 'math', accent: '#1d4ed8', accent2: '#15803d', support: '#b45309' }
  return { name: 'default', accent: '#b91c1c', accent2: '#b45309', support: '#15803d' }
}

function css(tokens) {
  return `
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .slide { width: 1600px; height: 900px; background: #f8fafc; position: relative; overflow: hidden; padding: 74px 92px 64px; }
    .topline { position: absolute; inset: 0 0 auto 0; height: 16px; background: ${tokens.accent}; }
    .meta { color: #64748b; font-size: 24px; font-weight: 700; letter-spacing: .02em; margin-bottom: 22px; }
    h1 { font-size: 64px; line-height: .98; margin: 0; letter-spacing: -.04em; max-width: 1280px; }
    .rule { width: 100%; height: 3px; background: #cbd5e1; margin: 28px 0 42px; }
    .footer { position: absolute; left: 92px; right: 92px; bottom: 28px; color: #64748b; font-size: 18px; }
    .hero { background: ${tokens.accent}; color: white; padding: 96px 108px; display: flex; flex-direction: column; justify-content: center; }
    .hero .eyebrow { font-size: 28px; font-weight: 800; opacity: .88; margin-bottom: 44px; }
    .hero h1 { color: white; font-size: 88px; max-width: 1260px; }
    .hero .subtitle { font-size: 44px; line-height: 1.08; margin-top: 46px; max-width: 1160px; opacity: .94; }
    .panel { background: white; border: 3px solid #cbd5e1; border-left: 18px solid ${tokens.accent}; border-radius: 30px; padding: 36px 44px; box-shadow: 0 18px 38px rgba(15, 23, 42, .08); }
    .panel.secondary { border-left-color: ${tokens.accent2}; }
    .panel.support { border-left-color: ${tokens.support}; background: #ffffff; }
    .label { color: ${tokens.accent}; font-size: 28px; font-weight: 900; margin-bottom: 18px; letter-spacing: .01em; }
    .label.secondary { color: ${tokens.accent2}; }
    .label.support { color: ${tokens.support}; }
    .big { font-size: 52px; line-height: 1.06; letter-spacing: -.03em; font-weight: 800; }
    .medium { font-size: 38px; line-height: 1.15; font-weight: 700; }
    .body { font-size: 34px; line-height: 1.18; font-weight: 600; }
    .muted { color: #475569; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; }
    .prompt-list { display: grid; gap: 20px; margin-top: 34px; }
    .prompt-item { display: grid; grid-template-columns: 56px 1fr; gap: 20px; align-items: start; font-size: 32px; line-height: 1.18; font-weight: 700; }
    .num { width: 56px; height: 56px; border-radius: 999px; background: #e2e8f0; display: grid; place-items: center; color: #0f172a; font-weight: 900; }
    .reflect-stack { display: grid; gap: 28px; margin-top: 44px; }
    .reflect-card { background: white; border: 3px solid #cbd5e1; border-left: 18px solid ${tokens.support}; border-radius: 26px; padding: 28px 36px; font-size: 34px; line-height: 1.15; font-weight: 700; }
  `
}

function frame(packet, slideSpec, inner) {
  const tokens = theme(packet)
  const title = escapeHtml(text(slideSpec?.title, text(packet.topic, 'Lesson')))
  const meta = escapeHtml([packet.subject, packet.grade, packet.lesson_label].map((item) => text(item)).filter(Boolean).join(' · '))
  const footer = escapeHtml([packet.subject, packet.grade, packet.topic].map((item) => text(item)).filter(Boolean).join(' · '))
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(tokens)}</style></head><body><main class="slide"><div class="topline"></div><div class="meta">${meta}</div><h1>${title}</h1><div class="rule"></div>${inner}<div class="footer">${footer}</div></main></body></html>`
}

function hero(packet, slideSpec, plan) {
  const tokens = theme(packet)
  const meta = escapeHtml([packet.subject, packet.grade, packet.lesson_label].map((item) => text(item)).filter(Boolean).join(' · '))
  const title = escapeHtml(clamp(plan.title ?? slideSpec?.title ?? packet.topic, 12))
  const subtitle = text(plan.subtitle) ? `<div class="subtitle">${escapeHtml(clamp(plan.subtitle, 18))}</div>` : ''
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(tokens)}</style></head><body><main class="slide hero"><div class="eyebrow">${meta}</div><h1>${title}</h1>${subtitle}</main></body></html>`
}

function prompt(packet, slideSpec, plan) {
  const items = flattenItems(plan.prompts, 3).map((item, index) => `<div class="prompt-item"><div class="num">${index + 1}</div><div>${escapeHtml(clamp(item, 16))}</div></div>`).join('')
  const inner = `<section class="panel"><div class="label">Start here</div><div class="big">${escapeHtml(clamp(plan.prompt ?? slideSpec?.title, 16))}</div></section>${items ? `<section class="prompt-list">${items}</section>` : ''}`
  return frame(packet, slideSpec, inner)
}

function model(packet, slideSpec, plan) {
  const support = text(plan.support) ? `<section class="panel support" style="margin-top:32px;"><div class="label support">Useful support</div><div class="body muted">${escapeHtml(clamp(plan.support, 20))}</div></section>` : ''
  const inner = `<section class="panel secondary"><div class="label secondary">Model</div><div class="medium">${escapeHtml(clamp(plan.model ?? slideSpec?.title, 24))}</div></section>${support}`
  return frame(packet, slideSpec, inner)
}

function compare(packet, slideSpec, plan) {
  const inner = `<section class="grid2"><div class="panel"><div class="label">${escapeHtml(clamp(plan.left_title, 5))}</div><div class="body">${escapeHtml(clamp(plan.left_body, 22))}</div></div><div class="panel secondary"><div class="label secondary">${escapeHtml(clamp(plan.right_title, 5))}</div><div class="body">${escapeHtml(clamp(plan.right_body, 22))}</div></div></section>${text(plan.takeaway) ? `<div class="body muted" style="text-align:center;margin-top:34px;">${escapeHtml(clamp(plan.takeaway, 18))}</div>` : ''}`
  return frame(packet, slideSpec, inner)
}

function reflect(packet, slideSpec, plan) {
  const cards = flattenItems(plan.prompts, 2).map((item, index) => `<div class="reflect-card">${index + 1}. ${escapeHtml(clamp(item, 18))}</div>`).join('')
  const inner = `<div class="big" style="text-align:center;margin-top:12px;">${escapeHtml(clamp(plan.invitation ?? slideSpec?.title, 18))}</div>${cards ? `<section class="reflect-stack">${cards}</section>` : ''}`
  return frame(packet, slideSpec, inner)
}

export function buildClassroomSlideHTML(packet, slideSpec, slideIndex) {
  const plan = contentPlan(packet, slideSpec, slideIndex)
  const family = slideFamily(packet, slideSpec, slideIndex)
  if (family === 'S_HERO') return hero(packet, slideSpec, plan)
  if (family === 'S_COMPARE') return compare(packet, slideSpec, plan)
  if (family === 'S_MODEL') return model(packet, slideSpec, plan)
  if (family === 'S_REFLECT') return reflect(packet, slideSpec, plan)
  return prompt(packet, slideSpec, plan)
}

export function buildClassroomSlideSemanticText(packet, slideSpec, slideIndex) {
  const plan = contentPlan(packet, slideSpec, slideIndex)
  const values = [
    packet.subject,
    packet.grade,
    packet.topic,
    slideSpec?.title,
    plan.title,
    plan.subtitle,
    plan.prompt,
    plan.model,
    plan.support,
    plan.left_title,
    plan.left_body,
    plan.right_title,
    plan.right_body,
    plan.takeaway,
    plan.invitation,
    ...flattenItems(plan.prompts, 4),
  ]
  return values.map((item) => text(item)).filter(Boolean).join(' · ')
}
