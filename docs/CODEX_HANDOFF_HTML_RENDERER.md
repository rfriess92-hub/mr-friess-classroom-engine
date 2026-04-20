# Codex Handoff — HTML/CSS Student PDF Renderer

> Branch: `feat/html-pdf-renderer`
> Committed: 2026-04-20
> Author context: Mr. Friess — 8th grade classroom, up to 13 students, documents printed on a B&W laser printer.

This document transfers the full design rationale, architecture, and constraints for the new HTML/CSS → Playwright PDF renderer. Every decision here was deliberate. Do not change these patterns without understanding the reasoning behind them.

---

## 1. Why this renderer exists

The previous student-facing PDFs were produced by Python/reportlab alongside teacher-facing documents. That meant:

- Student and teacher docs shared rendering logic and visual language
- Styling was buried in Python, hard to iterate on
- No separation between "assessment feel" and "daily work feel"

The new renderer gives each student output type its **own HTML template**, rendered by headless Chromium via Playwright. Teacher-facing docs (teacher_guide, lesson_overview, checkpoint_sheet, graphic_organizer) still go through the Python/reportlab path — don't touch that.

---

## 2. Core design constraints — read these first

These are non-negotiable and came from the actual classroom environment:

**B&W laser printer.** Every document must look good in greyscale. This means:
- No color fills that would print as a muddy grey block. Light grey (`#E5E7EB`) is the single allowed background, used only for masthead and section headers. It prints as a faint, clean grey.
- No colored borders, no colored text, no tinted callout boxes (other than `#F3F4F6` which is near-white).
- Hierarchy is established through **typography, borders, and whitespace** — not color.

**Ink economy.** The grey masthead is intentional: it signals identity without printing a solid black bar across every sheet. The teacher approved this tradeoff explicitly.

**Lexend font.** This is a readability-first typeface used for all student-facing documents. It is loaded as base64 WOFF2 embedded in `@font-face` — **not** via Google Fonts CDN, which doesn't resolve in headless Chromium. The font files come from the `@fontsource/lexend` npm package. Do not swap to a CDN URL.

**Letter-size pages, half-inch margins.** `@page { size: letter; margin: 0.5in 0.65in }`. The horizontal margin is slightly wider (0.65in) to match the masthead side padding.

**Every output type has its own template.** Do not copy-paste the task sheet template and tweak it. Each template in `engine/pdf-html/templates/` was written from scratch for its purpose. Adding a new output type means adding a new file.

---

## 3. Architecture

```
scripts/render-package.mjs
  └── for each route:
        if doc_mode + student audience + supportsHtmlRender(output_type)
          → collect into htmlRoutes[]   ← sync, no Playwright yet
      
      [sync loop ends, packageQa runs]
      
      for each route in htmlRoutes:   ← top-level await (ES module)
        if task_sheet → renderStudentDocDays()   ← one PDF per day
        else          → renderStudentDoc()        ← single PDF
```

The "collect then render" split is **load-bearing**. Playwright is async; the main render loop is sync. Top-level `await` in an ES module is how we bridge them — it is valid and intentional. Do not refactor this into a separate async function or wrap it in `Promise.all` without verifying test coverage still passes.

### Entry points

| Export | File | Purpose |
|---|---|---|
| `supportsHtmlRender(outputType)` | `engine/pdf-html/render.mjs` | Gate check — true if an HTML template exists for this type |
| `renderStudentDoc(pkg, route, outPath)` | `engine/pdf-html/render.mjs` | Render a single PDF |
| `renderStudentDocDays(pkg, route, outDir)` | `engine/pdf-html/render.mjs` | Render one PDF per day for task_sheet |

### Template registry

`render.mjs` maintains `TEMPLATE_MAP`:

```js
const TEMPLATE_MAP = {
  task_sheet:            buildTaskSheetHTML,
  final_response_sheet:  buildFinalResponseSheetHTML,
  exit_ticket:           buildExitTicketHTML,
  discussion_prep_sheet: buildDiscussionPrepSheetHTML,
  worksheet:             buildWorksheetHTML,
}
```

`supportsHtmlRender` just checks `outputType in TEMPLATE_MAP`. To add a new output type, add the builder function to this map and create the corresponding template file.

### Template function signature

Every builder follows this exact signature:

```js
export function buildXxxHTML(pkg, section, fontFaceCSS, designCSS) → string
```

- `pkg` — the full lesson package JSON (for `pkg.subject`, `pkg.grade`, `pkg.topic`)
- `section` — the resolved source section from the package (tasks, questions, prompts, etc.)
- `fontFaceCSS` — the `@font-face` block with embedded Lexend WOFF2 data (pass through, do not regenerate)
- `designCSS` — the shared design system CSS (pass through, do not override wholesale)
- Returns a complete `<!DOCTYPE html>` string

Font CSS and design CSS are **lazily cached** in `render.mjs` — they are expensive to generate (base64 encoding three font weights). Do not call `buildFontFaceCSS()` or `buildDesignSystemCSS()` inside a template. They are passed in as strings.

---

## 4. Shared design system (`engine/pdf-html/templates/shared.mjs`)

This file is the single source of truth for visual tokens and CSS. Every template injects it.

### Key CSS values

| Token | Value | Used for |
|---|---|---|
| Text primary | `#111827` | All body text, borders, doc titles |
| Text secondary | `#374151` | Supporting labels, sub-text |
| Text muted | `#6B7280` | Captions, metadata, dimmed labels |
| Text faint | `#9CA3AF` | Page fillers, de-emphasized content |
| Border default | `#D1D5DB` | Response lines, box borders |
| Fill grey (header) | `#E5E7EB` | Masthead, day section headers, badge backgrounds |
| Fill near-white | `#F3F4F6` | Task instruction background, tip boxes |
| Fill off-white | `#F9FAFB` | Prompt boxes in assessment docs |

### Masthead

The masthead stretches edge-to-edge by **compensating for the `@page` margin with negative margins**:

```css
.masthead {
  background: #E5E7EB;
  padding: 10pt 0.65in;
  margin: -0.5in -0.65in 18pt;
}
```

This is the canonical trick. The masthead always reads:
`Mr. Friess · [Subject] · Grade [Grade]` (left) and `[Topic]` (right).

Do not change the teacher's name. Do not hardcode subject or grade — always use `pkg.subject`, `pkg.grade`, `pkg.topic`.

### Page breaks

`page-break-after: avoid` is placed on `.task-label-row` (the task badge) only — to keep the badge with the instruction text below it. **Do not add `page-break-inside: avoid` to `.task-header-block` or `.task-instruction`.** That caused text overflow bugs when instruction blocks were tall: Chromium would refuse to break inside them, pushing content off-page rather than flowing onto the next page.

### `formatPrompt(text)`

Converts newline-delimited text to `<p>` tags, HTML-escaping each paragraph. Use this whenever rendering multi-paragraph prompt text from the package. Never inject raw text into HTML.

### `escapeHtml(str)`

Escapes `&`, `<`, `>`, `"`. Use this on every string value from the package JSON that gets interpolated into HTML. No exceptions.

---

## 5. Font loading

```js
// shared.mjs — called once, result cached in render.mjs
export function buildFontFaceCSS() {
  return [400, 600, 700].map(w => {
    const b64 = loadWoff2Base64(w)
    return `@font-face { font-family: 'Lexend'; font-weight: ${w}; src: url('data:font/woff2;base64,${b64}') format('woff2'); }`
  }).join('\n')
}
```

The WOFF2 files live at:
`node_modules/@fontsource/lexend/files/lexend-latin-{weight}-normal.woff2`

If the files are missing, `loadWoff2Base64` throws with an actionable message pointing to `pnpm install && npx playwright install chromium`. Do not silently fall back to system fonts — Lexend is intentional.

---

## 6. Template-by-template reference

### `task_sheet` — `templates/task-sheet.mjs`

The primary daily student document. Groups tasks by day label.

**Day parsing:** Tasks have labels like `"Day 1 — Card Sort"`. `extractDay()` pulls the `"Day X"` prefix. Tasks without a day prefix go into a group with `day: null` — this is valid (e.g. PBG fixtures that don't use day-based grouping).

**Per-day split:** `renderStudentDocDays()` calls `getDaysFromSection()` to get unique day labels, then renders one PDF per day via `buildTaskSheetHTMLForDay()`. Output filenames are: `{route.output_id}_day_1.pdf`, `{route.output_id}_day_2.pdf`, etc.

**`singleDay: true`:** When rendering a single day's PDF, the day section header (grey bar, "DAY 1") is suppressed — the document title already says "Day 1" at 26pt. Without this flag, you get the title and the header both saying the same thing.

**`buildPageFiller(dayLabel)`:** Appended at the bottom of each per-day document. Returns empty string if `dayLabel` is null (full-packet mode gets no filler). Selects a riddle deterministically from `fillers.json` using `charCodeSum(dayLabel) % fillers.length` — same day always gets the same riddle.

**Task block structure:**
- Badge: outlining border, uppercase label (with "Day X — " stripped)
- Instruction: left border (4pt solid black) + light grey background
- Response area: ruled lines in a bordered box

**`n_lines` vs `lines`:** The template checks `task.lines ?? task.n_lines ?? 4`. Both field names are valid; `lines` takes precedence.

---

### `worksheet` — `templates/worksheet.mjs`

Numbered academic questions. Distinct from task_sheet in feel and purpose.

- Circled question numbers (20pt circle, 1.5pt border)
- Optional point values displayed right-aligned: `question.points`
- `sub_questions` array support: lettered (a, b, c...) with their own line counts
- No day grouping, no task badges
- Optional `section.tip` renders as a left-border callout box before questions
- Optional `section.anchor` renders as a "Keep in mind:" list before questions
- `n_lines` per question defaults to 3; sub-questions default to 2

Name/date row is above the title (unlike task_sheet where it's below). This matches assessment convention.

---

### `exit_ticket` — `templates/exit-ticket.mjs`

Two identical tickets per page, separated by a dashed cut line with a scissors icon. Compact.

- No masthead (hidden via `display: none`) — identity is inside the ticket
- `@page { margin: 0.4in 0.65in }` — slightly tighter vertical margin to fit two tickets comfortably
- Each ticket has: eyebrow badge ("Exit Ticket"), class + name/date inline, topic, prompt label, prompt box, ruled lines
- `section.n_lines` defaults to 4
- The HTML renders the same `buildTicket()` block twice — the content is identical on both halves

Do not try to render different content on the two halves. The cut-line model assumes both halves are identical (teacher keeps one, student keeps one).

---

### `final_response_sheet` — `templates/final-response-sheet.mjs`

Assessment-feel. The culminating document for a unit.

- Eyebrow label "Culminating Task" above the title
- Title has a 2pt bottom border — heavier than normal, signals importance
- Prompt box: thicker left border (5pt), off-white background
- Optional planning space: dashed ruled lines labeled "rough notes only, not graded"
- Optional success criteria: checkboxes before submission (not actual HTML checkboxes — styled divs with a square border that students hand-check)
- Continuous ruled response area

**Key field names from the package section:**
- `section.prompt` — the full prompt text
- `section.response_lines` — number of response lines (checked first)
- `section.n_lines` — fallback for response lines
- `section.planning_lines` — number of dashed planning lines (0 = no planning space)
- `section.planning_reminders` — bullet points inside the prompt box
- `section.success_criteria` — array of strings for the self-check checklist

---

### `discussion_prep_sheet` — `templates/discussion-prep-sheet.mjs`

Structured for argumentative or discussion-based lessons. Three labelled boxes stacked vertically.

- No response lines — students write in open bordered boxes
- Box headers use the `#E5E7EB` fill (same as masthead/day-headers) — consistent grey language
- Box labels and hints are all overridable from the section JSON:
  - `section.position_label` / `section.position_hint`
  - `section.evidence_label` / `section.evidence_hint`
  - `section.counter_label` / `section.counter_hint`
- Featured discussion question in a prompt box above the stack
- `page-break-inside: avoid` on each `.prep-box` — keeps each box on one page if possible

**`min-height` placement:** The `style="min-height: Xpt"` goes on `.prep-box-inner`, not the outer `.prep-box`. The outer box has `overflow: hidden` and `border-radius`, which breaks min-height behavior on the outer element.

---

## 7. Page fillers — `engine/pdf-html/fillers.json`

Riddles only — no attributed quotes. This was an explicit decision: quote attribution is fragile (sources get disputed, misattributed). Riddles carry no attribution risk.

Structure:
```json
[
  { "type": "riddle", "prompt": "Brain break:", "text": "...", "answer": "(...)" }
]
```

- `prompt` — label that precedes the riddle text (uppercase, bold in CSS)
- `text` — the riddle in italic
- `answer` — answer in very faint grey (`#D1D5DB`) — visible up close, doesn't distract

**Selection is deterministic:** `charCodeSum(dayLabel) % fillers.length`. Same fixture + same day = same riddle every render. This is intentional so re-renders are stable.

**The teacher can edit this file freely.** It's plain JSON, no code changes required to add or swap riddles.

---

## 8. Playwright render config

```js
await page.pdf({
  path: outPath,
  format: 'Letter',
  printBackground: true,   // required for #E5E7EB fills — won't print without this
  margin: { top: '0', right: '0', bottom: '0', left: '0' },  // @page handles margins
})
```

`printBackground: true` is **required** for any background fill to appear. Without it, all `background-color` declarations are stripped by Chromium's print mode.

Margin is set to zero in `page.pdf()` because `@page { margin: ... }` in the CSS handles it. Setting margin in both places causes double-margin. Don't add margin to the `page.pdf()` call.

One browser per document (open → render → close). This is deliberate — sharing a browser context across multiple documents caused occasional stale-state issues during development. The performance cost is acceptable for small classroom batches.

---

## 9. How to add a new output type

1. Create `engine/pdf-html/templates/your-type.mjs`
2. Export `buildYourTypeHTML(pkg, section, fontFaceCSS, designCSS) → string`
3. Use `buildFontFaceCSS` and `buildDesignSystemCSS` passed in as arguments — do not import them in the template
4. Use `escapeHtml()` and `formatPrompt()` from `./shared.mjs` for all user content
5. Add the entry to `TEMPLATE_MAP` in `engine/pdf-html/render.mjs`
6. `supportsHtmlRender()` will automatically start returning true for the new type
7. In `scripts/render-package.mjs`, the routing is already handled: any `doc_mode` + `student` audience route whose `output_type` passes `supportsHtmlRender()` will be collected and rendered. No changes to render-package.mjs needed unless the new type needs per-day splitting (like task_sheet).

---

## 10. What this renderer does NOT handle

These output types still go through Python/reportlab and should not be moved:

| Type | Why it stays in Python |
|---|---|
| `teacher_guide` | Multipage, complex layout, teacher-specific chrome |
| `lesson_overview` | Teacher-facing, dense structure |
| `checkpoint_sheet` | Teacher-facing checkpoint logic |
| `graphic_organizer` | Complex layout with tables/grids |

Do not add these to `TEMPLATE_MAP`. The routing in render-package.mjs has a deliberate guard:

```js
if (route.renderer_family === 'pdf' && DOC_OUTPUT_TYPES.has(route.output_type)) {
  renderPdfOutput(packagePath, route, outDir)  // Python path
  continue
}
```

`DOC_OUTPUT_TYPES` is the set of types handled by Python. `TEMPLATE_MAP` is the set handled by HTML. There is no overlap by design.

---

## 11. Install requirements

```bash
pnpm install                    # installs @fontsource/lexend and playwright
pnpm run fonts:install          # npx playwright install chromium
```

Both are required before any student PDF can be rendered. If Chromium isn't installed, Playwright throws at `chromium.launch()`. If `@fontsource/lexend` is missing, `loadWoff2Base64` throws with a message pointing here.

---

## 12. Known constraints and invariants to preserve

- **`currentDay = undefined` in `groupTasksByDay`.** Not `null`. Tasks with no day label have `day = null`. If you initialize `currentDay` to `null`, those tasks silently skip group creation and crash. This was a real bug.
- **Font CSS is cached.** `getFontFaceCSS()` and `getDesignCSS()` in `render.mjs` are lazy singletons. Don't call the builders directly in a loop.
- **`buildPageFiller(null)` returns `''`.** If you pass a non-null value where null is expected, you'll get a spurious riddle on a full-packet document.
- **Template builders are synchronous.** Only `renderHtmlToPdf`, `renderStudentDoc`, and `renderStudentDocDays` are async. Template builders return plain strings.
- **No `page-break-inside: avoid` on instruction blocks.** Causes overflow on long prompts. See Section 4.
