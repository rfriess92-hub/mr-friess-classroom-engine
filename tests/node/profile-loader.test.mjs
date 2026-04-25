import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  loadTeacherProfile,
  loadCourseProfile,
  loadClassProfile,
  mergeProfileContext,
  buildProfilePromptBlock,
  findReferenceFixture,
  loadGradeBandContract,
} from '../../engine/generation/profile-loader.mjs'

describe('profile loader', () => {
  it('loads teacher profile', () => {
    const teacher = loadTeacherProfile()
    assert.ok(teacher, 'teacher profile should load')
    assert.ok(teacher.name, 'teacher profile should have a name')
  })

  it('loads careers_8 course profile', () => {
    const course = loadCourseProfile('careers_8')
    assert.ok(course, 'careers_8 course profile should exist')
    assert.equal(course.course_id, 'careers_8')
    assert.ok(course.theme, 'course profile should have a theme')
    assert.ok(Array.isArray(course.default_output_types), 'course profile should have default_output_types')
  })

  it('loads workplace_readiness course profile', () => {
    const course = loadCourseProfile('workplace_readiness')
    assert.ok(course, 'workplace_readiness course profile should exist')
    assert.equal(course.course_id, 'workplace_readiness')
    assert.ok(course.grade_band_contract, 'workplace_readiness should have a grade_band_contract')
  })

  it('loads workplace_readiness_bpg class profile', () => {
    const classProfile = loadClassProfile('workplace_readiness_bpg')
    assert.ok(classProfile, 'BPG class profile should exist')
    assert.equal(classProfile.section_id, 'workplace_readiness_bpg')
    assert.ok(classProfile.project, 'BPG class profile should have a project')
    assert.equal(classProfile.project.short_id, 'bpg')
  })

  it('returns null for unknown course', () => {
    const course = loadCourseProfile('nonexistent_course_xyz')
    assert.equal(course, null)
  })

  it('returns null for unknown section', () => {
    const classProfile = loadClassProfile('nonexistent_section_xyz')
    assert.equal(classProfile, null)
  })

  it('merges teacher + course + class into context', () => {
    const teacher = loadTeacherProfile()
    const course = loadCourseProfile('workplace_readiness')
    const classProfile = loadClassProfile('workplace_readiness_bpg')
    const ctx = mergeProfileContext({ teacher, course, classProfile })

    assert.ok(ctx.teacher_name, 'context should have teacher_name')
    assert.equal(ctx.course_id, 'workplace_readiness')
    assert.equal(ctx.section_id, 'workplace_readiness_bpg')
    assert.equal(ctx.teaching_mode, 'hands_on', 'class teaching_mode should override teacher default')
    assert.ok(ctx.project, 'context should have project from class profile')
    assert.equal(ctx.project.short_id, 'bpg')
    assert.equal(ctx.include_makeup_packet, true, 'class generation_overrides should be applied')
  })

  it('class lesson_length_minutes overrides teacher default', () => {
    const teacher = { default_lesson_length_minutes: 60 }
    const classProfile = { lesson_length_minutes: 79 }
    const ctx = mergeProfileContext({ teacher, classProfile })
    assert.equal(ctx.lesson_length_minutes, 79)
  })

  it('buildProfilePromptBlock produces non-empty string for BPG context', () => {
    const teacher = loadTeacherProfile()
    const course = loadCourseProfile('workplace_readiness')
    const classProfile = loadClassProfile('workplace_readiness_bpg')
    const ctx = mergeProfileContext({ teacher, course, classProfile })
    const block = buildProfilePromptBlock(ctx)

    assert.ok(block.length > 0, 'prompt block should be non-empty')
    assert.ok(block.includes('<class_context>'), 'prompt block should be wrapped in class_context tags')
    assert.ok(block.includes('Build, Plant, Grow'), 'prompt block should include project name')
    assert.ok(block.includes('hands_on'), 'prompt block should include teaching mode')
  })

  it('buildProfilePromptBlock returns empty string for empty context', () => {
    const block = buildProfilePromptBlock({})
    assert.equal(block, '')
  })

  it('findReferenceFixture returns a careers fixture for careers_8', () => {
    const ctx = mergeProfileContext({ course: loadCourseProfile('careers_8') })
    const path = findReferenceFixture(ctx)
    assert.ok(path.toLowerCase().includes('career'), 'reference fixture should match careers theme')
  })

  it('findReferenceFixture returns a math/workplace fixture for workplace_readiness', () => {
    const ctx = mergeProfileContext({ course: loadCourseProfile('workplace_readiness') })
    const path = findReferenceFixture(ctx)
    assert.ok(path, 'should return some fixture path')
  })

  it('loadGradeBandContract returns text for workplace-math-10-grade-band', () => {
    const text = loadGradeBandContract('workplace-math-10-grade-band')
    assert.ok(text && text.length > 0, 'contract text should be non-empty')
    assert.ok(text.includes('Workplace'), 'contract text should reference Workplace Math')
  })

  it('loadGradeBandContract returns null for unknown contract', () => {
    const text = loadGradeBandContract('nonexistent-contract-xyz')
    assert.equal(text, null)
  })
})
