# Audit lịch sử branch `codex/cloudflare-cms-seo-platform-v2`

> Tài liệu này ghi lại trạng thái trước migration hybrid ngày 2026-07-18. Kiến
> trúc production hiện tại được mô tả trong `ARCHITECTURE.md` và
> `CLOUDFLARE_DEPLOYMENT.md`.

Ngày audit: 2026-07-18.

## Git và lịch sử

- Repository gốc đang ở local `main` commit `e76c773`, chậm hơn `origin/main` 7 commit và có 10 file sửa cùng nhiều file mới chưa commit.
- Để không trộn hoặc ghi đè thay đổi đó, branch v3 được tạo trong worktree riêng.
- Merge-base giữa `origin/main` và v2: `9ead7400e700fa3777bd66d7384858965005187f`.
- V2 có 4 commit riêng: `c34aeef`, `9abed5e`, `f375cf6`, `68cbeb2`.
- `origin/main` có 5 commit riêng sau merge-base, bao gồm hai revert SEO/favicon và các sửa Trustindex.
- Diff ba chấm v2 so với main: 156 file, khoảng 14.227 dòng thêm và 3.371 dòng xóa.
- Dry-run merge-tree báo conflict lớn ở `.env.example`, `.gitignore`, layout, home, contact, robots, sitemap, header/footer/hero, i18n, Next config, Trustindex và các file modify/delete. Vì vậy không merge/rebase main tự động.
- Repository đã có sẵn 930 file tracked dưới `work/` (npm cache, log và ảnh kiểm
  thử), làm Git pack khoảng 283 MiB; blob lớn nhất khoảng 37 MiB. Chúng không đi
  vào `out` nhưng làm clone nặng. Branch này thêm ignore để không phát sinh thêm,
  chưa xóa 930 file nhằm tránh trộn một cleanup lịch sử lớn vào PR kiến trúc.
  Xóa ở commit riêng chỉ làm checkout tương lai gọn hơn; muốn giảm pack cũ phải
  rewrite history/force-push, việc bị cấm trong phạm vi này.

## Kiến trúc và rendering

- Bối cảnh ban đầu nói Next.js 14, nhưng branch thực tế dùng Next.js `15.5.20`, React 19 và TypeScript strict.
- `output: "export"`; toàn bộ trang SEO là Static/SSG. Không có SSR, ISR, Server Actions hoặc middleware.
- `fs`, `path`, `gray-matter` và Sharp chỉ chạy lúc build/script, không đi vào Pages Functions.
- Dynamic routes: brand/catalogue có `generateStaticParams`; article/project chỉ xuất entry published; `dynamicParams=false`.
- Form là Pages Functions `/api/contact` và `/api/quote`.
- `next/image` chạy `unoptimized` để phù hợp static export. Ảnh WebP đang được dùng ở runtime; nhiều PNG nguồn legacy lớn vẫn tồn tại nhưng không phải ảnh tải chính.
- Postbuild loại PNG/JPEG legacy khỏi artifact chỉ khi có WebP cùng tên và không
  xuất hiện trong HTML/CSS/JS/manifest. File nguồn vẫn được giữ trong repository,
  tránh redesign hoặc mất asset trong khi giảm kích thước Pages upload.

## Bản đồ nội dung trước khi hoàn thiện

| Nội dung | Nguồn |
|---|---|
| 6 landing sản phẩm | `content/products/*.md` |
| 3 bài viết draft | `content/articles/*.md` |
| 1 dự án mẫu draft | `content/projects/*.md` |
| 2 trang dịch vụ | `content/pages/*.md` |
| Doanh nghiệp/SEO/trang tĩnh | JSON trong `content/settings` |
| Thương hiệu/catalogue placeholder | TypeScript object trong `lib/brands.ts` |
| Địa điểm/Google Maps | TypeScript object trong `lib/locations.ts` |
| Hero/home categories/nội dung song ngữ | Component + `lib/i18n.ts` |
| Form submissions | D1 |

Sau audit, thương hiệu và địa điểm đã chuyển sang JSON; settings doanh nghiệp được nối vào footer, contact maps, CTA/phone constants và LocalBusiness JSON-LD. Text song ngữ và bố cục hero vẫn là presentation content trong source để không redesign.

## Phần v2 giữ lại

- Static export trên Pages và Pages Functions tách khỏi nội dung.
- Markdown + frontmatter, Zod, Decap editorial workflow.
- Canonical `https://mdftungphat.com`, robots/sitemap và metadata helper.
- Lead form, Turnstile, same-origin, honeypot, idempotency, prepared D1 statements.
- GitHub OAuth Worker với HMAC state, fixed postMessage origin và secret qua binding.
- Hero slideshow, ảnh mobile/desktop, preload slide đầu, reduced motion và pause khi hover/focus.
- CI, Vitest, Playwright/Axe, security headers, `_redirects`.

## Prototype hoặc lỗi tìm thấy

- R2 được thêm quá sớm dù mục tiêu ưu tiên Git images; tăng binding, API, custom widget, Access rule và backup surface.
- R2 widget dùng `self.state.csrf` thay vì component state nên upload có thể lỗi runtime.
- Validator biến R2 object thành chuỗi `[object Object]`, khiến CMS publish R2 sẽ fail build.
- CMS settings JSON tồn tại nhưng phần lớn website vẫn lấy business name, tax ID, maps, phone và schema từ hard-code.
- `config.yml` dùng R2 widget cho ảnh trong khi `media_folder` vẫn tồn tại; hai cơ chế media cạnh tranh.
- V2 có script route sentinel cho collection article/project chưa publish. Build
  thực tế xác nhận Next.js 15 static export từ chối `generateStaticParams()` trả
  mảng rỗng. V3 giữ lại cơ chế cần thiết này với tên/giải thích rõ hơn và postbuild
  xóa exact sentinel khỏi `out`; sitemap/link test cũng chặn URL sentinel.
- Hai workflow deploy bằng API token tồn tại song song với Pages Git integration, có nguy cơ deploy trùng và tăng secret.
- D1 chưa lưu product, dimensions, privacy-preserving `ip_hash` và user agent; hash rate-limit không có secret salt.
- Trang manifest là file public cũ thay vì metadata route; không có global error boundary.
- `www.mdftungphat.com` còn xuất hiện trong legal copy dù canonical đã là apex.
- CSP chưa cho Trustindex domain nên widget có thể bị chặn.
- `validate:links` baseline được gọi trước build trong lần kiểm tra thủ công và fail vì chưa có `out`; cần chạy từng lệnh độc lập.
- `npm audit` báo 2 moderate qua PostCSS nằm trong Next. `npm audit fix --force` đề xuất downgrade phá vỡ, vì vậy không áp dụng workaround đó.
- `wrangler.jsonc` còn UUID D1 placeholder có chủ đích; không thể thay bằng UUID
  thật nếu chưa tạo database trong Cloudflare account. Build/local test không
  dùng production UUID; deployment phải dừng cho tới khi Dashboard checklist
  được hoàn tất.

## Form và dữ liệu cá nhân

- Có API thật, server validation, Turnstile, honeypot, same-origin, 20 KB body cap, rate-limit 5 request/10 phút và chống trùng bằng `submission_key`.
- Không gửi email/notification. Người vận hành xem D1 bằng Dashboard hoặc Wrangler.
- Không log tên, điện thoại, email, message, token hay IP. IP thô chỉ được dùng trong request để verify Turnstile; D1 lưu hash có salt.
- Không nhận file CNC; giao diện cảnh báo không gửi dữ liệu nhạy cảm.

## SEO source audit

| Nhóm | Kết quả |
|---|---|
| Crawlability | Sitemap/robots static, admin/API/draft bị loại; pass |
| Indexability | Canonical apex; www redirect cần cấu hình dashboard; pass có bước vận hành |
| Security | HTTPS/HSTS/CSP/headers có cấu hình; Access/DNS chưa triển khai; pending dashboard |
| URL | URL sạch; hai alias CNC redirect 301; pass |
| Mobile | Responsive, menu mobile và touch target có E2E; pass |
| CWV | Hero có preload responsive; cần đo lại sau deployment vì chưa có CrUX |
| Structured data | WebSite, Organization, LocalBusiness, Product, Article, CreativeWork, BreadcrumbList; không rating/price giả |
| JS rendering | SEO elements nằm trong HTML prerender, không phụ thuộc client JS |
| IndexNow | Chưa triển khai; không cần cho lần cutover đầu |

## Kết luận

Không bắt đầu lại. Giữ static Pages/Decap/D1/OAuth của v2, bỏ R2 khỏi critical path, nối content settings thật vào UI/schema, bổ sung validation/privacy/migration và chuẩn hóa tài liệu. Không merge `origin/main` vì conflict lớn; các sửa main cần được port có chủ đích bằng PR riêng sau khi v3 được review.
