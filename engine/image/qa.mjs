function countResolvedImageSlots(page) {
  return (page.components ?? []).filter((component) => (
    component.type === 'ImageSlot'
    && (component.resolved_image?.status ?? 'resolved') === 'resolved'
  )).length
}

function pageHasWritingSpace(page) {
  return (page.components ?? []).some((component) => component.visual_role === 'student_response')
}

function roleCounts(page) {
  const counts = {}
  for (const component of page.components ?? []) {
    const role = component.visual_role ?? 'unknown'
    counts[role] = (counts[role] ?? 0) + 1
  }
  return counts
}

export function runImageQaOnPlan(visualPlan) {
  const findings = []
  const pages = Array.isArray(visualPlan.pages) ? visualPlan.pages : []

  for (const page of pages) {
    const imageCount = countResolvedImageSlots(page)
    const counts = roleCounts(page)

    if (pageHasWritingSpace(page) && imageCount > 1) {
      findings.push({
        type: 'worksheet_image_density',
        page_id: page.page_id,
        note: 'Student writing page resolves more than one image slot.',
      })
    }

    if ((page.authored_layout === 'reflect' || page.page_role === 'reflect') && imageCount > 1) {
      findings.push({
        type: 'reflect_image_crowding',
        page_id: page.page_id,
        note: 'Reflect page resolves more than one image slot.',
      })
    }

    if (imageCount > 0 && (counts.student_response ?? 0) > 0 && imageCount >= (counts.student_response ?? 0)) {
      findings.push({
        type: 'image_vs_writing_balance',
        page_id: page.page_id,
        note: 'Image presence is too strong relative to student writing space.',
      })
    }

    const unresolvedRequired = (page.image_plan?.slots ?? []).filter((slot) => (
      slot.status !== 'resolved' && slot.required === true
    ))
    if (unresolvedRequired.length > 0) {
      findings.push({
        type: 'required_image_missing',
        page_id: page.page_id,
        note: 'Required image slot did not resolve to a local approved asset.',
      })
    }
  }

  return {
    judgment: findings.length > 0 ? 'revise' : 'pass',
    findings,
  }
}
