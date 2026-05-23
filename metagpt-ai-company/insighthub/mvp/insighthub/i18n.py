"""Localization tables for the template-only report renderer (EN / JA / VN).

The full natural-language narrative — especially Japanese keigo — is produced by the
LLM/Copilot path. This module localizes only the *deterministic* template-only fallback:
section titles, fact labels, recurring English connector phrases, and status/severity
keywords. It never alters numbers or IDs, so the anti-hallucination validator still passes.

Constraint: translated strings must contain NO digits (would corrupt `allowed_numbers`).
"""

from __future__ import annotations

_SECTION_TITLES: dict[str, dict[str, str]] = {
    "en": {
        "exec_summary": "Executive Summary", "progress": "Progress",
        "completed": "Completed", "in_progress": "In Progress",
        "next_week": "Next Week", "blockers": "Blockers",
        "bugs": "Bugs", "decisions": "Decisions", "metrics": "Metrics",
        "phase_trend": "Phase Trend", "budget_effort": "Budget and Effort",
        "quality_kpis": "Quality KPIs", "changes_vs_last_report": "Changes vs last report",
    },
    "ja": {
        "exec_summary": "エグゼクティブサマリー", "progress": "進捗状況",
        "completed": "完了項目", "in_progress": "進行中の項目",
        "next_week": "来週の予定", "blockers": "障害・リスク",
        "bugs": "バグ状況", "decisions": "決定事項", "metrics": "メトリクス",
        "changes_vs_last_report": "前回報告からの変更点",
    },
    "vn": {
        "exec_summary": "Tóm tắt điều hành", "progress": "Tiến độ",
        "completed": "Hạng mục hoàn thành", "in_progress": "Đang thực hiện",
        "next_week": "Kế hoạch tuần tới", "blockers": "Vướng mắc & Rủi ro",
        "bugs": "Tình hình lỗi", "decisions": "Quyết định", "metrics": "Chỉ số",
        "changes_vs_last_report": "Thay đổi so với báo cáo trước",
    },
}

# Fact labels — only the STATIC labels from facts.py. Dynamic labels (Jira keys, phase
# names, sprint names, rule IDs) are passed through unchanged.
_LABELS: dict[str, dict[str, str]] = {
    "ja": {
        "Overall status": "全体ステータス",
        "Completed work items": "完了作業項目",
        "High risks": "重大リスク",
        "Overall progress": "全体進捗",
        "Upcoming or open WBS tasks": "今後・未完了のWBSタスク",
        "Blockers and schedule risks": "障害・スケジュールリスク",
        "Slipped task": "遅延タスク",
        "Opened bugs": "新規バグ", "Closed bugs": "解決済みバグ",
        "Open bugs": "未解決バグ", "Open bugs by severity": "重大度別の未解決バグ",
        "Reopened bugs": "再発バグ", "Mean time to fix": "平均修正時間",
        "Velocity": "ベロシティ", "Throughput": "スループット",
        "GitHub activity": "GitHubアクティビティ",
        "Decision": "決定事項", "Action Item": "アクションアイテム",
        "Newly closed since last report": "前回報告以降に完了",
        "Status changed since last report": "前回報告以降のステータス変更",
        "Metric delta since last report": "前回報告以降の指標差分",
        "Changes vs last report": "前回報告との比較",
    },
    "vn": {
        "Overall status": "Trạng thái tổng thể",
        "Completed work items": "Hạng mục đã hoàn thành",
        "High risks": "Rủi ro cao",
        "Overall progress": "Tiến độ tổng thể",
        "Upcoming or open WBS tasks": "Công việc WBS sắp tới hoặc đang mở",
        "Blockers and schedule risks": "Vướng mắc & rủi ro tiến độ",
        "Slipped task": "Công việc trễ hạn",
        "Opened bugs": "Bug mới mở", "Closed bugs": "Bug đã đóng",
        "Open bugs": "Bug đang mở", "Open bugs by severity": "Bug đang mở theo mức độ",
        "Reopened bugs": "Bug mở lại", "Mean time to fix": "Thời gian sửa trung bình",
        "Velocity": "Velocity", "Throughput": "Throughput",
        "GitHub activity": "Hoạt động GitHub",
        "Decision": "Quyết định", "Action Item": "Hạng mục hành động",
        "Newly closed since last report": "Hạng mục vừa đóng từ báo cáo trước",
        "Status changed since last report": "Hạng mục đổi trạng thái từ báo cáo trước",
        "Metric delta since last report": "Biến động chỉ số từ báo cáo trước",
        "Changes vs last report": "So sánh với báo cáo trước",
    },
}

# Recurring English connector phrases inside fact.value. Applied longest-first so that
# overlapping phrases resolve correctly. No digits allowed in any replacement.
_PHRASES: dict[str, dict[str, str]] = {
    "ja": {
        "completed work items": "件の完了作業項目",
        "blocker or schedule risk items": "件の障害・スケジュールリスク",
        "upcoming or open WBS tasks": "件の今後・未完了WBSタスク",
        "Open bug severity counts:": "重大度別の未解決バグ件数：",
        "High anomalies": "件の重大な異常",
        "story points done": "ストーリーポイント完了",
        "completed SP of": "完了SP／",
        "committed SP": "コミットSP",
        "issues completed": "件の課題完了",
        "bugs opened": "件の新規バグ", "bugs closed": "件の解決済みバグ",
        "bugs reopened": "件の再発バグ", "bugs open": "件の未解決バグ",
        "days MTTF": "日（平均修正時間）",
        "planned start": "開始予定",
        "slipped task": "遅延タスク",
        "commits and": "件のコミット、",
        "actual vs": "実績／", "completion": "達成", "completed": "完了",
        "planned": "計画", "variance": "差異", "actual": "実績", "PRs": "件のPR",
        "Green": "緑：順調", "Yellow": "黄：注意", "Red": "赤：危険",
        "High": "高", "Medium": "中", "Low": "低",
    },
    "vn": {
        "completed work items": "hạng mục hoàn thành",
        "blocker or schedule risk items": "vướng mắc hoặc rủi ro tiến độ",
        "upcoming or open WBS tasks": "công việc WBS sắp tới hoặc đang mở",
        "Open bug severity counts:": "Số bug đang mở theo mức độ:",
        "High anomalies": "bất thường mức Cao",
        "story points done": "story point hoàn thành",
        "completed SP of": "SP hoàn thành /",
        "committed SP": "SP cam kết",
        "issues completed": "issue hoàn thành",
        "bugs opened": "bug mới mở", "bugs closed": "bug đã đóng",
        "bugs reopened": "bug mở lại", "bugs open": "bug đang mở",
        "days MTTF": "ngày (thời gian sửa trung bình)",
        "planned start": "bắt đầu dự kiến",
        "slipped task": "công việc trễ hạn",
        "commits and": "commit và",
        "actual vs": "thực tế /", "completion": "hoàn thành", "completed": "hoàn thành",
        "planned": "kế hoạch", "variance": "chênh lệch", "actual": "thực tế", "PRs": "PR",
        "Green": "Xanh (Tốt)", "Yellow": "Vàng (Cảnh báo)", "Red": "Đỏ (Nguy cấp)",
        "High": "Cao", "Medium": "Trung bình", "Low": "Thấp",
    },
}

_NO_DATA = {"en": "(no data)", "ja": "(データなし)", "vn": "(không có dữ liệu)"}


_HEADERS: dict[str, dict[str, str]] = {
    "en": {
        "report_title": "Weekly Status Report",
        "period": "Period",
        "overall_status": "Overall Status",
    },
    "ja": {
        "report_title": "週次ステータス報告書",
        "period": "対象期間",
        "overall_status": "全体ステータス",
    },
    "vn": {
        "report_title": "Báo cáo trạng thái tuần",
        "period": "Kỳ báo cáo",
        "overall_status": "Trạng thái tổng thể",
    },
}


def section_title(section_id: str, lang: str) -> str:
    """Localized section heading; falls back to English then to the raw id."""
    table = _SECTION_TITLES.get(lang, _SECTION_TITLES["en"])
    return table.get(section_id) or _SECTION_TITLES["en"].get(section_id, section_id)


def label(text: str, lang: str) -> str:
    """Localized fact label; unknown (dynamic) labels pass through unchanged."""
    if lang == "en":
        return text
    return _LABELS.get(lang, {}).get(text, text)


def localize_value(value: str, lang: str) -> str:
    """Replace known English connector phrases in a fact value; numbers/IDs untouched."""
    if lang == "en":
        return value
    table = _PHRASES.get(lang, {})
    for phrase in sorted(table, key=len, reverse=True):
        value = value.replace(phrase, table[phrase])
    return value


def no_data(lang: str) -> str:
    """Localized empty-section placeholder."""
    return _NO_DATA.get(lang, _NO_DATA["en"])


def header(key: str, lang: str) -> str:
    """Localized report header label."""
    table = _HEADERS.get(lang, _HEADERS["en"])
    return table.get(key) or _HEADERS["en"].get(key, key)
