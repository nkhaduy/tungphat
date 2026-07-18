# Security checklist

## Đã triển khai trong code

- [x] Không có secret thật trong source; `.env`, `.dev.vars`, backup và Wrangler
  state bị ignore.
- [x] CSP, HSTS, nosniff, referrer/permissions policy và frame restriction.
- [x] Form dùng same-origin POST, body limit, Zod, honeypot, Turnstile, salted IP
  hash, rate limit, idempotency và prepared statement.
- [x] Không lưu IP thô; log không chứa phone, email hoặc message.
- [x] OAuth secret chỉ ở Worker; state HMAC ngắn hạn, HttpOnly cookie, callback
  cố định, scope GitHub tối thiểu cho repository public.
- [x] `/admin`, API, draft và preview noindex; dữ liệu lead không vào static HTML.
- [x] CMS ảnh trong Git có giới hạn file, validator và workflow tối ưu.
- [x] CI chặn lint/type/test/build/content/image/link và high/critical audit.
- [x] Không có workflow tự deploy production hoặc force-push. Workflow tối ưu
  ảnh chỉ auto-commit vào branch `cms/**`; thay đổi vẫn phải được review trong PR.

## Dashboard bắt buộc trước production

- [ ] Tạo Turnstile production/preview đúng hostname; không dùng test mode public.
- [ ] Đặt `IP_HASH_SALT` riêng từng environment, tối thiểu 32 ký tự.
- [ ] Tạo GitHub OAuth App đúng callback; secrets bằng `wrangler secret put`.
- [ ] Access Allow chỉ email/group quản trị cho `/admin/*`; không chặn OAuth
  callback hostname.
- [ ] GitHub collaborator quyền tối thiểu, 2FA, branch protection và CI bắt buộc.
- [ ] Thay hai D1 UUID placeholder, migrate preview, export rồi mới production.
- [ ] Kiểm CSP khi bật GA/Trustindex; không thêm wildcard tùy tiện.
- [ ] Xác minh NAP, giờ mở cửa, email và tuyên bố thương hiệu trước publish.
- [ ] Bật Cloudflare security/usage notification phù hợp với account.
- [ ] Thử backup/restore Git và D1.

## Rủi ro còn lại

- D1 rate limit phù hợp quy mô nhỏ, không thay WAF/rate-limit edge khi bị tấn công
  phân tán.
- Decap tải script từ CDN; cần pin/review khi đổi version và CSP.
- Không có email notification: nhân sự phải kiểm tra D1 theo lịch.
- Nội dung/thông số do con người nhập vẫn cần review; schema không xác minh tuyên
  bố thương mại.
- Ảnh Git có thể làm repository lớn dần; theo dõi dung lượng trước khi cân nhắc
  R2 qua abstraction `lib/media.ts`.
