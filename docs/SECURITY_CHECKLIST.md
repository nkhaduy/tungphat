# Security checklist

## Đã triển khai

- [x] Không có token/secret thật trong source; `.env`, `.dev.vars`, backup và Wrangler state bị ignore.
- [x] Header CSP, nosniff, referrer policy, permissions policy, frame restriction và HSTS trên Cloudflare.
- [x] API allowlist field + Zod + parameterized D1 query + generic production error.
- [x] Same-origin POST, body limit, honeypot, Turnstile server verify, expected action/hostname.
- [x] Rate limit bằng IP hash; không log PII; idempotency chống double submit.
- [x] Consent bắt buộc; privacy page và retention 24 tháng.
- [x] OAuth secret chỉ ở Worker secret; HMAC state, HttpOnly cookie, callback allowlist, minimum GitHub scope.
- [x] `/admin`, API, draft và preview noindex; lead không nằm trong static HTML.
- [x] Image extension/size/name/dimension validation; upload binary tắt.
- [x] Dependency audit chặn high/critical trong CI.
- [x] Script deploy không còn auto-commit/force-push.

## Dashboard bắt buộc trước production

- [ ] Tạo/rotate Turnstile keys; hostname allowlist chỉ apex/preview cần thiết.
- [ ] Tạo OAuth App đúng callback; secrets qua `wrangler secret put`.
- [ ] Access allowlist email cho `/admin` và `/auth`; callback Bypass có chủ đích.
- [ ] Chỉ cấp GitHub collaborator quyền cần thiết; bật 2FA/branch protection/review.
- [ ] Thay D1 UUID placeholder; migrate và kiểm tra backup restore.
- [ ] Bật Cloudflare security notification, usage alert và audit log nếu account hỗ trợ.
- [ ] Kiểm tra CSP sau khi quyết định dùng/bỏ Trustindex/GA; không mở rộng wildcard tùy tiện.
- [ ] Xác minh NAP, giờ mở cửa, email và claim thương hiệu trước publish.

## Residual risk

- Next 15.5.20 còn kéo PostCSS có advisory moderate ở build toolchain; production chỉ phục vụ static output. Theo dõi và nâng phiên bản khi upstream phát hành bản vá tương thích.
- Rate limit D1 đủ cho quy mô nhỏ, không thay WAF/rate-limit rule account-level khi bị tấn công phân tán.
- Access callback bypass phụ thuộc state HMAC/cookie của Worker; không bỏ các kiểm tra đó.
- CMS preview tải Decap từ CDN; pin phiên bản và kiểm CSP/SRI khi thay đổi chính sách dependency.
- Nội dung/thông số do con người nhập vẫn cần review; validation không xác minh tính đúng của tuyên bố thương mại.
