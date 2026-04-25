/**
 * Teaching mode defaults — maps each teaching_mode to its default output types
 * and a short prompt note injected into the <class_context> block.
 *
 * Merge priority (later wins):
 *   mode defaults → course default_output_types → generation_overrides.default_output_types
 */

export const TEACHING_MODE_DEFAULTS = {
  standard: {
    default_output_types: ['teacher_guide', 'slides', 'worksheet', 'exit_ticket'],
    prompt_notes: null,
  },
  hands_on: {
    default_output_types: ['teacher_guide', 'task_sheet', 'station_cards', 'exit_ticket'],
    prompt_notes: 'Prefer task sheets and station activities over static worksheets. Students move between tasks and work in groups.',
  },
  sub_friendly: {
    default_output_types: ['teacher_guide', 'slides', 'worksheet', 'sub_plan', 'exit_ticket'],
    prompt_notes: 'Include a sub plan. All instructions must be self-running and clear enough for a substitute who does not know the subject.',
  },
  low_tech: {
    default_output_types: ['teacher_guide', 'worksheet', 'exit_ticket'],
    prompt_notes: 'Assume no projector or screen access. Do not generate slides. All content must work on paper only.',
  },
  quiet_writing: {
    default_output_types: ['teacher_guide', 'task_sheet', 'final_response_sheet'],
    prompt_notes: 'Class runs in sustained silent independent writing mode. Minimize verbal instruction artifacts.',
  },
  recovery_reteach: {
    default_output_types: ['teacher_guide', 'worksheet', 'pacing_guide', 'exit_ticket'],
    prompt_notes: 'Content is reteaching for students who missed or did not retain earlier learning. Keep tasks short, concrete, and confidence-building.',
  },
  conversational: {
    default_output_types: ['teacher_guide', 'pacing_guide'],
    prompt_notes: 'This class runs as whole-group conversation. Do not generate student packets or worksheets. Focus on teacher facilitation notes and pacing.',
  },
}

export function getModeDefaults(teachingMode) {
  return TEACHING_MODE_DEFAULTS[teachingMode] ?? TEACHING_MODE_DEFAULTS.standard
}
