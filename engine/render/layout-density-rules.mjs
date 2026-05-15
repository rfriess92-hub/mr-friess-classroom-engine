export const LAYOUT_DENSITY_RULES = {
  SP_OPEN_FOLLOW_ALONG: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.14,
    minWritableAreaRatio: 0.35,
  },
  SP_ACTIVITY_PLUS_REFERENCE: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.32,
  },
  SP_CHECKLIST_CLOSE: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minChecklistItems: 3,
  },
  TG_PROJECT_TOOLS: {
    maxDecorativeIcons: 4,
    maxParagraphWordsPerTool: 22,
    teacherOnly: true,
  },
  RS_MATRIX_FEEDBACK: {
    maxCriteria: 4,
    maxLevels: 4,
    maxWordsPerCell: 22,
  },
  SC_CARD_GRID: {
    landscapeRequired: true,
    preferredCardsPerPage: 6,
    cutLinesVisible: true,
    noLargeFooterInsideEachCard: true,
  },
}

export function densityRuleFor(templateId) {
  return LAYOUT_DENSITY_RULES[String(templateId || '').trim()] ?? null
}
