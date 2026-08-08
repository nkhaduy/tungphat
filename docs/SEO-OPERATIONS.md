# Vận hành SEO và đo lường

## Domain và index

- Canonical duy nhất trong code: `https://mdftungphat.com`.
- Cloudflare/Vercel phải chuyển `www.mdftungphat.com` về apex bằng một redirect 301/308; không chuyển ngược.
- Sau khi deploy, xác minh domain property trong Google Search Console và submit `https://mdftungphat.com/sitemap.xml`.
- Các trang thương hiệu và catalogue đang `noindex` vì chưa có dữ liệu sản phẩm/catalogue đủ giá trị. Chỉ gỡ `noindex` khi đã có nội dung thực, hình ảnh và liên kết catalogue hợp lệ.

## Metadata và schema

- Dùng `createPageMetadata` trong `lib/seo.ts` cho route mới để canonical và Open Graph URL luôn theo đúng route.
- Dùng `JsonLd` và helper `breadcrumbSchema`; không đưa giá, tồn kho, đánh giá, giờ mở cửa hoặc khu vực phục vụ vào schema khi chưa có dữ liệu xác minh.
- Chỉ thêm `FAQPage`, `Product` hoặc `Article` khi nội dung tương ứng thực sự hiển thị trên trang.

## GA4

- Biến build tùy chọn trên Cloudflare Pages: `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Giá trị phải là Measurement ID dạng `G-...`. Khi biến thiếu hoặc sai định dạng, website không tải script Google Analytics.
- Event hiện có: `click_phone`, `click_zalo`, `request_quote`, `view_cnc_service`, `view_product_category`, `click_directions`.
- Không gửi tên, số điện thoại, email, nội dung trao đổi hoặc tên file trong event properties.

## Dữ liệu doanh nghiệp còn cần bổ sung

- Email công khai đã được lấy từ dữ liệu doanh nghiệp hiện tại; giờ làm việc vẫn chưa
  được xác minh nên không xuất vào schema. `serviceAreas` hiện xuất `TP. Hồ Chí Minh`
  vào LocalBusiness schema; chủ doanh nghiệp phải xác nhận phạm vi này trước production
  hoặc bỏ khỏi schema.
- Xác minh tên, địa chỉ, điện thoại trên Google Business Profile và giữ nhất quán với trang `/lien-he`.
- Chỉ công bố quan hệ đại lý chính thức hoặc chứng nhận khi có bằng chứng có thể kiểm tra.

## Machine-readable resources và IndexNow

- `/llms.txt` là tài liệu hỗ trợ retrieval, không thay thế robots hoặc sitemap. Nội dung
  phải trỏ tới các URL đang tồn tại và được rà soát cùng sitemap.
- `/knowledge.json` là dataset công khai được sinh từ content đã publish; không đưa draft,
  noindex hoặc dữ liệu riêng tư vào đó.
- Chạy `npm run audit:seo` sau build để kiểm tra indexability, canonical, sitemap,
  structured data, liên kết và answer blocks.
- Chạy `npm run validate:schema` để kiểm tra JSON-LD, URL page canonical, required
  schema types và các field thương mại chưa được xác minh.
- Tạo key local bằng `npm run indexnow:prepare-key` (key được ghi vào
  `public/indexnow-key.txt`, đã nằm trong `.gitignore`) và đặt `INDEXNOW_KEY` trong môi
  trường deploy. Chạy `npm run indexnow:submit -- --dry-run` để xem URL thay đổi; chỉ
  submit thật khi key endpoint đã được deploy và URL đã thay đổi.

## Asset và hiệu năng

- Ảnh nội dung dùng bản WebP; PNG gốc được giữ làm nguồn.
- Video xưởng dùng `NEXT_PUBLIC_PROCESS_VIDEO_URL`, `preload="none"` và poster
  hiện tại. Production stream MP4 đã nén từ R2 private qua
  `cms.mdftungphat.com/media/videos/*`; không commit video nguồn dung lượng lớn.
- Chỉ ảnh hero trang chủ được tải ưu tiên. Không thêm `priority` cho ảnh dưới màn hình đầu.

## Checklist sau mỗi lần phát hành

1. Chạy `npm run lint`, `npm run typecheck`, `npm test` và `npm run build`.
2. Kiểm tra `/robots.txt`, `/sitemap.xml`, canonical và JSON-LD trên bản deploy.
3. Kiểm tra 404, internal link, CTA điện thoại/Zalo và console ở desktop/mobile.
4. Theo dõi Core Web Vitals và index coverage trong Search Console sau khi Google thu thập dữ liệu mới.
