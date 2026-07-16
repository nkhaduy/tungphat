# Cloudflare deployment

## Kiến trúc chọn

Cloudflare Pages static export + Pages Functions + D1; OAuth là Worker riêng. Không dùng OpenNext vì project không cần SSR/ISR/Server Actions và mọi route SEO prerender được.

## Chuẩn bị

- Node 22 LTS khuyến nghị (project hỗ trợ `>=20.19 <27`), npm theo lockfile.
- Tạo Pages project `tung-phat`, liên kết repo GitHub.
- Build command: `npm ci && npm run build`; output directory: `out`.
- Production branch: `main`; preview branch: pull request.
- Tạo D1 production `tung-phat-leads` và D1 preview `tung-phat-leads-preview`; thay hai UUID placeholder khác nhau trong `wrangler.jsonc`. Preview tuyệt đối không bind database production.

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

Preview dùng Turnstile key/secret riêng và binding `DB` → `tung-phat-leads-preview`. Không đặt `TURNSTILE_TEST_MODE` trên bất kỳ deployment public nào; flag này chỉ dành cho local/CI với key kiểm thử chính thức.

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
```

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

Ở lưu lượng hiện tại và dưới quota miễn phí của Pages, Workers, D1 và Turnstile: dự kiến 0 đồng/tháng chi phí hạ tầng cố định. Domain renewal, vượt quota, dịch vụ email hoặc R2 tương lai không nằm trong ước tính; kiểm tra dashboard usage hàng tháng.
