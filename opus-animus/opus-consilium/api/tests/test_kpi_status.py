from kpi_status import get_kpi_status


def test_dti_34_2_vs_35_is_warn_not_ok():
    assert get_kpi_status("threshold_band", actual=34.2, threshold=35, direction="<=") == "warn"


def test_drift_9_4_vs_5_is_breach_not_warn():
    assert get_kpi_status("threshold_band", actual=9.4, threshold=5, direction="<=") == "breach"


def test_contrib_zero_before_payday_is_pending_not_breach():
    assert get_kpi_status("threshold_band", actual=0, threshold=100, direction=">=", pending=True) == "pending"


def test_contrib_zero_after_payday_is_breach():
    assert get_kpi_status("threshold_band", actual=0, threshold=100, direction=">=") == "breach"


def test_threshold_zero_edge_case_no_crash():
    assert get_kpi_status("threshold_band", actual=0, threshold=0, direction="<=") == "ok"
    assert get_kpi_status("threshold_band", actual=1, threshold=0, direction="<=") == "breach"


def test_boolean_flip_none_is_pending():
    assert get_kpi_status("boolean_flip", is_ok=None) == "pending"


def test_threshold_band_gte_warn_and_ok():
    assert get_kpi_status("threshold_band", actual=80, threshold=100, direction=">=") == "warn"
    assert get_kpi_status("threshold_band", actual=100, threshold=100, direction=">=") == "ok"


def test_count_step_kind():
    assert get_kpi_status("count_step", count=0) == "ok"
    assert get_kpi_status("count_step", count=1) == "warn"
    assert get_kpi_status("count_step", count=2) == "breach"


def test_day_severity_kind():
    assert get_kpi_status("day_severity", overdue_count=0, max_days=0, limit_days=90) == "ok"
    assert get_kpi_status("day_severity", overdue_count=1, max_days=10, limit_days=90) == "warn"
    assert get_kpi_status("day_severity", overdue_count=1, max_days=91, limit_days=90) == "breach"


def test_boolean_flip_true_false():
    assert get_kpi_status("boolean_flip", is_ok=True) == "ok"
    assert get_kpi_status("boolean_flip", is_ok=False) == "breach"
