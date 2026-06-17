import test from 'node:test'
import assert from 'node:assert/strict'

import { planPackageRoutes } from '../../engine/planner/output-router.mjs'

const packageFixture = {
  schema_version: '2.1.0',
  package_id: 'router-contract-fixture',
  primary_architecture: 'single_period_full',
  bundle: {
    bundle_id: 'router-contract-fixture',
    declared_outputs: ['slides', 'worksheet', 'teacher_guide', 'graphic_organizer', 'discussion_prep_sheet'],
  },
  slides: [
    {
      title: 'Launch',
      layout: 'prompt',
      content: {
        scenario: 'Warm opening',
      },
    },
  ],
  worksheet: {
    title: 'Worksheet',
    questions: [
      {
        q_num: 1,
        q_text: 'Explain your reasoning.',
        n_lines: 4,
      },
    ],
  },
  graphic_organizer: {
    title: 'Evidence organizer',
    organizer_type: 't_chart',
    columns: ['Claim', 'Evidence'],
    rows: 3,
    prompt: 'Sort your strongest points and proof.',
  },
  discussion_prep_sheet: {
    title: 'Discussion prep',
    discussion_prompt: 'Which solution is strongest and why?',
    position_label: 'My position',
    evidence_count: 3,
    include_question: true,
    include_counterargument: true,
  },
  outputs: [
    {
      output_id: 'lesson_slides',
      output_type: 'slides',
      audience: 'shared_view',
      source_section: 'slides',
      final_evidence: true,
    },
    {
      output_id: 'student_sheet',
      output_type: 'worksheet',
      audience: 'student',
      source_section: 'worksheet',
    },
    {
      output_id: 'teacher_guide',
      output_type: 'teacher_guide',
      audience: 'teacher',
      source_section: 'worksheet',
    },
    {
      output_id: 'organizer_sheet',
      output_type: 'graphic_organizer',
      audience: 'student',
      source_section: 'graphic_organizer',
    },
    {
      output_id: 'discussion_sheet',
      output_type: 'discussion_prep_sheet',
      audience: 'student',
      source_section: 'discussion_prep_sheet',
    },
  ],
}

const literacyQuestFixture = {
  schema_version: '2.1.0',
  course_family_id: 'literacy-guild',
  package_id: 'literacy_guild_voice_trial_fixture',
  package_type: 'student_packet',
  title: 'Voice Trial Lesson 1',
  primary_architecture: 'single_period_full',
  bundle: {
    bundle_id: 'literacy_guild_voice_trial_fixture',
    declared_outputs: ['task_sheet', 'teacher_guide', 'graphic_organizer', 'rubric_sheet', 'vocabulary_card'],
  },
  task_sheet: {
    title: 'Voice Trial Mission Page',
    purpose_line: 'Read one line again and name what got clearer.',
    tasks: [
      {
        label: 'Reread one line',
        prompt: 'Choose one line and read it again.',
        lines: 3,
      },
    ],
  },
  graphic_organizer: {
    title: 'Phrase map',
    organizer_type: 't_chart',
    columns: ['Line', 'What I changed'],
    rows: 2,
  },
  rubric_sheet: {
    title: 'Fluency criteria',
    criteria: ['Accuracy', 'Phrasing', 'Reread repair'],
  },
  outputs: [
    {
      output_id: 'voice_trial_student_packet',
      output_type: 'task_sheet',
      audience: 'student',
      source_section: 'task_sheet',
      title: 'Voice Trial Lesson 1',
    },
    {
      output_id: 'voice_trial_teacher_guide',
      output_type: 'teacher_guide',
      audience: 'teacher',
      source_section: 'task_sheet',
      title: 'Voice Trial Lesson 1',
    },
    {
      output_id: 'voice_trial_strategy_map',
      output_type: 'graphic_organizer',
      audience: 'student',
      source_section: 'graphic_organizer',
      title: 'Phrase Practice',
    },
    {
      output_id: 'voice_trial_mastery_scale',
      output_type: 'rubric_sheet',
      audience: 'student',
      source_section: 'rubric_sheet',
      title: 'Fluency Criteria',
    },
    {
      output_id: 'voice_trial_key_terms',
      output_type: 'vocabulary_card',
      audience: 'student',
      source_section: 'task_sheet',
      title: 'Key Terms',
    },
  ],
}

test('planPackageRoutes maps output types to renderer families and audience buckets', () => {
  const { validation, routes } = planPackageRoutes(packageFixture)

  assert.equal(validation.valid, true)
  assert.equal(routes.length, 5)

  const slidesRoute = routes.find((route) => route.output_id === 'lesson_slides')
  const worksheetRoute = routes.find((route) => route.output_id === 'student_sheet')
  const teacherGuideRoute = routes.find((route) => route.output_id === 'teacher_guide')
  const organizerRoute = routes.find((route) => route.output_id === 'organizer_sheet')
  const discussionRoute = routes.find((route) => route.output_id === 'discussion_sheet')

  assert.equal(slidesRoute?.renderer_family, 'pptx')
  assert.equal(slidesRoute?.audience_bucket, 'shared_view')
  assert.equal(slidesRoute?.final_evidence_role, 'primary')

  assert.equal(worksheetRoute?.renderer_family, 'pdf')
  assert.equal(worksheetRoute?.audience_bucket, 'student_facing')

  assert.equal(teacherGuideRoute?.renderer_family, 'pdf')
  assert.equal(teacherGuideRoute?.audience_bucket, 'teacher_only')

  assert.equal(organizerRoute?.renderer_family, 'pdf')
  assert.equal(organizerRoute?.renderer_key, 'render_graphic_organizer')
  assert.equal(organizerRoute?.audience_bucket, 'student_facing')

  assert.equal(discussionRoute?.renderer_family, 'pdf')
  assert.equal(discussionRoute?.renderer_key, 'render_discussion_prep_sheet')
  assert.equal(discussionRoute?.audience_bucket, 'student_facing')
})

test('literacy routes carry wrapper metadata without replacing structural routing', () => {
  const { validation, routes } = planPackageRoutes(literacyQuestFixture)

  assert.equal(validation.valid, true)
  assert.equal(routes.length, 5)

  const studentPacket = routes.find((route) => route.output_id === 'voice_trial_student_packet')
  const teacherGuide = routes.find((route) => route.output_id === 'voice_trial_teacher_guide')
  const strategyMap = routes.find((route) => route.output_id === 'voice_trial_strategy_map')
  const masteryScale = routes.find((route) => route.output_id === 'voice_trial_mastery_scale')
  const keyTerms = routes.find((route) => route.output_id === 'voice_trial_key_terms')

  assert.equal(studentPacket?.renderer_key, 'render_task_sheet')
  assert.equal(studentPacket?.resource_role, 'student_packet')
  assert.equal(studentPacket?.wrapper_label, 'Quest Journal')
  assert.equal(studentPacket?.display_title, 'Quest Journal: Voice Trial Lesson 1')
  assert.equal(studentPacket?.wrapper_theme_scope, 'wrapper_navigation_only')

  assert.equal(teacherGuide?.renderer_key, 'render_teacher_guide')
  assert.equal(teacherGuide?.resource_role, 'teacher_guide')
  assert.equal(teacherGuide?.wrapper_label, 'Guild Leader Guide')
  assert.equal(teacherGuide?.display_title, 'Guild Leader Guide: Voice Trial Lesson 1')

  assert.equal(strategyMap?.resource_role, 'graphic_organizer')
  assert.equal(strategyMap?.wrapper_label, 'Strategy Map')
  assert.equal(strategyMap?.display_title, 'Strategy Map: Phrase Practice')

  assert.equal(masteryScale?.resource_role, 'rubric')
  assert.equal(masteryScale?.wrapper_label, 'Guild Criteria')
  assert.equal(masteryScale?.display_title, 'Guild Criteria: Fluency Criteria')

  assert.equal(keyTerms?.resource_role, 'vocabulary')
  assert.equal(keyTerms?.wrapper_label, 'Key Terms')
})
