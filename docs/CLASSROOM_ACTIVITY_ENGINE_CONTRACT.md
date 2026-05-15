# Classroom Activity Engine Contract

This document is the human-readable contract and roadmap for the Classroom Activity Engine.

Use it to keep activity work stable, classroom-real, and separate from the stable-core lesson-package output contract.

## Purpose

The Classroom Activity Engine exists to support reusable classroom games and short activity structures without flattening them into generic lesson-package artifacts.

Its guiding model is:

- activity shell
- content bank
- proof move
- competition layer

Optional bridge packs and deployment templates can sit beside that core model when an activity is meant to travel across rounds, support levels, or instructional settings.

## Current Repo Boundary

The Classroom Activity Engine is live on `main`, but it is a parallel subsystem.

It is not the same thing as the stable-core lesson-package contract.

Stable-core package work still centers on:

- `schemas/lesson-package.schema.json`
- `engine/planner/output-router.mjs`
- `engine/pdf-html/render.mjs`
- `scripts/render-package.mjs`
- `scripts/qa-bundle.mjs`

The activity subsystem currently centers on:

- `activity-library/`
- `engine/activity-family/`
- `schemas/classroom-activity.schema.json`
- `schemas/activity-bank.schema.json`
- `schemas/activity-family.schema.json`
- `schemas/activity-bridge-pack.schema.json`
- `schemas/competition-shell.schema.json`
- `scripts/generate-activity.mjs`
- `scripts/route-plan-activity.mjs`
- `scripts/schema-check-activity.mjs`
- `scripts/select-activity-family.mjs`

Do not mix these two contracts casually.

## What Is Live On Main

The current activity subsystem already has working foundations:

- family registry and family selection
- object registry for banks, bridge packs, competition shells, and deployment templates
- preflight validation for activity objects
- a render-plan layer for activity outputs
- activity fixtures and a dedicated node test surface

Current live fixture proofs include:

- `fixtures/activities/morphology-word-parts-prefix-corners.classroom-activity.json`
- `fixtures/activities/bridge-chunk-to-meaning.classroom-activity.json`

Current activity-layer regression coverage includes:

- `tests/node/classroom-activity-layer.test.mjs`

## Current Live Scope

The current schema-backed scope is literacy-first and bridge-first.

Live `strand` values in `schemas/classroom-activity.schema.json` are:

- `morphology_word_knowledge`
- `foundational_word_reading`
- `bridge`

The current subsystem does not yet make Careers / Life Skills a schema-live strand.

That expansion is planned, but it is not implemented by this document.

## Current Live Output Surface

The activity schema currently allows these output types:

- `activity_card`
- `bank_card`
- `bridge_pack_card`
- `quick_game_card`
- `relay_card`
- `station_card`
- `boss_round_card`
- `deployment_template_card`
- `lesson_extension_block`
- `early_finisher_card`
- `worksheet_companion`

These are activity-layer outputs, not stable-core lesson-package outputs.

They should not be added to `engine/contracts/output-type-inventory.json` unless they are deliberately promoted into the stable-core contract.

Current audience buckets are:

- `teacher`
- `student`
- `shared_view`

Current render-plan behavior routes:

- `activity_card`
- `lesson_extension_block`
- `station_card`
- `early_finisher_card`
- `worksheet_companion`

through `compact_activity_pdf`, while other current activity outputs normalize to `generic_activity_doc`.

## Canonical Activity Model

When we extend this subsystem, the default mental model should be:

1. activity shell
2. content bank
3. proof move
4. competition layer

In repo terms, that means:

- family definitions describe the reusable game structure
- banks provide controlled prompts, examples, traps, and answer language
- bridge packs carry activity flow across linked rounds when needed
- competition shells define repeatable classroom energy patterns
- deployment templates define practical classroom setup variants

The engine should become better at enforcing classroom-stable activity structure, not just storing fun ideas.

## Naming Rules

Use `Classroom Activity Engine` as the umbrella subsystem name.

Use strand-specific gold-set naming rather than one generic `Gold Set` label:

- `Literacy Gold Set v1`
- `Careers Gold Set v1`

Do not use one cross-strand generic gold-set label in future docs or fixtures.

## Planned Namespace Rules

These naming rules are part of the roadmap and should guide the next activity-lane implementation work:

- Literacy game cards: `L-G#`
- Literacy bridge cards: `L-BR#`
- Literacy morphology banks: `L-BANK-MORPH-#`
- Literacy foundational banks: `L-BANK-FOUND-#`
- Careers game cards: `C-G#`
- Careers bank cards: `C-BANK-#`
- Shared shells: `SHELL-#`

This document records the intended namespace. It does not retroactively rename current live files by itself.

## Planned Gold Sets

### Literacy Gold Set v1

- `L-G1` Chunk and Conquer
- `L-G2` Decode and Deliver
- `L-G3` Real / Fake / Possible
- `L-G4` Affix Detective Sentences
- `L-G5` Find It / Fix It
- `L-G6` Sort and Defend
- `L-G7` Wrong Corner Trap
- `L-G8` Whiteboard Build Race
- `L-G9` Word Ladders
- `L-G10` Partner Relay
- `L-G11` Sound-to-Print Relay
- `L-BR1` Chunk to Meaning

### Careers Gold Set v1

- `C-G1` Real / Risky / Depends
- `C-G2` Fix the Response
- `C-G3` Skill Sort and Defend
- `C-G4` Workplace Corners
- `C-G5` Interview Relay
- `C-G6` Resume Bullet Fix-It

Careers naming correction to preserve:

- card title may remain `Real / Risky / Depends`
- student-facing labels should be `Professional`, `Risky`, and `Depends`
- do not use `Real / Professional` as the label set

## Shared Shell Abstraction

Shared shell logic should remain separate from strand-specific card content.

Planned shared shells:

- `SHELL-1` Judge and Defend
- `SHELL-2` Fix and Upgrade
- `SHELL-3` Sort and Defend
- `SHELL-4` Corners
- `SHELL-5` Relay
- `SHELL-6` Build Race
- `SHELL-7` Ladder / Sequence

This is the right layer for cross-strand classroom structure reuse.

It is not the same thing as stable-core artifact typing.

## Stability Rules For The Next Implementation Slice

The next activity-lane implementation should be a stability patch, not a broad content expansion.

That patch should codify these classroom-stability rules.

### 1. Activity mode

Activities should declare:

- `constrained_selection`
- `controlled_generation`
- `generative`

Defaults:

- morphology choice games default to `constrained_selection`
- morphology build games default to `controlled_generation`
- `generative` mode should be reserved for clearly tagged sprint, extension, or boss rounds

### 2. Prompt type system

Required prompt types should include:

- `target_meaning`
- `base_word`
- `base_word_plus_target_meaning`
- `sentence_clue`
- `definition_match`
- `scenario`
- `repair_prompt`

For morphology, the default should be `target_meaning` or `base_word_plus_target_meaning`.

Base-word-only prompts should be restricted, not treated as the default.

### 3. Prompt validation

Each prompt should declare whether it has:

- a single best answer
- multiple acceptable answers
- no strong answer

Future implementation should reject prompts that silently sit between those states.

### 4. Option-density control

Corners and choice games should keep option counts controlled.

The failed Word-Part Corners version is the cautionary example:

- recommended active options: 6 to 8
- preferred maximum: 8
- hard cap: 10
- per-corner maximum: 2 to 3

### 5. No-answer support

`no_answer` should be treated as a first-class classroom move when the format needs it.

Students should be able to defend that no strong answer exists.

### 6. Trap quality

Preferred trap types:

- `hard_no_answer`
- `near_miss`

`arguable` should be reserved for advanced rounds.

Future activity QA should reject traps that depend on obscure real words, dialect fights, or teacher-only judgments about ordinary usage.

### 7. Proof move requirement

Activities should require a real proof move rather than a shallow selection.

Morphology answers should normally include:

- selection
- exact word part
- constructed output
- meaning match

Careers answers should normally include:

- category or action
- reason
- risk, context, or skill
- improved response when relevant

### 8. Scoring alignment

Default scoring should privilege correctness plus proof, not speed alone.

Suggested default:

- 1 point: correct selection or core move
- 2 points: correct selection plus correct form or fit
- 3 points: correct plus form or fit plus meaning or explanation
- optional 4th point: strong defense, comparison, or sentence use

Speed should break ties, not replace accuracy.

### 9. Stability threshold

Future activity QA should track an `activity_stability_score`, especially single-answer prompt ratio.

Minimum threshold:

- 0.70 acceptable

Target threshold:

- 0.80 to 0.90 preferred

Activities should be flagged unstable when multi-answer drift, missing no-answer support, or bypassable explanation rules make the game unreliable.

### 10. Pre-run simulation

Morphology prompts should eventually support pre-run simulation where feasible.

If a prompt accidentally produces multiple valid paths while claiming a single best answer, the engine should catch that before classroom use.

## First Proof Targets For The Stability Patch

Patch these first:

- `L-G7` Wrong Corner Trap
- `L-G8` Whiteboard Build Race

These are the best proof targets because the classroom-stability failure mode is already known:

- too many valid answers
- too many active options
- too much open generation
- not enough proof requirement

The engine rule should be:

- do not ask "what can you make?"
- ask "what exactly matches this meaning?"

## Planned Careers Expansion After Stability

After the literacy-first stability patch is in place, the next careers-facing content layer should include formal banks:

- `C-BANK-1` Workplace Communication and Professionalism
- `C-BANK-2` Employability Skills
- `C-BANK-3` Interview Questions
- `C-BANK-4` Resume / Application Evidence
- `C-BANK-5` Safety and Responsibility Scenarios

That work should happen after the stability patch, not before it.

## Field-Test Tracker

Future activity QA should add a lightweight field-test tracker capturing:

- activity id
- date
- group
- duration
- whether students understood the task quickly
- whether accidental multiple answers appeared
- whether it felt too easy
- whether the energy held
- whether scoring felt fair
- whether the teacher would run it again
- notes
- suggested patch

This should remain activity-layer QA, not stable-core bundle QA.

## QA Boundary

Keep these lanes separate:

- stable-core render QA for lesson-package outputs
- classroom-activity stability QA for activity artifacts

`qa:bundle` is the acceptance gate for stable-core lesson packages.

It is not the primary gate for activity stability.

Activity stability should be evaluated through:

- activity schema validation
- family/object registry validation
- activity-layer node tests
- targeted field-test and ambiguity checks

Only promote an activity artifact into the stable-core output inventory if it is deliberately becoming part of the lesson-package contract.

## What This Document Does Not Do

This document does not:

- add new stable-core output types
- rename existing files automatically
- expand Careers strands in schema by itself
- patch activity fixtures by itself
- merge activity QA into stable-core render QA

It is the contract and roadmap layer that later implementation should follow.

## Recommended Next Phase Order

1. P0 stability patch for activity-mode, prompt validation, no-answer support, proof moves, and scoring alignment
2. literacy proof patch for `L-G7` and `L-G8`
3. apply the stability patch to other open-generation literacy activities
4. add formal Careers banks and a Careers pilot pack
5. add the field-test tracker
6. only then consider broader strand expansion

## Build Rule

Do not solve activity instability by adding more generic prose.

Prefer:

- constrained answer spaces
- explicit proof moves
- controlled option density
- classroom-stable scoring
- low-prep teacher usability

The repo should enforce classroom-stable activity generation, not just store cute activities.
