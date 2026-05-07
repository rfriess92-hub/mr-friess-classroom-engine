import { mkdirSync, writeFileSync } from 'node:fs'

const outDir = 'fixtures/generated/kamloops-growth-project'

const weeks = [
  { n: 1, name: 'Meet the Planter Box', focus: 'measurement, area, perimeter, first observations', math: ['Record length, width, and height.', 'Find area and perimeter.', 'This measurement helps us decide ____.'], english: ['Write or draw one thing you noticed.', 'Use one garden word in a sentence.', 'Explain what the planter looked like at the start.'], cols: ['What I saw', 'Number or evidence', 'What it means'], exit: 'One useful measurement from this week was ___. It matters because ___.' },
  { n: 2, name: 'Soil, Water, and Volume', focus: 'soil, water, volume, capacity, sequence writing', math: ['Record today\'s soil: dry, damp, or wet.', 'Record water in mL or L.', 'Show water for 4 plants if each gets 1/4 L.', 'Estimate volume with length x width x soil depth.'], english: ['Put watering steps in order.', 'Write one care rule.', 'Explain how dry Kamloops weather can affect the planter.'], cols: ['Soil evidence', 'Water amount', 'Decision'], exit: 'Today the soil was dry / damp / wet. We watered / waited because ___.' },
  { n: 3, name: 'Sprouts, Ratios, and Rates', focus: 'sprouts, ratios, rates, cause and effect', math: ['Record seeds planted, seeds sprouted, and sprouted : planted.', 'Compare two plant groups.', 'Record watering rate.', 'Explain one transplant decision.'], english: ['Write a cause-and-effect sentence about a seed.', 'Use because to explain one garden decision.', 'Describe one plant growing well and one plant needing support.'], cols: ['Seed or plant', 'Count or evidence', 'Decision'], exit: 'The ratio ____ : ____ means ___.' },
  { n: 4, name: 'Percents and Percent Change', focus: 'percents, percent change, nonfiction update', math: ['Convert sprouted out of planted to percent.', 'Record old height, new height, and change.', 'Show a percent model.', 'Write one data claim.'], english: ['Write one true garden-data fact.', 'Explain what helped one plant grow or survive.', 'Write a 3-sentence update.'], cols: ['Part', 'Whole', 'Percent or change'], exit: 'Our germination or survival percent is ____%. This means ___.' },
  { n: 5, name: 'Data, Graphs, and Averages', focus: 'data tables, graphs, averages, captions', math: ['Record four data points.', 'Make a graph with title and labels.', 'Find mean or range.', 'Write one evidence sentence.'], english: ['Write a photo caption.', 'Use one number in a sentence.', 'Explain what the graph helps someone understand.'], cols: ['Measurement', 'Graph detail', 'What it shows'], exit: 'My graph shows ___. I know because ___.' },
  { n: 6, name: 'Patterns and Predictions', focus: 'patterns, predictions, input/output tables', math: ['Complete a week-to-height or week-to-leaf table.', 'Name the pattern.', 'Predict next week.', 'Compare actual result to prediction.'], english: ['Write a prediction using because.', 'Explain whether the prediction was close, too high, or too low.', 'Explain why plants may not follow a perfect pattern.'], cols: ['Past data', 'Prediction', 'Actual result'], exit: 'My prediction was ___. The actual result was ___.' },
  { n: 7, name: 'Budget, Equations, and Best Buys', focus: 'equations, budget, best buys, recommendations', math: ['List one need and one not-needed-yet item.', 'Solve 8 + 4p = 30.', 'Compare two buying options.', 'Recommend one choice.'], english: ['Write one opinion about what the planter needs next.', 'Give one budget or care reason.', 'Write a recommendation using because.'], cols: ['Option', 'Cost or evidence', 'Recommendation'], exit: 'The better buy is ____ because ___.' },
  { n: 8, name: 'Geometry, Probability, and Showcase', focus: 'geometry, probability, final claim, final growth story', math: ['Label faces, edges, corners, top view, and side view.', 'Set up diagonal squared = length squared + width squared.', 'Write one probability.', 'Write a final math claim.'], english: ['Choose a final form.', 'Show community, building, care, or growth.', 'Revise one sentence so it is clearer or more detailed.'], cols: ['Math evidence', 'Story evidence', 'Growth claim'], exit: 'The math shows ___. The story shows ___. Together they show growth because ___.' },
]

const base = {
  schema_version: '2.1.0',
  primary_architecture: 'multi_day_sequence',
  session_count: 5,
  grade_band: '6-8',
  subject: 'Mathematics / English Language Arts',
  grade: 8,
  theme: 'mathematics',
  materials_control_note: 'Student pages contain student directions and response spaces only. Teacher notes, conference prompts, release rules, and answer guidance stay in teacher-facing artifacts.',
}

function studentSheet(title, prompts) {
  return {
    title,
    purpose_line: 'Use real planter evidence.',
    instructions: ['Use real planter evidence.', 'Write units when needed.', 'Complete the parts assigned.'],
    tasks: prompts.map((prompt, i) => ({ label: `Part ${i + 1}`, prompt, lines: 4, activity_type: 'write_response' })),
    embedded_supports: ['Start: complete one frame.', 'Build: complete the core task.', 'Stretch: compare or explain another way.'],
    success_criteria: ['I used project evidence.', 'I explained my thinking.'],
  }
}

function slides(w) {
  return [
    { type: 'LAUNCH', title: `Week ${w.n}: ${w.name}`, layout: 'hero', content: { subtitle: 'Daily garden interaction plus one weekly math and English evidence page.' } },
    { type: 'LEARN', title: 'Daily garden routine', layout: 'rows', content: { rows: ['Look carefully.', 'Check soil and plant changes.', 'Record one number, word, sketch, or photo.', 'Act only when evidence says to.', 'Close with one change noticed.'] } },
    { type: 'TASK', title: 'This week', layout: 'rows', content: { rows: [`Focus: ${w.focus}`, 'Use Kamloops as the place reference.', 'Keep math evidence and story evidence separate.'] } },
  ]
}

function teacherGuide(n, name, focus) {
  return {
    big_idea: `Week ${n} uses the planter box for ${focus}.`,
    learning_goals: ['Use real garden evidence.', 'Complete one math evidence page.', 'Complete one English evidence page.', 'Keep the daily garden routine predictable.'],
    materials: ['Planter box', 'Garden log', 'Ruler or tape measure', 'Watering container', 'Calculator', 'Pencil'],
    timing: [{ time: '10-30 min daily', activity: 'Look, check, record, act, close.' }],
    teacher_notes: ['Keep student pages short.', 'Allow drawing, dictation, photos, partner measurement, and calculator use.', 'Teacher-only prompts stay on checkpoint and guide pages.'],
    likely_misconceptions: ['Numbers without units', 'Claims without evidence'],
    look_fors: ['One real observation or number', 'One explanation connected to growth or care'],
    support_moves: ['Use the frame: The data shows ___ because ___.'],
    extension_moves: ['Ask for a Kamloops connection or a second strategy.'],
  }
}

function makeWeekPack(w) {
  const id = `kamloops_growth_project_week_${String(w.n).padStart(2, '0')}`
  const bundle = `${id}_bundle`
  const dayId = `week${w.n}`
  const day = {
    day_id: dayId,
    day_label: `Week ${w.n}: ${w.name}`,
    slides: slides(w),
    math_task: studentSheet(`Week ${w.n} Math - ${w.name}`, w.math),
    english_task: studentSheet(`Week ${w.n} English - ${w.name}`, w.english),
    graphic_organizer: { title: `Week ${w.n} Garden Organizer`, organizer_type: 'three_column', columns: w.cols, rows: 4, prompt: 'Record real evidence before weekly work.', success_criteria: ['I recorded real evidence.', 'I explained what it means.'] },
    checkpoint_sheet: { title: `Week ${w.n} Teacher Checkpoint`, checkpoint_focus: w.focus, look_fors: ['Uses real planter evidence.', 'Uses scaffold/core/extension pathway appropriately.', 'Teacher directions stay off student pages.'], conference_prompts: ['Show one piece of evidence.', 'What does it mean?', 'What support did you use?'], release_rule: 'Ready evidence includes one real garden detail and one short explanation.' },
    exit_ticket: { title: `Week ${w.n} Exit Ticket`, prompt: w.exit, n_lines: 3, success_criteria: ['I used project evidence.', 'I explained my thinking.'] },
  }
  const outputs = [
    { output_id: `w${w.n}_slides`, output_type: 'slides', audience: 'shared_view', source_section: `days.${dayId}.slides`, bundle },
    { output_id: `w${w.n}_math`, output_type: 'task_sheet', audience: 'student', source_section: `days.${dayId}.math_task`, bundle },
    { output_id: `w${w.n}_english`, output_type: 'task_sheet', audience: 'student', source_section: `days.${dayId}.english_task`, bundle },
    { output_id: `w${w.n}_organizer`, output_type: 'graphic_organizer', audience: 'student', source_section: `days.${dayId}.graphic_organizer`, bundle },
    { output_id: `w${w.n}_checkpoint`, output_type: 'checkpoint_sheet', audience: 'teacher', source_section: `days.${dayId}.checkpoint_sheet`, bundle },
    { output_id: `w${w.n}_exit`, output_type: 'exit_ticket', audience: 'student', source_section: `days.${dayId}.exit_ticket`, bundle },
  ]
  const declared = ['teacher_guide', 'slides', 'task_sheet', 'graphic_organizer', 'checkpoint_sheet', 'exit_ticket']
  if (w.n === 4) {
    day.quiz = { title: 'Midpoint Garden Math Check', instructions: 'Use the planter project. Show your work. Calculators are allowed.', time_limit_min: 25, questions: [
      { q_text: 'We planted 20 seeds and 15 sprouted. What percent sprouted?', question_type: 'calculation', difficulty: 'core', bloom_level: 'apply', point_value: 2, n_lines: 3 },
      { q_text: 'One plant was 8 cm tall last week and 12 cm tall this week. How many cm did it grow?', question_type: 'calculation', difficulty: 'scaffolded', bloom_level: 'apply', point_value: 1, n_lines: 2 },
      { q_text: 'Explain one watering decision using soil evidence.', question_type: 'short_answer', difficulty: 'core', bloom_level: 'understand', point_value: 2, n_lines: 3 },
    ], success_criteria: ['I showed my work.', 'I used units.', 'I used evidence.'] }
    outputs.push({ output_id: 'w4_quiz', output_type: 'quiz', audience: 'student', source_section: 'days.week4.quiz', bundle })
    declared.push('quiz')
  }
  if (w.n === 8) {
    day.final_response = { title: 'Final Showcase Response', prompt: 'Choose one math piece and one English piece. Explain what changed and what growth means.', planning_reminders: ['Use one real number.', 'Use one story detail.', 'Explain what they show together.'], paragraph_support: { frame_strip: ['The math shows ___.', 'The story shows ___.', 'Together, they show growth because ___.'], reminder_box: 'Math evidence + story evidence + growth claim' }, success_criteria: ['I used project evidence.', 'I explained growth.'], response_lines: 10 }
    day.assessment = { title: 'Kamloops Growth Project Final Assessment', instructions: 'Use your project evidence. Calculators and project pages are allowed.', time_limit_min: 45, questions: [
      { q_text: 'Use one project measurement to make a math claim.', question_type: 'extended_response', difficulty: 'core', bloom_level: 'evaluate', point_value: 4, n_lines: 5 },
      { q_text: 'Set up the Pythagorean theorem for a 120 cm by 80 cm planter diagonal.', question_type: 'calculation', difficulty: 'extension', bloom_level: 'apply', point_value: 3, n_lines: 4 },
      { q_text: 'Write the probability of one garden event.', question_type: 'short_answer', difficulty: 'core', bloom_level: 'apply', point_value: 3, n_lines: 4 },
      { q_text: 'Explain how your English piece shows community, building, care, or growth.', question_type: 'extended_response', difficulty: 'core', bloom_level: 'analyze', point_value: 4, n_lines: 5 },
    ], success_criteria: ['I used project evidence.', 'I explained my thinking.'] }
    outputs.push({ output_id: 'w8_final_response', output_type: 'final_response_sheet', audience: 'student', source_section: 'days.week8.final_response', bundle, final_evidence: true })
    outputs.push({ output_id: 'w8_assessment', output_type: 'assessment', audience: 'student', source_section: 'days.week8.assessment', bundle })
    declared.push('final_response_sheet', 'assessment')
  }
  day.outputs = outputs
  return { ...base, package_id: id, topic: `The Kamloops Growth Project - Week ${w.n}: ${w.name}`, teacher_guide: teacherGuide(w.n, w.name, w.focus), bundle: { bundle_id: bundle, declared_outputs: declared }, outputs: [{ output_id: `w${w.n}_teacher_guide`, output_type: 'teacher_guide', audience: 'teacher', source_section: 'teacher_guide', bundle }], days: [day] }
}

const overviewBundle = 'kamloops_growth_project_overview_bundle'
const overview = {
  ...base,
  package_id: 'kamloops_growth_project_overview',
  session_count: 40,
  topic: 'The Kamloops Growth Project - Unit Overview',
  lesson_overview: { overview: 'Eight-week integrated planter-box project for a K designation Grade 8 class in Kamloops, BC.', essential_question: 'How can we grow something in Kamloops, use math to care for it, and tell the story of what changed?', sequence: weeks.map((w) => ({ day: `Week ${w.n}`, focus: w.focus, artifacts: ['weekly slides', 'math task sheet', 'English task sheet', 'organizer', 'checkpoint', 'exit ticket'] })) },
  teacher_guide: teacherGuide(0, 'Unit Overview', 'daily garden interaction, BC Math 8 evidence, and growth writing'),
  rubric_sheet: { title: 'Kamloops Growth Project Rubric', purpose_line: 'Use this before the final showcase.', scale: { min: 1, max: 4, labels: { 1: 'Starting', 2: 'Building', 3: 'Ready', 4: 'Strong' } }, criteria: [{ name: 'Garden participation', descriptor: 'I joined the garden routine safely.' }, { name: 'Math evidence', descriptor: 'I used real planter data with units, calculations, tables, graphs, or diagrams.' }, { name: 'English communication', descriptor: 'I told part of the planter story clearly.' }, { name: 'Explanation', descriptor: 'I explained growth, care, community, or building.' }], comment_fields: ['One part I am proud of', 'One part I improved', 'One thing the planter taught me'], repeat_for_subjects: 1, subject_label: 'Student', include_signature_line: true, success_criteria: ['I checked my work honestly.', 'I chose one math piece and one English piece.'] },
  answer_key: { title: 'Teacher Answer Key and Assessment Notes', entries: [{ artifact_ref: 'Area/perimeter', expected_answer: 'Area = length x width. Perimeter = 2(length + width).', teacher_note: 'Use actual planter measurements.' }, { artifact_ref: 'Watering fractions', expected_answer: 'Four plants at 1/4 L each equals 1 L total.', teacher_note: 'Repeated addition is acceptable.' }, { artifact_ref: 'Budget equation', expected_answer: '8 + 4p = 30 gives p = 5 with $2 remaining.', teacher_note: 'Accept money model or inverse operations.' }], scoring_guidance: ['Prioritize setup, real-world connection, and units over mental arithmetic speed.'] },
  bundle: { bundle_id: overviewBundle, declared_outputs: ['lesson_overview', 'teacher_guide', 'rubric_sheet', 'answer_key'] },
  outputs: [{ output_id: 'overview', output_type: 'lesson_overview', audience: 'teacher', source_section: 'lesson_overview', bundle: overviewBundle }, { output_id: 'overview_teacher_guide', output_type: 'teacher_guide', audience: 'teacher', source_section: 'teacher_guide', bundle: overviewBundle }, { output_id: 'overview_rubric', output_type: 'rubric_sheet', audience: 'student', source_section: 'rubric_sheet', bundle: overviewBundle }, { output_id: 'overview_answer_key', output_type: 'answer_key', audience: 'teacher', source_section: 'answer_key', bundle: overviewBundle }],
  days: [],
}

mkdirSync(outDir, { recursive: true })
writeFileSync(`${outDir}/kamloops-growth-project-overview.grade8-math-ela.json`, `${JSON.stringify(overview, null, 2)}\n`)
for (const w of weeks) {
  writeFileSync(`${outDir}/kamloops-growth-project-week-${String(w.n).padStart(2, '0')}.grade8-math-ela.json`, `${JSON.stringify(makeWeekPack(w), null, 2)}\n`)
}
console.log('Generated Kamloops Growth Project weekly packs')
