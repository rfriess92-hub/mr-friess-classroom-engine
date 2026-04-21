import test from 'node:test'
import assert from 'node:assert/strict'

import { buildVisualArtifactPlan } from '../../engine/visual/component-mapper.mjs'
import { validateVisualPlanPageRoles } from '../../engine/visual/validate-plan.mjs'
import { runVisualQaOnPlan } from '../../engine/visual/qa.mjs'

function slideRoute() {
  return {
    route_id: 'route-slides',
    output_id: 'week_slides',
    output_type: 'slides',
    variant_role: 'core',
  }
}

test('slide visual plan routes deck pages into the new classroom slide families', () => {
  const slides = [
    {
      title: 'Week opener',
      layout: 'hero',
      type: 'ENGAGE',
      content: { subtitle: 'Start with the big question.' },
    },
    {
      title: 'Talk it through',
      layout: 'prompt',
      type: 'ENGAGE',
      content: {
        scenario: 'What do you notice first when you look at this situation?',
        prompts: ['What stands out?', 'What changes your mind?'],
      },
    },
    {
      title: 'One example',
      layout: 'planner_model',
      type: 'LEARN',
      content: {
        model: 'A short example stays focused on one clear move.',
        supports: ['Keep the model short.', 'Notice the exact choice it makes.'],
      },
    },
    {
      title: 'Compare the two',
      layout: 'two_column_compare',
      content: {
        left: 'Fast answer',
        right: 'Better answer',
        prompts: ['Which one helps more?'],
      },
    },
    {
      title: 'Pause and reflect',
      layout: 'reflect',
      type: 'REFLECT',
      content: {
        prompts: ['What are you leaving with?', 'What still feels open?'],
      },
    },
  ]

  const plan = buildVisualArtifactPlan({}, slideRoute(), slides)
  const pageRoles = plan.pages.map((page) => page.page_role)
  const layoutIds = plan.pages.map((page) => page.layout_id)

  assert.deepEqual(pageRoles, ['hero', 'prompt', 'model', 'compare', 'reflect'])
  assert.deepEqual(layoutIds, ['S_HERO', 'S_PROMPT', 'S_MODEL', 'S_COMPARE', 'S_REFLECT'])

  const preflight = validateVisualPlanPageRoles(plan)
  assert.equal(preflight.valid, true)

  const qa = runVisualQaOnPlan(plan)
  assert.equal(qa.judgment, 'pass', JSON.stringify(qa, null, 2))
})

test('slide visual QA blocks small text and over-budget prompt slides', () => {
  const slides = [
    {
      title: 'Crowded prompt',
      layout: 'prompt',
      type: 'ENGAGE',
      content: {
        scenario: 'This prompt deliberately uses a long block of classroom text so the contract can catch when a single slide tries to carry too much explanation before students have even started talking about the idea.',
        prompts: [
          'What do you notice first?',
          'What seems important now?',
          'What would you ask next?',
          'What might someone else say?',
        ],
      },
    },
  ]

  const plan = buildVisualArtifactPlan({}, slideRoute(), slides)
  plan.pages[0].metrics.body_font_pt = 22

  const qa = runVisualQaOnPlan(plan)
  const failingRules = qa.findings.map((finding) => finding.type)

  assert.equal(qa.judgment, 'block')
  assert.match(JSON.stringify(failingRules), /SL-TXT-002/)
  assert.match(JSON.stringify(failingRules), /SL-WRD-001/)
  assert.match(JSON.stringify(failingRules), /SL-PRM-002/)
})
