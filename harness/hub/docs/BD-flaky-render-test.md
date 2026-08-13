# BD — Truy ra test render chập chờn

**Date:** 2026-08-13 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Giao cho:** Sonnet subagent. Claude review.

---

## 0. Hiện tượng

`tests/test_render_nodes.py::test_render_success_uses_only_config_argv_and_registers_real_artifact`

- Chạy cả bộ: fail khoảng **2 trên 6 lần**
- Chạy riêng file đó: **luôn pass** (11 passed)
- Không do thay đổi gần đây — đã stash công việc ra chạy ở HEAD cũ, vẫn vậy

Con số gần nhất: `harness/hub` 430 passed / 1 skipped, thỉnh thoảng thành 429/1 kèm đúng test này.

## 1. Điều chưa biết, và đó là vấn đề

**Chưa ai bắt được traceback của lần fail.** Mọi phân tích dưới đây là giả thuyết đọc từ code, chưa có bằng chứng chạy. Bước 1 vì thế không phải sửa, mà là *nhìn thấy nó hỏng*.

Đừng sửa gì trước khi có traceback thật.

## 2. Hai giả thuyết, và cách phân biệt

Test này spawn **tiến trình con thật** (không mock), rồi khẳng định ba điều:

```python
assert captured[0][:-1] == render_target["command"][:-1]
assert captured[0][-1].endswith("render-props.json")
artifact = runtime_state.read_run(run_id)["artifacts"][0]
assert Path(artifact["path"]).is_file() and artifact["size"] == 5
```

### Giả thuyết A — chạm trần tiến trình đồng thời

`services/providers/procs.py`:

- `registry = ProcessRegistry()` ở **cấp module** (dòng 200) — dùng chung cho cả phiên pytest
- `spawn` ném `BusyError` khi `_live_count_locked() >= config.MAX_CONCURRENT_CLI` (mặc định **3**, `config.py:366`)
- `_live_count_locked` đếm entry còn `process.poll() is None` — tức còn **đang chạy thật**
- entry chỉ bị bỏ khi ai đó gọi `unregister()`; `kill_all()` chỉ gắn vào lifespan của FastAPI, **không chạy giữa các test**

`tests/test_providers.py` cũng spawn tiến trình thật. Nếu ba tiến trình còn sống đúng lúc test render spawn, nó ăn `BusyError`, render node hỏng, `captured` rỗng → `captured[0]` ném `IndexError`.

**Dấu nhận biết:** traceback là `IndexError: list index out of range` ở dòng 100, hoặc `BusyError` trong log.

### Giả thuyết B — tiến trình con chưa kịp ghi xong

`artifact["size"] == 5` phụ thuộc tiến trình con ghi đúng 5 byte và đã đóng file. Chạy cả bộ thì máy tải nặng hơn hẳn chạy một file.

**Dấu nhận biết:** traceback là `AssertionError` ở dòng 103 với `size` khác 5, hoặc `artifacts` rỗng → `IndexError` ở dòng 102 (khác dòng 100, phân biệt được với giả thuyết A).

Hai giả thuyết cho hai dòng lỗi khác nhau. Một traceback là đủ để loại một cái.

## 3. Bước 1 — bắt bằng chứng

Chạy lặp cho tới khi vồ được, lưu traceback đầy đủ:

```bash
cd harness/hub
for i in 1 2 3 4 5 6 7 8; do
  PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 <python311> -m pytest -p no:randomly \
    --tb=long -q > "/tmp/run-$i.txt" 2>&1
  grep -q "^FAILED" "/tmp/run-$i.txt" && echo "bắt được ở lần $i" && break
done
```

Ghi lại: dòng nào ném, kiểu lỗi gì, giá trị thực tế của `captured` và `artifacts`.

Nếu 8 lần đều xanh thì **báo lại, đừng đoán bừa** — có thể nó chỉ nổ khi máy đang tải nặng (lúc trước Docker và dev server cùng chạy).

## 4. Bước 2 — sửa theo đúng loại

**Nếu là A:** thêm fixture `autouse` trong `tests/conftest.py` dọn registry giữa các test. Đây là rò rỉ trạng thái toàn cục thật, đáng sửa dù test này có chập chờn hay không — bất kỳ test nào spawn cũng đang ảnh hưởng test sau.

**Nếu là B:** cho test chờ artifact ổn định thay vì đọc ngay. **Không** nới `max_seconds` lên cho qua chuyện — làm thế là giấu bệnh, và lần sau máy chậm hơn nó lại nổ.

Dù là loại nào, sau khi sửa phải chạy lại **8 lần liên tiếp cả bộ**, xanh cả 8 mới tính là xong.

## 5. Ràng buộc

- **Không chạy lệnh git** — Claude commit.
- Không thêm dependency. Không nới timeout để test qua.
- Python 3.11: `C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe`. `python` trần là 3.14, thiếu `openai` và `pytest`.
- Bắt buộc `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, không thì `hydra` làm sập collection.
- Baseline hiện tại: `harness/hub` **430 passed, 1 skipped**; `harness/tests` **17 passed**; chạy chung **447 passed**. Không được giảm.

## 6. Báo lại

- Traceback thật, nguyên văn
- Giả thuyết nào đúng, và cái gì loại được cái kia
- Sửa ở đâu, vì sao chọn cách đó
- Kết quả 8 lần chạy liên tiếp sau khi sửa
