from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_engine_layout_exists() -> None:
    required = [
        ROOT / 'engine' / 'content',
        ROOT / 'engine' / 'schema' / 'lesson.schema.json',
        ROOT / 'engine' / 'pdf' / 'build.py',
        ROOT / 'engine' / 'pptx' / 'render_pptx.py',
        ROOT / 'package.json',
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    assert missing == [], f'Missing required engine paths: {missing}'
