# Vendored components — attribution

Một số file trong `.claude/` được **mượn (vendored) từ dự án ECC** và (một số) adapt lại cho workspace này. File này giữ lại license notice theo yêu cầu của giấy phép MIT.

## Nguồn
- Dự án: **ECC** (`ecc-universal`) — https://github.com/affaan-m/ECC
- License: **MIT** — Copyright (c) 2026 Affaan Mustafa
- Lấy về: shallow clone (`--depth 1`), 2026-06-19

## File vendored nguyên gốc (chỉ copy, không sửa)
- `.claude/agents/architect.md`
- `.claude/agents/code-explorer.md`
- `.claude/agents/code-reviewer.md`

## File mượn rồi adapt (sửa cho khớp `CLAUDE.md`)
- `.claude/commands/model-route.md` — routing đổi theo 3 tuyến Opus/Sonnet/Codex
- `.claude/skills/agentic-engineering/SKILL.md` — đoạn Model Routing chỉnh theo `CLAUDE.md`

> `.claude/skills/dependency-vetting/SKILL.md` là nội dung tự viết, không thuộc ECC.

## MIT License notice (giữ nguyên theo điều khoản)

```
MIT License

Copyright (c) 2026 Affaan Mustafa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
