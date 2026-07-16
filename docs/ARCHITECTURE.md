# Kiến trúc Tùng Phát

## Quyết định

Project dùng **Next.js App Router static export trên Cloudflare Pages**. Nội dung SEO được lưu trong Git/Markdown và quản lý bằng Decap CMS. Hai Pages Functions nhận form và ghi vào Cloudflare D1. GitHub OAuth của CMS chạy bằng một Cloudflare Worker độc lập.

```text
Khách truy cập -> Cloudflare Pages -> static Next.js HTML/CSS/JS
                    |-> /api/contact, /api/quote -> Turnstile -> D1

Biên tập viên -> Cloudflare Access -> /admin -> Decap CMS
                                      |-> OAuth Worker -> GitHub
                                                          |-> CI -> Pages
```

ADR-001: Chọn Pages static thay vì OpenNext Workers vì mọi URL indexable hiện prerender được; form có thể tách thành Pages Functions; CMS commit GitHub; không cần SSR, ISR hoặc Server Actions. Cách này giảm runtime, điểm lỗi và chi phí. Nếu sau này cần dashboard lead động hoặc ISR, đánh giá lại OpenNext thay vì ép vào static.

ADR-002: Bài viết, sản phẩm, dự án và trang dịch vụ là Markdown/JSON trong `content/`; D1 chỉ chứa lead và lịch sử xử lý. Git giữ lịch sử, review và rollback nội dung.

ADR-003: Ảnh tối ưu nằm trong repository. R2 chưa cần vì kho ảnh hiện tại nhỏ và upload CMS giới hạn 1,5 MB. Xem xét R2 khi repo tăng hàng GB, clone/build chậm đáng kể hoặc cần upload bản vẽ.

## Thành phần

- `app/`: giao diện, metadata, sitemap, robots và các route static.
- `content/`: article/product/project/service/settings có Zod schema.
- `public/admin/`: Decap CMS, preview và kiểm tra trước publish.
- `functions/`: API form, xác thực Turnstile, rate limit và D1.
- `workers/cms-oauth/`: OAuth proxy GitHub, state HMAC và cookie ngắn hạn.
- `migrations/`: schema D1 tuần tự, có history và rate-limit table.
- `scripts/`: content/image/link validation và image optimization.
- `.github/workflows/`: CI, preview, production và xử lý ảnh CMS.

## Ranh giới dữ liệu và bảo mật

- Browser không nhận D1 binding, GitHub secret hay Turnstile secret.
- API chỉ nhận allowlist field; không nhận `status`; query D1 có bind parameter.
- Cloudflare Access là lớp ngoài cho `/admin`; OAuth Worker vẫn tự xác minh origin/state.
- Callback OAuth phải truy cập được sau khi GitHub redirect; policy được mô tả trong `CMS_SETUP.md`.
- Lead không được đưa vào static HTML. Giai đoạn này quản lý bằng D1 dashboard/CLI để không biến site thành ứng dụng SSR chỉ vì dashboard.

## Canonical và deployment song song

Canonical duy nhất là `https://mdftungphat.com`. Vercel tiếp tục hoạt động đến khi Pages được nghiệm thu. Chỉ đổi DNS sau preview, E2E và custom-domain check; `www` redirect 308 về apex. Rollback ở `ROLLBACK.md`.
