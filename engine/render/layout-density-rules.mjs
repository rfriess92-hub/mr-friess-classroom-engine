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
  SP_RESEARCH_PLANNER: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.38,
  },
  SP_CHECKLIST_CLOSE: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minChecklistItems: 3,
  },
  TG_OVERVIEW_ENTRY: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.14,
    teacherOnly: true,
  },
  TG_SEQUENCE_MAP: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.12,
    teacherOnly: true,
  },
  TG_PROJECT_TOOLS: {
    maxDecorativeIcons: 4,
    maxParagraphWordsPerTool: 22,
    teacherOnly: true,
  },
  TG_MODEL_FEATURE: {
    maxDecorativeIcons: 3,
    maxParagraphWordsPerTool: 28,
    teacherOnly: true,
  },
  TG_ASSESSMENT_REFERENCE: {
    maxDecorativeIcons: 3,
    maxParagraphWordsPerTool: 24,
    teacherOnly: true,
  },
  CWS_STUDENT_WORKSHEET: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.42,
  },
  CWS_EXIT_REFLECTION: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.36,
  },
  CWS_GRAPHIC_ORGANIZER: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.38,
  },
  CWS_DISCUSSION_PREP: {
    maxDecorativeIcons: 2,
    maxHeaderHeightRatio: 0.12,
    minWritableAreaRatio: 0.36,
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
  WSD_LAUNCH_FRAME: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.18,
  },
  WSD_ACTIVITY_DISCUSSION: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.18,
  },
  WSD_CHECKPOINT_PREP: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.18,
  },
  WSD_SYNTHESIS_SHARE: {
    maxDecorativeIcons: 3,
    maxHeaderHeightRatio: 0.18,
  },
  AK_REFERENCE_TABLE: {
    maxDecorativeIcons: 2,
    maxParagraphWordsPerTool: 24,
    teacherOnly: true,
  },
}

export function densityRuleFor(templateId) {
  return LAYOUT_DENSITY_RULES[String(templateId || '').trim()] ?? null
}
