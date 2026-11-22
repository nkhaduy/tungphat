# Quyết định phát hành — Phase 5

**NO-GO cho phê duyệt deploy tại thời điểm này.** Một số rủi ro local đã được xử lý và có test; không suy rủi ro được chủ website chấp nhận. Hai gate mandatory vẫn chưa có đủ bằng chứng: phạm vi ảnh mới/tái sử dụng trên toàn release chưa được khép kín, và các tình huống analytics/CMS bắt buộc chưa được kiểm thử browser/integration đầy đủ. LCP catalogue ~10,8 giây trong điều kiện giả lập mobile cũng là phát hiện cần xử lý/đánh giá trước khi phát hành, dù không phải field CWV.

## Layer 1 — trước release

| Gate | Kết quả | Bằng chứng / việc còn lại |
|---|---|---|
| Ownership và conflict behavior | NOT VERIFIED | Có ma trận, fingerprint và test xung đột, render mẫu, draft, null, ngày và heading; chưa test trọn mọi trường CMS và mọi trường hợp trùng ngữ nghĩa, owner chưa xác nhận quy trình. |
| Không regression nội dung/ảnh mới | NOT VERIFIED | Test HTML/figure đại diện; chưa xác minh toàn bộ ảnh hoặc trạng thái UI. |
| Không tài sản mới thiếu quyền | BLOCKED | 12 URL ảnh mới trong HTML mẫu có căn cứ ghi nhận; 2.992 record search index không đổi mapping thumbnail. Chưa có delta đầy đủ cho ảnh CSS/JS, thứ tự render và catalogue; quyền theo SKU chưa xác nhận. Không tự nhận rủi ro. |
| GA4 opt-out và event dedup browser | NOT VERIFIED | Receiver giả có kiểm tra page_view và click, song chưa phủ đầy đủ timing opt-out/tải lỗi/rời trang; xem `ANALYTICS_VERIFICATION.md`. |
| Lint/typecheck/unit/integration/build/catalogue/link/schema | NOT VERIFIED | Lượt verify cuối đang được đối chiếu mã thoát và phiên bản file; kết quả sẽ ghi ở đây. |
| Catalogue search/filter và SEO policy | NOT VERIFIED | Kiểm tra index alias mới và suite Playwright đại diện cần chạy trên build cuối; không sửa chính sách noindex/canonical hàng loạt. |
| CTA/đích chính | NOT VERIFIED | Kiểm tra receiver và href trong test cục bộ; đích ngoài và liên miền chưa kiểm chứng toàn bộ, không gửi lead. |
| Rollback | PASS | Kế hoạch phía dưới; chưa diễn tập production. |

## Layer 2 — sau khi được duyệt deploy, không yêu cầu chặn vô thời hạn

| Công việc | Trạng thái | Người thực hiện / bước tiếp |
|---|---|---|
| GA4 DebugView và liên miền | NOT VERIFIED | Người quản trị GA4/app xác nhận property, consent, single event và attribution; không gửi lead giả. |
| GSC, Bing, chọn canonical/index | NOT VERIFIED | Người quản trị property lấy baseline và kiểm tra mẫu alias/hub sau deploy. |
| WAF/crawler thật | NOT VERIFIED | Quản trị CDN đối chiếu log và IP chính thức. |
| CrUX/field CWV | NOT VERIFIED | Người quản trị GSC/CrUX xem p75 đủ dữ liệu sau deploy. |
| GBP và thực địa | NOT VERIFIED | Chủ website/quản trị GBP đối chiếu hai địa chỉ, số, giờ, map. |
| AI citations / lead / đơn thật | NOT VERIFIED | Người phụ trách marketing/kinh doanh đo lặp, tách click khỏi lead và đơn thực. |

`ACCEPTED RISK`: không có; chỉ chủ website mới quyết định chấp nhận rủi ro còn lại.

## Rollback sau khi được phép triển khai

Trước release, lưu ID deployment frontend đang phục vụ, cấu hình public build, snapshot source/content export và xác minh khả năng khôi phục. Nếu lỗi nghiêm trọng sau deploy, người có quyền khôi phục deployment frontend trước đó trên đúng project, không migrate hay khôi phục D1/R2 tùy tiện; xác nhận homepage, các route vật liệu, catalogue, liên hệ và robots/canonical, sau đó ghi thời gian và ảnh hưởng vào nhật ký. Nếu lỗi từ dữ liệu CMS thì ngừng thay đổi, dùng backup đã xác minh và quy trình riêng được duyệt. Không kích hoạt rollback hoặc deploy trong Phase 5.
