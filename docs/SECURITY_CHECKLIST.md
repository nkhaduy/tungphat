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
- [x] R2 credential không có trong frontend; Pages Functions chỉ dùng binding `context.env.MEDIA`.
- [x] Media API yêu cầu Access headers, optional email allowlist, Origin/Host và CSRF cho mutation.
- [x] Upload allowlist MIME + magic bytes + giới hạn size + server-generated key + no-overwrite; SVG/HTML/JS/archive/executable bị chặn.
- [x] Delete không dùng GET/wildcard và soft-delete sang exact `trash/` key trước khi xóa nguồn.
- [x] Local media bypass chỉ hoạt động trên localhost và không có trong Wrangler public config.

## Dashboard bắt buộc trước production

- [ ] Tạo/rotate Turnstile keys; hostname allowlist chỉ apex/preview cần thiết.
- [ ] Tạo OAuth App đúng callback; secrets qua `wrangler secret put`.
- [ ] Access allowlist email cho `/admin` và `/auth`; callback Bypass có chủ đích.
- [ ] Chỉ cấp GitHub collaborator quyền cần thiết; bật 2FA/branch protection/review.
- [ ] Thay D1 UUID placeholder; migrate và kiểm tra backup restore.
- [ ] Bật Cloudflare security notification, usage alert và audit log nếu account hỗ trợ.
- [ ] Kiểm tra CSP sau khi quyết định dùng/bỏ Trustindex/GA; không mở rộng wildcard tùy tiện.
- [ ] Xác minh NAP, giờ mở cửa, email và claim thương hiệu trước publish.
- [ ] Bảo vệ `/api/admin/media*` trên mọi hostname production/preview bằng Cloudflare Access.
- [ ] Bật Public Development URL chỉ cho bucket preview và đặt đúng `NEXT_PUBLIC_MEDIA_BASE_URL` Preview.
- [ ] Cấu hình `MEDIA_ADMIN_EMAILS`, test user được phép/bị chặn và test CSRF từ browser.
- [ ] Đặt R2 usage/billing alert, retention `trash/`, lịch backup và restore drill.
- [ ] Trước production, kết nối `media.mdftungphat.com`, kiểm cache/CORS, không dùng `r2.dev` làm endpoint production.

## Residual risk

- Next 15.5.20 còn kéo PostCSS có advisory moderate ở build toolchain; production chỉ phục vụ static output. Theo dõi và nâng phiên bản khi upstream phát hành bản vá tương thích.
- Rate limit D1 đủ cho quy mô nhỏ, không thay WAF/rate-limit rule account-level khi bị tấn công phân tán.
- Access callback bypass phụ thuộc state HMAC/cookie của Worker; không bỏ các kiểm tra đó.
- CMS preview tải Decap từ CDN; pin phiên bản và kiểm CSP/SRI khi thay đổi chính sách dependency.
- Nội dung/thông số do con người nhập vẫn cần review; validation không xác minh tính đúng của tuyên bố thương mại.
- Code kiểm tra Access headers là defense-in-depth; Cloudflare Access policy vẫn là enforcement bắt buộc ở edge. Nếu hostname nào không nằm sau Access, không được coi route admin là an toàn.
- Custom `r2-media` chưa thay toàn bộ Markdown media library của Decap; đội biên tập không dùng uploader mặc định trong Markdown.
