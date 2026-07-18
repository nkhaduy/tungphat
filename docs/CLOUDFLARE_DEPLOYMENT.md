# Triển khai hybrid Vercel và Cloudflare

## Giá trị production

| Mục | Giá trị |
|---|---|
| Website host | Vercel project `tungphat` |
| Website domains | `mdftungphat.com`, `www.mdftungphat.com` |
| Production branch | `main` |
| CMS Pages project | `tungphat-cms` |
| CMS URL | `https://cms.mdftungphat.com` |
| Pages fallback | `https://tungphat-cms.pages.dev` |
| OAuth callback | `https://cms.mdftungphat.com/callback` |
| D1 production | `tung-phat-leads` |
| D1 preview | `tung-phat-leads-preview` |
| D1 binding | `DB` |
| Canonical | `https://mdftungphat.com` |

Website tiếp tục dùng Next.js static export trên Vercel. Cloudflare Pages chỉ
phục vụ CMS và Functions; không deploy website public từ Pages project này.

## Workflow Git

1. Làm việc trực tiếp trên `main`.
2. Chạy quality gate website và CMS.
3. Commit, push `main`; không force-push hoặc rewrite history.
4. Vercel Git Integration tự deploy website.
5. Decap `publish_mode: simple` cũng commit trực tiếp vào `main`.
6. Không tạo GitHub Actions hoặc Cloudflare integration thứ hai để deploy
   website public.

## D1

Migrations nằm tại `cloudflare-cms/migrations`. Luôn chạy preview trước:

```bash
npm run d1:migrate:preview
```

Nếu production đã có dữ liệu, backup trước:

```bash
npm run d1:backup
```

Sau khi preview pass:

```bash
npm run d1:migrate:remote
```

Hai database phải khác UUID. Không xóa database production hoặc dùng D1 cho
content.

## Cloudflare Pages CMS

Quality gate:

```bash
npm --prefix cloudflare-cms ci
npm --prefix cloudflare-cms run lint
npm --prefix cloudflare-cms run typecheck
npm --prefix cloudflare-cms test
npm --prefix cloudflare-cms run build
npm --prefix cloudflare-cms run validate:cloudflare-config
npm --prefix cloudflare-cms run cms:dry-run
```

Deploy preview:

```bash
npm --prefix cloudflare-cms run deploy:preview
```

Deploy production:

```bash
npm --prefix cloudflare-cms run deploy:production
```

Production và preview phải có binding `DB` riêng. Secret store cần các tên:

```text
GITHUB_OAUTH_ID
GITHUB_OAUTH_SECRET
OAUTH_STATE_SECRET
TURNSTILE_SECRET_KEY
IP_HASH_SALT
```

Không đặt giá trị secret trong Git, log hoặc báo cáo.

## GitHub OAuth

OAuth App:

```text
Homepage:
https://cms.mdftungphat.com/

Authorization callback URL:
https://cms.mdftungphat.com/callback
```

Decap backend:

```yaml
backend:
  name: github
  repo: nkhaduy/tungphat
  branch: main
  base_url: https://cms.mdftungphat.com
  auth_endpoint: auth
publish_mode: simple
```

Người publish phải có quyền ghi repository và email đã verify trong allowlist
server-side. `/health` chỉ trả trạng thái service, không tiết lộ cấu hình.

## Turnstile và form API

Production widget chỉ allowlist:

```text
mdftungphat.com
www.mdftungphat.com
```

Vercel production có đúng hai biến frontend:

```text
NEXT_PUBLIC_FORMS_API_BASE=https://cms.mdftungphat.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<production site key>
```

API:

```text
POST https://cms.mdftungphat.com/api/contact
POST https://cms.mdftungphat.com/api/quote
```

CORS production chỉ cho apex và `www`; không wildcard và không credentials.

## DNS TenTen

Không thay nameserver. Record CMS:

```text
Type: CNAME
Name: cms
Value: tungphat-cms.pages.dev
Priority: 0
```

Không sửa record apex hoặc `www`. Chỉ tiếp tục OAuth/Vercel production sau khi
Pages custom domain và SSL đều `active`.

## Quality gate website

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links
npm run test:e2e
git diff --check
```

Sau deploy, kiểm tra homepage, mobile menu, hero slideshow, sản phẩm, bài viết,
dự án, form, `/admin` redirect, canonical, JSON-LD, robots và sitemap.
