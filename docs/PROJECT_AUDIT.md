# Audit project Tùng Phát — 2026-07-16

## Baseline trước thay đổi

- Git: `main` tại `9ead740`; chỉ có các thư mục skill untracked của người dùng.
- Runtime: Node `v26.4.0`, npm `11.17.0`; package manager npm với `package-lock.json`.
- `npm install`: thành công; audit ban đầu có 5 cảnh báo (1 moderate, 4 high).
- `npm run lint`: thành công.
- `npm run typecheck`: thất bại vì chưa có script.
- `npm test`: thất bại vì chưa có script.
- `npm run build`: thành công trên Next 14.2.35, 21 route static/SSG.

## Kiến trúc ban đầu

Next.js App Router + TypeScript + Tailwind + Framer Motion. Nội dung nằm trong `lib/i18n.ts` và component; không có content layer, CMS, form API/database, CI hay cấu hình Cloudflare. Metadata/sitemap/robots có sẵn một phần. Trang chủ, brand và catalogue đều prerender. Vercel là deployment hiện hành; repo không có Server Action, API route, SSR hay ISR bắt buộc.

Route ban đầu: `/`, `/san-pham`, `/san-pham/[brand]`, `/catalogue/[brand]`, `/gia-cong-cnc`, `/lien-he`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/robots.txt`, `/sitemap.xml` và 404.

## Phát hiện

### Build và technical debt

- Thiếu typecheck/test script và test automation.
- `lib/i18n.ts` là module dữ liệu lớn, khó cho biên tập viên và dễ tạo xung đột Git.
- Content, metadata và route chưa có schema/validation tập trung.
- Script deploy cũ tự stage/commit và force-push, có rủi ro ghi đè lịch sử; đã thay bằng quality gate không ghi Git.
- Next/dependency cũ có advisory mức high; đã nâng Next 15.5.20 và dependency liên quan. Residual audit hiện là advisory moderate của PostCSS được bundling trong Next; đường chạy production là static HTML và không xử lý CSS từ người dùng, nhưng cần theo dõi bản Next vá tiếp theo.

### SEO

- Chưa có landing page độc lập cho các cluster gỗ ghép, MDF và CNC.
- Canonical vận hành cũ từng ghi `www`, trái với domain chính; đã chuẩn hóa apex.
- Sitemap không lấy bài viết/sản phẩm/dự án từ content và chưa có lastmod thực.
- Thiếu Article/Product/Service/FAQ schema theo nội dung thật và breadcrumb tái sử dụng cho money page.
- Chưa có CMS/editorial review, keyword map, competitor gap hoặc 90-day plan.
- Brand/catalogue chưa đủ nội dung độc lập; giữ noindex để tránh thin/duplicate page.

### Performance và accessibility

- Hero là ảnh tĩnh trong code baseline, trong khi yêu cầu kinh doanh là slideshow; đã khôi phục slideshow tự chuyển, chỉ ưu tiên slide đầu và lazy-load phần sau.
- Ảnh legacy PNG lớn tồn tại trong repo; runtime đã dùng WebP nhưng nguồn gốc được giữ để tránh xóa dữ liệu.
- Chưa có pipeline giới hạn kích thước/tên/định dạng ảnh hoặc kiểm tra a11y/E2E.
- Third-party GA/Trustindex chỉ được tải khi có cấu hình; không gửi PII.

### Security và dữ liệu cá nhân

- Baseline chưa có server endpoint nên form chưa thể ghi nhận lead.
- Chưa có server validation, spam control, consent, retention hoặc backup/export.
- Chưa có CMS auth flow. Không phát hiện secret được commit trong tracked source.
- Deploy script cũ là rủi ro supply-chain/operational; đã vô hiệu hóa thao tác Git tự động.

## Sau triển khai

- Content: Markdown/JSON + Zod + Decap CMS editorial workflow.
- Hosting: Next static export trên Pages; Pages Functions cho form; D1 chỉ cho lead.
- Security: Turnstile server verify, honeypot, same-origin, size/length limits, normalized phone, parameterized SQL, hashed-IP rate limit, idempotency và error không lộ stack.
- SEO: 8 money/service landing page mới, `/bao-gia`, article/project hubs, canonical apex, sitemap/robots động lúc build, metadata/schema theo loại nội dung.
- CI: lint, typecheck, unit, content/image/link validation, build, E2E, D1 local migration; deploy workflows được gate bằng repository variable.
- Analytics: event call/Zalo/contact/quote/view page, không chứa tên, phone, email hoặc message.

## Cloudflare compatibility

Pages static phù hợp: mọi indexable route được prerender; `next/image` dùng unoptimized static assets; form tách Functions. OpenNext Workers cũng khả thi nhưng không cần hiện tại và có nhiều runtime/adapter hơn. Không có tính năng bắt buộc Vercel ngoài deployment hiện tại. Vercel vẫn build static site, dùng `vercel.json` để redirect `www` khi host khớp.

## Rủi ro migration

- DNS/custom domain/certificate và Access/OAuth policy cần thao tác dashboard thật.
- D1 database ID, Pages project và Turnstile keys chưa thể tạo không có quyền tài khoản.
- Decap publish cần GitHub OAuth App và collaborator có quyền ghi repo.
- Ảnh/bài mới có thể làm CI fail có chủ đích nếu thiếu SEO/alt hoặc quá lớn.
- Route dynamic dùng placeholder build-time rồi xóa khỏi `out`; CI kiểm tra link/output để ngăn placeholder bị phát hành.

## Rollback và chi phí

Không xóa deployment Vercel. Giữ DNS/TTL có kiểm soát, snapshot D1 trước migration và rollback content bằng Git revert/Decap history. Ở quy mô hiện tại, Pages, Workers OAuth, D1, Turnstile, GitHub/Decap có thể nằm trong free tier: chi phí hạ tầng cố định dự kiến 0 đồng/tháng, không gồm phí gia hạn domain và mọi mức vượt quota. Chi tiết: `ROLLBACK.md` và `CLOUDFLARE_DEPLOYMENT.md`.

## Kết quả xác minh cuối

- `npm ci`: pass, 638 packages; 2 advisory moderate residual đã nêu, không có high/critical.
- `npm run lint`: pass, 0 warning.
- `npm run typecheck`: pass cho Next và Cloudflare Functions/Worker.
- `npm test`: 10/10 unit test pass.
- `npm run build`: pass; 34 route build-time, 27 HTML sau khi xóa 2 placeholder dynamic; internal links pass.
- D1 local migrations: pass; lead insert, normalization, consent và history trigger đã kiểm tra.
- Playwright trên `wrangler pages dev`: 10/10 pass, gồm form, Turnstile test mode, rate limit, injection payload, double-submit, slideshow, mobile, SEO/a11y và 404.
- OAuth Worker `wrangler deploy --dry-run`: pass, 6,07 KiB upload (gzip 2,33 KiB).
- Lighthouse mobile lab local gần production: Performance 92, Accessibility 100, Best Practices 100, SEO 100; observed LCP 0,83 s, simulated LCP 3,3 s, CLS 0, TBT 60 ms. Đây là lab local, không thay số field CrUX sau deploy thật.
