"""Tests for reconciliation-backed anomaly detection."""

from __future__ import annotations

import json
from pathlib import Path

from insighthub.anomalies import detect
from insighthub.reconcile import reconcile
from insighthub.schema import ProjectState


def test_detects_expected_seeded_anomaly_rules_without_overflagging():
    state = ProjectState.model_validate_json(Path("data/sample/_projectstate.json").read_text(encoding="utf-8"))
    expected = set(json.loads(Path("data/sample/_ground_truth.json").read_text(encoding="utf-8"))["expected_rules"])

    anomalies = detect(state, reconcile(state))
    detected = {anomaly.rule_id for anomaly in anomalies}

    assert len(detected & expected) >= 13
    assert len(anomalies) <= 25
