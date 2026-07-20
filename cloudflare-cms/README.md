# Tùng Phát Cloudflare CMS

Project độc lập cho Decap CMS, GitHub OAuth same-domain, API lead và media video
trên Cloudflare Pages. Website công khai vẫn chạy trên Vercel; content và ảnh
CMS commit trực tiếp vào `nkhaduy/tungphat` branch `main`, còn video lớn nằm
trong R2 private.

## Runtime

- Production: `https://cms.mdftungphat.com`
- Fallback: `https://tungphat-cms.pages.dev`
- Preview branch alias: `https://preview.tungphat-cms.pages.dev`
- API: `POST /api/contact`, `POST /api/quote`
- OAuth: `GET /auth`, `GET /callback`
- Health: `GET /health`
- Media: `GET|HEAD /media/videos/*`

## Bindings và secrets

D1 binding là `DB`. Production dùng `tung-phat-leads`; preview dùng
`tung-phat-leads-preview`. Không dùng D1 cho content.

R2 binding là `MEDIA`. Production dùng `tung-phat-media`; preview dùng
`tung-phat-media-preview`. Bucket giữ private; route media chỉ cho phép key dưới
`videos/`.

Các secret bắt buộc, chỉ đặt trong Cloudflare secret store:

- `TURNSTILE_SECRET_KEY`
- `IP_HASH_SALT`
- `GITHUB_OAUTH_ID`
- `GITHUB_OAUTH_SECRET`
- `OAUTH_STATE_SECRET`

Production và preview phải dùng Turnstile secret/salt khác nhau. `OAUTH_ALLOWED_EMAIL` là server-side Pages variable và đang giới hạn `nkhaduy@gmail.com`.

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

1. `npm run d1:migrate:preview`
2. `npm run deploy:preview`
3. Test OAuth/API ở preview alias.
4. Export backup production nếu database có dữ liệu.
5. `npm run d1:migrate:production`
6. `npm run deploy:production`
7. Add Pages custom domain `cms.mdftungphat.com`, sau đó tạo đúng một CNAME tại TenTen trỏ tới target do Pages trả về.

Không đổi nameserver, apex hoặc record `www` trong quy trình này.
