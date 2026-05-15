export const COMPACT_PRIMITIVES = {
  page: { margin: 28, gap: 5 },
  landscapePage: { margin: 28, gap: 5, orientation: 'landscape' },
  roleChip: { paddingX: 6, paddingY: 2, radius: 6 },
  sectionCard: { padding: 8, radius: 8 },
  compactMetaGrid: { rowHeight: 18, columns: 2 },
  twoColumn: { leftRatio: 0.62, rightRatio: 0.38, gap: 5 },
  grid: { gap: 5 },
  checklist: { rowHeight: 18, marker: 'checkbox' },
  compactNumberedSteps: { rowHeight: 18 },
  ruledLines: { rowHeight: 18 },
  gridSpace: { rowHeight: 18, columns: 6 },
  promptLine: { rowHeight: 18 },
  bulletList: { maxWordsPerItem: 16 },
  rubricTable: { maxCriteria: 4, maxLevels: 4, maxWordsPerCell: 22 },
  stationCard: { cardsPerLandscapePage: 6 },
  teacherDecisionStrip: { steps: ['Observe', 'Choose', 'Implement', 'Adjust'] },
  compactCallout: { padding: 6 },
  labeledLine: { rowHeight: 18 },
}

export function primitiveSpec(name) {
  return COMPACT_PRIMITIVES[name] ?? null
}
