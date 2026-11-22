# Hai quyết định độc lập

## A — Website: NO-GO

Ảnh contact trở về baseline production nhưng quyền ảnh legacy chưa được chứng minh. Catalogue LCP lab không cải thiện đáng kể, lượt Playwright rộng đạt 116/120, bốn test có kỳ vọng cũ đã được sửa và chạy lại 4/4 đạt; analytics/canonical với GA ID giả đạt 4/4; không suy từ test lịch sử. Owner cần xác nhận quyền/nguồn ảnh và quyết định phương án phù hợp. Không có phê duyệt phát hành hay chấp nhận rủi ro ở đây. Những kiểm tra phụ thuộc production được theo dõi riêng.

## B — WordPress blog: NOT READY

Chưa có instance local/staging, import thực, media flow, preview được bảo vệ, publish/build pipeline, parity hoặc rollback end-to-end. Sanitizer và renderer độc lập được test bằng markup mô phỏng; không cấu thành local MVP. DNS Payload không thay đổi. Track B chưa sẵn sàng không tự làm Track A NO-GO; Track A có blocker riêng.
