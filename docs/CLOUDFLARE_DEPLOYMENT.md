# Cloudflare deployment

## Kiến trúc chọn

Cloudflare Pages static export + Pages Functions + D1 + R2; OAuth là Worker riêng. Không dùng OpenNext vì project không cần SSR/ISR/Server Actions và mọi route SEO prerender được.

## Chuẩn bị

- Node 22 LTS khuyến nghị (project hỗ trợ `>=20.19 <27`), npm theo lockfile.
- Tạo Pages project `tung-phat`, liên kết repo GitHub.
- Build command: `npm ci && npm run build`; output directory: `out`.
- Production branch: `main`; preview branch: pull request.
- Tạo D1 production `tung-phat-leads` và D1 preview `tung-phat-leads-preview`; thay hai UUID placeholder khác nhau trong `wrangler.jsonc`. Preview tuyệt đối không bind database production.
- Hai bucket R2 đã dùng: production `tung-phat-media`, preview `tung-phat-media-preview`. Binding code luôn là `MEDIA`.

```bash
npx wrangler login
npx wrangler d1 create tung-phat-leads
npx wrangler d1 create tung-phat-leads-preview
npm run cf:typegen
npm run d1:migrate:preview
npm run d1:migrate:remote
npm run cf:deploy
```

## Environment và secrets

Build variables trên Pages:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public site key, bắt buộc cho form.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — tùy chọn, dạng `G-...`.
- `NEXT_PUBLIC_REVIEWS_PROVIDER`/`NEXT_PUBLIC_TRUSTINDEX_WIDGET_ID` — chỉ bật khi dữ liệu review thật đã được xác minh.

Pages secret/binding:

- `TURNSTILE_SECRET_KEY` — secret, không đặt trong build log/source.
- D1 binding `DB` → `tung-phat-leads`.
- R2 binding `MEDIA` → `tung-phat-media` ở production.
- Function variable `NEXT_PUBLIC_MEDIA_BASE_URL` → `https://media.mdftungphat.com` chỉ sau khi domain media production Active.

Preview dùng Turnstile key/secret riêng, `DB` → `tung-phat-leads-preview`, `MEDIA` → `tung-phat-media-preview`, và `NEXT_PUBLIC_MEDIA_BASE_URL` → Public Development URL preview. Không đặt `TURNSTILE_TEST_MODE` hoặc `MEDIA_LOCAL_DEV_BYPASS` trên bất kỳ deployment public nào; các flag này chỉ dành cho local/CI.

Wrangler file là source of truth cho binding Pages. Top-level R2 là production; `env.preview.r2_buckets` thay bằng bucket preview. Mỗi environment có đúng một `MEDIA`; D1 binding hiện có được giữ trong cả hai. `npm run cf:typegen` là validation bắt buộc sau mỗi lần đổi config.

OAuth Worker secrets: `GITHUB_OAUTH_ID`, `GITHUB_OAUTH_SECRET`, `OAUTH_STATE_SECRET`. Vars không bí mật nằm trong worker config. R2 chưa dùng.

## Preview và kiểm thử

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
find out -type f -size +24M -print
```

## Dashboard bắt buộc cho R2/Access

1. R2 → `tung-phat-media-preview` → Settings → bật Public Development URL; không bật URL production nếu chưa có nhu cầu.
2. Pages → Settings → Environment variables: đặt **Preview build** `NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-….r2.dev`. Cấu hình cùng variable cho Functions Preview nếu giao diện tách build/runtime.
3. Zero Trust Access: tạo self-hosted app/policy cho `/api/admin/media*` trên hostname admin/preview thực tế. Chỉ Allow email/group quản trị. Route cần chuyển tiếp `Cf-Access-Jwt-Assertion` và authenticated email header.
4. Tùy chọn Pages variable `MEDIA_ADMIN_EMAILS` làm allowlist email thứ hai, phân cách dấu phẩy.
5. Redeploy preview và test list/upload/trash. Không deploy production trong bước này.
6. Khi chuyển production sau này, kết nối `media.mdftungphat.com` trực tiếp với bucket production, chờ Active, cấu hình cache/CORS cần thiết, đổi production build/runtime variable, rồi tắt `r2.dev` production nếu từng bật. Không đổi DNS trong rollout preview hiện tại.

Deploy preview PR chỉ khi repository variable `CLOUDFLARE_DEPLOY_ENABLED=true` và các Cloudflare secret/ID đã cấu hình. Không bật production workflow trước khi preview đạt và D1 backup được xác minh.

## Domain, redirect và DNS không downtime

1. Thêm `mdftungphat.com` và `www.mdftungphat.com` vào Pages, chờ certificate Active.
2. Hạ TTL trước cửa sổ chuyển đổi; giữ Vercel deployment và cấu hình nguyên vẹn.
3. Chuyển apex sang Pages. Kiểm tra homepage/form/canonical/sitemap.
4. Tạo Cloudflare Redirect Rule 308: hostname `www.mdftungphat.com` → `https://mdftungphat.com${uri}` và giữ query string.
5. Thêm rule HTTP→HTTPS (thường là Always Use HTTPS). Xác nhận không quá một redirect và không loop.
6. Preview/production Vercel cũ không được đưa vào sitemap; canonical luôn apex. Chỉ redirect hostname cũ khi chắc chắn không ảnh hưởng preview/rollback.

`public/_redirects` quản lý alias path cũ; `vercel.json` giữ canonical redirect khi Vercel còn phục vụ hostname `www`.

## Access và OAuth

Áp dụng policy trong `CMS_SETUP.md`. `/admin` noindex và cache-control private. Callback OAuth không được đặt sau policy chặn; Worker tự kiểm tra state.

## Rollback

- Pages: chọn deployment trước trong dashboard và **Rollback to this deployment**.
- D1: export trước migration; migration là forward-only, phục hồi database mới từ export nếu schema/data bị lỗi.
- DNS: trỏ lại record Vercel đã ghi trước đó; không xóa Vercel project/domain cho đến sau giai đoạn ổn định.
- OAuth: route/custom domain có thể tắt độc lập, website public vẫn hoạt động.

## Chi phí

Ở lưu lượng thấp và dưới quota miễn phí của Pages, Workers, D1, Turnstile và R2 Standard có thể chưa phát sinh phí. Đây không phải bảo đảm chi phí: R2 free tier theo tháng (10 GB-month, 1 triệu Class A, 10 triệu Class B), usage vượt quota có thể bị tính phí; đặt billing alert và kiểm tra dashboard hàng tháng.
