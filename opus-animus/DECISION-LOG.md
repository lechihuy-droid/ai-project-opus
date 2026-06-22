# DECISION-LOG — Opus Animus

> Strategic & architectural decisions. Owned by Opus Logos (§7.2). Append-only; mỗi quyết định không sống chỉ trong chat (§7.3).

---

## DL-2026-06-21-01 — Proactive store về tree của Rector (deviation khỏi v4 §7.2)

**Bối cảnh:** v4 §7.2 đặt "Proactive items + state" tại `opus-nexus/proactive/` nhưng "owned by Rector" → tách **writer (Rector)** khỏi **vị trí file (Nexus)**.

**Quyết định:** Lưu proactive item-set + state tại **`opus-rector/proactive/YYYY-MM-DD.json`**. Rector là **single writer**. Nexus render brief đọc qua API `get_proactive_set(date)`, **không** đọc file trực tiếp.

**Lý do:** Khớp luật mạnh nhất của repo — *"một writer sở hữu store của nó"* (y như "chỉ Module C được ghi `personal-wiki/`"). Tránh nhầm ownership khi browse `opus-nexus/`. Boundary trở thành **interface contract**, không phải shared folder.

**Đã cân nhắc:** (A) Giữ v4 `opus-nexus/proactive/` — nhầm owner. (C) `opus-animus/proactive/` root như TODO.md/DECISION-LOG.md — hợp lý nhưng proactive thiên về internal state hơn shared doc.

**Ảnh hưởng:** `SD-opus-rector.md`, `SD-proactive-brief.md`, `RD-proactive-mvp.md`, scaffold `opus-rector/`. Plan doc v4 **không sửa** (là plan đã duyệt; deviation ghi tại đây).

**Owner:** Logos (decision) · **Approved by:** Lê Chí Huy (2026-06-21)
