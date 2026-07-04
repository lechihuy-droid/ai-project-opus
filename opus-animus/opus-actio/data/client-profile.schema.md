# client-profile.json — Schema (hồ sơ thân chủ)

Hồ sơ nền mà actio (chuyên gia) đọc TRƯỚC mọi phân tích, để không phải hỏi lại mỗi phiên. File thật: `data/_local/client-profile.json` (gitignored). Template: `data/client-profile.example.json` (tracked, placeholder).

**Privacy:** số/chi tiết nhạy cảm (lương chính xác, tuổi, gia đình) chỉ giữ ở `_local`. Khi actio ghi vào artifact/repo → quy thành range theo `FINANCE_DATA_STORAGE_POLICY.md`.

## profile
| Field | Type | Note |
|---|---|---|
| `age` | int | Tuổi |
| `nationality` | string | `"VN"` |
| `residence_country` | string | `"JP"` |
| `residence_status` | string | Loại visa: `"engineer/specialist"`, `"PR"` (永住), `"spouse"`, `"HSP"`… — chi phối rủi ro việc làm |
| `years_in_japan` | int | Số năm đã ở Nhật |
| `japan_horizon` | enum | `"long_term"` \| `"return_to_vn_possible"` \| `"undecided"` — **biến số gốc** chi phối FX, mua nhà, iDeCo |
| `family_status` | enum | `"single"` \| `"married"` \| `"married_kids"` |
| `dependents` | int | Số người phụ thuộc |
| `vn_obligations` | string | Nghĩa vụ tài chính ở VN (gửi tiền gia đình…), dạng range/mô tả |

## employment
| Field | Type | Note |
|---|---|---|
| `job_stability` | enum | `"low"` \| `"medium"` \| `"high"` — quyết định size quỹ khẩn cấp |
| `income_structure` | enum | `"monthly_only"` \| `"monthly_plus_bonus"` |
| `employer_sector` | string | Ngành (để hiểu chu kỳ thu nhập) |

## cashflow_jpy (exact ở _local; range ở artifact)
| Field | Type | Note |
|---|---|---|
| `monthly_net_income` | int | Lương ròng sau thuế/社会保険 |
| `annual_bonus_net` | int | Thưởng năm sau thuế |
| `side_income_monthly` | int | Thu nhập phụ TB/tháng |
| `monthly_expense` | int | Chi tiêu/tháng (có thể để null → suy từ card_txn) |

## risk
| Field | Type | Note |
|---|---|---|
| `risk_tolerance` | enum | `"conservative"` \| `"moderate"` \| `"aggressive"` |
| `max_drawdown_comfort_pct` | int | Mức sụt tối đa chịu được (vd `20` = chịu −20%) |
| `investment_experience` | enum | `"beginner"` \| `"intermediate"` \| `"advanced"` |

## protection
| Field | Type | Note |
|---|---|---|
| `life_insurance` | string | `"none"` \| `"employer"` \| `"private"` + mức bảo hiểm (range) |
| `medical_insurance` | string | `"shakai"` (社会保険) \| `"kokumin"` (国民健康保険) |
| `disability_income` | string | Có bảo hiểm thu nhập khi mất sức? |
| `pension_enrolled` | string | `"kosei"` (厚生年金) \| `"kokumin"` (国民年金) |

## cross_border
| Field | Type | Note |
|---|---|---|
| `currency_exposure_target` | object/null | Tỷ lệ JPY/USD/VND mong muốn, hoặc null nếu chưa định |
| `repatriation_plan` | enum | `"none"` \| `"partial"` \| `"full_eventual"` |

## Cập nhật
- Đầu mỗi phiên review lớn, actio đọc file này. Khi đời sống đổi (kết hôn, đổi visa, có con, đổi việc) → cập nhật ngay.
- Goals KHÔNG ở đây — để riêng `goals.json` (sẽ thành multi-goal).
