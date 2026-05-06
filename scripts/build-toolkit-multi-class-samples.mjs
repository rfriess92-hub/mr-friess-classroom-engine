import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'output/toolkit-multi-class-samples/packages'

mkdirSync(outDir, { recursive: true })

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toolSubtitle(config, purpose) {
  return `${config.course} · ${config.shortTitle} · ${purpose}`
}

function toolMeta(config) {
  return `${config.course} · Toolkit sample`
}

function toolFooter(config) {
  return `${config.course} · ${config.shortTitle} · Mr. Friess · SD73 Kamloops`
}

function toolkitPackage(config) {
  const packageId = `toolkit_${slug(config.course).replaceAll('-', '_')}`
  const bundleId = `${packageId}_bundle`
  return {
    schema_version: '2.1.0',
    package_id: packageId,
    primary_architecture: 'single_period_full',
    grade_band: '9-12',
    subject: config.course,
    grade: config.grade,
    topic: config.topic,
    theme: config.theme,
    assignment_family: 'short_inquiry_sequence',
    grade_subject_fit: `${config.course} sample package using reusable classroom toolkit layouts for launch, analysis, language support, choice, and a low-stakes check.`,
    unit_context: config.unitContext,
    assignment_purpose: `Prove centralized toolkit layouts transfer cleanly into ${config.course}.`,
    final_evidence_target: 'A completed set of student-facing toolkit pages that supports thinking, vocabulary, choice, and formative checking.',
    student_task_flow: [
      'Use the KWHL page to activate background knowledge and questions.',
      'Use the fishbone page to analyze causes, constraints, or design factors.',
      'Use the sentence-frame card during discussion and written explanation.',
      'Use the choice board to select a task pathway.',
      'Complete the scaffolded quiz as a low-stakes check.'
    ],
    supports_scaffolds: [
      { label: 'Structured thinking', support: 'KWHL and fishbone pages organize thinking before students write.', embedded: true },
      { label: 'Language support', support: 'Sentence frames help students explain, compare, justify, and reflect.', embedded: true },
      { label: 'Choice pathway', support: 'Choice board gives students multiple aligned ways to show learning.', embedded: true },
      { label: 'Low-stakes check', support: 'Scaffolded quiz uses word bank and hints to reduce blank-page pressure.', embedded: true }
    ],
    differentiation_model: {
      support_pathway: 'Use sentence frames, word bank, and short written responses.',
      core_pathway: 'Complete the organizers and selected choice-board pathway independently.',
      extension_pathway: 'Add precise evidence, technical vocabulary, and an explanation of tradeoffs or implications.'
    },
    checkpoint_release_logic: 'All pages are sample student-facing toolkit artifacts. No teacher-only key or final assessment is included in this proof sample.',
    teacher_implementation_notes: [
      'Use these as layout-transfer samples, not as a full unit package.',
      'The goal is to test whether the centralized toolkit layouts stay useful across subjects.',
      'Review spacing and clarity before using with students.'
    ],
    likely_misconceptions: config.misconceptions,
    pacing_shape: 'Single-period toolkit proof sample with five student-facing artifacts.',
    assessment_focus: 'Formative check of vocabulary, explanation, and transfer of the lesson concept.',
    success_criteria: config.successCriteria,
    kwhl_chart: {
      layout_template_id: 'kwhl_chart',
      title: 'KWHL Chart',
      subtitle: toolSubtitle(config, 'Lesson launch and closure'),
      doc_type: 'Lesson Launch & Closure Tool',
      meta: toolMeta(config),
      footer: toolFooter(config),
      directions: config.kwhlDirections,
      learning_target: config.learningTarget,
      checklist: [
        'I added what I already know before the lesson.',
        'I wrote at least two useful questions.',
        'I updated what I learned in my own words.'
      ]
    },
    fishbone_diagram: {
      layout_template_id: 'fishbone_diagram',
      title: 'Fishbone Diagram',
      subtitle: toolSubtitle(config, 'Cause, factor, and constraint analysis'),
      doc_type: 'Graphic Organizer — Cause & Effect Analysis',
      meta: toolMeta(config),
      footer: toolFooter(config),
      directions: config.fishboneDirections,
      tip: config.fishboneTip,
      cause_categories: config.causeCategories,
      checklist: [
        'The problem or outcome is clear.',
        'Each cause category has at least one specific note.',
        'I identified one cause or factor that matters most.'
      ]
    },
    sentence_frame_card: {
      layout_template_id: 'sentence_frame_card',
      title: 'Sentence Frame Card',
      subtitle: toolSubtitle(config, 'Discussion and written-response support'),
      doc_type: 'EA & Student Reference Tool',
      meta: toolMeta(config),
      footer: toolFooter(config),
      frame_groups: config.frameGroups
    },
    choice_board: {
      layout_template_id: 'choice_board',
      title: 'Choice Board',
      subtitle: toolSubtitle(config, 'Differentiated task pathway'),
      doc_type: 'Differentiated Task Menu',
      meta: toolMeta(config),
      footer: toolFooter(config),
      directions: 'Choose 3 tasks that connect like a line — across, down, or diagonal.',
      learning_target: config.learningTarget,
      tasks: config.choiceTasks,
      checklist: [
        'I completed three connected tasks.',
        'My work connects to the learning target.',
        'I can explain my strongest choice.'
      ]
    },
    scaffolded_quiz: {
      layout_template_id: 'scaffolded_quiz',
      title: 'Low-Stakes Check',
      subtitle: toolSubtitle(config, 'Word bank and hints provided'),
      doc_type: 'Low-Stakes Check',
      meta: toolMeta(config),
      footer: toolFooter(config),
      support_label: 'Scaffolded Support — word bank & hints provided',
      learning_target: config.learningTarget,
      word_bank: config.wordBank,
      multiple_choice: config.multipleChoice,
      short_answer: config.shortAnswer
    },
    bundle: {
      bundle_id: bundleId,
      declared_outputs: ['worksheet', 'graphic_organizer']
    },
    outputs: [
      { output_id: 'kwhl_chart_doc', output_type: 'graphic_organizer', audience: 'student', source_section: 'kwhl_chart', bundle: bundleId },
      { output_id: 'fishbone_diagram_doc', output_type: 'graphic_organizer', audience: 'student', source_section: 'fishbone_diagram', bundle: bundleId },
      { output_id: 'sentence_frame_card_doc', output_type: 'worksheet', audience: 'student', source_section: 'sentence_frame_card', bundle: bundleId },
      { output_id: 'choice_board_doc', output_type: 'worksheet', audience: 'student', source_section: 'choice_board', bundle: bundleId },
      { output_id: 'scaffolded_quiz_doc', output_type: 'worksheet', audience: 'student', source_section: 'scaffolded_quiz', bundle: bundleId }
    ]
  }
}

const sharedFrames = (topic) => [
  { code: 'EXP', title: 'Explaining', frames: [`The most important part of ${topic} is _____ because _____.`, 'This matters because _____.'] },
  { code: 'EV', title: 'Using Evidence', frames: ['The evidence that supports my thinking is _____.', 'I know this because _____.'] },
  { code: 'CMP', title: 'Comparing', frames: ['Compared with _____, _____ is _____.', 'One similarity is _____, while one difference is _____.'] },
  { code: 'JUS', title: 'Justifying', frames: ['I chose _____ because _____.', 'The tradeoff is _____, but _____.'] },
  { code: 'ASK', title: 'Clarifying', frames: ['Can you explain what you mean by _____?', 'What would happen if _____?'] },
  { code: 'REF', title: 'Reflecting', frames: ['One thing I understand better now is _____.', 'My next step is _____.'] }
]

const samples = [
  {
    course: 'Math 11', grade: 11, theme: 'mathematics', shortTitle: 'Quadratic Models', topic: 'Quadratic models and real-world constraints',
    unitContext: 'Students connect quadratic graphs, intercepts, vertex form, and realistic constraints in modelling situations.',
    learningTarget: 'I can use a quadratic model to explain a relationship and identify meaningful features.',
    kwhlDirections: 'Before modelling, record what you know about parabolas and what you need to find. During the task, track how you will solve. Afterward, summarize what the model tells you.',
    fishboneDirections: 'Write the modelling problem or outcome in the box. Use each category to identify factors that affect the model.',
    fishboneTip: 'Look for assumptions, units, domain restrictions, and what each feature means in context.',
    causeCategories: ['Initial value', 'Rate of change', 'Vertex', 'Intercepts', 'Domain', 'Assumptions'],
    misconceptions: ['Students may describe the graph without connecting features to context.', 'Students may treat all x-values as meaningful even when the situation has limits.'],
    successCriteria: ['I can identify vertex, intercepts, and domain.', 'I can explain what a graph feature means in context.', 'I can state one limitation of a model.'],
    frameGroups: sharedFrames('the quadratic model'),
    wordBank: ['vertex', 'axis of symmetry', 'intercept', 'domain', 'range', 'maximum', 'minimum', 'model'],
    multipleChoice: [
      { question: 'In a real-world quadratic model, the vertex often represents', options: ['A maximum or minimum value', 'Only the starting value', 'The unit of measurement', 'A random point'] },
      { question: 'A domain restriction is important because', options: ['It makes the equation harder', 'It shows which input values make sense in context', 'It removes all intercepts', 'It changes the graph color'] }
    ],
    shortAnswer: [
      { question: 'Explain what the vertex could mean in a real-world model.', hint: 'Use maximum or minimum in your answer.' },
      { question: 'Name one assumption a quadratic model might make.', hint: 'Think about air resistance, measurement, or simplified conditions.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Feature List', description: 'Identify the vertex, intercepts, and domain of a sample graph.' },
      { label: 'A2', title: 'Context Match', description: 'Match each graph feature to what it means in the situation.' },
      { label: 'A3', title: 'Quick Sketch', description: 'Sketch a model and label the important features.' },
      { label: 'B1', title: 'Explain the Vertex', description: 'Write a short explanation of what the vertex means.' },
      { label: 'FREE', title: 'Free Choice', description: 'Create a valid way to show your understanding.' },
      { label: 'B3', title: 'Compare Models', description: 'Compare two possible quadratic models and choose the better fit.' },
      { label: 'C1', title: 'Error Check', description: 'Find and correct a modelling mistake.' },
      { label: 'C2', title: 'Scenario Builder', description: 'Write a real-world situation that could match a quadratic model.' },
      { label: 'C3', title: 'Limitation Note', description: 'Explain one limitation of the model.' }
    ]
  },
  {
    course: 'Foods 9', grade: 9, theme: 'health_science', shortTitle: 'Kitchen Safety', topic: 'Kitchen safety and recipe workflow',
    unitContext: 'Students prepare for a kitchen lab by reviewing safety, sanitation, timing, and equipment decisions.',
    learningTarget: 'I can follow a safe kitchen workflow and explain how safety choices prevent problems.',
    kwhlDirections: 'Before the lab, record what you know about safety and sanitation. During the lesson, track how you will find answers. Afterward, summarize the most important safety learning.',
    fishboneDirections: 'Write the kitchen problem or possible accident in the box. Use the categories to identify causes and prevention moves.',
    fishboneTip: 'Good causes are specific: equipment location, timing, heat, contamination, communication, or cleanup.',
    causeCategories: ['Equipment', 'Heat', 'Sanitation', 'Timing', 'Communication', 'Cleanup'],
    misconceptions: ['Students may list rules without explaining why they matter.', 'Students may focus on cooking only and miss sanitation or cleanup.'],
    successCriteria: ['I can name specific kitchen hazards.', 'I can explain how a safety step prevents a problem.', 'I can plan a safe workflow before cooking.'],
    frameGroups: sharedFrames('the kitchen workflow'),
    wordBank: ['sanitize', 'cross-contamination', 'workflow', 'hazard', 'equipment', 'temperature', 'cleanup', 'prevention'],
    multipleChoice: [
      { question: 'Cross-contamination happens when', options: ['Food cooks too quickly', 'Bacteria or allergens are transferred between foods or surfaces', 'A recipe has too many steps', 'A knife is too sharp'] },
      { question: 'A safe workflow helps because it', options: ['Makes cooking random', 'Prevents confusion, hazards, and missed steps', 'Removes all cleanup', 'Means no measuring is needed'] }
    ],
    shortAnswer: [
      { question: 'Explain one safety step that prevents a kitchen problem.', hint: 'Name the step and the problem it prevents.' },
      { question: 'Why is cleanup part of food safety?', hint: 'Think about spills, bacteria, and shared equipment.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Hazard Hunt', description: 'List five possible hazards in a kitchen lab.' },
      { label: 'A2', title: 'Safety Match', description: 'Match each safety rule to the problem it prevents.' },
      { label: 'A3', title: 'Tool Check', description: 'Choose the right tool for three recipe steps.' },
      { label: 'B1', title: 'Workflow Map', description: 'Sequence the steps for a safe lab start-to-finish.' },
      { label: 'FREE', title: 'Free Choice', description: 'Create a poster, diagram, or checklist.' },
      { label: 'B3', title: 'Scenario Fix', description: 'Read a kitchen problem and explain how to fix it.' },
      { label: 'C1', title: 'Sanitation Plan', description: 'Create a cleaning plan for a shared station.' },
      { label: 'C2', title: 'Partner Script', description: 'Write what partners should say to avoid confusion.' },
      { label: 'C3', title: 'Reflection', description: 'Explain your most important safety habit.' }
    ]
  },
  {
    course: 'Art 12', grade: 12, theme: 'humanities', shortTitle: 'Portfolio Critique', topic: 'Portfolio development and critique language',
    unitContext: 'Students use critique language to refine a portfolio piece and explain artistic decisions.',
    learningTarget: 'I can explain artistic choices and use critique feedback to refine a portfolio piece.',
    kwhlDirections: 'Before critique, record what you know about your piece and what feedback you need. During critique, track how you will gather useful feedback. Afterward, summarize your revision plan.',
    fishboneDirections: 'Write the intended effect or current problem in the box. Use the categories to identify what affects the piece.',
    fishboneTip: 'Focus on evidence in the work: composition, contrast, material, scale, focal point, and intention.',
    causeCategories: ['Composition', 'Contrast', 'Material', 'Technique', 'Symbolism', 'Audience'],
    misconceptions: ['Students may say they like or dislike something without evidence.', 'Students may revise randomly instead of linking choices to intention.'],
    successCriteria: ['I can use specific visual evidence.', 'I can connect choices to intention.', 'I can make a revision plan based on critique.'],
    frameGroups: sharedFrames('the artwork'),
    wordBank: ['composition', 'contrast', 'focal point', 'symbolism', 'medium', 'technique', 'audience', 'intention'],
    multipleChoice: [
      { question: 'Useful critique feedback should be', options: ['Specific and connected to the artwork', 'Only positive', 'Only about effort', 'Unrelated to intention'] },
      { question: 'A focal point is', options: ['The least important area', 'The area that draws attention first', 'The artist statement', 'The border of the page'] }
    ],
    shortAnswer: [
      { question: 'Explain one artistic choice in your piece and what it is meant to do.', hint: 'Use a visual element and an intended effect.' },
      { question: 'Name one revision you could make after critique and why.', hint: 'Connect the revision to audience impact.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Visual Evidence', description: 'List five specific visual details in your piece.' },
      { label: 'A2', title: 'Intention Match', description: 'Connect three choices to your artistic intention.' },
      { label: 'A3', title: 'Critique Question', description: 'Write three useful questions for peer critique.' },
      { label: 'B1', title: 'Revision Plan', description: 'Choose one revision and explain why it matters.' },
      { label: 'FREE', title: 'Free Choice', description: 'Show your critique thinking in another format.' },
      { label: 'B3', title: 'Artist Statement', description: 'Draft a short paragraph explaining your piece.' },
      { label: 'C1', title: 'Compare Works', description: 'Compare your piece with an artist reference.' },
      { label: 'C2', title: 'Audience Lens', description: 'Explain how a viewer might interpret your work.' },
      { label: 'C3', title: 'Before/After', description: 'Describe how your piece changed through revision.' }
    ]
  },
  {
    course: 'Woodworking 10', grade: 10, theme: 'careers', shortTitle: 'Joinery Plan', topic: 'Woodworking joinery, measurement, and safe process',
    unitContext: 'Students plan a small woodworking build by connecting joinery choice, measurement accuracy, tool safety, and process sequence.',
    learningTarget: 'I can choose an appropriate joint and explain how measurement and safety affect build quality.',
    kwhlDirections: 'Before building, record what you know about joints, tools, and measurements. During planning, track how you will find missing information. Afterward, summarize what affects build quality.',
    fishboneDirections: 'Write the build problem or quality issue in the box. Use each category to identify possible causes.',
    fishboneTip: 'Look for measurement, grain direction, tool setup, clamping, glue, and safety sequence.',
    causeCategories: ['Measurement', 'Material', 'Tool setup', 'Joinery', 'Clamping', 'Safety sequence'],
    misconceptions: ['Students may think accuracy only matters at the end.', 'Students may choose a joint without considering load, material, or tool access.'],
    successCriteria: ['I can identify the purpose of a joint.', 'I can explain how measurement affects fit.', 'I can describe a safe process sequence.'],
    frameGroups: sharedFrames('the build plan'),
    wordBank: ['joint', 'grain', 'measure', 'clamp', 'square', 'flush', 'tool setup', 'sequence'],
    multipleChoice: [
      { question: 'Accurate measurement matters because it', options: ['Improves fit and reduces waste', 'Makes safety optional', 'Only affects the final mark', 'Changes the type of wood'] },
      { question: 'A clamp is mainly used to', options: ['Decorate a project', 'Hold material securely while glue dries or work is done', 'Replace measuring', 'Cut wood faster'] }
    ],
    shortAnswer: [
      { question: 'Explain how one small measurement error can affect a build.', hint: 'Think about fit, squareness, or wasted material.' },
      { question: 'Why should tool setup happen before cutting?', hint: 'Connect setup to safety and accuracy.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Joint Match', description: 'Match common joints to possible uses.' },
      { label: 'A2', title: 'Measurement Check', description: 'Explain where accuracy matters in a sample build.' },
      { label: 'A3', title: 'Tool Safety', description: 'List safety checks before using a tool.' },
      { label: 'B1', title: 'Process Sequence', description: 'Put a build process in the correct order.' },
      { label: 'FREE', title: 'Free Choice', description: 'Draw, label, or explain a safe build plan.' },
      { label: 'B3', title: 'Error Fix', description: 'Identify a likely cause of a bad fit and how to fix it.' },
      { label: 'C1', title: 'Joint Justification', description: 'Choose a joint and justify your choice.' },
      { label: 'C2', title: 'Material Note', description: 'Explain how material choice affects the build.' },
      { label: 'C3', title: 'Quality Reflection', description: 'Describe what quality means in this build.' }
    ]
  },
  {
    course: 'Leadership 12', grade: 12, theme: 'social_science', shortTitle: 'Event Planning', topic: 'Leadership event planning and team decision-making',
    unitContext: 'Students plan a leadership event by considering audience needs, team roles, logistics, communication, and risk management.',
    learningTarget: 'I can plan a leadership action by identifying needs, roles, risks, and communication moves.',
    kwhlDirections: 'Before planning, record what you know about the group or event. During planning, track how you will find missing information. Afterward, summarize the decision or next step.',
    fishboneDirections: 'Write the event outcome or problem in the box. Use each category to identify causes, constraints, or risks.',
    fishboneTip: 'Look beyond ideas: audience, communication, permissions, time, materials, and backup plans matter.',
    causeCategories: ['Audience', 'Roles', 'Communication', 'Timeline', 'Resources', 'Risk plan'],
    misconceptions: ['Students may treat leadership as personality instead of action and planning.', 'Students may focus on ideas but skip logistics and communication.'],
    successCriteria: ['I can identify audience needs.', 'I can assign roles and responsibilities.', 'I can name risks and backup plans.'],
    frameGroups: sharedFrames('the event plan'),
    wordBank: ['audience', 'role', 'timeline', 'resource', 'risk', 'communication', 'feedback', 'responsibility'],
    multipleChoice: [
      { question: 'A strong leadership plan should include', options: ['Only the best idea', 'Roles, timeline, resources, and communication', 'No backup plan', 'Only teacher instructions'] },
      { question: 'Audience needs matter because', options: ['They help make the action useful and appropriate', 'They make planning unnecessary', 'They replace teamwork', 'They are always the same'] }
    ],
    shortAnswer: [
      { question: 'Explain one risk in an event plan and how the team could prepare for it.', hint: 'Name the risk and a backup move.' },
      { question: 'What is one communication move that helps a team follow through?', hint: 'Think about reminders, role clarity, or check-ins.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Need Scan', description: 'Identify three audience needs for an event.' },
      { label: 'A2', title: 'Role Map', description: 'Assign roles and explain why each role matters.' },
      { label: 'A3', title: 'Timeline Draft', description: 'Create a short planning timeline.' },
      { label: 'B1', title: 'Risk Plan', description: 'List two risks and backup plans.' },
      { label: 'FREE', title: 'Free Choice', description: 'Show the plan in another useful format.' },
      { label: 'B3', title: 'Communication Script', description: 'Write a message to teammates or participants.' },
      { label: 'C1', title: 'Feedback Loop', description: 'Plan how you will collect feedback.' },
      { label: 'C2', title: 'Leadership Move', description: 'Describe one action that builds trust.' },
      { label: 'C3', title: 'Impact Reflection', description: 'Explain what success would look like.' }
    ]
  },
  {
    course: 'Chemistry 11', grade: 11, theme: 'science', shortTitle: 'Reaction Evidence', topic: 'Chemical reaction evidence and lab reasoning',
    unitContext: 'Students connect observations, chemical reaction evidence, particle reasoning, and lab safety in an introductory chemistry investigation.',
    learningTarget: 'I can use observations as evidence to explain whether a chemical reaction occurred.',
    kwhlDirections: 'Before the lab, record what you know about reaction evidence. During the lab, track how you will gather observations safely. Afterward, summarize what the evidence showed.',
    fishboneDirections: 'Write the reaction question or evidence problem in the box. Use each category to identify causes or factors.',
    fishboneTip: 'Separate observations from interpretations. Evidence includes temperature change, gas, precipitate, color change, and light.',
    causeCategories: ['Reactants', 'Temperature', 'Concentration', 'Observation', 'Safety', 'Measurement'],
    misconceptions: ['Students may confuse physical change with chemical reaction evidence.', 'Students may interpret before recording careful observations.'],
    successCriteria: ['I can record observations accurately.', 'I can identify evidence of a chemical reaction.', 'I can explain a claim using evidence and reasoning.'],
    frameGroups: sharedFrames('the reaction evidence'),
    wordBank: ['reactant', 'product', 'precipitate', 'gas', 'temperature', 'evidence', 'observation', 'claim'],
    multipleChoice: [
      { question: 'Which observation can be evidence of a chemical reaction?', options: ['A new gas forms', 'The beaker is labelled', 'The worksheet is complete', 'The table is clean'] },
      { question: 'A claim about a reaction should be supported by', options: ['A guess', 'Specific observations', 'Only the word chemical', 'The longest answer'] }
    ],
    shortAnswer: [
      { question: 'Name two observations that could suggest a chemical reaction occurred.', hint: 'Think about gas, precipitate, color, temperature, or light.' },
      { question: 'Explain why observation and inference are not the same thing.', hint: 'Observation is what you notice; inference is what you think it means.' }
    ],
    choiceTasks: [
      { label: 'A1', title: 'Evidence Sort', description: 'Sort observations into reaction evidence or not enough evidence.' },
      { label: 'A2', title: 'Vocab Match', description: 'Match key chemistry terms to definitions.' },
      { label: 'A3', title: 'Safety Check', description: 'List lab safety steps before mixing substances.' },
      { label: 'B1', title: 'CER Mini', description: 'Write a claim, evidence, and reasoning response.' },
      { label: 'FREE', title: 'Free Choice', description: 'Show reaction evidence in another format.' },
      { label: 'B3', title: 'Particle Sketch', description: 'Draw a before/after particle model.' },
      { label: 'C1', title: 'Error Analysis', description: 'Explain how poor observation could lead to a wrong conclusion.' },
      { label: 'C2', title: 'Lab Variable', description: 'Describe one factor that could change reaction evidence.' },
      { label: 'C3', title: 'Evidence Ranking', description: 'Rank three observations from strongest to weakest evidence.' }
    ]
  }
]

const files = []
for (const config of samples) {
  const pkg = toolkitPackage(config)
  const fileName = `${slug(config.course)}.toolkit-sample.json`
  const filePath = join(outDir, fileName)
  writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  files.push(filePath)
}

console.log(files.join('\n'))
