// Official 2026-2027 course-load guardrails.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf-8')
}

function loadJson(path) {
  return JSON.parse(readText(path))
}

function courseInstanceIds(loadText) {
  return [...loadText.matchAll(/course_instance_id: ([a-z0-9-]+)/g)].map((match) => match[1])
}

test('official 2026-2027 load lists the actual six course instances', () => {
  const load = readText('school-year/2026-2027/official-course-load.yaml')

  assert.deepEqual(courseInstanceIds(load), [
    'psychology-11-12-sem1',
    'literacy-cohort-1-sem1',
    'literacy-cohort-2-sem1',
    'psychology-11-12-sem2',
    'literacy-cohort-2-sem2',
    'careers-10-sem2',
  ])
})

test('official load encodes Literacy Cohort 2 as a two-semester continuity case', () => {
  const load = readText('school-year/2026-2027/official-course-load.yaml')

  assert.match(load, /course_instance_id: literacy-cohort-2-sem1[\s\S]*continues_to: literacy-cohort-2-sem2/)
  assert.match(load, /course_instance_id: literacy-cohort-2-sem2[\s\S]*continues_from: literacy-cohort-2-sem1/)
  assert.match(load, /course_family_id: literacy[\s\S]*core_engine_need: cohort_memory_and_intervention_tracking/)
})

test('official load keeps Psychology reusable but instance-specific', () => {
  const load = readText('school-year/2026-2027/official-course-load.yaml')

  assert.match(load, /course_instance_id: psychology-11-12-sem1[\s\S]*repeats_in: semester-2/)
  assert.match(load, /course_instance_id: psychology-11-12-sem2[\s\S]*repeats_from: semester-1/)
  assert.match(load, /course_family_id: psychology-11-12[\s\S]*core_engine_need: reusable_course_spine_with_instance_overrides/)
})

test('official load proof fixture mirrors the course-load assumptions', () => {
  const proof = loadJson('fixtures/course-load/official-2026-2027.proof.json')

  assert.equal(proof.expected_school_year, '2026-2027')
  assert.equal(proof.expected_course_instance_count, 6)
  assert.equal(proof.expected_course_family_count, 3)
  assert.deepEqual(proof.expected_course_families, [
    'psychology-11-12',
    'literacy',
    'careers-10',
  ])
  assert.ok(proof.required_engine_assertions.includes('literacy_cohort_2 continues from Semester 1 into Semester 2'))
  assert.ok(proof.required_engine_assertions.includes('student_packet package types require a completion_check role'))
  assert.ok(proof.required_engine_assertions.includes('project-based teacher_guide package types require project_tools when applicable'))
})

test('course profiles preserve course-specific package contract signals', () => {
  const psychology = readText('courses/psychology-11-12/course-profile.yaml')
  const literacy = readText('courses/literacy/course-profile.yaml')
  const careers = readText('courses/careers-10/course-profile.yaml')

  assert.match(psychology, /course_type: repeatable_semester_course/)
  assert.match(psychology, /teacher_guide_conditional_roles:[\s\S]*project_tools/)

  assert.match(literacy, /course_type: cohort_continuity_course/)
  assert.match(literacy, /carry_forward_fields:[\s\S]*successful_scaffolds/)
  assert.match(literacy, /student_packet_required_roles:[\s\S]*completion_check/)

  assert.match(careers, /course_type: contained_semester_course/)
  assert.match(careers, /course_family_id: careers-10/)
  assert.match(careers, /student_packet_required_roles:[\s\S]*completion_check/)
})
