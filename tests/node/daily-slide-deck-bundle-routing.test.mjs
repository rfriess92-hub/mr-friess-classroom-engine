import test from 'node:test'
import assert from 'node:assert/strict'
import { planPackageRoutes } from '../../engine/planner/output-router.mjs'
import { buildArtifactTrace } from '../../engine/render/artifact-classifier.mjs'
import { resolveTemplateRoute } from '../../engine/render/template-router.mjs'
import { buildRouteVisualPlan } from '../../engine/visual/plan-visuals.mjs'
import { extractSlidesForRoute } from '../../engine/slides/slide-bundle.mjs'
import { runDailySlideDeckBundleQa } from '../../engine/slides/slide-bundle-qa.mjs'

function slide(title, layout = 'prompt') {
  return {
    title,
    layout,
    content: layout === 'hero'
      ? { subtitle: `${title} focus` }
      : { task: `${title} classroom prompt`, prompts: ['Think first', 'Share evidence'] },
    image_intent: { disallow_images: true },
  }
}

function packageFixture() {
  return {
    schema_version: '2.1.0',
    package_id: 'daily_slide_bundle_fixture',
    primary_architecture: 'multi_day_sequence',
    session_count: 2,
    subject: 'Psychology',
    grade: '11-12',
    topic: 'Research Methods',
    theme: 'social_science',
    days: [
      { day_id: 'day_01', day_label: 'Day 1' },
      { day_id: 'day_02', day_label: 'Day 2' },
    ],
    bundle: {
      bundle_id: 'daily_slide_bundle_fixture',
      declared_outputs: ['daily_slide_deck_bundle'],
    },
    outputs: [
      {
        output_id: 'a1_daily_slide_decks',
        output_type: 'daily_slide_deck_bundle',
        audience: 'shared_view',
        source_section: 'daily_slide_deck_bundle',
      },
    ],
    daily_slide_deck_bundle: {
      title: 'A1 Daily Slide Decks',
      expected_day_count: 2,
      min_slides_per_day: 2,
      daily_decks: [
        { day_id: 'day_01', day_label: 'Day 1', slides: [slide('Day 1 Launch', 'hero'), slide('Day 1 Apply')] },
        { day_id: 'day_02', day_label: 'Day 2', slides: [slide('Day 2 Launch', 'hero'), slide('Day 2 Apply')] },
      ],
    },
  }
}

test('daily_slide_deck_bundle routes as a PPTX slide-mode artifact', () => {
  const pkg = packageFixture()
  const { validation, routes } = planPackageRoutes(pkg)
  assert.equal(validation.valid, true, validation.errors.map((error) => error.message).join('; '))
  assert.equal(routes.length, 1)
  const [route] = routes
  assert.equal(route.renderer_family, 'pptx')

  const trace = buildArtifactTrace(pkg, route)
  assert.equal(trace.artifact_class, 'daily_slide_deck_bundle')
  assert.equal(trace.mode, 'slide_mode')
  assert.equal(trace.package_system_role, 'daily_slide_deck_bundle')

  const template = resolveTemplateRoute(trace)
  assert.equal(template.template_family, 'DAILY_SLIDE_DECK_BUNDLE')
})

test('daily_slide_deck_bundle resolves to visual slide pages and passes depth QA', () => {
  const pkg = packageFixture()
  const { routes } = planPackageRoutes(pkg)
  const [route] = routes
  const slides = extractSlidesForRoute(pkg, route)
  assert.equal(slides.length, 4)
  assert.equal(new Set(slides.map((entry) => entry.day_label)).size, 2)

  const visual = buildRouteVisualPlan(pkg, route).visual_plan
  assert.equal(visual.output_type, 'daily_slide_deck_bundle')
  assert.equal(visual.artifact_type, 'slide_deck')
  assert.equal(visual.pages.length, 4)

  const qa = runDailySlideDeckBundleQa({ pkg, route, slides })
  assert.equal(qa.judgment, 'pass')
  assert.equal(qa.slide_count, 4)
  assert.equal(qa.min_slide_count, 4)
})

test('daily_slide_deck_bundle QA blocks a too-thin deck', () => {
  const pkg = packageFixture()
  pkg.daily_slide_deck_bundle.daily_decks[1].slides = []
  const { routes } = planPackageRoutes(pkg)
  const [route] = routes
  const slides = extractSlidesForRoute(pkg, route)
  const qa = runDailySlideDeckBundleQa({ pkg, route, slides })
  assert.equal(qa.judgment, 'block')
  assert.ok(qa.checks.some((check) => check.check_id === 'daily_slide_deck_bundle.minimum_depth' && check.status === 'block'))
})
