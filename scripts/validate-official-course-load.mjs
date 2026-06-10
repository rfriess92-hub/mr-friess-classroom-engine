import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const LOAD_PATH = 'school-year/2026-2027/official-course-load.yaml'
const PROOF_PATH = 'fixtures/course-load/official-2026-2027.proof.json'

const LITERACY_COHORT_FILES = [
  'courses/literacy/cohort-1/learner-profile-notes.yaml',
  'courses/literacy/cohort-1/semester-1-plan.yaml',
  'courses/literacy/cohort-2/learner-profile-notes.yaml',
  'courses/literacy/cohort-2/semester-1-plan.yaml',
  'courses/literacy/cohort-2/semester-2-continuation-plan.yaml',
  'courses/literacy/cohort-2/intervention-map.yaml',
]

function readText(path) {
  return readFileSync(resolve(ROOT, path), 'utf-8')
}

function readJson(path) {
  return JSON.parse(readText(path))
}

function assertFileExists(path) {
  assert.ok(existsSync(resolve(ROOT, path)), `Missing required file: ${path}`)
}

function scalarValue(block, key) {
  const match = block.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'))
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null
}

function extractCourseBlocks(loadText) {
  const blocks = []
  const pattern = /\n\s{6}- course_instance_id: ([^\n]+)\n([\s\S]*?)(?=\n\s{6}- course_instance_id:|\n\s{2}- id: semester-2|\ncourse_families:)/g

  for (const match of loadText.matchAll(pattern)) {
    const block = `course_instance_id: ${match[1]}\n${match[2]}`
    blocks.push({
      course_instance_id: match[1].trim(),
      course_family_id: scalarValue(block, 'course_family_id'),
      title: scalarValue(block, 'title'),
      instance_type: scalarValue(block, 'instance_type'),
      cohort_id: scalarValue(block, 'cohort_id'),
      repeats_in: scalarValue(block, 'repeats_in'),
      repeats_from: scalarValue(block, 'repeats_from'),
      continues_to: scalarValue(block, 'continues_to'),
      continues_from: scalarValue(block, 'continues_from'),
      continuity_status: scalarValue(block, 'continuity_status'),
      block,
    })
  }

  return blocks
}

function extractCourseFamilyPaths(loadText) {
  const families = new Map()
  const pattern = /\n\s{2}- id: ([^\n]+)\n([\s\S]*?)(?=\n\s{2}- id:|\nrendering_contract_targets:|\nplanning_order:|$)/g

  for (const match of loadText.matchAll(pattern)) {
    const id = match[1].trim()
    const block = `id: ${id}\n${match[2]}`
    const path = scalarValue(block, 'path')
    if (path) families.set(id, path)
  }

  return families
}

function hasListItem(text, heading, item) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const section = text.match(new RegExp(`${escapedHeading}:\\n([\\s\\S]*?)(?=\\n\\S|$)`))
  if (!section) return false
  return section[1].includes(`- ${item}`)
}

function validateLiteracyCohortFiles() {
  for (const path of LITERACY_COHORT_FILES) {
    assertFileExists(path)
    const text = readText(path)
    assert.equal(scalarValue(text, 'course_family_id'), 'literacy', `${path} must remain tied to Literacy`)
    assert.equal(scalarValue(text, 'status'), 'placeholder', `${path} should remain marked as placeholder until filled`)
  }

  const cohort1Profile = readText('courses/literacy/cohort-1/learner-profile-notes.yaml')
  assert.equal(scalarValue(cohort1Profile, 'cohort_id'), 'literacy_cohort_1')
  assert.match(cohort1Profile, /continuity_status: returning_from_current_semester/)

  const cohort2Profile = readText('courses/literacy/cohort-2/learner-profile-notes.yaml')
  assert.equal(scalarValue(cohort2Profile, 'cohort_id'), 'literacy_cohort_2')
  assert.match(cohort2Profile, /continuity_status: two_semester_sequence/)
  assert.ok(hasListItem(cohort2Profile, 'course_instance_ids', 'literacy-cohort-2-sem1'))
  assert.ok(hasListItem(cohort2Profile, 'course_instance_ids', 'literacy-cohort-2-sem2'))
  assert.ok(hasListItem(cohort2Profile, 'carry_forward_fields', 'successful_scaffolds'))
  assert.ok(hasListItem(cohort2Profile, 'carry_forward_fields', 'incomplete_or_reassessment_items'))

  const cohort2Sem1 = readText('courses/literacy/cohort-2/semester-1-plan.yaml')
  assert.match(cohort2Sem1, /continues_to: courses\/literacy\/cohort-2\/semester-2-continuation-plan.yaml/)
  assert.ok(hasListItem(cohort2Sem1, 'carry_forward_outputs', 'successful_scaffolds'))

  const cohort2Sem2 = readText('courses/literacy/cohort-2/semester-2-continuation-plan.yaml')
  assert.match(cohort2Sem2, /continues_from: courses\/literacy\/cohort-2\/semester-1-plan.yaml/)
  assert.ok(hasListItem(cohort2Sem2, 'required_inputs_from_semester_1', 'successful_scaffolds'))
}

function validateOfficialCourseLoad() {
  assertFileExists(LOAD_PATH)
  assertFileExists(PROOF_PATH)

  const load = readText(LOAD_PATH)
  const proof = readJson(PROOF_PATH)
  const courseBlocks = extractCourseBlocks(load)
  const familyPaths = extractCourseFamilyPaths(load)
  const ids = courseBlocks.map((course) => course.course_instance_id)

  assert.equal(scalarValue(load, 'schema_version'), '1')
  assert.equal(scalarValue(load, 'school_year'), '2026-2027')
  assert.equal(scalarValue(load, 'status'), 'official')
  assert.equal(courseBlocks.length, 6, 'Expected exactly six official course instances')
  assert.equal(familyPaths.size, 3, 'Expected exactly three course families')

  assert.deepEqual(ids, [
    'psychology-11-12-sem1',
    'literacy-cohort-1-sem1',
    'literacy-cohort-2-sem1',
    'psychology-11-12-sem2',
    'literacy-cohort-2-sem2',
    'careers-10-sem2',
  ])

  for (const expected of proof.expected_course_instances) {
    const actual = courseBlocks.find((course) => course.course_instance_id === expected.course_instance_id)
    assert.ok(actual, `Missing course instance from load: ${expected.course_instance_id}`)
    for (const [key, value] of Object.entries(expected)) {
      if (key === 'semester_id') continue
      assert.equal(actual[key], value, `Mismatch for ${expected.course_instance_id}.${key}`)
    }
  }

  const familyIds = [...familyPaths.keys()]
  assert.deepEqual(familyIds, proof.expected_course_families)

  for (const [familyId, profilePath] of familyPaths) {
    assertFileExists(profilePath)
    const profile = readText(profilePath)
    assert.equal(scalarValue(profile, 'course_family_id'), familyId)
  }

  const psychology = readText('courses/psychology-11-12/course-profile.yaml')
  assert.equal(scalarValue(psychology, 'course_type'), 'repeatable_semester_course')
  assert.ok(hasListItem(psychology, 'instances', 'psychology-11-12-sem1'))
  assert.ok(hasListItem(psychology, 'instances', 'psychology-11-12-sem2'))
  assert.ok(hasListItem(psychology, 'student_packet_required_roles', 'completion_check'))
  assert.ok(hasListItem(psychology, 'teacher_guide_conditional_roles', 'project_tools'))

  const literacy = readText('courses/literacy/course-profile.yaml')
  assert.equal(scalarValue(literacy, 'course_type'), 'cohort_continuity_course')
  assert.ok(hasListItem(literacy, 'instances', 'literacy-cohort-1-sem1'))
  assert.ok(hasListItem(literacy, 'instances', 'literacy-cohort-2-sem1'))
  assert.ok(hasListItem(literacy, 'instances', 'literacy-cohort-2-sem2'))
  assert.ok(hasListItem(literacy, 'carry_forward_fields', 'successful_scaffolds'))
  assert.ok(hasListItem(literacy, 'carry_forward_fields', 'incomplete_or_reassessment_items'))
  assert.ok(hasListItem(literacy, 'student_packet_required_roles', 'completion_check'))

  const careers = readText('courses/careers-10/course-profile.yaml')
  assert.equal(scalarValue(careers, 'course_type'), 'contained_semester_course')
  assert.equal(scalarValue(careers, 'grade_band'), '10')
  assert.ok(hasListItem(careers, 'instances', 'careers-10-sem2'))
  assert.ok(hasListItem(careers, 'student_packet_required_roles', 'completion_check'))
  assert.ok(hasListItem(careers, 'teacher_guide_conditional_roles', 'project_tools'))

  assert.match(load, /student_packet:[\s\S]*required_roles:[\s\S]*- completion_check/)
  assert.match(load, /teacher_guide:[\s\S]*conditional_roles:[\s\S]*- project_tools/)

  validateLiteracyCohortFiles()

  return {
    course_instances: ids.length,
    course_families: familyPaths.size,
    literacy_cohort_files: LITERACY_COHORT_FILES.length,
    proof_id: proof.proof_id,
  }
}

try {
  const result = validateOfficialCourseLoad()
  console.log(`official-course-load ok: ${result.course_instances} instances, ${result.course_families} families, ${result.literacy_cohort_files} literacy cohort files, proof=${result.proof_id}`)
} catch (error) {
  console.error('official-course-load validation failed')
  console.error(error?.stack || error)
  process.exit(1)
}
