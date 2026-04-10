import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveVisualStyle } from '../visual/style-resolver.mjs'

const REGISTRY_PATH = resolve(process.cwd(), 'engine', 'image', 'asset-registry.json')
const SLOT_CONFIG_PATH = resolve(process.cwd(), 'engine', 'image', 'layout-image-slots.json')

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function safeLoadJson(path, fallback) {
  return existsSync(path) ? loadJson(path) : fallback
}

function registry() {
  return safeLoadJson(REGISTRY_PATH, { fallback_roles: {}, assets: [] })
}

function slotConfig() {
  return safeLoadJson(SLOT_CONFIG_PATH, { slide_layouts: {}, worksheet_layouts: {}, exit_ticket_layouts: {} })
}

function resolveIntent(explicitIntent, defaultIntent) {
  if (explicitIntent && typeof explicitIntent === 'object') return explicitIntent
  if (defaultIntent && typeof defaultIntent === 'object') return defaultIntent
  return null
}

function lessonTagsFor(pkg, route, authoredLayout) {
  return new Set([
    String(pkg?.theme ?? '').trim(),
    String(pkg?.package_id ?? '').trim(),
    String(route?.output_type ?? '').trim(),
    String(authoredLayout ?? '').trim(),
    'middle_years',
    'school_safe',
  ].filter(Boolean))
}

function candidateRoles(registryData, requestedRole, slot) {
  const fallbacks = (registryData.fallback_roles ?? {})[requestedRole] ?? []
  const allowedRoles = new Set(slot.allowed_roles ?? [])
  return [requestedRole, ...fallbacks].filter((role, index, items) => (
    allowedRoles.has(role) && items.indexOf(role) === index
  ))
}

function scoreAsset(asset, intent, authoredLayout, lessonTags, artifactType) {
  let score = 0
  if ((asset.compatible_artifact_types ?? []).includes(artifactType)) score += 5
  if ((asset.compatible_image_roles ?? []).includes(intent.role)) score += 6
  if ((asset.image_purposes ?? []).includes(intent.purpose)) score += 5
  if ((asset.tone_tags ?? []).includes('middle_years')) score += 3
  if ((asset.tone_tags ?? []).includes('school_safe')) score += 2
  if ((asset.lesson_tags ?? []).includes(authoredLayout)) score += 3
  if ((asset.lesson_tags ?? []).some((tag) => lessonTags.has(tag))) score += 2
  if (asset.print_safe === true) score += 1
  if (asset.grayscale_safe === true) score += 1
  return score
}

function resolveAssetForSlot({ pkg, route, artifactType, authoredLayout, slot, intent }) {
  const registryData = registry()
  const lessonTags = lessonTagsFor(pkg, route, authoredLayout)
  const roles = candidateRoles(registryData, intent.role, slot)

  let best = null
  for (const role of roles) {
    for (const asset of registryData.assets ?? []) {
      if (!(asset.compatible_artifact_types ?? []).includes(artifactType)) continue
      if (!(asset.compatible_image_roles ?? []).includes(role)) continue
      if (!(asset.image_purposes ?? []).includes(intent.purpose)) continue
      const absolutePath = resolve(process.cwd(), 'engine', asset.path)
      if (!existsSync(absolutePath)) continue
      const score = scoreAsset(asset, { ...intent, role }, authoredLayout, lessonTags, artifactType)
      if (!best || score > best.score) {
        best = {
          asset,
          resolved_role: role,
          absolute_path: absolutePath,
          score,
        }
      }
    }
    if (best) break
  }
  return best
}

function buildImageComponent({ visualPlan, page, pageIndex, slot, intent, resolvedAsset }) {
  return {
    id: `${visualPlan.output_id}_page_${pageIndex + 1}_${slot.slot_id}`,
    type: 'ImageSlot',
    visual_role: 'image_anchor',
    content: {
      label: slot.slot_id,
      asset_id: resolvedAsset.asset.asset_id,
      alt_text: resolvedAsset.asset.alt_text ?? '',
    },
    layout: {
      ...(slot.bounds ?? {}),
      anchor: 'absolute',
      z: 1,
    },
    options: {
      image_role: resolvedAsset.resolved_role,
      image_purpose: intent.purpose,
      render_mode: slot.render_mode ?? 'cover',
    },
    resolved_image: {
      status: 'resolved',
      asset_id: resolvedAsset.asset.asset_id,
      asset_path: resolvedAsset.absolute_path,
      approved_source: resolvedAsset.asset.approved_source ?? 'internal_curated',
      role: resolvedAsset.resolved_role,
      purpose: intent.purpose,
      aspect_ratio: resolvedAsset.asset.aspect_ratio ?? null,
      crop_focus: resolvedAsset.asset.crop_focus ?? 'center',
      print_safe: resolvedAsset.asset.print_safe === true,
      grayscale_safe: resolvedAsset.asset.grayscale_safe === true,
      alt_text: resolvedAsset.asset.alt_text ?? '',
      slot_id: slot.slot_id,
    },
    resolved_visual: resolveVisualStyle({
      surfaceVariant: visualPlan.surface_variant,
      instructionalVariant: visualPlan.instructional_variant,
      pageRole: page.page_role,
      visualRole: 'image_anchor',
      componentType: 'ImageSlot',
    }),
  }
}

function resolveSlotsForSlidePage({ pkg, route, visualPlan, page, pageIndex, sourceSlide }) {
  const authoredLayout = String(sourceSlide?.layout ?? '')
  const authoredConfig = (slotConfig().slide_layouts ?? {})[authoredLayout]
  if (!authoredConfig) {
    return { page, image_plan: { status: 'unsupported_layout', authored_layout: authoredLayout } }
  }

  const slotDefinitions = authoredConfig.image_slots ?? []
  if (slotDefinitions.length === 0) {
    return { page, image_plan: { status: 'no_slots', authored_layout: authoredLayout } }
  }

  const intent = resolveIntent(sourceSlide?.image_intent, authoredConfig.default_image_intent)
  if (!intent?.role || !intent?.purpose) {
    return { page, image_plan: { status: 'no_intent', authored_layout: authoredLayout } }
  }

  const components = [...(page.components ?? [])]
  const manifest = []
  for (const slot of slotDefinitions) {
    const resolvedAsset = resolveAssetForSlot({
      pkg,
      route,
      artifactType: 'slides',
      authoredLayout,
      slot,
      intent,
    })
    if (!resolvedAsset) {
      manifest.push({
        slot_id: slot.slot_id,
        authored_layout: authoredLayout,
        status: slot.fallback_mode === 'no_image' ? 'fallback_no_image' : 'missing_asset',
        requested_role: intent.role,
        requested_purpose: intent.purpose,
      })
      continue
    }
    const component = buildImageComponent({
      visualPlan,
      page,
      pageIndex,
      slot,
      intent,
      resolvedAsset,
    })
    components.push(component)
    manifest.push({
      slot_id: slot.slot_id,
      authored_layout: authoredLayout,
      status: 'resolved',
      asset_id: resolvedAsset.asset.asset_id,
      requested_role: intent.role,
      resolved_role: resolvedAsset.resolved_role,
      requested_purpose: intent.purpose,
      asset_path: resolvedAsset.absolute_path,
    })
  }

  return {
    page: {
      ...page,
      authored_layout: authoredLayout,
      components,
      image_plan: {
        status: manifest.some((item) => item.status === 'resolved') ? 'resolved' : 'fallback_no_image',
        authored_layout: authoredLayout,
        requested_role: intent.role,
        requested_purpose: intent.purpose,
        slots: manifest,
      },
    },
    image_plan: {
      authored_layout: authoredLayout,
      slots: manifest,
    },
  }
}

function applySlideImages(pkg, route, sourceSection, visualPlan) {
  const slides = Array.isArray(sourceSection) ? sourceSection : []
  const pages = []
  const image_manifest = []

  for (let i = 0; i < (visualPlan.pages ?? []).length; i += 1) {
    const page = visualPlan.pages[i]
    const sourceSlide = slides[i] ?? {}
    const resolved = resolveSlotsForSlidePage({ pkg, route, visualPlan, page, pageIndex: i, sourceSlide })
    pages.push(resolved.page)
    image_manifest.push({
      page_id: page.page_id,
      ...(resolved.image_plan ?? {}),
    })
  }

  return {
    ...visualPlan,
    pages,
    image_manifest,
  }
}

export function collectImageManifest(visualPlan) {
  return Array.isArray(visualPlan?.image_manifest) ? visualPlan.image_manifest : []
}

export function enrichVisualPlanWithImages(pkg, route, sourceSection, visualPlan) {
  if (route.output_type !== 'slides') {
    return {
      ...visualPlan,
      image_manifest: [],
    }
  }
  return applySlideImages(pkg, route, sourceSection, visualPlan)
}
