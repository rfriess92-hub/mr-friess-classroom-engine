# Builder Notes

## Rendering pipeline

All output is produced by two renderers:

**PDF — Python/reportlab**
- Entry: `engine/pdf/render_stable_core_output.py`
- Base module: `engine/pdf/archive/render_stable_core_output_base.py`
- Per-type modules: `student_pdf_task_sheets.py`, `student_pdf_short_forms.py`, `student_pdf_graphic_organizer.py`, `student_pdf_worksheet.py`
- Chrome wrapper: `engine/pdf/document_chrome.py` — branded header/footer applied to every page via `build_printable_pdf()`

**Slides — Python/python-pptx**
- Entry: `engine/pptx/render-cli.mjs` (Node subprocess wrapper)
- Renderer: `engine/pptx/renderer.py`

Both renderers are invoked by `scripts/render-package.mjs`, which runs the full route plan → artifact classification → dispatch cycle.

## Install

```bash
pip install reportlab python-pptx pypdf pillow lxml
pnpm install
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

| Output type | Renderer module |
|---|---|
| `task_sheet` | `student_pdf_task_sheets.py` |
| `final_response_sheet` | `student_pdf_task_sheets.py` |
| `exit_ticket` | `student_pdf_short_forms.py` |
| `discussion_prep_sheet` | `student_pdf_short_forms.py` |
| `graphic_organizer` | `student_pdf_graphic_organizer.py` |
| `worksheet` | `student_pdf_worksheet.py` |
| `teacher_guide` | base module + multipage variant |
| `lesson_overview` | base module |
| `checkpoint_sheet` | base module |
| `slides` | `engine/pptx/renderer.py` |
