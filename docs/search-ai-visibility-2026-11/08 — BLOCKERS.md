# Blockers và việc cần chủ sở hữu xác nhận

1. **Dữ liệu tìm kiếm hiện hành:** GSC, GA4 và Bing Webmaster Tools chưa được truy cập trong lượt này. Cần quyền đọc và xuất cùng cửa sổ ngày để đo query × page, index, conversion; không tự tạo số liệu. Báo cáo GSC 08/11 là lịch sử.
2. **Crawler thật / WAF:** Cần log CDN/WAF và IP thực để xác minh OAI-SearchBot theo [dải IP công bố](https://openai.com/searchbot.json); [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests) và [Bing](https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26) có phương pháp xác thực riêng. Không tin user-agent, không tắt WAF. Xác nhận chính sách GPTBot/training nếu chủ sở hữu muốn thay đổi; Phase 3 giữ wildcard hiện tại.
3. **GBP và pháp lý:** Cần quyền xem từng GBP, giờ mở cửa, vai trò chi nhánh và hồ sơ doanh nghiệp gốc. Không thêm giờ, review hoặc quan hệ độc quyền.
4. **Ảnh / sản phẩm:** 5.515 bản ghi nguồn `UNCONFIRMED` không tự thành ảnh đã dùng hay có quyền; ánh xạ SKU, chủ sở hữu, giấy phép, đối chiếu hình và thông số trước khi mở index hoặc thêm ảnh. Không có ảnh tràm thật đã xác nhận.
5. **260 alias Ba Thanh:** 257 canonical đích noindex theo snapshot 13/11; cần rà từng cặp mã, quyền ảnh, nội dung, GSC và mục tiêu tìm kiếm. Không gỡ noindex/redirect hàng loạt.
6. **Measurement:** Cần quyền kiểm tra GA4 DebugView/first-party endpoint và conversion thực. GA4 config-event được sửa local nhưng chưa thể xác nhận delivery production hoặc ảnh hưởng session. Không xem click là lead.
7. **Hiệu năng và audit sâu:** Chưa có field CWV; Lighthouse, Rich Results Test và rà thủ công mọi SKU/ảnh chưa hoàn thành. Audit HTML 3.589 URL không thay thế content/visual review. Cần đánh giá thêm URL `/du-an/` bị audit local báo orphan khác với đồ thị production.
8. **Nguồn nội dung:** Frontend override có thể che chỉnh sửa body CMS của bài MDF và các trang vật liệu; cần thống nhất quy trình cập nhật/duyệt trước khi làm CMS thành nguồn duy nhất.
