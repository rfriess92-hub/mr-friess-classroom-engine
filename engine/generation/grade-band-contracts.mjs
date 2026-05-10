import { existsSync, readFileSync } from 'node:fs'
import { repoPath } from '../../scripts/lib.mjs'

const CAREERS_8_CONTRACT_ID = 'careers_8_grade_band'
const CAREERS_8_CONTRACT_PATH = repoPath('engine', 'generation', 'contracts', 'careers-8-grade-band.md')
const CAREERS_8_SUBJECT_PATTERN = /\bcareer/
const CAREERS_8_GRADE_PATTERN = /\bgrade\s*8\b|\b8th\s+grade\b|\bgrade\s+eight\b|\bg8\b/

const CAREERS_8_ALLOWED_WITH_SUPPORT = [
  'self-concept',
  'mindset',
  'bias',
  'influence',
  'purpose',
  'contribution',
  'identity',
  'pathway',
  'pathways',
  'digital footprint',
  'misinformation',
  'stereotypes',
]

const CAREERS_8_AVOID_DEFAULT_VOCAB = [
  'metacognition',
  'epistemology',
  'labour-market dynamics',
  'labor-market dynamics',
  'identity formation',
  'systemic bias',
  'therapeutic',
]

const CAREERS_8_ADULT_TONE_PATTERNS = [
  'follow your passion',
  'be yourself',
  'adult professional tone',
  'professional profile',
  'career development plan',
  'labour market',
  'labor market',
  'resume',
  'interview training',
  'interview response',
  'counseling-style',
  'counselling-style',
]

const CAREERS_8_TOO_EASY_PATTERNS = [
  'what job do you want',
  'what career do you want',
  'follow your passion',
  'be yourself',
]

const CAREERS_8_SCAFFOLD_PATTERNS = [
  'sort',
  'sorting',
  'rank',
  'ranking',
  'compare',
  'comparison',
  'match',
  'matching',
  'matching bank',
  'paired choice',
  'pair',
  'pairs',
  'choose',
  'pick one',
  'list',
  'scenario',
  'scenario sort',
  'role map',
  'role-response',
  'response role',
  'example',
  'examples',
  'organizer',
  'graphic organizer',
  'matrix',
  'card sort',
  'category',
  'categories',
  'which of these',
  'look at these',
]

const STUDENT_FACING_SECTION_KEYS = new Set([
  'slides',
  'worksheet',
  'task_sheet',
  'exit_ticket',
  'final_response_sheet',
  'graphic_organizer',
  'discussion_prep_sheet',
])

function normalizeText(value) {
  return typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim()
    : ''
}

function lowerText(value) {
  return normalizeText(value).toLowerCase()
}

function wordCount(value) {
  const text = normalizeText(value)
  return text ? text.split(/\s+/).length : 0
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern))
}

function collectStrings(value, path = '') {
  if (typeof value === 'string') {
    return normalizeText(value)
      ? [{ path, text: normalizeText(value) }]
      : []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`))
  }

  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => collectStrings(child, path ? `${path}.${key}` : key))
}

function isStudentFacingDaySection(key) {
  return STUDENT_FACING_SECTION_KEYS.has(key) || key.startsWith('task_sheet_') || key.startsWith('worksheet_')
}

function isExcludedStudentPath(path = '') {
  return path.includes('answer_key') ||
    /^outputs\[/.test(path) ||
    /\.outputs\[/.test(path) ||
    /\.(source_section|bundle|output_id|output_type|audience|variant_group|variant_role|alignment_target|final_evidence_target|final_evidence)$/.test(path) ||
    /^days\[\d+\]\.(day_id|day_label|carryover_note)$/.test(path)
}

function collectStudentContentSections(pkg = {}) {
  const sections = []

  for (const key of STUDENT_FACING_SECTION_KEYS) {
    if (pkg[key]) sections.push({ path: key, value: pkg[key] })
  }

  for (const [key, value] of Object.entries(pkg)) {
    if ((key.startsWith('task_sheet_') || key.startsWith('worksheet_')) && value) {
      sections.push({ path: key, value })
    }
  }

  if (Array.isArray(pkg.days)) {
    for (let index = 0; index < pkg.days.length; index += 1) {
      const day = pkg.days[index]
      if (!day || typeof day !== 'object') continue
      for (const [key, value] of Object.entries(day)) {
        if (!value || !isStudentFacingDaySection(key)) continue
        sections.push({ path: `days[${index}].${key}`, value })
      }
    }
  }

  return sections
}

function collectStudentFacingStrings(pkg = {}) {
  return collectStudentContentSections(pkg)
    .flatMap(({ path, value }) => collectStrings(value, path))
    .filter(({ path }) => !isExcludedStudentPath(path))
}

function collectLongResponseTargets(section = {}, path = '') {
  if (Array.isArray(section)) {
    return section.flatMap((item, index) => collectLongResponseTargets(item, `${path}[${index}]`))
  }

  if (!section || typeof section !== 'object') return []

  const findings = []
  const promptText = typeof section.q_text === 'string'
    ? section.q_text
    : typeof section.prompt === 'string'
      ? section.prompt
      : null

  if (promptText && typeof section.n_lines === 'number') {
    findings.push({
      path,
      prompt: normalizeText(promptText),
      n_lines: section.n_lines,
    })
  }

  return findings.concat(
    Object.entries(section).flatMap(([key, value]) => collectLongResponseTargets(value, path ? `${path}.${key}` : key))
  )
}

function collectStudentLongResponseTargets(pkg = {}) {
  return collectStudentContentSections(pkg)
    .flatMap(({ path, value }) => collectLongResponseTargets(value, path))
    .filter(({ path }) => !isExcludedStudentPath(path))
}

function isConcreteListBankPath(path = '') {
  return /(matching_columns|choice_pairs|left_items|right_items|record_fields|blank_prompts|structured_labels|table_rows|table_columns)/.test(path)
}

function isPromptLikePath(path = '') {
  return /(scenario|task|prompt|q_text|instruction|instructions|tip|help|response_note|purpose_line)/i.test(path)
}

function hasConcreteScaffold(studentFacingStrings = []) {
  return studentFacingStrings.some(({ path, text }) => {
    const lowered = lowerText(text)
    return includesAny(lowered, CAREERS_8_SCAFFOLD_PATTERNS) ||
      /(activity_type|response_pattern|choice_pairs|matching_columns|record_fields|blank_prompts|table_rows|table_columns|structured_labels)/.test(path)
  })
}

// ---------------------------------------------------------------------------
// Band detection helpers
// ---------------------------------------------------------------------------

export function appliesCareers8GradeBandContract(context = {}) {
  const subject = lowerText(context.subject)
  const topic = lowerText(context.topic)
  const briefText = lowerText(context.briefText)
  const grade = Number(context.grade ?? Number.NaN)

  const gradeMatch = grade === 8 || CAREERS_8_GRADE_PATTERN.test(briefText)
  const careersMatch = CAREERS_8_SUBJECT_PATTERN.test(subject) || CAREERS_8_SUBJECT_PATTERN.test(topic) || CAREERS_8_SUBJECT_PATTERN.test(briefText)

  return gradeMatch && careersMatch
}

function appliesElaBand(context = {}, targetGrade) {
  const theme = lowerText(context.theme)
  const grade = Number(context.grade ?? Number.NaN)
  return (theme === 'english_language_arts' || theme === 'ela') && grade === targetGrade
}

function appliesMath8Band(context = {}) {
  const theme = lowerText(context.theme)
  const subject = lowerText(context.subject)
  const grade = Number(context.grade ?? Number.NaN)
  const isWorkplace = subject.includes('workplace') || subject.includes('applied')
  return theme === 'mathematics' && grade === 8 && !isWorkplace
}

function appliesWorkplaceMath10Band(context = {}) {
  const theme = lowerText(context.theme)
  const subject = lowerText(context.subject)
  const grade = Number(context.grade ?? Number.NaN)
  const isWorkplace = subject.includes('workplace') || subject.includes('applied') || lowerText(context.course_id).includes('workplace')
  return theme === 'mathematics' && grade === 10 && isWorkplace
}

// ---------------------------------------------------------------------------
// Contract registry
// ---------------------------------------------------------------------------

const BAND_REGISTRY = [
  {
    id: CAREERS_8_CONTRACT_ID,
    label: 'Careers 8 grade-band contract',
    path: CAREERS_8_CONTRACT_PATH,
    applies: appliesCareers8GradeBandContract,
  },
  {
    id: 'english_10_grade_band',
    label: 'English 10 grade-band contract',
    path: repoPath('engine', 'generation', 'contracts', 'english-10-grade-band.md'),
    applies: (ctx) => appliesElaBand(ctx, 10),
  },
  {
    id: 'english_11_grade_band',
    label: 'English 11 grade-band contract',
    path: repoPath('engine', 'generation', 'contracts', 'english-11-grade-band.md'),
    applies: (ctx) => appliesElaBand(ctx, 11),
  },
  {
    id: 'english_12_grade_band',
    label: 'English 12 grade-band contract',
    path: repoPath('engine', 'generation', 'contracts', 'english-12-grade-band.md'),
    applies: (ctx) => appliesElaBand(ctx, 12),
  },
  {
    id: 'math_8_grade_band',
    label: 'Math 8 grade-band contract',
    path: repoPath('engine', 'generation', 'contracts', 'math-8-grade-band.md'),
    applies: appliesMath8Band,
  },
  {
    id: 'workplace_math_10_grade_band',
    label: 'Workplace Math 10 grade-band contract',
    path: repoPath('engine', 'generation', 'contracts', 'workplace-math-10-grade-band.md'),
    applies: appliesWorkplaceMath10Band,
  },
]

export function getApplicableGradeBandContracts(context = {}) {
  return BAND_REGISTRY
    .filter((band) => band.applies(context))
    .map((band) => ({
      id: band.id,
      label: band.label,
      path: band.path,
      text: existsSync(band.path) ? readFileSync(band.path, 'utf-8').trim() : '',
    }))
}

export function buildGradeBandGenerationPrompt(context = {}) {
  const blocks = getApplicableGradeBandContracts(context)
    .filter((contract) => contract.text)

  if (blocks.length === 0) return ''

  return blocks.map((contract) => `This brief matches the ${contract.label}. Treat it as binding for student-facing content, output demand, vocabulary, abstraction level, and tone.

<${contract.id}>
${contract.text}
</${contract.id}>`).join('\n\n')
}

// ---------------------------------------------------------------------------
// Band-specific validators
// ---------------------------------------------------------------------------

function makeFinding(code, path, note) {
  return { type: 'content_issue', code, path, note }
}

function validateCareers8(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []
  const hasScaffold = hasConcreteScaffold(studentFacingStrings)

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    const words = wordCount(entry.text)

    if (includesAny(text, CAREERS_8_AVOID_DEFAULT_VOCAB) && !isConcreteListBankPath(entry.path)) {
      findings.push(makeFinding('unsupported_vocabulary', entry.path, `Student-facing text uses off-band adult vocabulary: "${entry.text}".`))
    }
    if (includesAny(text, CAREERS_8_ADULT_TONE_PATTERNS)) {
      findings.push(makeFinding('adult_tone_drift', entry.path, `Student-facing text sounds adult, slogan-like, or senior-secondary in tone: "${entry.text}".`))
    }
    if (includesAny(text, CAREERS_8_TOO_EASY_PATTERNS)) {
      findings.push(makeFinding('too_easy', entry.path, `Student-facing text risks shallow or fake-choice reflection: "${entry.text}".`))
    }
    if (includesAny(text, CAREERS_8_ALLOWED_WITH_SUPPORT) && !hasScaffold && !includesAny(text, CAREERS_8_SCAFFOLD_PATTERNS)) {
      findings.push(makeFinding('missing_concrete_scaffold', entry.path, `Abstract Careers 8 language appears without a visible concrete scaffold: "${entry.text}".`))
    }
    if (isPromptLikePath(entry.path) && words > 28) {
      findings.push(makeFinding(words > 36 ? 'read_aloud_unfriendly' : 'output_overreach', entry.path, `Student-facing instruction is too long for quick read-aloud use (${words} words): "${entry.text}".`))
    }
    const hiddenMoveCount = (text.match(/\b(and|or)\b/g) ?? []).length
    if (isPromptLikePath(entry.path) && words > 24 && hiddenMoveCount >= 2 && (text.match(/\?/g) ?? []).length >= 2) {
      findings.push(makeFinding('multi_hidden_thinking_moves', entry.path, `Student-facing prompt appears to bundle multiple thinking moves into one task: "${entry.text}".`))
    }
  }

  for (const target of collectStudentLongResponseTargets(pkg)) {
    const promptText = lowerText(target.prompt)
    if (target.n_lines >= 8 && /\b(explain|justify|argue|recommend|analysis|analyze|essay|paragraph)\b/.test(promptText)) {
      findings.push(makeFinding('output_overreach', target.path, `Student response demand looks too long for a default Careers 8 task (${target.n_lines} lines): "${target.prompt}".`))
    }
  }

  if (!hasScaffold) {
    findings.push(makeFinding('missing_concrete_scaffold', 'student_facing_bundle', 'Careers 8 package does not clearly include a list, sort, ranking task, scenario, role map, comparison prompt, or visible example set.'))
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  const severeCount = Array.from(findingCodes).filter((c) => ['adult_tone_drift', 'missing_concrete_scaffold', 'unsupported_vocabulary'].includes(c)).length

  if (
    (findingCodes.has('adult_tone_drift') && (findingCodes.has('missing_concrete_scaffold') || findingCodes.has('unsupported_vocabulary'))) ||
    (findingCodes.has('missing_concrete_scaffold') && findingCodes.has('unsupported_vocabulary') && findingCodes.has('multi_hidden_thinking_moves')) ||
    severeCount >= 3
  ) {
    blockers.push('careers8_contract_violation')
  }

  return { findings, blockers }
}

// ELA shared helpers

// Vocabulary that signals register drift above grade 10
const ELA_GRADE12_DRIFT_VOCAB = [
  'recommendation memo',
  'policy proposal',
  'formal synthesis',
  'multi-source synthesis',
  'post-secondary',
  'academic citation',
  'literature review',
  'formal argument essay',
]

// Vocabulary that signals literary criticism overreach above grade 10 level
const ELA_LITERARY_CRIT_VOCAB = [
  'rhetorical strategies',
  'rhetorical analysis',
  'analytical essay',
  'theoretical lens',
  'discourse analysis',
  'nuanced argumentation',
  'epistemic',
]

// Signals that a prompt is over-scaffolded for grade 11/12
const ELA_OVER_SCAFFOLD_SIGNALS = [
  'use the sentence frames',
  'use the frames',
  'fill in the sentence',
  'word bank',
]

// Grade 10 down-drift signals (too simple for 11/12)
const ELA_GRADE10_DRIFT_VOCAB = [
  'write one sentence',
  'do you agree or disagree? write one',
  'fill in the blank',
]

function validateEla10(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    if (isConcreteListBankPath(entry.path)) continue

    if (includesAny(text, ELA_LITERARY_CRIT_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `English 10 student-facing text uses literary criticism vocabulary that belongs at Grade 11/12: "${entry.text}".`))
    }
    if (includesAny(text, ELA_GRADE12_DRIFT_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `English 10 student-facing text expects Grade 12 synthesis or formal writing: "${entry.text}".`))
    }
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  if (findingCodes.has('register_drift_up')) {
    blockers.push('ela10_contract_violation')
  }

  return { findings, blockers }
}

function validateEla11(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    if (isConcreteListBankPath(entry.path)) continue

    // Drift upward: Grade 12 tasks appearing in Grade 11
    if (includesAny(text, ELA_GRADE12_DRIFT_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `English 11 student-facing text expects Grade 12-level synthesis or formal products: "${entry.text}".`))
    }

    // Drift downward: Grade 10 scaffolding in Grade 11
    if (includesAny(text, ELA_OVER_SCAFFOLD_SIGNALS)) {
      findings.push(makeFinding('register_drift_down', entry.path, `English 11 student-facing text over-scaffolds with sentence frames that belong at Grade 10: "${entry.text}".`))
    }
    if (includesAny(text, ELA_GRADE10_DRIFT_VOCAB)) {
      findings.push(makeFinding('register_drift_down', entry.path, `English 11 prompt sounds like a Grade 10 task: "${entry.text}".`))
    }
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  if (findingCodes.has('register_drift_up') && findingCodes.has('register_drift_down')) {
    blockers.push('ela11_contract_violation')
  }

  return { findings, blockers }
}

function validateEla12(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    if (isConcreteListBankPath(entry.path)) continue

    // Grade 12 must not over-scaffold argument structure
    if (includesAny(text, ELA_OVER_SCAFFOLD_SIGNALS)) {
      findings.push(makeFinding('register_drift_down', entry.path, `English 12 student-facing text uses sentence frames for argument structure that belong at Grade 10: "${entry.text}".`))
    }
    // Grade 12 must not reduce to one-sentence answers
    if (includesAny(text, ELA_GRADE10_DRIFT_VOCAB)) {
      findings.push(makeFinding('register_drift_down', entry.path, `English 12 prompt sounds like a Grade 10 task: "${entry.text}".`))
    }
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  if (findingCodes.has('register_drift_down')) {
    blockers.push('ela12_contract_violation')
  }

  return { findings, blockers }
}

// Math 8: vocabulary that belongs in Workplace Math 10, not Math 8
const MATH8_TRADE_VOCAB = [
  'invoice',
  'markup',
  'material cost',
  'project budget',
  'overhead',
  'labour cost',
  'labor cost',
  'contractor',
  'bid',
  'estimate the cost',
  'unit cost',
]

// Math 8: abstract/senior algebra drift. Curricular Grade 8 terms such as
// statistical range and Pythagorean theorem are intentionally allowed.
const MATH8_ADVANCED_VOCAB = [
  'domain',
  'function notation',
  'f(x)',
  'g(x)',
  'optimization',
  'conjecture',
  'formal proof',
]

function validateMath8(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    if (isConcreteListBankPath(entry.path)) continue

    if (includesAny(text, MATH8_TRADE_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `Math 8 student-facing text uses trade/budget vocabulary that belongs in Workplace Math 10: "${entry.text}".`))
    }
    if (includesAny(text, MATH8_ADVANCED_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `Math 8 student-facing text uses senior-secondary math vocabulary not appropriate at this level: "${entry.text}".`))
    }
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  if (findingCodes.has('register_drift_up')) {
    blockers.push('math8_contract_violation')
  }

  return { findings, blockers }
}

// Workplace Math 10: abstract/pre-calculus drift
const WM10_ABSTRACT_VOCAB = [
  'derive',
  'formal proof',
  'theorem',
  'f(x)',
  'domain and range',
  'transformation of',
  'limit as',
  'pre-calculus',
  'precalculus',
]

// Workplace Math 10: must have scenario — warn if no scenario signal
const WM10_SCENARIO_SIGNALS = [
  'budget',
  'invoice',
  'material',
  'floor plan',
  'blueprint',
  'scale',
  'estimate',
  'client',
  'contractor',
  'cost',
  'measure',
  'proportion',
  'perimeter',
  'area',
  'volume',
]

function validateWorkplaceMath10(pkg) {
  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const findings = []
  const blockers = []
  const fullText = studentFacingStrings.map(({ text }) => lowerText(text)).join('\n')

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    if (isConcreteListBankPath(entry.path)) continue

    if (includesAny(text, WM10_ABSTRACT_VOCAB)) {
      findings.push(makeFinding('register_drift_up', entry.path, `Workplace Math 10 student-facing text uses pre-calculus or formal proof vocabulary: "${entry.text}".`))
    }
  }

  if (!includesAny(fullText, WM10_SCENARIO_SIGNALS)) {
    findings.push(makeFinding('missing_applied_scenario', 'student_facing_bundle', 'Workplace Math 10 package does not appear to include applied scenario vocabulary (budget, cost, measurement, scale, proportion, etc.).'))
  }

  const findingCodes = new Set(findings.map((f) => f.code).filter(Boolean))
  if (findingCodes.has('register_drift_up') || findingCodes.has('missing_applied_scenario')) {
    blockers.push('wm10_contract_violation')
  }

  return { findings, blockers }
}

// ---------------------------------------------------------------------------
// Public validator dispatcher
// ---------------------------------------------------------------------------

export function validateGradeBandContractFit(pkg = {}) {
  if (appliesCareers8GradeBandContract(pkg)) {
    const { findings, blockers } = validateCareers8(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: CAREERS_8_CONTRACT_ID, judgment, blockers, findings, matched_contracts: [CAREERS_8_CONTRACT_ID] }
  }

  if (appliesElaBand(pkg, 10)) {
    const { findings, blockers } = validateEla10(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: 'english_10_grade_band', judgment, blockers, findings, matched_contracts: ['english_10_grade_band'] }
  }

  if (appliesElaBand(pkg, 11)) {
    const { findings, blockers } = validateEla11(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: 'english_11_grade_band', judgment, blockers, findings, matched_contracts: ['english_11_grade_band'] }
  }

  if (appliesElaBand(pkg, 12)) {
    const { findings, blockers } = validateEla12(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: 'english_12_grade_band', judgment, blockers, findings, matched_contracts: ['english_12_grade_band'] }
  }

  if (appliesMath8Band(pkg)) {
    const { findings, blockers } = validateMath8(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: 'math_8_grade_band', judgment, blockers, findings, matched_contracts: ['math_8_grade_band'] }
  }

  if (appliesWorkplaceMath10Band(pkg)) {
    const { findings, blockers } = validateWorkplaceMath10(pkg)
    const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'
    return { applies: true, contract_id: 'workplace_math_10_grade_band', judgment, blockers, findings, matched_contracts: ['workplace_math_10_grade_band'] }
  }

  return {
    applies: false,
    contract_id: null,
    judgment: 'pass',
    blockers: [],
    findings: [],
    matched_contracts: [],
  }
}
