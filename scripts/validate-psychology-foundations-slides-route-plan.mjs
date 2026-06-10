import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { buildArtifactTrace } from '../engine/render/artifact-classifier.mjs'
import { buildTypedLayoutBlocks, validateTypedLayoutBlocks } from '../engine/render/typed-blocks.mjs'

const proofPath = 'fixtures/psychology/foundations-slides.proof.json'
const proof = JSON.parse(readFileSync(resolve(process.cwd(), proofPath), 'utf-8'))
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(proof)

assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2))
assert.equal(renderPlan.package_id, 'psychology_foundations_slides_proof')
assert.equal(renderPlan.primary_architecture, 'single_period_full')
assert.equal(routes.length, 1)

const slideRoute = routes[0]
assert.equal(slideRoute.output_id, 'psychology_foundations_l1_slides')
assert.equal(slideRoute.output_type, 'slides')
assert.equal(slideRoute.audience, 'shared_view')
assert.equal(slideRoute.audience_bucket, 'shared_view')
assert.equal(slideRoute.renderer_key, 'render_slides')
assert.equal(slideRoute.renderer_family, 'pptx')
assert.equal(slideRoute.artifact_family, 'slides')
assert.equal(slideRoute.source_section, 'slides')

const blocks = buildTypedLayoutBlocks(proof, slideRoute)
const blockValidation = validateTypedLayoutBlocks(blocks)
assert.equal(blockValidation.valid, true, JSON.stringify(blockValidation.errors, null, 2))
assert.ok(blocks.length >= 30)
assert.equal(blocks.some((block) => block.teacher_only === true), false)

const trace = buildArtifactTrace(proof, slideRoute, blocks)
assert.equal(trace.artifact_class, 'mini_lesson_slides')
assert.equal(trace.mode, 'slide_mode')
assert.equal(trace.fallback_reason, null)

assert.equal(Array.isArray(proof.slides), true)
assert.equal(proof.slides.length, 15)

console.log('psychology-foundations-slides-route ok: Cycle A L1 slide route is renderable as shared-view PPTX')
