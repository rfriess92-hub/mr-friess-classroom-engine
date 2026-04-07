# Generated builder layer

These are **generated starter builders**, not the original lost engine files.

They are meant to do three things:
1. validate the current lesson packet shape,
2. build a simple PPTX deck,
3. build a simple PDF print pack.

## Files

- `engine/pptx/build.js` — thin Node wrapper
- `engine/pptx/render_pptx.py` — Python PPTX renderer
- `engine/pdf/build.py` — Python PDF renderer
- `engine/schema/lesson.schema.json` — starter schema

## Install

Python:

```bash
pip install python-pptx reportlab jsonschema
```

## Usage

```bash
node engine/pptx/build.js --lesson engine/content/science9_interconnected_spheres.json --out output
python3 engine/pdf/build.py --lesson engine/content/science9_interconnected_spheres.json --out output
```

The PPTX builder writes `{lesson_id}.pptx`.
The PDF builder writes `{lesson_id}.pdf`.
