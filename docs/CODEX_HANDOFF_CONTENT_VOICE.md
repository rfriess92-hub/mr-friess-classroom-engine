# Codex Handoff: Content Voice Rewrite — Teacher-Facing Fields

**Date:** 2026-04-20  
**Target fixtures:** all fixtures under `fixtures/core/` and `fixtures/generated/`  
**Schema version:** 2.1

---

## The problem

Teacher-facing fields in existing fixtures are written in coaching/instructional voice — they tell the teacher what to do or how to teach. That voice is wrong for these documents. Mr. Friess is an experienced teacher; he does not need to be coached through his own lesson plan.

**The rule:** Teacher-facing fields are reference material and agenda notes, not instructions. They describe what is happening, what to watch for, and what decisions are available — in the same voice you'd use to jot a note to yourself.

**Exception:** `sub_plan` fields are intentionally prescriptive (for substitutes who don't know the class). Do not change `sub_plan` content.

---

## Voice standard

| Wrong (coaching voice) | Right (reference/agenda voice) |
|---|---|
| "Ask students to share their thinking with a partner." | "Partner share." |
| "Make sure to circulate and check for understanding." | "Circulate — watch for students skipping the evidence step." |
| "You should provide explicit feedback on argument structure." | "Argument structure is the main feedback target." |
| "Encourage students who are stuck to refer to the word bank." | "Word bank available for students who stall on vocabulary." |
| "Students should discuss with their partner before writing independently." | "Partner share → independent write." |
| "Make sure to address the difference between correlation and causation." | "Students often conflate correlation and causation here." |

**Practical tests:**
- Does it start with "Ask", "Make sure", "Encourage", "You should", "Tell students", "Remind students"? → Rewrite.
- Is it longer than ~20 words? Consider whether half of it is implicit from context and can be cut.
- Does it describe what students do, not what the teacher does? → Move it to `student_move` if in a pacing guide, or cut it.

---

## Fields to rewrite

### `pacing_guide.phases[*].teacher_move`
One-line agenda note. State the activity, not the instruction.
- Cut "Ask students to…" → state the activity directly.
- Arrow notation is fine: `"Launch problem → cold-call 3"`
- Examples from schema: `"Ten-frame noticing, cold-call 2–3"` not `"Ask students to notice the ten-frame and share observations."`

### `pacing_guide.phases[*].student_move`
One-line factual note on what students are doing during this phase.
- Remove directive framing entirely.
- Example: `"Partner share, then independent write"` not `"Students should discuss with their partner before writing independently."`

### `pacing_guide.phases[*].checkpoint`
Observable end-of-phase marker — what you expect to see, not a directive.
- Example: `"Most students have a claim written."` not `"Students should have their claim written before moving on."`

### `pacing_guide.buffer_note`
A decision, not a procedure.
- Example: `"Skip partner share in Phase 3, go straight to independent write."` not `"If you are running behind, you should skip the partner share activity and have students write independently."`

### `teacher_implementation_notes` (top-level and in assignment_family)
Reference flags — observations and decision points, not directives.
- Each item should be something worth noticing, not something worth doing on command.
- Cut "Make sure to…", "Remember to…", "Be sure to…" → reframe as observation or flag.

### `likely_misconceptions`
Predictable student errors, stated as observations.
- Example: `"Students often conflate correlation and causation here."` not `"You should explicitly address the difference between correlation and causation."`

---

## Fields to leave alone

- `sub_plan.steps[*].what_to_do` — intentionally prescriptive for substitutes
- `sub_plan.steps[*].what_to_say` — verbatim script for substitutes
- `sub_plan.class_context` — background info, voice doesn't matter
- All student-facing fields (`worksheet`, `task_sheet`, `exit_ticket`, etc.) — different voice rules apply

---

## Fixture files to rewrite

Process every file in:
- `fixtures/core/*.json`
- `fixtures/generated/*.json`

For each file:
1. Find `pacing_guide.phases` — rewrite `teacher_move`, `student_move`, `checkpoint` per rules above
2. Find `pacing_guide.buffer_note` — rewrite if present
3. Find `teacher_implementation_notes` — rewrite each item
4. Find `likely_misconceptions` — rewrite each item
5. Leave all other fields unchanged

Do not change any field that already passes the voice standard. Preserve exact meaning — rewrite voice only.

---

## Validation

After rewriting, run:
```
pnpm run schema:check -- --fixture <key>
```
for each fixture to confirm the rewritten content is still schema-valid.

No structural changes — only string content within the fields listed above.
