import test from 'node:test'
import assert from 'node:assert/strict'

import { buildPlanterVolumeDecisionHTML, isPlanterVolumeDecisionLayout } from '../../engine/pdf-html/templates/planter-volume-decision.mjs'

test('planter volume decision layout id is recognized', () => {
  assert.equal(isPlanterVolumeDecisionLayout('planter_volume_decision'), true)
  assert.equal(isPlanterVolumeDecisionLayout('Planter Volume Decision'), true)
  assert.equal(isPlanterVolumeDecisionLayout('generic_graphic_organizer'), false)
})

test('planter volume decision template renders classroom math decision sections', () => {
  const html = buildPlanterVolumeDecisionHTML(
    { grade: 8, subject: 'Math', topic: 'Planter volume' },
    {
      title: 'Planter Box Volume Decision Sheet',
      prompt: 'Our class is filling planter boxes.',
      soil_bag_volume: '1 soil bag = 28 L',
      watering_can_volume: '1 watering can = 8 L',
      success_criteria: ['I used length × width × height.', 'I included units.'],
    },
    '',
    '',
  )

  assert.match(html, /Planter Box Volume Decision Sheet/)
  assert.match(html, /V = l × w × h/)
  assert.match(html, /Sketch the planter/)
  assert.match(html, /Estimate volume/)
  assert.match(html, /Soil decision/)
  assert.match(html, /Water decision/)
  assert.match(html, /Final classroom recommendation/)
  assert.match(html, /1 soil bag = 28 L/)
  assert.match(html, /1 watering can = 8 L/)
})
