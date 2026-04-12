import json
import subprocess
from pathlib import Path


def test_visual_qa_emits_new_rule_ids():
    repo_root = Path(__file__).resolve().parents[2]
    fixture_path = repo_root / "fixtures" / "visual" / "qa-rule-id-violations.slide-deck.json"

    command = (
        "import { readFileSync } from 'node:fs';"
        "import { runVisualQaOnPlan } from './engine/visual/qa.mjs';"
        "const plan = JSON.parse(readFileSync(process.argv[1], 'utf8'));"
        "const result = runVisualQaOnPlan(plan);"
        "console.log(JSON.stringify(result));"
    )

    completed = subprocess.run(
        ["node", "--input-type=module", "-e", command, str(fixture_path)],
        check=True,
        cwd=repo_root,
        capture_output=True,
        text=True,
    )

    payload = json.loads(completed.stdout)
    finding_types = {finding["type"] for finding in payload["findings"]}

    assert "accent_limit" in finding_types
    assert "reflection_breathing_room" in finding_types
