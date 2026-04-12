import { loadVisualConfig } from './load-config.mjs'

function pushIssue(collection, code, message, path = null) {
  collection.push({ code, message, path })
}

export function validateVisualPlanPageRoles(visualPlan) {
  const errors = []
  const config = loadVisualConfig()
  const artifactType = visualPlan?.artifact_type
  const pages = Array.isArray(visualPlan?.pages) ? visualPlan.pages : []
  const knownRoles = new Set(config.layouts.page_roles?.[artifactType] ?? [])
  const knownLayouts = artifactType === 'slide_deck'
    ? (config.layouts.slide_layouts ?? {})
    : (config.layouts.worksheet_layouts ?? {})

  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i] ?? {}
    const path = `pages[${i}]`

    if (knownRoles.size > 0 && !knownRoles.has(page.page_role)) {
      pushIssue(
        errors,
        'unknown_visual_page_role',
        `Unknown visual page_role: ${page.page_role}. Expected one of ${Array.from(knownRoles).join(', ')}.`,
        `${path}.page_role`,
      )
    }

    const layoutDef = knownLayouts[page.layout_id]
    if (layoutDef?.page_roles && !layoutDef.page_roles.includes(page.page_role)) {
      pushIssue(
        errors,
        'layout_page_role_mismatch',
        `layout_id ${page.layout_id} does not accept page_role ${page.page_role}.`,
        `${path}.layout_id`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
