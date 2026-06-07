import { resolveSourceSection } from '../schema/source-section.mjs'

export const SLIDE_LIKE_OUTPUT_TYPES = new Set(['slides', 'daily_slide_deck_bundle'])

function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

export function isSlideLikeOutputType(outputType) {
  return SLIDE_LIKE_OUTPUT_TYPES.has(outputType)
}

export function isSlideNode(value) {
  return isObject(value) && (typeof value.title === 'string' || typeof value.layout === 'string' || isObject(value.content))
}

function normalizeSlide(slide, context = {}) {
  if (!isObject(slide)) return null
  return {
    ...slide,
    day_id: slide.day_id ?? context.day_id ?? null,
    day_label: slide.day_label ?? context.day_label ?? null,
    deck_id: slide.deck_id ?? context.deck_id ?? null,
  }
}

function dividerSlideFor(context) {
  const dayLabel = String(context.day_label ?? context.title ?? '').trim()
  if (!dayLabel) return null
  return {
    title: dayLabel,
    layout: 'hero',
    type: 'LAUNCH',
    day_id: context.day_id ?? null,
    day_label: dayLabel,
    deck_id: context.deck_id ?? null,
    content: {
      subtitle: context.focus ?? context.subtitle ?? 'Classroom slide deck section',
      course_note: context.course_note ?? '',
    },
    image_intent: { disallow_images: true },
  }
}

function deckSlides(deck, parent = {}) {
  if (!isObject(deck)) return []
  const context = {
    day_id: deck.day_id ?? parent.day_id ?? null,
    day_label: deck.day_label ?? deck.label ?? deck.title ?? parent.day_label ?? null,
    deck_id: deck.deck_id ?? deck.output_id ?? parent.deck_id ?? null,
    title: deck.title ?? deck.day_label ?? parent.title ?? null,
    subtitle: deck.subtitle ?? deck.focus ?? parent.subtitle ?? null,
    focus: deck.focus ?? parent.focus ?? null,
    course_note: deck.course_note ?? parent.course_note ?? null,
  }

  const rawSlides = safeArray(deck.slides)
  const slides = rawSlides.map((slide) => normalizeSlide(slide, context)).filter(Boolean)
  if (slides.length === 0) return []

  const shouldInsertDivider = deck.include_day_divider === true || parent.include_day_dividers === true
  const divider = shouldInsertDivider ? dividerSlideFor(context) : null
  return divider ? [divider, ...slides] : slides
}

export function extractSlidesFromBundleSection(section, pkg = {}) {
  if (Array.isArray(section)) {
    if (section.every(isSlideNode)) return section.map((slide) => normalizeSlide(slide)).filter(Boolean)
    return section.flatMap((entry) => deckSlides(entry))
  }

  if (isObject(section)) {
    if (Array.isArray(section.slides) && section.slides.every(isSlideNode)) {
      return section.slides.map((slide) => normalizeSlide(slide, section)).filter(Boolean)
    }

    for (const key of ['daily_decks', 'decks', 'days', 'sections']) {
      if (Array.isArray(section[key])) {
        const slides = section[key].flatMap((entry) => deckSlides(entry, section))
        if (slides.length > 0) return slides
      }
    }
  }

  if (Array.isArray(pkg.days)) {
    const slides = pkg.days.flatMap((day) => deckSlides(day, { include_day_dividers: section?.include_day_dividers === true }))
    if (slides.length > 0) return slides
  }

  if (Array.isArray(pkg.slides)) {
    return pkg.slides.map((slide) => normalizeSlide(slide)).filter(Boolean)
  }

  return []
}

export function extractSlidesForRoute(pkg, route) {
  if (route?.output_type === 'slides') {
    const slides = resolveSourceSection(pkg, route.source_section)
    return Array.isArray(slides) ? slides.map((slide) => normalizeSlide(slide)).filter(Boolean) : []
  }

  const section = resolveSourceSection(pkg, route?.source_section)
  return extractSlidesFromBundleSection(section, pkg)
}

export function summarizeSlideBundle(pkg, route, slides) {
  const section = resolveSourceSection(pkg, route?.source_section)
  const explicitDecks = isObject(section)
    ? safeArray(section.daily_decks).concat(safeArray(section.decks), safeArray(section.days)).filter(isObject)
    : []
  const dayLabels = new Set(
    safeArray(slides)
      .map((slide) => slide?.day_label ?? slide?.day_id ?? null)
      .filter(Boolean),
  )
  return {
    output_id: route?.output_id ?? null,
    output_type: route?.output_type ?? null,
    slide_count: safeArray(slides).length,
    declared_deck_count: explicitDecks.length,
    represented_day_count: dayLabels.size,
    package_day_count: Array.isArray(pkg?.days) ? pkg.days.length : 0,
  }
}
