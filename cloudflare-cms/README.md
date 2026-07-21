# Tùng Phát Cloudflare CMS

Ứng dụng quản trị thống nhất cho Decap CMS và Analytics trên Cloudflare Pages.
Website công khai tiếp tục chạy trên Vercel. Content và ảnh CMS được commit vào
repository cố định `nkhaduy/tungphat`, branch `main`, qua GitHub App phía server;
trình duyệt không nhận GitHub credential. Video lớn hiện có tiếp tục nằm trong R2
private.

## Runtime

- Production: `https://cms.mdftungphat.com`
- Fallback: `https://tungphat-cms.pages.dev`
- Preview: `https://preview.tungphat-cms.pages.dev`
- Session auth: `/api/auth/*`
- Decap Git gateway: `/git-gateway/github/*`
- Analytics admin API: `/api/admin/analytics/*`
- Lead API: `POST /api/contact`, `POST /api/quote`
- Health: `GET /health`
- R2 media: `GET|HEAD /media/videos/*`

## Bindings và secrets

D1 binding `DB` dùng `tung-phat-leads` ở production và
`tung-phat-leads-preview` ở preview. Ngoài lead/analytics, D1 lưu session hash,
CSRF hash và rate-limit key đã HMAC; không lưu raw IP hoặc password.

R2 binding `MEDIA` dùng `tung-phat-media` ở production và
`tung-phat-media-preview` ở preview. Bucket giữ private; route media chỉ cho phép
key dưới `videos/`.

Các secret bắt buộc, chỉ đặt trong Cloudflare encrypted secret store:

- `TURNSTILE_SECRET_KEY`
- `IP_HASH_SALT`
- `ANALYTICS_HASH_SALT`
- `CMS_ADMIN_USERNAME`
- `CMS_ADMIN_PASSWORD_HASH`
- `CMS_SESSION_SECRET`
- `GITHUB_APP_ID`
- `GITHUB_INSTALLATION_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GA4_PROPERTY_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `SEARCH_CONSOLE_SITE_URL`

`GITHUB_FINE_GRAINED_TOKEN` chỉ là fallback nếu tài khoản không cho tạo GitHub
App; không cấu hình đồng thời khi GitHub App hoạt động.

Sau khi production E2E xác nhận gateway mới có thể publish, các secret OAuth cũ
`GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET`, `OAUTH_STATE_SECRET` có thể xóa. Không
xóa GitHub integration dùng cho CI/CD hoặc Vercel/Cloudflare deployment.

## Security model

- Password: PBKDF2-HMAC-SHA256, salt riêng, 600.000 iterations.
- Cookie: `tp_cms_session`, HttpOnly, Secure, SameSite=Strict, host-only, 12 giờ.
- Session có state thu hồi trong D1 và rotate ở mỗi lần login.
- Mutation yêu cầu Origin allowlist và CSRF token.
- Login dùng lỗi chung, payload 8 KiB, rate limit và lockout tạm thời.
- Git gateway cố định repository/branch, allowlist method/route và path.
- Admin/Analytics dùng `no-store`, `noindex`, CSP và `frame-ancestors 'none'`.

## Quality gate

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:cloudflare-config
npm run cms:dry-run
```

## Deploy order

1. Apply migration preview và deploy preview.
2. Test login, Decap read/publish/media, Analytics, tab switching và logout.
3. Apply migration production và deploy production.
4. Chạy production E2E và kiểm tra browser network không chứa credential.
5. Chỉ sau khi pass mới vô hiệu hóa/xóa GitHub OAuth cũ.
