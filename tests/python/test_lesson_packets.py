import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'engine' / 'content'

REQUIRED_TOP_LEVEL = [
    'lesson_id',
    'subject',
    'grade',
    'topic',
    'time_minutes',
    'learning_goals',
    'slides',
    'worksheets',
]

REQUIRED_TIERS = ['supported', 'proficient', 'extending']


def test_reference_lesson_packets_have_required_shape() -> None:
    packets = sorted(CONTENT.glob('*.json'))
    assert packets, 'No lesson packets found in engine/content'

    for packet_path in packets:
        data = json.loads(packet_path.read_text(encoding='utf-8'))

        for key in REQUIRED_TOP_LEVEL:
            assert key in data, f'{packet_path.name} missing top-level key: {key}'

        assert data['slides'], f'{packet_path.name} has no slides'

        for tier in REQUIRED_TIERS:
            assert tier in data['worksheets'], f'{packet_path.name} missing worksheet tier: {tier}'
