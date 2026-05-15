export const LAYOUT_TOKENS = {
  page: {
    margin: 28,
    topMargin: 20,
    bottomMargin: 20,
    contentWidth: 540,
  },
  gap: {
    xs: 3,
    sm: 5,
    md: 8,
    lg: 12,
  },
  font: {
    title: 21,
    section: 12,
    body: 9.5,
    micro: 8.2,
  },
  density: {
    compactCardPadding: 8,
    normalCardPadding: 12,
    compactRowHeight: 18,
    normalRowHeight: 24,
  },
  color: {
    student: '#dbeafe',
    studentBorder: '#60a5fa',
    teacher: '#dcfce7',
    teacherBorder: '#22c55e',
    slide: '#ede9fe',
    slideBorder: '#8b5cf6',
    assessment: '#fef3c7',
    assessmentBorder: '#f59e0b',
    neutral: '#f8fafc',
    neutralBorder: '#cbd5e1',
  },
}

export function layoutToken(path, fallback = undefined) {
  return String(path)
    .split('.')
    .reduce((current, part) => (current && current[part] !== undefined ? current[part] : undefined), LAYOUT_TOKENS) ?? fallback
}
