from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_engine_layout_exists() -> None:
    required = [
        ROOT / 'engine' / 'content',
        ROOT / 'README.md',
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
    assert missing == [], f'Missing required engine paths: {missing}'
