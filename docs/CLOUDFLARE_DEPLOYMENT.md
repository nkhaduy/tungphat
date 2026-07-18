# Triển khai Cloudflare

Tài liệu này là checklist vận hành production theo workflow một branch `main`.

## 1. Giá trị cố định

| Mục | Giá trị |
|---|---|
| Pages project | `tung-phat` |
| Production branch | `main` |
| Build command | `npm ci && npm run validate:cloudflare-config && npm run build` |
| Build output | `out` |
| Node | `22` |
| Canonical | `https://mdftungphat.com` |
| D1 production | `tung-phat-leads` |
| D1 preview | `tung-phat-leads-preview` |
| D1 binding | `DB` |
| OAuth Worker | `tung-phat-cms-oauth` |
| OAuth hostname | `cms-auth.mdftungphat.com` |
| OAuth callback | `https://cms-auth.mdftungphat.com/callback` |

Kiến trúc dùng static export, không dùng OpenNext: website không có SSR, ISR,
Server Actions hay route Next động tại runtime. Pages Functions chỉ phục vụ
`/api/contact` và `/api/quote`.

## 2. GitHub và workflow một branch

1. Branch làm việc và production duy nhất là `main`.
2. Trước mỗi push, chạy local: lint, typecheck, unit tests, build, link
   validation, Cloudflare config validation và `git diff --check`.
3. Commit và push trực tiếp `main`; không force-push và không rewrite history.
4. Không tạo GitHub Actions deploy khác. Pages Git integration là cơ chế deploy
   production duy nhất để tránh hai deployment cùng một commit.
5. Khi deployment lỗi, rollback bằng deployment trước hoặc `git revert` commit
   mới sau khi chạy lại quality gate.

## 3. Tạo hai D1 database

Đăng nhập đúng Cloudflare account, chạy:

```bash
npx wrangler login
npx wrangler d1 create tung-phat-leads
npx wrangler d1 create tung-phat-leads-preview
```

Mỗi lệnh in một `database_id`. Copy UUID của production vào
`wrangler.jsonc > d1_databases[0].database_id`; copy UUID preview vào
`wrangler.jsonc > env.preview.d1_databases[0].database_id`. Hai UUID phải khác
nhau và không còn giá trị toàn số `0` hoặc toàn số `1`.

Sau đó chạy:

```bash
npm run cf:typegen
npm run d1:migrate:local
npm run d1:migrate:preview
```

Chỉ sau khi backup/preview đã đạt mới chạy:

```bash
npm run d1:migrate:remote
```

Kiểm tra thành công:

```bash
npx wrangler d1 execute tung-phat-leads-preview --remote --command \
  "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name"
```

Kết quả phải có `leads`, `lead_status_history` và `rate_limits`.

## 4. Tạo Pages project bằng Git integration

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Chọn GitHub repository `nkhaduy/tungphat`.
3. Đặt project name `tung-phat`; production branch `main`.
4. Framework preset: **Next.js (Static HTML Export)** nếu có; nếu không, chọn
   **None** rồi nhập build command `npm ci && npm run validate:cloudflare-config && npm run build`, output `out`.
5. Thêm build variable `NODE_VERSION=22`.
6. Preview deployments: bật cho pull request/non-production branches.
7. `wrangler.jsonc` là source of truth cho D1 binding khi file có
   `pages_build_output_dir`. Không tạo binding Dashboard khác với file. Sau
   deployment đầu tiên, xác minh binding `DB` hiển thị production →
   `tung-phat-leads`, preview → `tung-phat-leads-preview`. Với Pages project đã
   tồn tại, tải config Dashboard vào file tạm bằng `wrangler pages download
   config`, đối chiếu rồi mới thay config đang review; không overwrite trực tiếp.

Không chạy `wrangler pages deploy`: project dùng Git integration và deploy từ
commit được review. Build command bắt buộc chạy preflight trước `npm run build`,
vì preview Git integration cũng đọc `wrangler.jsonc`; với UUID sentinel, build
Pages dừng trước upload thay vì deploy binding giả.

## 5. Turnstile và runtime secrets

Trước mọi Pages deployment, chạy `npm run validate:cloudflare-config`. Lệnh này cố ý fail khi
`wrangler.jsonc` còn D1 UUID sentinel, hai environment dùng chung database, binding khác `DB`,
hoặc checklist thiếu `TURNSTILE_SECRET_KEY` hay `IP_HASH_SALT`. `npm run build` vẫn độc lập với
Cloudflare credential; chỉ deployment mới cần D1 UUID thật trong `wrangler.jsonc`.

Dashboard → **Turnstile → Add widget**:

- Name: `tung-phat-production`
- Hostname: `mdftungphat.com`
- Widget mode: Managed

Tạo widget khác cho preview và chỉ allowlist hostname preview thật. Trong Pages
→ **Settings → Variables and Secrets**, nhập riêng từng environment:

| Tên | Production | Preview | Loại |
|---|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | site key production | site key preview | Plain text |
| `TURNSTILE_SECRET_KEY` | secret production | secret preview | Secret |
| `IP_HASH_SALT` | chuỗi ngẫu nhiên ≥32 ký tự | chuỗi khác production | Secret |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-...` nếu dùng | để trống nếu không cần | Plain text |
| `NEXT_PUBLIC_PROCESS_VIDEO_URL` | local path hoặc `https://media.mdftungphat.com/...` | tương tự | Plain text |
| `NEXT_PUBLIC_TRUSTINDEX_WIDGET_ID` | chỉ khi widget thật đã xác minh | để trống | Plain text |
| `NEXT_PUBLIC_REVIEWS_PROVIDER` | nhà cung cấp thật nếu dùng | để trống | Plain text |

Tạo salt cục bộ rồi chỉ copy phần output vào ô Secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Testing key chỉ được code chấp nhận trên `localhost`, `127.0.0.1` hoặc `::1`.
Preview và Production phải dùng widget/site key/secret thật của đúng hostname.

## 6. GitHub OAuth cho Decap CMS

Access không thay OAuth. Access quyết định ai mở được `/admin`; OAuth GitHub cấp
quyền để Decap đọc/ghi repository.

1. GitHub → avatar → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Nhập:
   - Application name: `Tung Phat Decap CMS`
   - Homepage URL: `https://mdftungphat.com/admin/`
   - Authorization callback URL:
     `https://cms-auth.mdftungphat.com/callback`
3. Copy **Client ID**. Generate **Client secret** và lưu trong password manager.
4. Xác nhận `public/admin/config.yml` dùng đúng repo, branch `main`, `base_url`
   và `site_domain`.
5. Đặt secrets cho Worker:

```bash
npx wrangler secret put GITHUB_OAUTH_ID --config workers/cms-oauth/wrangler.jsonc
npx wrangler secret put GITHUB_OAUTH_SECRET --config workers/cms-oauth/wrangler.jsonc
npx wrangler secret put OAUTH_STATE_SECRET --config workers/cms-oauth/wrangler.jsonc
```

Ở lệnh thứ ba, nhập một giá trị ngẫu nhiên ≥32 bytes, không nhập chuỗi ví dụ.
Sau khi được phê duyệt triển khai:

```bash
npm run cms:dry-run
npm run cms:deploy
```

Worker custom domain tạo record `cms-auth.mdftungphat.com`; không đặt hostname
này sau policy Access của `/admin`. Kiểm tra:

```bash
curl -i https://cms-auth.mdftungphat.com/health
```

Phải trả `200` và `{"ok":true}`. `/auth` thiếu `site_id` phải trả `403`.

Người đăng bài phải là GitHub collaborator có quyền ghi repository. Để thu hồi:
GitHub repository → **Settings → Collaborators** → Remove access; đồng thời xóa
email khỏi Access policy và revoke grant ở GitHub user settings nếu cần.

## 7. Bảo vệ `/admin` bằng Cloudflare Access

Zero Trust → **Access → Applications → Add an application → Self-hosted**:

- Name: `Tung Phat CMS`
- Domain: `mdftungphat.com`
- Path: `/admin/*`
- Session duration: `8 hours`

Tạo policy **Allow** chỉ chứa email hoặc group quản trị cụ thể; không dùng
`Everyone`. Có thể dùng One-time PIN hoặc GitHub làm identity provider của
Access. Đây là lớp cổng vào CMS, độc lập với GitHub OAuth bên trong Decap.

Không thêm `cms-auth.mdftungphat.com/callback` vào application này. Kiểm tra ở
cửa sổ ẩn danh:

1. `/admin/` yêu cầu Access.
2. Email ngoài allowlist bị từ chối.
3. Email trong allowlist vào được trang Decap nhưng vẫn phải đăng nhập GitHub.
4. GitHub account không có quyền repository không thể publish.

## 8. Domain, HTTPS và redirect

Chỉ làm sau khi preview đạt; ghi lại DNS Vercel hiện tại trước khi thay đổi.

1. Pages project → **Custom domains** → thêm `mdftungphat.com` và
   `www.mdftungphat.com`; chờ cả hai ở trạng thái **Active**.
2. SSL/TLS → Edge Certificates → bật **Always Use HTTPS**.
3. Rules → Redirect Rules → Single Redirect:
   - Name: `www-to-apex`
   - When: hostname equals `www.mdftungphat.com`
   - Target URL: dynamic
     `concat("https://mdftungphat.com", http.request.uri.path)`
   - Status: `308`
   - Preserve query string: bật
4. Không tạo rule ngược apex → www.

Kiểm tra:

```bash
curl -IL http://mdftungphat.com/
curl -IL https://www.mdftungphat.com/du-an?src=test
curl -s https://mdftungphat.com/robots.txt
curl -s https://mdftungphat.com/sitemap.xml
```

Mọi URL public cuối cùng phải về `https://mdftungphat.com`, không loop, giữ path
và query. Sitemap/canonical không được chứa Pages, Workers hoặc Vercel hostname.

## 9. Checklist trước khi cho production nhận traffic

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links
npm run d1:migrate:local
npm run test:e2e
npm run cf:typegen
git diff --check
```

Sau deploy preview, kiểm thủ công homepage, menu mobile, slideshow tự chuyển,
trang sản phẩm/bài viết/dự án, 404, `/admin`, hai form, canonical, JSON-LD,
robots, sitemap và manifest. Không cutover DNS nếu còn một mục lỗi.

Nguồn giới hạn cần kiểm lại định kỳ:

- <https://developers.cloudflare.com/pages/platform/limits/>
- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/d1/platform/limits/>
- <https://www.cloudflare.com/plans/zero-trust-services/>
