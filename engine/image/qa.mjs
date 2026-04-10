function safeArray(value) {
  return Array.isArray(value) ? value : []
}

function slotArea(slot) {
  const bounds = slot?.bounds ?? {}
  return Number(bounds.w ?? 0) * Number(bounds.h ?? 0)
}

export function runImageQaOnPlan(visualPlan) {
  const findings = []
  const pages = safeArray(visualPlan.pages)

  const seenAssetKinds = new Set()

  for (const page of pages) {
    const imagePlan = page.image_plan ?? { slots: [] }
    const slots = safeArray(imagePlan.slots)

    if (imagePlan.judgment === 'fallback_layout' && safeArray(imagePlan.missing_slots).length > 0) {
      findings.push({
        type: 'image_fallback',
        page_id: page.page_id,
        note: 'No compatible image asset resolved; page falls back to no-image behavior.',
      })
    }

    if (visualPlan.artifact_type === 'worksheet' && slots.length > 1) {
      findings.push({
        type: 'worksheet_image_density',
        page_id: page.page_id,
        note: 'Worksheet page resolved more than one image slot.',
      })
    }

    for (const slot of slots) {
      if (visualPlan.artifact_type === 'worksheet' && slotArea(slot) > 0.4) {
        findings.push({
          type: 'worksheet_image_crowding',
          page_id: page.page_id,
          slot_id: slot.slot_id,
          note: 'Worksheet image slot is too large for writing-first policy.',
        })
      }
      if (visualPlan.artifact_type === 'worksheet' && slot.grayscale_safe === false) {
        findings.push({
          type: 'worksheet_print_safety',
          page_id: page.page_id,
          slot_id: slot.slot_id,
          note: 'Worksheet image slot is not marked grayscale safe.',
        })
      }
      seenAssetKinds.add(slot.role)
    }
  }

  if (visualPlan.artifact_type === 'slide_deck' && seenAssetKinds.size > 2) {
    findings.push({
      type: 'image_style_drift',
      note: 'Slide deck mixes too many image-role treatments in one lesson.',
    })
  }

  return {
    judgment: findings.length > 0 ? 'revise' : 'pass',
    findings,
  }
}
