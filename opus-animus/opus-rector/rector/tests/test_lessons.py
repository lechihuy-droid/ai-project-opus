from rector.lessons import list_lessons, log_lesson


def test_log_lesson_caps_active_lessons_at_30_and_retires_oldest(tmp_path, monkeypatch):
    monkeypatch.setenv("ANIMUS_ROOT", str(tmp_path))

    for index in range(31):
        log_lesson(f"lesson {index}")

    lessons = list_lessons()

    assert len(lessons) == 30
    assert "lesson 0" not in lessons
    assert lessons[0] == "lesson 1"
    assert lessons[-1] == "lesson 30"
