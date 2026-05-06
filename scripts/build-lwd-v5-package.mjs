import { readFileSync, writeFileSync } from 'node:fs'

const sourcePath = 'fixtures/generated/long-way-down-graphic-novel-study.grade8-ela.v4.json'
const targetPath = 'fixtures/generated/long-way-down-graphic-novel-study.grade8-ela.v5.json'

const pkg = JSON.parse(readFileSync(sourcePath, 'utf8'))

pkg.package_id = 'long_way_down_graphic_novel_study_grade8_ela_v5'
pkg.bundle.bundle_id = 'long_way_down_graphic_novel_study_grade8_ela_v5_bundle'
for (const output of pkg.outputs ?? []) {
  output.bundle = pkg.bundle.bundle_id
}

pkg.shared_display_deck = [
  {
    type: 'title',
    layout: 'hero',
    title: 'Long Way Down',
    subtitle: 'Graphic novel and novel-in-verse study',
    content: {
      subtitle: 'Track evidence, explain impact, and defend an interpretation.'
    }
  },
  {
    type: 'LEARN',
    layout: 'bullet_focus',
    title: 'Today\'s reading path',
    content: {
      model: 'Read or reread the focus section first. Then choose the evidence that best explains Will\'s thinking.',
      supports: ['Use short evidence notes.', 'Explain what the detail shows.']
    }
  },
  {
    type: 'LEARN',
    layout: 'bullet_focus',
    title: 'Floor encounter tracker',
    content: {
      model: 'Each elevator-floor encounter should change what we understand about Will\'s plan.',
      supports: ['Connection to Will', 'Question or pressure', 'Impact on Will']
    }
  },
  {
    type: 'LEARN',
    layout: 'bullet_focus',
    title: 'Graphic novel evidence',
    content: {
      model: 'A panel, page layout, facial expression, angle, or contrast can add meaning that the words alone do not carry.',
      supports: ['What do I notice?', 'What does the image add?']
    }
  },
  {
    type: 'REFLECT',
    layout: 'reflect',
    title: 'Ending interpretation',
    content: {
      invitation: 'Do not hunt for one official answer. Make a defensible interpretation.',
      prompts: ['What does Will decide?', 'Which evidence makes that interpretation believable?']
    }
  },
  {
    type: 'LEARN',
    layout: 'bullet_focus',
    title: 'Final response choices',
    content: {
      model: 'Choose one focus and build a short response with claim, evidence, and explanation.',
      supports: ['Will\'s decision', 'Theme development', 'Character impact', 'Author\'s choices']
    }
  },
  {
    type: 'REFLECT',
    layout: 'reflect',
    title: 'Before you write',
    content: {
      invitation: 'Check that your claim answers the question and your evidence actually proves it.',
      prompts: ['Do I explain why the evidence matters?', 'Did I connect back to theme, structure, or character?']
    }
  }
]

writeFileSync(targetPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
