import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'

const proofPath = 'fixtures/psychology/foundations-package.proof.json'
const proof = JSON.parse(readFileSync(resolve(process.cwd(), proofPath), 'utf-8'))
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(proof)

assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2))
assert.equal(renderPlan.package_id, 'psychology_foundations_package_proof')
assert.equal(renderPlan.primary_architecture, 'single_period_full')
assert.equal(routes.length, 2, 'Expected separate student and teacher routes')

const studentRoute = routes.find((route) => route.output_id === 'psychology_foundations_student_packet')
const teacherRoute = routes.find((route) => route.output_id === 'psychology_foundations_teacher_guide')

assert.ok(studentRoute, 'Missing student packet route')
assert.ok(teacherRoute, 'Missing teacher guide route')

assert.equal(studentRoute.output_type, 'task_sheet')
assert.equal(studentRoute.audience, 'student')
assert.equal(studentRoute.audience_bucket, 'student_facing')
assert.equal(studentRoute.renderer_key, 'render_task_sheet')
assert.equal(studentRoute.renderer_family, 'pdf')
assert.equal(studentRoute.artifact_family, 'task_sheet')
assert.equal(studentRoute.source_section, 'task_sheet')

assert.equal(teacherRoute.output_type, 'teacher_guide')
assert.equal(teacherRoute.audience, 'teacher')
assert.equal(teacherRoute.audience_bucket, 'teacher_only')
assert.equal(teacherRoute.renderer_key, 'render_teacher_guide')
assert.equal(teacherRoute.renderer_family, 'pdf')
assert.equal(teacherRoute.artifact_family, 'teacher_guide')
assert.equal(teacherRoute.source_section, 'teacher_guide')

assert.notEqual(studentRoute.route_id, teacherRoute.route_id)
assert.notEqual(studentRoute.artifact_id, teacherRoute.artifact_id)
assert.equal(studentRoute.route_id.includes('teacher'), false, 'Student route must not be routed as teacher content')
assert.equal(teacherRoute.route_id.includes('student'), false, 'Teacher route must not be routed as student content')

const studentOutput = renderPlan.outputs.find((output) => output.output_id === studentRoute.output_id)
const teacherOutput = renderPlan.outputs.find((output) => output.output_id === teacherRoute.output_id)
assert.equal(studentOutput.answer_key, false)
assert.equal(studentOutput.visibility.student, true)
assert.equal(studentOutput.visibility.teacher, false)
assert.equal(teacherOutput.answer_key, true)
assert.equal(teacherOutput.visibility.student, false)
assert.equal(teacherOutput.visibility.teacher, true)

console.log('psychology-foundations-route-plan ok: student/teacher routes separated and renderable')
