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
  'counseling',
  'counselling',
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
  'choose',
  'pick one',
  'list',
  'scenario',
  'role map',
  'example',
  'examples',
  'organizer',
  'graphic organizer',
  'look at these',
  'which of these',
]

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

function collectStudentFacingStrings(pkg = {}) {
  const sections = ['slides', 'worksheet', 'task_sheet', 'checkpoint_sheet', 'exit_ticket', 'final_response_sheet']
  return sections.flatMap((section) => {
    const value = pkg[section]
    if (!value) return []
    return collectStrings(value, section)
  }).filter(({ path }) => !path.includes('answer_key'))
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

export function appliesCareers8GradeBandContract(context = {}) {
  const subject = lowerText(context.subject)
  const topic = lowerText(context.topic)
  const briefText = lowerText(context.briefText)
  const grade = Number(context.grade ?? Number.NaN)

  const gradeMatch = grade === 8 || CAREERS_8_GRADE_PATTERN.test(briefText)
  const careersMatch = CAREERS_8_SUBJECT_PATTERN.test(subject) || CAREERS_8_SUBJECT_PATTERN.test(topic) || CAREERS_8_SUBJECT_PATTERN.test(briefText)

  return gradeMatch && careersMatch
}

export function getApplicableGradeBandContracts(context = {}) {
  if (!appliesCareers8GradeBandContract(context)) return []

  const contractText = existsSync(CAREERS_8_CONTRACT_PATH)
    ? readFileSync(CAREERS_8_CONTRACT_PATH, 'utf-8').trim()
    : ''

  return [{
    id: CAREERS_8_CONTRACT_ID,
    label: 'Careers 8 grade-band contract',
    path: CAREERS_8_CONTRACT_PATH,
    text: contractText,
  }]
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

export function validateGradeBandContractFit(pkg = {}) {
  if (!appliesCareers8GradeBandContract(pkg)) {
    return {
      applies: false,
      contract_id: null,
      judgment: 'pass',
      blockers: [],
      findings: [],
      matched_contracts: [],
    }
  }

  const studentFacingStrings = collectStudentFacingStrings(pkg)
  const fullText = studentFacingStrings.map(({ text }) => lowerText(text)).join('\n')
  const findings = []
  const blockers = []
  const matchedContracts = [CAREERS_8_CONTRACT_ID]
  const hasScaffold = includesAny(fullText, CAREERS_8_SCAFFOLD_PATTERNS)
  const severeCodes = new Set()

  for (const entry of studentFacingStrings) {
    const text = lowerText(entry.text)
    const words = wordCount(entry.text)

    if (includesAny(text, CAREERS_8_AVOID_DEFAULT_VOCAB)) {
      findings.push({
        type: 'content_issue',
        code: 'unsupported_vocabulary',
        path: entry.path,
        note: `Student-facing text uses off-band adult vocabulary: "${entry.text}".`,
      })
      severeCodes.add('unsupported_vocabulary')
    }

    if (includesAny(text, CAREERS_8_ADULT_TONE_PATTERNS)) {
      findings.push({
        type: 'content_issue',
        code: 'adult_tone_drift',
        path: entry.path,
        note: `Student-facing text sounds adult, slogan-like, or senior-secondary in tone: "${entry.text}".`,
      })
      severeCodes.add('adult_tone_drift')
    }

    if (includesAny(text, CAREERS_8_TOO_EASY_PATTERNS)) {
      findings.push({
        type: 'content_issue',
        code: 'too_easy',
        path: entry.path,
        note: `Student-facing text risks shallow or fake-choice reflection: "${entry.text}".`,
      })
    }

    if (includesAny(text, CAREERS_8_ALLOWED_WITH_SUPPORT) && !hasScaffold && !includesAny(text, CAREERS_8_SCAFFOLD_PATTERNS)) {
      findings.push({
        type: 'content_issue',
        code: 'missing_concrete_scaffold',
        path: entry.path,
        note: `Abstract Careers 8 language appears without a visible concrete scaffold: "${entry.text}".`,
      })
      severeCodes.add('missing_concrete_scaffold')
    }

    const isPromptLikePath = /scenario|task|prompt|q_text|instruction|tip/i.test(entry.path)
    if (isPromptLikePath && words > 28) {
      findings.push({
        type: 'content_issue',
        code: words > 36 ? 'read_aloud_unfriendly' : 'output_overreach',
        path: entry.path,
        note: `Student-facing instruction is too long for quick read-aloud use (${words} words): "${entry.text}".`,
      })
    }

    const hiddenMoveCount = (text.match(/\b(and|or)\b/g) ?? []).length
    if (isPromptLikePath && words > 24 && hiddenMoveCount >= 2 && (text.match(/\?/g) ?? []).length >= 2) {
      findings.push({
        type: 'content_issue',
        code: 'multi_hidden_thinking_moves',
        path: entry.path,
        note: `Student-facing prompt appears to bundle multiple thinking moves into one task: "${entry.text}".`,
      })
    }
  }

  for (const target of collectLongResponseTargets(pkg.worksheet, 'worksheet').concat(
    collectLongResponseTargets(pkg.task_sheet, 'task_sheet'),
    collectLongResponseTargets(pkg.exit_ticket, 'exit_ticket'),
    collectLongResponseTargets(pkg.final_response_sheet, 'final_response_sheet'),
  )) {
    const promptText = lowerText(target.prompt)
    if (target.n_lines >= 8 && /\b(explain|justify|argue|recommend|analysis|analyze|essay|paragraph)\b/.test(promptText)) {
      findings.push({
        type: 'content_issue',
        code: 'output_overreach',
        path: target.path,
        note: `Student response demand looks too long for a default Careers 8 task (${target.n_lines} lines): "${target.prompt}".`,
      })
    }
  }

  if (!hasScaffold) {
    findings.push({
      type: 'content_issue',
      code: 'missing_concrete_scaffold',
      path: 'student_facing_bundle',
      note: 'Careers 8 package does not clearly include a list, sort, ranking task, scenario, role map, comparison prompt, or visible example set.',
    })
    severeCodes.add('missing_concrete_scaffold')
  }

  if (
    findings.some((item) => item.code === 'unsupported_vocabulary' || item.code === 'adult_tone_drift') &&
    findings.some((item) => item.code === 'missing_concrete_scaffold' || item.code === 'output_overreach' || item.code === 'multi_hidden_thinking_moves')
  ) {
    blockers.push('careers8_contract_violation')
  } else if (severeCodes.size >= 2) {
    blockers.push('careers8_contract_violation')
  }

  const judgment = blockers.length > 0 ? 'block' : findings.length > 0 ? 'revise' : 'pass'

  return {
    applies: true,
    contract_id: CAREERS_8_CONTRACT_ID,
    judgment,
    blockers,
    findings,
    matched_contracts: matchedContracts,
  }
}
