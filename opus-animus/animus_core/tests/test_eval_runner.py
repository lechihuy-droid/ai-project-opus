from __future__ import annotations

import json

from animus_core.eval_runner import format_report, run_eval


def _write_jsonl(path, rows: list[dict]) -> None:
    path.write_text("\n".join(json.dumps(row) for row in rows) + "\n", encoding="utf-8")


def _write_baseline(path, routing_accuracy: float) -> None:
    path.write_text(json.dumps({"routing_accuracy": routing_accuracy}), encoding="utf-8")


def test_run_eval_scores_accuracy_and_misroutes(tmp_path):
    goldens = [
        {"input": f"case {index}", "target_subsystem": "NEXUS", "lang": "en", "note": "test"}
        for index in range(10)
    ]
    goldens_path = tmp_path / "routing-goldens.jsonl"
    _write_jsonl(goldens_path, goldens)

    wrong_inputs = {"case 3", "case 8"}

    def router(input_str: str) -> dict:
        target = "CONSILIUM" if input_str in wrong_inputs else "NEXUS"
        return {"target_subsystem": target, "route_confidence": 0.95}

    report = run_eval(goldens_path, router)

    assert report["suite"] == "routing"
    assert report["n"] == 10
    assert report["routing_accuracy"] == 0.8
    assert report["misroute_rate"] == 0.19999999999999996
    assert report["misroutes"] == [
        {"input": "case 3", "gold": "NEXUS", "got": "CONSILIUM"},
        {"input": "case 8", "gold": "NEXUS", "got": "CONSILIUM"},
    ]
    assert report["result"] == "PASS"


def test_run_eval_applies_baseline_gate(tmp_path):
    goldens = [
        {"input": f"case {index}", "target_subsystem": "NEXUS"}
        for index in range(10)
    ]
    goldens_path = tmp_path / "routing-goldens.jsonl"
    _write_jsonl(goldens_path, goldens)

    def router(input_str: str) -> dict:
        index = int(input_str.split()[-1])
        target = "NEXUS" if index < 8 else "INFRA"
        return {"target_subsystem": target, "route_confidence": 0.8}

    baseline_path = tmp_path / "baseline.json"
    _write_baseline(baseline_path, 0.9)
    assert run_eval(goldens_path, router, baseline_path=baseline_path)["result"] == "FAIL"

    _write_baseline(baseline_path, 0.7)
    assert run_eval(goldens_path, router, baseline_path=baseline_path)["result"] == "PASS"


def test_confidence_buckets_aggregate_accuracy(tmp_path):
    goldens = [
        {"input": "low correct", "target_subsystem": "NEXUS"},
        {"input": "mid wrong", "target_subsystem": "NEXUS"},
        {"input": "mid correct", "target_subsystem": "NEXUS"},
        {"input": "high correct", "target_subsystem": "NEXUS"},
        {"input": "top wrong", "target_subsystem": "NEXUS"},
        {"input": "top correct", "target_subsystem": "NEXUS"},
    ]
    predictions = {
        "low correct": ("NEXUS", 0.4),
        "mid wrong": ("WIKI", 0.5),
        "mid correct": ("NEXUS", 0.69),
        "high correct": ("NEXUS", 0.7),
        "top wrong": ("INFRA", 0.9),
        "top correct": ("NEXUS", 1.0),
    }
    goldens_path = tmp_path / "routing-goldens.jsonl"
    _write_jsonl(goldens_path, goldens)

    def router(input_str: str) -> dict:
        target, confidence = predictions[input_str]
        return {"target_subsystem": target, "route_confidence": confidence}

    report = run_eval(goldens_path, router)

    assert report["confidence_buckets"] == [
        {"range": "0.0-0.5", "n": 1, "accuracy": 1.0},
        {"range": "0.5-0.7", "n": 2, "accuracy": 0.5},
        {"range": "0.7-0.9", "n": 1, "accuracy": 1.0},
        {"range": "0.9-1.0", "n": 2, "accuracy": 0.5},
    ]


def test_traces_compute_observed_misroute_rate_when_supplied(tmp_path):
    goldens_path = tmp_path / "routing-goldens.jsonl"
    _write_jsonl(goldens_path, [{"input": "route", "target_subsystem": "NEXUS"}])

    def router(input_str: str) -> dict:
        return {"target_subsystem": "NEXUS", "route_confidence": 0.9}

    report = run_eval(
        goldens_path,
        router,
        traces=[
            {"id": "1", "rerouted": True},
            {"id": "2", "user_verdict": "accepted"},
            {"id": "3", "user_verdict": "dismissed", "corrected_target_subsystem": "WIKI"},
        ],
    )

    assert report["misroute_rate_observed"] == 2 / 3


def test_format_report_includes_result_and_sections():
    report = {
        "suite": "routing",
        "n": 1,
        "routing_accuracy": 1.0,
        "misroute_rate": 0.0,
        "misroutes": [],
        "confidence_buckets": [{"range": "0.9-1.0", "n": 1, "accuracy": 1.0}],
        "baseline": None,
        "result": "PASS",
    }

    text = format_report(report)

    assert "routing_accuracy" in text
    assert "Confidence buckets:" in text
    assert "RESULT: PASS" in text
