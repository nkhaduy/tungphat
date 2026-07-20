# Security review — CMS Analytics

| Mức độ | Đang mở | Đã khắc phục |
|---|---:|---:|
| Critical | 0 | 0 |
| High | 0 | 0 |
| Medium | 0 | 2 |
| Low | 0 | 0 |
| Info | 0 | 0 |

Phạm vi: toàn repository TypeScript/JavaScript, Next.js, Cloudflare Pages
Functions, D1 queries, OAuth/session, dashboard DOM rendering, environment/CI
files và hai dependency trees. Review ngày 2026-07-20.

## Dependency audit

`npm audit` ban đầu phát hiện PostCSS `<8.5.10` bên trong Next.js, advisory
GHSA-qx2v-qp2m-jg93 (Moderate). `package.json` đã override PostCSS toàn cây bằng
direct version 8.5.20. Sau sửa:

```text
website dependency audit: 0 vulnerabilities
CMS dependency audit: 0 vulnerabilities
```

## Secrets và dữ liệu

Không phát hiện credential thật, private key, token hoặc connection string
được commit. File `.env`, `.dev.vars`, private key và backup đã Git-ignore.
Google private key chỉ đọc từ environment, không log/trả qua API.

Collector không lưu raw IP, full User-Agent, Cookie/Authorization, query tùy ý
hoặc form values. Rate-limit key là SHA-256 có salt và TTL.

## Auth, CSRF và access control

Smoke test ban đầu phát hiện Pages tối ưu static asset trước root middleware,
khiến shell `/analytics/` trả 200 chưa auth (API dữ liệu vẫn trả 401). Đã chuyển
middleware vào namespace `/analytics` và thêm `_routes.json` để bắt buộc static
dashboard đi qua Worker. Kiểm tra lại: chưa session trả 302, session hợp lệ trả
200. Confidence: High; mức độ trước sửa: Medium.

- OAuth state ký HMAC, ngắn hạn, cookie HttpOnly/Secure/SameSite=Lax.
- Session admin ký HMAC, có `iat`/`exp`, so sánh constant-time và 12 giờ.
- Middleware bảo vệ static `/analytics`; từng API kiểm tra session lại.
- Admin POST kiểm tra Origin exact allowlist.
- Journey ID yêu cầu UUID, endpoint luôn cần admin; không có public raw export.

## Injection/XSS/SSRF

Mọi D1 input dùng `.bind`; dimension/order expression là constant server-side.
Date range, pagination, enum và route ID bị giới hạn. Dashboard escape toàn bộ
giá trị API trước khi dùng `innerHTML`. Google fetch chỉ đến endpoint cố định,
property/site được URL-encode. Không có command execution hoặc user-controlled
file path trong analytics.

## Runtime verification

Local collector trả 204, duplicate cùng event ID chỉ tạo một row, payload >8 KiB
trả 413, admin không session trả 401. Đây là static + local dynamic review;
Cloudflare/Vercel production logs và WAF metrics vẫn cần được theo dõi sau deploy.
