const SLIDE_SLOTS = {
  hero: [
    {
      slot_id: 'hero_reference_visual',
      bounds: { x: 7.7, y: 3.1, w: 4.0, h: 2.4 },
      fit_mode: 'contain',
      allowed_roles: ['reference_photo', 'small_illustration'],
      allowed_purposes: ['orient_lesson', 'explain_content'],
      fallback_layout_id: 'hero'
    },
  ],
  prompt: [
    {
      slot_id: 'prompt_cue_visual',
      bounds: { x: 10.75, y: 1.55, w: 1.05, h: 1.05 },
      fit_mode: 'contain',
      allowed_roles: ['small_illustration', 'cue_icon'],
      allowed_purposes: ['organize_attention', 'orient_lesson'],
      fallback_layout_id: 'prompt'
    },
  ],
  prompt_card: [
    {
      slot_id: 'prompt_card_cue_visual',
      bounds: { x: 10.65, y: 1.95, w: 1.05, h: 1.05 },
      fit_mode: 'contain',
      allowed_roles: ['small_illustration', 'cue_icon'],
      allowed_purposes: ['organize_attention', 'orient_lesson'],
      fallback_layout_id: 'prompt_card'
    },
  ],
  reflect: [
    {
      slot_id: 'reflect_light_visual',
      bounds: { x: 10.45, y: 1.9, w: 1.1, h: 1.1 },
      fit_mode: 'contain',
      allowed_roles: ['small_illustration', 'cue_icon'],
      allowed_purposes: ['organize_attention', 'explain_content'],
      fallback_layout_id: 'reflect'
    },
  ],
  two_column: [
    {
      slot_id: 'two_column_anchor_visual',
      bounds: { x: 6.15, y: 1.5, w: 0.7, h: 0.7 },
      fit_mode: 'contain',
      allowed_roles: ['cue_icon'],
      allowed_purposes: ['organize_attention'],
      fallback_layout_id: 'two_column'
    },
  ],
}

const OUTPUT_SLOTS = {
  worksheet: [
    {
      slot_id: 'worksheet_header_cue',
      bounds: { x: 9.8, y: 0.45, w: 0.4, h: 0.4 },
      fit_mode: 'contain',
      allowed_roles: ['cue_icon'],
      allowed_purposes: ['organize_attention'],
      fallback_layout_id: null
    },
  ],
  exit_ticket: [
    {
      slot_id: 'exit_ticket_header_cue',
      bounds: { x: 9.8, y: 0.45, w: 0.35, h: 0.35 },
      fit_mode: 'contain',
      allowed_roles: ['cue_icon'],
      allowed_purposes: ['organize_attention'],
      fallback_layout_id: null
    },
  ],
}

export function slotsForPage({ outputType, sourceLayout = null }) {
  if (outputType === 'slides') {
    return Array.isArray(SLIDE_SLOTS[sourceLayout]) ? SLIDE_SLOTS[sourceLayout] : []
  }
  return Array.isArray(OUTPUT_SLOTS[outputType]) ? OUTPUT_SLOTS[outputType] : []
}
