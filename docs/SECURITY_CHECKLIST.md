# Security checklist

## Đã triển khai trong code

- [x] Không có secret thật trong source; `.env`, `.dev.vars`, backup và Wrangler
  state bị ignore.
- [x] CSP, HSTS, nosniff, referrer/permissions policy và frame restriction.
- [x] Form dùng exact-origin CORS allowlist, body limit, Zod, honeypot,
  Turnstile, salted IP hash, rate limit, idempotency và prepared statement.
- [x] Không lưu IP thô; log không chứa phone, email hoặc message.
- [x] OAuth secret chỉ ở Pages secret store; state HMAC ngắn hạn, HttpOnly
  cookie, callback same-domain cố định, scope GitHub tối thiểu cho repository
  public và email allowlist server-side.
- [x] `/admin`, API, draft và preview noindex; dữ liệu lead không vào static HTML.
- [x] CMS ảnh trong Git có giới hạn file, validator và workflow tối ưu.
- [x] CI chặn lint/type/test/build/content/image/link và high/critical audit.
- [x] Không có workflow deploy production thứ hai hoặc force-push. Workflow tối
  ưu ảnh chỉ auto-commit vào `main` sau khi toàn bộ quality gate pass.

## Dashboard production

- [x] Turnstile production/preview đúng hostname; không dùng test mode public.
- [x] `IP_HASH_SALT` riêng từng environment, tối thiểu 32 ký tự.
- [x] GitHub OAuth App callback `https://cms.mdftungphat.com/callback`; secret
  nằm trong Pages secret store.
- [x] GitHub collaborator quyền tối thiểu, 2FA; không cho force-push/xóa `main`.
- [x] Hai D1 UUID khác nhau; migrate preview trước production.
- [x] Custom domain CMS và SSL active mà không đổi nameserver.
- [ ] Kiểm tra định kỳ OAuth email allowlist và quyền repository.
- [ ] Kiểm CSP khi bật GA hoặc dịch vụ bên thứ ba; không thêm wildcard tùy tiện.
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
