function normalizeDayNumber(rawLabel) {
  const match = String(rawLabel ?? '').match(/^\s*day\s+(\d+)(?=\s*(?:[\/\-\u2013\u2014]|$))/i)
  if (!match) return null
  return `Day ${match[1]}`
}

export function extractDayLabel(label) {
  return normalizeDayNumber(label)
}

export function stripDayPrefix(label) {
  const text = String(label ?? '').trim()
  const dayLabel = extractDayLabel(text)
  if (!dayLabel) return text

  return text
    .replace(/^\s*day\s+\d+\s*(?:[\/\-\u2013\u2014]\s*)?/i, '')
    .trim() || dayLabel
}

export function getDaysFromSection(section) {
  const tasks = Array.isArray(section?.tasks) ? section.tasks : []
  const seen = new Set()
  const days = []

  for (const task of tasks) {
    const dayLabel = extractDayLabel(task?.label)
    if (!dayLabel || seen.has(dayLabel)) continue
    seen.add(dayLabel)
    days.push(dayLabel)
  }

  return days
}

export function getTaskSheetOutputPackaging(section) {
  const requested = section?.output_packaging ?? section?.render_hints?.output_packaging ?? 'packet'
  return requested === 'packet_and_days' ? 'packet_and_days' : 'packet'
}

export function slugifyDayLabel(dayLabel) {
  return String(dayLabel ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function listTaskSheetArtifactFilenames(outputId, section, extension = '.pdf') {
  const filenames = [`${outputId}${extension}`]
  if (getTaskSheetOutputPackaging(section) !== 'packet_and_days') return filenames

  for (const dayLabel of getDaysFromSection(section)) {
    filenames.push(`${outputId}_${slugifyDayLabel(dayLabel)}${extension}`)
  }

  return filenames
}
