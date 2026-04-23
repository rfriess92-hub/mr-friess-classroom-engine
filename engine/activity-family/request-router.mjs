const ACTIVITY_CUES = [
  'quick activity',
  '5-minute',
  '10-minute',
  '15-minute',
  'game',
  'intervention',
  'station',
  'early finisher',
  'whiteboard',
  'movement activity',
  'corners',
  'prefix',
  'prefixes',
  'suffix',
  'suffixes',
  'root',
  'roots',
  'morphology practice',
  'word part',
  'word parts',
]

const LESSON_CUES = [
  'lesson',
  'mini-lesson',
  'unit',
  'sequence',
  'teacher guide',
  'slides',
  'exit ticket',
  'final response',
  'checkpoint',
]

const BANK_CUES = [
  'master bank',
  'bank',
  'list of activities',
  'categorized bank',
  'activity bank',
  'word bank',
]

function lower(value) {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function includesAny(text, cues) {
  return cues.some((cue) => text.includes(cue))
}

export function classifyContentRequest(requestText = '') {
  const text = lower(requestText)
  const hasActivityCue = includesAny(text, ACTIVITY_CUES)
  const hasLessonCue = includesAny(text, LESSON_CUES)
  const hasBankCue = includesAny(text, BANK_CUES)

  let route = 'lesson_only'
  if (hasBankCue && hasActivityCue) route = 'activity_bank_request'
  else if (hasActivityCue && hasLessonCue) route = 'lesson_plus_activity'
  else if (hasActivityCue) route = 'activity_only'

  return {
    route,
    has_activity_cue: hasActivityCue,
    has_lesson_cue: hasLessonCue,
    has_bank_cue: hasBankCue,
  }
}
