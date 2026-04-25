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
import { getModeDefaults, TEACHING_MODE_DEFAULTS } from '../../engine/generation/teaching-mode-defaults.mjs'

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

  // ---------------------------------------------------------------------------
  // C1 — Teaching mode defaults
  // ---------------------------------------------------------------------------

  it('all teaching_mode enum values have entries in TEACHING_MODE_DEFAULTS', () => {
    const enumValues = ['standard', 'sub_friendly', 'hands_on', 'low_tech', 'quiet_writing', 'recovery_reteach', 'conversational']
    for (const mode of enumValues) {
      assert.ok(TEACHING_MODE_DEFAULTS[mode], `TEACHING_MODE_DEFAULTS should have entry for "${mode}"`)
      assert.ok(Array.isArray(TEACHING_MODE_DEFAULTS[mode].default_output_types), `"${mode}" should have default_output_types array`)
    }
  })

  it('getModeDefaults falls back to standard for unknown mode', () => {
    const result = getModeDefaults('nonexistent_mode')
    assert.deepEqual(result, TEACHING_MODE_DEFAULTS.standard)
  })

  it('hands_on mode applies output type defaults when no course default is set', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'hands_on' }
    const ctx = mergeProfileContext({ classProfile })
    assert.ok(Array.isArray(ctx.default_output_types))
    assert.ok(ctx.default_output_types.includes('task_sheet'), 'hands_on should default to task_sheet')
    assert.ok(ctx.default_output_types.includes('station_cards'), 'hands_on should default to station_cards')
    assert.ok(!ctx.default_output_types.includes('worksheet'), 'hands_on should not default to worksheet')
  })

  it('conversational mode sets minimal output types', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'conversational' }
    const ctx = mergeProfileContext({ classProfile })
    assert.ok(ctx.default_output_types.includes('pacing_guide'))
    assert.ok(!ctx.default_output_types.includes('worksheet'))
    assert.ok(!ctx.default_output_types.includes('task_sheet'))
  })

  it('sub_friendly mode includes sub_plan in output types', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'sub_friendly' }
    const ctx = mergeProfileContext({ classProfile })
    assert.ok(ctx.default_output_types.includes('sub_plan'))
  })

  it('mode prompt_notes are set on context for non-standard modes', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'hands_on' }
    const ctx = mergeProfileContext({ classProfile })
    assert.ok(ctx.mode_prompt_notes, 'hands_on should set mode_prompt_notes')
    assert.ok(ctx.mode_prompt_notes.includes('station'), 'hands_on notes should mention station activities')
  })

  it('standard mode does not set mode_prompt_notes', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'standard' }
    const ctx = mergeProfileContext({ classProfile })
    assert.equal(ctx.mode_prompt_notes, undefined)
  })

  it('course default_output_types take precedence over mode defaults', () => {
    const course = { course_id: 'test', default_output_types: ['teacher_guide', 'worksheet'] }
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'hands_on' }
    const ctx = mergeProfileContext({ course, classProfile })
    // Course explicitly set worksheet — mode should not override
    assert.ok(ctx.default_output_types.includes('worksheet'))
  })

  it('generation_overrides.default_output_types win over mode defaults', () => {
    const classProfile = {
      section_id: 'test',
      course_id: 'test',
      teaching_mode: 'hands_on',
      generation_overrides: { default_output_types: ['teacher_guide', 'rubric_sheet'] },
    }
    const ctx = mergeProfileContext({ classProfile })
    assert.deepEqual(ctx.default_output_types, ['teacher_guide', 'rubric_sheet'])
    assert.ok(!ctx.default_output_types.includes('task_sheet'))
  })

  it('buildProfilePromptBlock includes mode_prompt_notes for hands_on', () => {
    const classProfile = { section_id: 'test', course_id: 'test', teaching_mode: 'hands_on' }
    const ctx = mergeProfileContext({ classProfile })
    const block = buildProfilePromptBlock(ctx)
    assert.ok(block.includes('station'), 'prompt block should include hands_on mode notes')
  })

  it('buildProfilePromptBlock includes sub_plan instruction when include_sub_plan is set', () => {
    const classProfile = {
      section_id: 'test',
      course_id: 'test',
      generation_overrides: { include_sub_plan: true },
    }
    const ctx = mergeProfileContext({ classProfile })
    const block = buildProfilePromptBlock(ctx)
    assert.ok(block.includes('sub_plan'), 'prompt block should mention sub_plan when include_sub_plan is set')
  })

  it('BPG class hands_on mode injects mode notes into prompt block', () => {
    const teacher = loadTeacherProfile()
    const course = loadCourseProfile('workplace_readiness')
    const classProfile = loadClassProfile('workplace_readiness_bpg')
    const ctx = mergeProfileContext({ teacher, course, classProfile })
    const block = buildProfilePromptBlock(ctx)
    assert.ok(block.includes('hands_on'))
    assert.ok(block.includes('station') || block.includes('task sheet') || block.includes('task_sheet') || block.includes('station activities'))
  })
})
