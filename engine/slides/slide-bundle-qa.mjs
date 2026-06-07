import { resolveSourceSection } from '../schema/source-section.mjs'
import { summarizeSlideBundle } from './slide-bundle.mjs'

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function makeCheck(checkId, passed, detail, status = 'block') {
  return {
    check_id: checkId,
    status: passed ? 'pass' : status,
    detail,
  }
}

function numberFromSection(section, key, fallback) {
  const value = Number(section?.[key])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function runDailySlideDeckBundleQa({ pkg, route, slides }) {
  if (route?.output_type !== 'daily_slide_deck_bundle') return null

  const section = resolveSourceSection(pkg, route.source_section)
  const summary = summarizeSlideBundle(pkg, route, slides)
  const packageDayCount = summary.package_day_count
  const declaredDeckCount = summary.declared_deck_count
  const targetDayCount = Math.max(
    1,
    numberFromSection(section, 'expected_day_count', 0),
    Number(pkg?.session_count ?? 0),
    packageDayCount,
    declaredDeckCount,
  )
  const minSlidesPerDay = numberFromSection(section, 'min_slides_per_day', 2)
  const minSlideCount = numberFromSection(section, 'min_slide_count', targetDayCount * minSlidesPerDay)

  const hasSlides = summary.slide_count > 0
  const enoughSlides = summary.slide_count >= minSlideCount
  const coversDays = targetDayCount <= 1 || summary.represented_day_count === 0 || summary.represented_day_count >= Math.min(targetDayCount, declaredDeckCount || targetDayCount)
  const hasDeclaredBundleShape = Array.isArray(section?.daily_decks)
    || Array.isArray(section?.decks)
    || Array.isArray(section?.days)
    || Array.isArray(section?.slides)
    || Array.isArray(pkg?.days)

  const checks = [
    makeCheck(
      'daily_slide_deck_bundle.has_slides',
      hasSlides,
      hasSlides
        ? `Bundle resolves to ${summary.slide_count} slide(s).`
        : 'Bundle does not resolve to any slide nodes.',
    ),
    makeCheck(
      'daily_slide_deck_bundle.minimum_depth',
      enoughSlides,
      enoughSlides
        ? `Bundle meets minimum depth: ${summary.slide_count}/${minSlideCount} slides.`
        : `Bundle is too thin: ${summary.slide_count}/${minSlideCount} slides. Default is two slides per represented class day unless overridden.`,
    ),
    makeCheck(
      'daily_slide_deck_bundle.day_coverage',
      coversDays,
      coversDays
        ? `Bundle day coverage is acceptable for ${targetDayCount} target day(s).`
        : `Bundle only marks ${summary.represented_day_count} represented day(s) for ${targetDayCount} target day(s).`,
      'revise',
    ),
    makeCheck(
      'daily_slide_deck_bundle.declared_shape',
      isObject(section) || Array.isArray(section) || Array.isArray(pkg?.days),
      hasDeclaredBundleShape
        ? 'Bundle has a recognizable slides/decks/days source shape.'
        : 'Bundle source should declare slides, daily_decks, decks, days, or rely on package days[*].slides.',
      'revise',
    ),
  ]

  const hasBlock = checks.some((check) => check.status === 'block')
  const hasRevise = checks.some((check) => check.status === 'revise')

  return {
    qa_scope: 'daily_slide_deck_bundle',
    package_id: pkg?.package_id ?? null,
    output_id: route.output_id,
    target_day_count: targetDayCount,
    min_slides_per_day: minSlidesPerDay,
    min_slide_count: minSlideCount,
    ...summary,
    judgment: hasBlock ? 'block' : hasRevise ? 'revise' : 'pass',
    check_count: checks.length,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    fail_count: checks.filter((check) => check.status !== 'pass').length,
    checks,
  }
}
