import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'

const proofPath = 'fixtures/psychology/foundations-assessment.proof.json'
const proof = JSON.parse(readFileSync(resolve(process.cwd(), proofPath), 'utf-8'))
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(proof)

assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2))
assert.equal(renderPlan.package_id, 'psychology_foundations_assessment_proof')
assert.equal(renderPlan.primary_architecture, 'single_period_full')
assert.equal(routes.length, 2)

const studentRoute = routes.find((route) => route.output_id === 'psychology_foundations_student_assessment')
const teacherRoute = routes.find((route) => route.output_id === 'psychology_foundations_teacher_marking_guide')

assert.ok(studentRoute)
assert.ok(teacherRoute)
assert.equal(studentRoute.output_type, 'assessment')
assert.equal(studentRoute.audience, 'student')
assert.equal(studentRoute.audience_bucket, 'student_facing')
assert.equal(studentRoute.renderer_key, 'render_assessment')
assert.equal(studentRoute.renderer_family, 'pdf')
assert.equal(studentRoute.artifact_family, 'assessment')
assert.equal(studentRoute.source_section, 'assessment')

assert.equal(teacherRoute.output_type, 'answer_key')
assert.equal(teacherRoute.audience, 'teacher')
assert.equal(teacherRoute.audience_bucket, 'teacher_only')
assert.equal(teacherRoute.renderer_key, 'render_answer_key')
assert.equal(teacherRoute.renderer_family, 'pdf')
assert.equal(teacherRoute.artifact_family, 'answer_key')
assert.equal(teacherRoute.source_section, 'marking_guide')

assert.notEqual(studentRoute.route_id, teacherRoute.route_id)
assert.notEqual(studentRoute.artifact_id, teacherRoute.artifact_id)

const studentOutput = proof.outputs.find((output) => output.output_id === studentRoute.output_id)
const teacherOutput = proof.outputs.find((output) => output.output_id === teacherRoute.output_id)
assert.equal(studentOutput.answer_key, false)
assert.equal(studentOutput.visibility.student, true)
assert.equal(studentOutput.visibility.teacher, false)
assert.equal(teacherOutput.answer_key, true)
assert.equal(teacherOutput.visibility.student, false)
assert.equal(teacherOutput.visibility.teacher, true)

console.log('psychology-foundations-assessment-route ok')
