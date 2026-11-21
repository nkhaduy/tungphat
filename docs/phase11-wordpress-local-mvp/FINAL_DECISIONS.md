# Quyết định Phase 11

## A — Website Next.js hiện tại: NO-GO

Hai phiên bản Next.js đã được vá **trong workspace**, chưa được triển khai. Chưa có lượt `npm run verify`, build và full Playwright trên source cuối sau nâng cấp; audit dependency Payload còn các mục cần phân tích. Không suy ra production đã an toàn hoặc có lỗi khai thác chỉ từ version hay kết quả test. Không đánh giá lại toàn bộ SEO/AEO/GEO và không tuyên bố Core Web Vitals field đã đạt.

## B — WordPress Local MVP: NOT READY

WordPress local và dữ liệu đã được khôi phục; Editor có thể đăng nhập, lưu bài, SEO và media. Preview xác thực và worker polling đang được thử nghiệm, nhưng migration parity chưa đạt, chưa có bằng chứng build HTML/sitemap thật sau publish/update/unpublish, và chưa có regression cuối. Các thông báo build và khởi động tự động sau reboot chưa hoàn chỉnh. Xem các báo cáo cùng thư mục; không dùng các unit test giả lập để thay thế acceptance E2E.

Trước khi tiếp tục build cần đủ dung lượng đĩa. Worker hiện yêu cầu tối thiểu 8 GiB trống trước khi tạo bản build cô lập; ngưỡng này không bảo đảm một build bất kỳ sẽ không hết đĩa. Không tự xóa backup, snapshot hoặc dữ liệu hiện hữu để tạo chỗ. Sau đó cần hoàn tất parity và quyền ảnh, thử lại luồng Editor → preview → publish/update/unpublish → HTML/sitemap, failure recovery và full regression trên source cuối.

## C — Production WordPress cutover: NOT READY

Playground local không phải staging. Cần hosting, backup và diễn tập restore, hardening, quản lý secrets, preview runtime, publishing pipeline và staging E2E phù hợp trước khi xin duyệt cutover. `cms.mdftungphat.com` tiếp tục là Payload; không thay DNS hoặc triển khai trong phase này.

Không commit, push hoặc deploy. Ba draft biên tập 32–34 không được xuất bản.
