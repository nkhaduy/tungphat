# Thiết lập Analytics

## 1. Biến môi trường

Vercel build:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_ANALYTICS_API_BASE=https://cms.mdftungphat.com
```

Cloudflare Pages secrets/variables:

```text
ANALYTICS_HASH_SALT=<random >= 32 chars>   # tùy chọn; fallback IP_HASH_SALT
GA4_PROPERTY_ID=<numeric property id>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service account email>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<PEM private key>
SEARCH_CONSOLE_SITE_URL=sc-domain:mdftungphat.com
```

Không đưa giá trị thật vào Git, log hoặc response. Private key hỗ trợ dạng có
newline thật hoặc chuỗi `\n`.

## 2. D1

Migration: `cloudflare-cms/migrations/0004_create_analytics.sql`.

```bash
npm run d1:migrate:preview
npm run d1:backup
npm run d1:migrate:remote
```

Luôn migrate preview và smoke test trước production. Migration chỉ tạo mới
bảng/index nên rollback ứng dụng không yêu cầu drop bảng.

Local:

```bash
cp cloudflare-cms/.dev.vars.example cloudflare-cms/.dev.vars
npm run d1:migrate:local
npm --prefix cloudflare-cms run dev
```

`.dev.vars` bị Git ignore. Chỉ dùng placeholder local hoặc secret development,
không sao chép secret production xuống máy nếu không cần.

## 3. GA4

1. Đặt Measurement ID vào Vercel.
2. Trong GA4 Admin, thêm service account với quyền Viewer hoặc Analyst.
3. Đặt numeric property ID vào `GA4_PROPERTY_ID`.
4. Kiểm tra tab **Cấu hình** và realtime.
5. Trong GA4 Admin → Key events, đánh dấu `click_phone`, `click_zalo`,
   `click_quote`, `form_submit`; có thể thêm `click_email`.

Khi Data API chưa cấu hình, tracking bằng Measurement ID vẫn có thể hoạt động,
nhưng dashboard ghi “Chưa cấu hình”.

## 4. Search Console

1. Xác định property hiện có (ưu tiên domain property).
2. Thêm service account email làm user có quyền đọc.
3. Bật Search Console API trong Google Cloud project của service account.
4. Đặt `SEARCH_CONSOLE_SITE_URL`, ví dụ `sc-domain:mdftungphat.com`.
5. Mở tab SEO; lần gọi đầu lấy dữ liệu và ghi cache D1.

Search Console có độ trễ và không cung cấp query organic ở cấp người/session.

## 5. Deploy và xác minh

```bash
npm run lint
npm run typecheck
npm test
npm --prefix cloudflare-cms test
npm run build
npm --prefix cloudflare-cms run build
npm --prefix cloudflare-cms run cms:dry-run
npm --prefix cloudflare-cms run deploy:preview
```

Preview checklist:

- homepage và hero slideshow không đổi;
- page view chỉ một lần mỗi route;
- click phone/Zalo/maps/catalogue ghi đúng;
- article 50% hoặc 30 giây chỉ ghi một `article_engaged`;
- `/admin`, preview và localhost không track;
- OAuth login phát session và `/analytics/` mở được;
- chưa login bị redirect, API trả 401;
- opt-out ngừng tạo event;
- GA4/GSC lỗi không làm dashboard crash.

Sau khi pass, deploy production CMS và để Vercel deploy website từ commit đã
merge. Không deploy production trước migration production.

Kiểm tra `https://mdftungphat.com/admin/analytics` chuyển tới
`https://cms.mdftungphat.com/analytics/`; request chưa đăng nhập sau đó phải
được chuyển về màn hình đăng nhập CMS.
