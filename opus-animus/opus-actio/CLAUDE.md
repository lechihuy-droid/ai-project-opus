# opus-actio
*Cổ phần · cổ phiếu · phần chia (Lat. actio, gen. actionis)*

Sub-project của opus-animus — workflow đầu tư cá nhân vào chứng khoán **Mỹ + Nhật**.

## Mục đích

Áp dụng bộ skill chính thức của Anthropic (`anthropics/financial-services`) cho retail investor, bổ sung custom skill cho thị trường JP mà repo gốc thiếu hỗ trợ:

| Layer | Nguồn | Vai trò |
|---|---|---|
| Core skills | `anthropics/financial-services/plugins/vertical-plugins/equity-research` | Earnings, thesis, screen, model-update, morning-note, sector, catalysts |
| Core modeling | `anthropics/financial-services/plugins/vertical-plugins/financial-analysis` | DCF, comps, 3-statement, audit-xls |
| Custom JP | `opus-actio/skills/` | EDINET fetch, NISA/iDeCo accounting, JP fiscal calendar |

## Cấu trúc

```
opus-actio/
├── CLAUDE.md            ← file này
├── USAGE.md             ← suggest cách dùng + workflow examples
├── ai/
│   └── status.md
├── skills/              ← custom skills cho JP market
│   ├── edinet-fetcher/
│   ├── jp-tax-account/
│   └── jp-fiscal-calendar/
└── docs/                ← RD/SD sau khi cài xong core
```

## Quy ước

- Skill viết theo format chuẩn Anthropic: `SKILL.md` với frontmatter `name` + `description`
- Disclaimer: skills là draft analyst work, KHÔNG phải investment advice — verify trước khi giao dịch
- Response tiếng Việt
