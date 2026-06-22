from __future__ import annotations

import pytest

from animus_core.router import route


@pytest.mark.parametrize(
    ("user_input", "target"),
    [
        ("Logos: nen bo huong X khong?", "LOGOS"),
        ("Wiki: toi da luu gi ve RLHF?", "WIKI"),
        ("Infra: scheduler nao dang chay?", "INFRA"),
    ],
)
def test_prefix_override_routes_directly_with_full_confidence(user_input, target):
    assert route(user_input) == {"target_subsystem": target, "route_confidence": 1.0}


@pytest.mark.parametrize(
    ("user_input", "target"),
    [
        ("tong hop tin AI", "CONSILIUM"),
        ("break task nay", "RECTOR"),
        ("lich hom nay", "NEXUS"),
        ("chay pipeline", "INFRA"),
        ("luu vao wiki", "WIKI"),
        ("regenerate slide", "LUCIDA"),
        ("nen bo huong nao", "LOGOS"),
    ],
)
def test_keyword_routing_maps_clear_cases(user_input, target):
    assert route(user_input)["target_subsystem"] == target


def test_primus_prefix_is_stripped_before_matching():
    result = route("Primus, break task nay ra cac buoc nho")

    assert result["target_subsystem"] == "RECTOR"
    assert result["route_confidence"] == 0.9
