# Hai quyết định phát hành — 15/11/2026

## A — Website hiện tại: NO-GO

| Gate | Trạng thái | Bằng chứng / người xử lý |
|---|---|---|
| Verify local | PASS | `npm run verify` exit 0 trong bản sao trước adapter WordPress: 765 frontend, 313 catalogue, 38 CMS; build, sitemap, schema và link validator. |
| Analytics browser / canonical | PASS trong phạm vi test | 4/4 test browser trên build GA ID giả; Google và endpoint analytics bị chặn. Kiểm tra queue/config, opt-out đầu trang/trong phiên, page_view, phone/Zalo/quote và mẫu alias. Chưa kiểm tra GA4 production, rời trang trước replay hoặc app báo giá liên miền. |
| Playwright regression | PASS trong phạm vi test | 67/67 catalogue, vật liệu, nội dung, ảnh và indexability; thêm 2/2 CTA/báo giá trên build không GA ID. Không thay thế review mọi trang. |
| Quyền ảnh release | BLOCKED | `/images/material-color-hero.webp` dùng mới tại `/lien-he/`, khác production; chưa có quyền sử dụng riêng theo vị trí. Chủ website xác nhận nguồn/quyền hoặc phê duyệt phương án khác; không tự nhận rủi ro. Xem `IMAGE_RELEASE_DELTA.md`. |
| Catalogue mobile | FAIL mục tiêu cải thiện lab | Median 10.804 ms so với 10.808 ms baseline, cùng điều kiện mô phỏng; không cải thiện có ý nghĩa. Cần owner xác nhận quyền xử lý hero, sau đó tạo biến thể phù hợp và đo lại. Không suy đây là field p75. |
| CMS ownership hiện tại | NOT VERIFIED | Đã có guard và test đại diện; editor cần đối chiếu bản preview và chấp nhận quy trình trước release. |
| Rollback | PLANNED | Lưu deployment frontend hiện tại và config; khôi phục phiên bản frontend trước nếu lỗi, không can thiệp D1/R2. Chưa diễn tập production. |

GA4 DebugView, GSC/Bing, crawler WAF, CrUX, GBP và lead thực là kiểm tra phụ thuộc production/quyền, theo checklist Phase 4; không tự biến chúng thành blocker local vô hạn. Không có rủi ro nào được tự đánh dấu owner đã chấp nhận.

## B — WordPress blog: NOT READY

Adapter REST, primitive kiểm tra HMAC và fixture ba bài đã có 10 test local nhưng chưa nối renderer hay endpoint. Thiếu WordPress instance, import/so sánh parity, sanitizer Gutenberg, preview được xác thực, webhook/build trigger bảo vệ, kiểm thử staging và rollback end-to-end. Người phụ trách hạ tầng cần cung cấp môi trường WordPress riêng; `cms.mdftungphat.com` hiện là Payload, không tự chuyển DNS. Xem `WORDPRESS_IMPLEMENTATION.md`, `WORDPRESS_ARCHITECTURE.md`, `CONTENT_MIGRATION_MAP.md`. Track A có quyết định riêng và không phụ thuộc việc cấp host WordPress.

Không commit, push, deploy, import production, gửi lead hay thay đổi DNS/CMS trong session này.
