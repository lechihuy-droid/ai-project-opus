# review-cadence.json - Schema

Cadence map ma `/actio-review` doc de tinh skill nao den han. File tracked: `data/review-cadence.example.json` (cung la file thuc dung; co the copy sang `data/_local/review-cadence.json` neu muon doi nhip rieng). Run-state thuc (`last_run` per skill): `data/_local/review-state.json` (gitignored).

## Root

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `cadence` | object | yes | Map `skill -> cadence_key`. Key skill khop ten slash-command (`/actio-<skill>`). |
| `cadence_days` | object | yes | Map `cadence_key -> so ngay`. |
| `note` | string | no | Caveat. |

## cadence

| Skill key | Default cadence |
|---|---|
| `morning` | `daily` |
| `spending` | `weekly` |
| `networth` | `monthly` |
| `goals` | `monthly` |
| `ips` | `quarterly` |
| `portfolio` | `quarterly` |
| `tax` | `annual` |
| `retire` | `annual` |

## cadence_days

| Key | Days |
|---|---:|
| `daily` | 1 |
| `weekly` | 7 |
| `monthly` | 30 |
| `quarterly` | 91 |
| `annual` | 365 |

## review-state.json (`data/_local/`, gitignored)

| Field | Type | Notes |
|---|---:|---|
| `last_run` | object | Map `skill -> "YYYY-MM-DD"` ngay chay gan nhat. Thieu key -> coi la DUE. |
| `note` | string | Caveat. |

## Analysis rules (cho `/actio-review`)

- `due = today − last_run[skill] >= cadence_days[cadence[skill]]`; thieu `last_run[skill]` -> DUE.
- Uu tien hien thi DUE theo cadence thua truoc (annual/quarterly de quen).
- Health snapshot lay tu `finance.db` snapshot moi nhat: true net worth, savings rate, top concentration flag (>20% invested_total).
- Mac dinh KHONG tu ghi `last_run`; chi cap nhat khi user xac nhan da chay skill.
- File nay va review-state KHONG chua so tai chinh; cadence_days la hang so trung tinh.
