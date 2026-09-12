from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "contracts" / "beacon_v8_studionet.py"
ACTIVE_DEPLOYMENT_FILES = (
    ROOT / "deploy" / "deployScript.ts",
    ROOT / "deploy" / "v8" / "deploy.ts",
)


def test_active_deployment_paths_are_v8_only():
    for path in ACTIVE_DEPLOYMENT_FILES:
        text = path.read_text(encoding="utf-8").lower()
        assert "contracts/beacon_v8_studionet.py" in text
        assert "https://studio.genlayer.com/api" in text
        assert "61999" in text
        assert "beacon.py" not in text
        assert "beacon_v5.py" not in text
        assert "beacon_v6.py" not in text
        assert "beacon_v7.py" not in text

    historical_runner = (ROOT / "tools" / "bradbury_runner.mjs").read_text(encoding="utf-8")
    assert "disabled" in historical_runner.lower()
    assert "deploy/v8/deploy.ts" in historical_runner


def test_frozen_sha_matches_exact_deployment_bytes_when_frozen():
    freeze = ROOT / "deploy" / "v8" / "FROZEN_SHA256SUMS.txt"
    if not freeze.exists():
        pytest.skip("V8 freeze is correctly deferred until live gates pass")

    import hashlib

    expected = next(
        line.split("=", 1)[1].strip().lower()
        for line in freeze.read_text(encoding="utf-8").splitlines()
        if line.upper().startswith("V8_CONTRACT_SHA256")
    )
    actual = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    assert actual == expected
