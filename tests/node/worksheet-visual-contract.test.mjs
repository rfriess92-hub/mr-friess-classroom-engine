import test from 'node:test'
import assert from 'node:assert/strict'

import { buildVisualArtifactPlan } from '../../engine/visual/component-mapper.mjs'
import { runVisualQaOnPlan } from '../../engine/visual/qa.mjs'

function worksheetRoute(outputType) {
  return {
    route_id: `route-${outputType}`,
    output_id: `${outputType}_main`,
    output_type: outputType,
    variant_role: 'core',
    density: 'medium',
    length_band: 'standard',
    render_intent: outputType === 'task_sheet' ? 'staged_week_workflow' : 'single_final_evidence',
  }
}

test('task-sheet visual plan keeps one dominant prompt while later tasks step down', () => {
  const section = {
    title: 'Weekly packet',
    instructions: ['Read the focus.', 'Complete both parts.'],
    embedded_supports: ['Use one specific example if you can.'],
    success_criteria: ['Finish both parts clearly.'],
    tasks: [
      { label: 'Day 1 - First look', prompt: 'What do you notice first about your own habits?' },
      { label: 'Day 1 - Next move', prompt: 'Where do you see that habit show up in class?' },
      { label: 'Day 1 - Carry it forward', prompt: 'What might you try next?' },
    ],
  }

  const plan = buildVisualArtifactPlan({}, worksheetRoute('task_sheet'), section)
  const firstPage = plan.pages[0]
  const mainPrompts = firstPage.components.filter((component) => component.visual_role === 'main_prompt')
  const secondaryPrompts = firstPage.components.filter((component) => component.visual_role === 'secondary_prompt')

  assert.equal(mainPrompts.length, 1)
  assert.equal(secondaryPrompts.length >= 2, true)

  const qa = runVisualQaOnPlan(plan)
  assert.equal(qa.findings.some((finding) => finding.type === 'main_task_visible'), false, JSON.stringify(qa, null, 2))
  assert.equal(qa.findings.some((finding) => finding.type === 'not_all_rectangles'), false, JSON.stringify(qa, null, 2))
})

test('final-response visual plan uses a quiet prompt plus softened draft surface', () => {
  const section = {
    title: 'Career Identity Snapshot',
    prompt: 'Write your final snapshot using details that feel true and specific.',
    response_lines: 10,
    success_criteria: ['My response sounds like me.', 'My next step feels realistic.'],
    render_hints: {
      prompt_label: 'Use this page for your final snapshot',
      response_label: 'Write your snapshot here',
      quick_check_label: 'Before you hand it in',
    },
  }

  const plan = buildVisualArtifactPlan({}, worksheetRoute('final_response_sheet'), section)
  const page = plan.pages[0]
  const promptComponents = page.components.filter((component) => component.visual_role === 'secondary_prompt')
  const responseComponents = page.components.filter((component) => component.visual_role === 'student_response')
  const successComponents = page.components.filter((component) => component.visual_role === 'success_check')

  assert.equal(promptComponents.length, 1)
  assert.equal(responseComponents.length, 1)
  assert.equal(successComponents.length, 1)
  assert.equal(responseComponents[0].resolved_visual?.style?.radius_token, 'soft')

  const qa = runVisualQaOnPlan(plan)
  assert.equal(qa.findings.some((finding) => finding.type === 'not_all_rectangles'), false, JSON.stringify(qa, null, 2))
})
