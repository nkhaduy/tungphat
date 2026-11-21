# Workers Static Assets: hồ sơ review cutover — 21/11/2026

Trạng thái: **PARTIAL**. Preview riêng đang chạy; chưa có phê duyệt chuyển production. Cấu hình và thao tác bên dưới không tự gắn domain, thay DNS hoặc deploy production.

## Phạm vi và bảo toàn

Repository ban đầu có 685 thay đổi chưa commit tính theo `git status --porcelain --untracked-files=all`. Source thử nghiệm gồm cả untracked được sao chép vào `/tmp/tungphat-workers-preview.VOpiIl`; các bước build ghi vào bản sao, không chạy prebuild/verify trong working tree chính. Tài nguyên CMS, WordPress, quote-app, D1 và R2 production không được sửa. Không commit/push hay thay cấu hình Vercel, Pages cũ.

Các file migration được thêm riêng: `workers/static-preview.mjs`, `workers/static-preview.d.mts`, `workers/static-production.mjs`, `workers/static-production.d.mts`, `wrangler.static-preview.jsonc`, `wrangler.static-production.jsonc`, `tests/workers-static-preview.test.ts`, `tests/workers-static-production.test.ts`, `scripts/prepare-workers-production-artifact.mjs` và báo cáo này. `public/_headers` được sửa đúng một origin trong CSP `connect-src` để khớp Vercel.

## Bảo mật bản sao tạm

Lần sao chép trước đã để thư mục tạm quyền 755 trong khoảng ngắn trước khi đặt 700. File `.vercel/.env.production.local` có 15 biến không rỗng; tên credential riêng được nhận diện là `VERCEL_OIDC_TOKEN`. Claim `exp` đọc từ token cho thấy hết hạn 2026-11-04 01:58:42 UTC; claim chưa được xác minh chữ ký. Đã xóa chính xác file môi trường và hai file còn lại trong bản sao `.vercel`, rồi xóa thư mục rỗng. Không sửa bản gốc. Các file `.env.example` còn lại là file mẫu. Không có bằng chứng truy cập trái phép; quyền 755 đã từng cho phép người dùng local khác truy cập nếu họ biết đường dẫn. Rà soát audit hệ điều hành nếu có và cân nhắc thu hồi/rotation các credential còn hiệu lực nếu xác nhận có truy cập; không kết luận các giá trị khác an toàn chỉ bằng tên biến.

## Kiến trúc và quota

- Preview: version `a87d7467-7a5d-466b-bfd4-972ae98c4d0f` tại `https://tungphat-static-assets-preview.nkhaduy.workers.dev`; `wrangler.static-preview.jsonc`, `run_worker_first: true`; Worker thêm noindex vào mọi response, kể cả redirect/proxy. Preview công khai, noindex không phải xác thực.
- Production dự kiến: `wrangler.static-production.jsonc`, asset-first và `run_worker_first: ["/catalog/*"]`; không route, custom domain hay workers.dev trigger. Request asset hợp lệ không cần chạy code; request không khớp asset có thể gọi Worker. Proxy chuyển GET/HEAD tới CMS, giữ Range và conditional headers, không thay ảnh lỗi bằng placeholder.
- Cấu hình production dùng thư mục riêng `.wrangler/workers-production-assets`; `node scripts/prepare-workers-production-artifact.mjs` từ chối môi trường preview và `_headers` có global noindex, yêu cầu `out/index.html` và `out/404.html`, và từ chối ghi đè thư mục đích. Chạy sau build production mới, trong checkout cô lập; không tái sử dụng artifact cũ. Đây là guard kiểm tra header, không thay thế review đầy đủ HTML/SEO trước deploy.
- Build kiểm tra 7.394 file, lớn nhất 2.108.160 byte; Wrangler báo 11.041 entries đọc và 7.392 asset đã upload khi preview. Cả hai con số dưới 20.000; file dưới 25 MiB. Workers Free: 100.000 request động/ngày, 10 ms CPU/request; static asset phục vụ trực tiếp miễn phí. Preview chạy mọi request qua Worker nên dùng quota, trong khi production dự kiến chủ yếu dùng quota cho proxy và miss. Chưa có số traffic hiện tại hay CPU thực đo: chưa thể chứng minh đủ Free khi production chạy; quota Workers còn chia sẻ với các Worker/Pages Functions trong tài khoản. Tham khảo https://developers.cloudflare.com/workers/platform/limits/ và https://developers.cloudflare.com/workers/platform/pricing/.
- `_headers` và `_redirects` dùng asset router. Cloudflare không tự áp những rule đó lên response do Worker tự tạo; proxy giữ header origin và lỗi có `nosniff`, preview gắn noindex trong code. Redirect ưu tiên trước headers. `/cms-preview/` có các rule trùng áp dụng cùng giá trị noindex/cache-control; cần review để tránh header lặp, không phải global noindex.

## Kiểm chứng

- `npm run verify` trong bản sao: PASS, bao gồm lint, typecheck, test frontend 843, test catalogue 313, test Payload local 38, build static, sitemap và kiểm tra 258.049 liên kết. Kiểm thử Worker riêng 8/8 PASS, gồm guard artifact.
- Production config: guard đã tạo artifact riêng và Wrangler dry-run với artifact đó PASS; HTTP local asset-first: `/`, `/san-pham/`, `/van-mfc/` 200 và không có global noindex; `/ma-mau` 308; route không tồn tại 404; `/cms-preview/` vẫn noindex; ảnh catalogue 200 và Range 206/32 byte. Chromium trên cấu hình production local: 5/5 test chọn lọc PASS; preview live cập nhật: 4/4 test chọn lọc PASS.
- 14 URL đại diện trên Vercel và preview: status, canonical và OG trùng; `/ma-mau` redirect cùng đích tương đối; robots.txt trùng byte; hai sitemap có cùng 2.664 `<loc>` nhưng nội dung byte khác, cần review `lastmod` và nội dung trước cutover. Trang `/gia-cong-cnc/` preview có 6 khối JSON-LD so với 4 ở Vercel; review nội dung/schema local chưa commit trước khi xuất bản. CSP `connect-src` ban đầu thiếu Google Tag Manager trên Workers; đã sửa file nguồn, thêm test so với `vercel.json` và cập nhật preview; CSP trang chủ live hiện khớp. Preview có header noindex và CSP trên redirect, Vercel không có hai header này.
- WordPress unit/adapter nằm trong bộ test; 28 test adapter/provider/renderer/webhook/publishing chạy riêng đều PASS; không có Docker hay WP Playground cài sẵn để dựng WordPress staging thật. Quote-app trong thư mục này chỉ có build `dist`, không có source/package hay migration staging để kiểm thử luồng ghi an toàn. Không thử tạo báo giá, đăng nhập, xuất bản hoặc ghi API production. Cần staging có database và credentials độc lập, rồi chạy E2E tạo/sửa/hủy báo giá, auth, upload/preview/publish và đối chiếu dữ liệu trước khi đóng các mục này.

## Phụ thuộc phải giữ hoặc chuẩn bị thay

- `cms.mdftungphat.com`: Payload build sync (`scripts/sync-payload-build-data.ts`, `lib/content.ts`), endpoint analytics (`lib/analytics/client.ts`), admin và analytics redirect (`vercel.json`, `public/_redirects`), CMS preview (`app/cms-preview/page.tsx`, `lib/cms-preview.ts`), origin proxy `/catalog/*`, CSP và gateway. Cần giữ DNS/HTTPS, CORS và allowlist; xác nhận preview/auth với domain mới trước cutover. Không đổi nguồn blog: mặc định Payload; WordPress chỉ bật khi cấu hình rõ.
- `cdn.mdftungphat.com`: URL ảnh/media (`lib/media.ts`, dữ liệu catalogue/build), cấu hình Next, CSP, video (`components/WorkshopMedia.tsx`), scripts audit/sync; tồn tại cả ảnh legacy qua `cms.mdftungphat.com/media/catalog/*`. Giữ CDN và R2 hoạt động khi thay domain frontend.
- `baogia.mdftungphat.com`: link ngoài tại `app/bao-gia/page.tsx`; ứng dụng báo giá là dịch vụ riêng. Cần xác nhận domain, auth/cookie/CORS và staging độc lập; không thay D1 của nó.
- Các phụ thuộc ngoài khác gồm Zalo, Google Maps, Analytics/GTM, Cloudflare Turnstile, ảnh Google và chính sách CSP. Kiểm tra trên domain mới và không gửi lead thử vào production.

## Kế hoạch cutover — chỉ thực hiện sau phê duyệt riêng

1. Hoàn tất staging WordPress/quote/API tách biệt; review toàn bộ 685 thay đổi và schema CNC; xác nhận chủ sở hữu dịch vụ cũ, hạn mức thực tế, quyền DNS/domain và kế hoạch bảo mật. Lưu bằng chứng và snapshot cấu hình Vercel/DNS/Worker hiện tại; kiểm tra restore và TTL.
2. Chuẩn bị release riêng trong checkout sạch đã review, giữ Payload làm nguồn. Thay domain trong canonical, sitemap, robots, OG, schema và link nội bộ cho `gotungphat.com`; kiểm tra schema, sitemap, HTTPS và không global noindex. Cập nhật allowlist CORS/CSP, CMS preview và auth theo domain mới sau khi kiểm tra staging. Chạy `npm run verify`, Chromium, `node scripts/prepare-workers-production-artifact.mjs`, kiểm tra artifact sạch và Wrangler `--dry-run` với production config. Không reuse preview build.
3. Sau phê duyệt, triển khai phiên bản production được review; gắn apex `gotungphat.com` và thiết lập DNS/HTTPS đúng theo Cloudflare. Chuẩn bị `www.gotungphat.com` → apex bằng 301 giữ path/query, tránh loop. Không áp redirect này lên CMS/CDN/quote subdomain cũ.
4. Với quyền kiểm soát domain cũ, cấu hình 301 từ `mdftungphat.com` và `www.mdftungphat.com` sang URL tương đương trên domain mới, giữ path/query, ngoại trừ subdomain dịch vụ. So sánh danh sách redirect legacy, tránh chuỗi và vòng lặp. Xác minh Search Console cả hai property, nộp sitemap mới và dùng Change of Address khi đủ điều kiện; theo dõi indexing và lỗi crawl.
5. Xác minh từ ngoài mạng: HTTPS/certificate, DNS apex/www, redirect, 404, sitemap/robots/canonical/OG/schema, noindex chỉ ở các route dự kiến, CSP, ảnh CDN, Range proxy, CMS read/preview, quote link, Zalo và logs/quota. Thử các thao tác ghi chỉ theo kế hoạch production được phê duyệt hoặc staging độc lập.

## Rollback

Giữ Vercel deployment và domain/cấu hình cũ cho tới khi có quyết định khác. Trước thay đổi lưu bản chụp DNS/TTL, routes, Worker version, redirect và cấu hình SEO. Nếu lỗi, khôi phục DNS/routes về Vercel và tắt redirect mới theo trình tự đã diễn tập; nếu đã chuyển canonical/301 hoặc Google đã crawl, khôi phục nhất quán các tín hiệu SEO và theo dõi cả hai domain. Kiểm tra HTTPS, sitemap, canonical, CMS/CDN, quote và catalogue sau rollback. Không đổi hoặc khôi phục D1/R2 trừ khi có phương án và phê duyệt riêng.
