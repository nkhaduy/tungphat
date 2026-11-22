# Analytics verification

Định nghĩa: `click_quote` là ý định hỏi giá, `click_phone` là nhấp số, `click_zalo` là nhấp mở Zalo. Hai event có thể là cùng một click và không được cộng thành hai lead. `form_submit` chỉ là tín hiệu form theo nơi phát; lead xác nhận phải đối chiếu backend/CRM có xử lý thành công; giao dịch là đơn hàng xác nhận riêng. `countContactIntentSessions` đếm **phiên có hành động liên hệ**, dedup theo session, không đếm lead hay đơn.

| Tình huống | Bằng chứng / giới hạn |
|---|---|
| Event trước config và replay | Test unit `ga4-bootstrap`; browser dùng build ID giả và chặn GA thật, quan sát `config` trước `page_view` trong dataLayer. Không chứng minh GA nhận. |
| Opt-out trước bootstrap / pending | Unit test và browser preload queue + cookie opt-out: không config/replay, queue xóa; không request receiver. |
| Opt-out sau khi lên lịch gửi | Unit test mô phỏng idle callback: kiểm tra lại cookie ngay lúc dispatch, không gửi request sau opt-out. |
| Opt-out trong phiên | Browser test riêng; xem kết quả cuối ở `BLOCKER_RESOLUTION.md`. Cookie chỉ được kiểm tra khi event/dispatch/bootstrap xảy ra; nếu bật rồi tắt lại mà không có event trước bootstrap, code không quan sát được khoảng chuyển trạng thái. |
| Tag lỗi/chặn | Browser chặn googletagmanager và google-analytics; cấu hình/queue vào dataLayer local vẫn quan sát được, không có bằng chứng delivery tới Google. Tag lỗi có thể mất event. |
| Rời trang trước replay | Queue trong `window`, không bền qua full navigation; mất event có thể xảy ra, chưa có browser test có kiểm soát cho mọi timing. Không tái gửi sau opt-out để bù. |
| Hai event một click | Browser Zalo CTA qua receiver giả xác nhận một `click_quote` và một `click_zalo`. Header tel phát một `click_quote` và một `click_phone`; không cộng thành hai lead. Request body gồm `event_name`, session ID, path và loại/vị trí CTA đã sanitize; không gửi PII. |
| page_view | Browser điều hướng hai route, một page_view mỗi route trong test; không chứng minh mọi kiểu navigation/query hoặc cả hành trình liên miền. |
| App báo giá | `/bao-gia/` link tới `https://baogia.mdftungphat.com`; browser kiểm tra href, không mở hay gửi báo giá. Cross-domain attribution/GA cấu hình bên app chưa xác nhận. |
| GA4 production | NOT VERIFIED: chưa có quyền DebugView/property, không biết ID build thật hay Google nhận event. Sau khi được duyệt deploy theo `phase4/POST_DEPLOY_CHECKLIST.md`, kiểm tra opt-out, page_view, click, nhận data và liên miền bằng thiết bị debug được phép. |

Ở local, test chặn toàn bộ Google tag/analytics và mock `/api/analytics/track` trước khi thao tác; không tạo lead hoặc event trong property thật. Bài test đầu chọn nhầm CTA điện thoại thay vì CTA Zalo, kỳ vọng `click_zalo` thất bại; đã sửa selector theo vị trí thực và chạy lại. Đây là sửa fixture, không thay expectation để che lỗi ứng dụng.
