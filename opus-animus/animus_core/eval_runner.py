"""Routing eval runner primitives."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable, Iterable


Bucket = tuple[str, float, float, bool]
BUCKETS: tuple[Bucket, ...] = (
    ("0.0-0.5", 0.0, 0.5, False),
    ("0.5-0.7", 0.5, 0.7, False),
    ("0.7-0.9", 0.7, 0.9, False),
    ("0.9-1.0", 0.9, 1.0, True),
)


def run_eval(
    goldens_path,
    router: Callable[[str], dict],
    baseline_path=None,
    traces: list[dict] | None = None,
    suite: str = "routing",
) -> dict:
    """Run routing eval against a JSONL golden set.

    Observed trace re-routes are counted from a truthy ``rerouted`` field.
    If richer correction data is present, a dismissed trace with a corrected
    target field is also counted as a re-route.
    """

    goldens = _read_jsonl(Path(goldens_path))
    if not goldens:
        raise ValueError("Golden set is empty")

    correct = 0
    misroutes: list[dict] = []
    bucket_rows: list[dict] = []

    for golden in goldens:
        input_text = golden["input"]
        gold_target = golden["target_subsystem"]
        prediction = router(input_text)
        got_target = prediction["target_subsystem"]
        confidence = float(prediction["route_confidence"])
        is_correct = got_target == gold_target

        if is_correct:
            correct += 1
        else:
            misroutes.append({"input": input_text, "gold": gold_target, "got": got_target})

        bucket_rows.append({"confidence": confidence, "correct": is_correct})

    n = len(goldens)
    routing_accuracy = correct / n
    baseline = _load_baseline(baseline_path)
    result = "FAIL" if baseline is not None and routing_accuracy < baseline else "PASS"

    report = {
        "suite": suite,
        "n": n,
        "routing_accuracy": routing_accuracy,
        "misroute_rate": 1 - routing_accuracy,
        "misroutes": misroutes,
        "confidence_buckets": _confidence_buckets(bucket_rows),
        "baseline": baseline,
        "result": result,
    }

    if traces is not None:
        report["misroute_rate_observed"] = _observed_misroute_rate(traces)

    return report


def format_report(report: dict) -> str:
    """Return a human-readable routing eval report."""

    baseline = report["baseline"]
    baseline_text = "none" if baseline is None else f"{baseline:.2f}"
    lines = [
        f"Routing eval - {report['n']} cases",
        f"routing_accuracy : {report['routing_accuracy']:.2f}  baseline {baseline_text}",
        f"misroute_rate    : {report['misroute_rate']:.2f}",
    ]

    if "misroute_rate_observed" in report:
        lines.append(f"observed_misroute_rate : {report['misroute_rate_observed']:.2f}")

    lines.append("Misroutes:")
    if report["misroutes"]:
        for row in report["misroutes"]:
            lines.append(f"  {row['input']!r}  gold={row['gold']}  got={row['got']}")
    else:
        lines.append("  none")

    lines.append("Confidence buckets:")
    if report["confidence_buckets"]:
        lines.append("  range      n  accuracy")
        for bucket in report["confidence_buckets"]:
            lines.append(f"  {bucket['range']:<9} {bucket['n']:>2}  {bucket['accuracy']:.2f}")
    else:
        lines.append("  none")

    lines.append(f"RESULT: {report['result']}")
    return "\n".join(lines)


def _read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as jsonl_file:
        for line in jsonl_file:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def _load_baseline(baseline_path) -> float | None:
    if baseline_path is None:
        return None

    path = Path(baseline_path)
    if not path.exists():
        return None

    with path.open("r", encoding="utf-8") as baseline_file:
        baseline = json.load(baseline_file)
    return float(baseline["routing_accuracy"])


def _confidence_buckets(rows: Iterable[dict]) -> list[dict]:
    buckets: list[dict] = []
    row_list = list(rows)

    for label, lower, upper, upper_inclusive in BUCKETS:
        bucket_rows = [row for row in row_list if _in_bucket(row["confidence"], lower, upper, upper_inclusive)]
        if not bucket_rows:
            continue

        correct = sum(1 for row in bucket_rows if row["correct"])
        buckets.append({"range": label, "n": len(bucket_rows), "accuracy": correct / len(bucket_rows)})

    return buckets


def _in_bucket(confidence: float, lower: float, upper: float, upper_inclusive: bool) -> bool:
    if upper_inclusive:
        return lower <= confidence <= upper
    return lower <= confidence < upper


def _observed_misroute_rate(traces: list[dict]) -> float:
    if not traces:
        return 0.0

    reroutes = sum(1 for trace in traces if _is_reroute(trace))
    return reroutes / len(traces)


def _is_reroute(trace: dict) -> bool:
    if trace.get("rerouted"):
        return True

    corrected_target = (
        trace.get("corrected_target_subsystem")
        or trace.get("corrected_target")
        or trace.get("followup_target_subsystem")
    )
    return trace.get("user_verdict") == "dismissed" and bool(corrected_target)
