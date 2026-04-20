# Builder Notes

## Rendering pipeline

All output is produced by three renderers:

**Student PDFs — HTML/CSS → Playwright (Node)**
- Entry: `engine/pdf-html/render.mjs` (`renderStudentDoc`, `renderStudentDocDays`)
- Templates: `engine/pdf-html/templates/` — one file per output type (task-sheet, worksheet, exit-ticket, final-response-sheet, discussion-prep-sheet)
- Shared CSS design system and Lexend font loader: `engine/pdf-html/templates/shared.mjs`
- Page fillers (riddles): `engine/pdf-html/fillers.json` — edit to add or change riddles
- `task_sheet` routes are split per-day automatically; each day produces a separate PDF
- Requires: `pnpm install && pnpm run fonts:install` (installs Playwright Chromium)

**Teacher PDFs — Python/reportlab**
- Entry: `engine/pdf/render_stable_core_output.py`
- Chrome wrapper: `engine/pdf/document_chrome.py` — branded header/footer via `build_printable_pdf()`

**Slides — Python/python-pptx**
- Entry: `engine/pptx/render-cli.mjs` (Node subprocess wrapper)
- Renderer: `engine/pptx/renderer.py`

All renderers are invoked by `scripts/render-package.mjs`, which runs the full route plan → artifact classification → dispatch cycle.

## Install

```bash
pip install reportlab python-pptx pypdf pillow lxml
pnpm install
pnpm run fonts:install   # installs Playwright Chromium — required for student PDFs
```

## Key scripts

```bash
pnpm run schema:check -- --fixture benchmark1
pnpm run route:plan   -- --fixture benchmark1 --print-routes
pnpm run render:package -- --fixture benchmark1 --out output
pnpm run qa:bundle    -- --fixture benchmark1 --out output
pnpm run qa:pedagogy-variants -- --fixture benchmark1
pnpm test
```

## Output types

| Output type | Renderer | Notes |
|---|---|---|
| `task_sheet` | `engine/pdf-html` (HTML→PDF) | per-day split; one PDF per "Day X" |
| `worksheet` | `engine/pdf-html` (HTML→PDF) | numbered questions, optional points |
| `exit_ticket` | `engine/pdf-html` (HTML→PDF) | two-up layout, cut line |
| `final_response_sheet` | `engine/pdf-html` (HTML→PDF) | culminating task, success criteria |
| `discussion_prep_sheet` | `engine/pdf-html` (HTML→PDF) | position/evidence/counterargument boxes |
| `graphic_organizer` | `engine/pdf` (Python/reportlab) | |
| `teacher_guide` | `engine/pdf` (Python/reportlab) | multipage variant |
| `lesson_overview` | `engine/pdf` (Python/reportlab) | |
| `checkpoint_sheet` | `engine/pdf` (Python/reportlab) | |
| `slides` | `engine/pptx/renderer.py` | |
