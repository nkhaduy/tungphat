# Vận hành SEO và đo lường

## Domain và index

- Canonical duy nhất trong code: `https://www.mdftungphat.com`.
- Vercel Domains cần đặt `www.mdftungphat.com` làm primary domain và chuyển hướng apex thẳng sang `www` bằng một lần redirect.
- Sau khi deploy, xác minh cả hai domain trong Google Search Console và submit `https://www.mdftungphat.com/sitemap.xml`.
- Các trang thương hiệu và catalogue đang `noindex` vì chưa có dữ liệu sản phẩm/catalogue đủ giá trị. Chỉ gỡ `noindex` khi đã có nội dung thực, hình ảnh và liên kết catalogue hợp lệ.

## Metadata và schema

- Dùng `createPageMetadata` trong `lib/seo.ts` cho route mới để canonical và Open Graph URL luôn theo đúng route.
- Dùng `JsonLd` và helper `breadcrumbSchema`; không đưa giá, tồn kho, đánh giá, giờ mở cửa hoặc khu vực phục vụ vào schema khi chưa có dữ liệu xác minh.
- Chỉ thêm `FAQPage`, `Product` hoặc `Article` khi nội dung tương ứng thực sự hiển thị trên trang.

## GA4

- Biến môi trường tùy chọn trên Vercel: `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Giá trị phải là Measurement ID dạng `G-...`. Khi biến thiếu hoặc sai định dạng, website không tải script Google Analytics.
- Event hiện có: `click_phone`, `click_zalo`, `request_quote`, `view_cnc_service`, `view_product_category`, `click_directions`.
- Không gửi tên, số điện thoại, email, nội dung trao đổi hoặc tên file trong event properties.

## Dữ liệu doanh nghiệp còn cần bổ sung

- Email công khai, giờ làm việc và khu vực phục vụ chưa được xác minh nên chưa xuất hiện trong metadata/schema.
- Xác minh tên, địa chỉ, điện thoại trên Google Business Profile và giữ nhất quán với trang `/lien-he`.
- Chỉ công bố quan hệ đại lý chính thức hoặc chứng nhận khi có bằng chứng có thể kiểm tra.

## Asset và hiệu năng

- Ảnh nội dung dùng bản WebP; PNG gốc được giữ làm nguồn.
- Video `public/0619.mp4` không preload và không autoplay. Nên tạo bản encode web tối ưu sau khi có quy trình kiểm tra chất lượng hình ảnh, đồng thời giữ poster hiện tại.
- Chỉ ảnh hero trang chủ được tải ưu tiên. Không thêm `priority` cho ảnh dưới màn hình đầu.

## Checklist sau mỗi lần phát hành

1. Chạy `npm run lint`, `npx tsc --noEmit` và `npm run build`.
2. Kiểm tra `/robots.txt`, `/sitemap.xml`, canonical và JSON-LD trên bản deploy.
3. Kiểm tra 404, internal link, CTA điện thoại/Zalo và console ở desktop/mobile.
4. Theo dõi Core Web Vitals và index coverage trong Search Console sau khi Google thu thập dữ liệu mới.
