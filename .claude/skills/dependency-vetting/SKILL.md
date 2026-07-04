---
name: dependency-vetting
description: Checklist để vet an toàn third-party repo, npm package, hoặc pip package TRƯỚC khi cài. Tự trigger khi user sắp chạy npm install, pip install, clone repo lạ, hoặc đánh giá dependency mới — đặc biệt khi có rủi ro malware, supply-chain attack, postinstall scripts, hoặc typosquatting.
---

# Dependency Vetting — Pre-Install Checklist

## Khi nào dùng

Sắp `npm install`, `pip install`, `git clone` + run, hoặc thêm bất kỳ dependency/repo lạ vào project.

## 1. Pre-Install Checklist

**Clone để đọc, không để chạy ngay.**

```bash
# Clone vào thư mục riêng biệt, chưa cd vào
git clone <repo> /tmp/review-sandbox && ls /tmp/review-sandbox
```

Kiểm tra trước khi install:

- [ ] `package.json` → soi mục `scripts`: `preinstall`, `install`, `postinstall` có code lạ không?
- [ ] File binary / minified / obfuscated không giải thích được — flag ngay.
- [ ] Hooks tự chạy: `.husky/`, `.githooks/`, Claude hooks (`session-start`, `PostToolUse`) — đọc từng file.
- [ ] `setup.py` / `pyproject.toml` → `[build-system]` có gọi shell script không?

**Cài an toàn hơn:**

```bash
# npm — bỏ qua lifecycle scripts
npm install --ignore-scripts

# pip — ưu tiên wheel (không build), tránh chạy setup.py tùy tiện
pip install --only-binary=:all: <package>
# Nếu bắt buộc build từ source, cân nhắc:
pip install --no-build-isolation <package>
```

## 2. Supply-Chain Scan

Mỗi tool bắt **thứ khác nhau** — không thay thế nhau:

| Tool | Bắt gì |
|---|---|
| `npm audit` / `pip-audit` | CVE đã được đăng ký (NVD/OSV) — **không** bắt package độc mới |
| [OSV-Scanner](https://github.com/google/osv-scanner) | Vulnerability DB rộng hơn, đa ecosystem |
| [Socket.dev](https://socket.dev) | Hành vi đáng ngờ: network call, shell exec, obfuscation — bắt **malicious package mới** |
| [Snyk](https://snyk.io) | CVE + license + một phần behavior |

**Kết luận:** `npm audit` clean ≠ package an toàn. Socket.dev / OSV-Scanner là lớp khác không thể bỏ.

## 3. Isolation

Chạy code lạ PHẢI trong môi trường cách ly:

- Container Docker không mount secret, không có credentials.
- VM / sandbox không có egress mạng (block outbound).
- Không chạy với `sudo` / admin privileges.
- Không cài vào máy dev chính trước khi review xong.

## 4. Source Authenticity

- Xác nhận đúng repo chính chủ (owner/org, không phải fork hay mirror lậu).
- Kiểm tra typosquat: `requests` ≠ `request`, `lodash` ≠ `loadash`.
- Dùng lockfile (`package-lock.json`, `poetry.lock`) + integrity hash (`sha512`).
- Với npm: `npm pack <package>` → inspect tarball trước khi install thật.

## 5. Giới hạn của Agent LLM Review

`/security-review` hay bất kỳ agent LLM nào **KHÔNG thay thế** các bước trên vì:

- Agent không chặn được code chạy lúc `npm install` (postinstall scripts thực thi trước khi review xong).
- Agent không đáng tin với code bị obfuscate/minify nặng — dễ bỏ sót payload ẩn.
- Agent chỉ đọc source tĩnh, không thấy network call / filesystem write lúc runtime.

**Agent LLM chỉ là lớp bổ trợ** cho code của chính mình — không phải lớp bảo vệ chính với dependency bên ngoài.
