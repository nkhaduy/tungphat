# Kiểm tra lại độ tin cậy báo giá — 18/11/2026

Trạng thái: **PARTIAL / chưa xác nhận sẵn sàng production**. Không commit, push, deploy, chạy migration production hoặc thay đổi dữ liệu kinh doanh production.

## Production và Git

- Cloudflare Pages `tungphat-quotes` liệt kê deployment production mới nhất `216cedd1-478d-403a-b98f-161a8fe85d9e`, source `9f1d0a6`, nhánh deployment `main`. HTML deployment và `baogia.mdftungphat.com/login` có cùng SHA-256. Bundle đang phục vụ là `index-qkvn8crb.js`, SHA-256 `17ec8d705c948404879f6500b8e5935bde96a37aa30e609a2208203164ef12a5`.
- Git HEAD local `9f1d0a6524131a03be980b31fe1c823547ea1cb3`; các sửa lỗi vẫn chưa commit trên `codex/quote-save-reliability`. `git ls-remote` không tìm thấy nhánh sửa lỗi trên origin. Production chưa chứa các thay đổi chưa commit.
- Hai SELECT chỉ đọc trên D1 production trả migration 0001–0008; không có bảng `quote_create_requests` của migration 0009. Metadata trả `changed_db: false`, `rows_written: 0`.

## Lỗi mới được tái hiện và sửa

1. Gõ `1,125` từng phím ở số lượng thành `1125`: giữ chuỗi đang nhập trong ô cho tới khi rời ô, nhưng lưu state số 1.125. Playwright gõ từng phím, lưu, đọc lại số lượng và thành tiền thành công.
2. Khôi phục nháp chỉnh sửa tự gửi PUT sau 1,8 giây: nháp khôi phục nay yêu cầu lưu chủ động; Playwright xác nhận không có PUT tự động.
3. Nháp chỉnh sửa mất khi đóng tab: thêm bản nháp bền vững theo tài khoản/báo giá/lần mở editor, lựa chọn khôi phục thủ công và xóa có xác nhận. Hai tab giữ hai bản nháp riêng trong test local. Hiển thị tuổi trên 30 ngày; không tự xóa nội dung chưa lưu. Bản nháp là dữ liệu không mã hóa trên trình duyệt dùng chung.
4. Hai báo giá mới cùng tài khoản dùng chung khóa tạo: bản nháp mới có khóa riêng và lưu khóa cùng nội dung trước POST. Hai POST khác nội dung từ hai tab tạo hai báo giá riêng trong test local; mất response, đóng tab, khôi phục và lưu lại chỉ có một báo giá. Dữ liệu/khóa định dạng cũ vẫn được xử lý khi có thể.
5. Chuyển từ nháp đã tạo sang nháp mới có thể dùng nhầm ID và ghi đè báo giá cũ. Test trước sửa tái hiện; sau sửa bản cũ và bản mới tồn tại độc lập.

Các bài kiểm thử local có thể chạy lại với tài khoản local giả qua `scripts/test-decimal-quantity-local.mjs`, `test-recovered-draft-local.mjs`, `test-edit-drafts-local.mjs`, `test-new-drafts-local.mjs`, `test-switch-drafts-local.mjs`, `test-create-update-recovery-local.mjs`, `test-draft-recovery-local.mjs`, `test-idempotency-local.mjs`, `test-navigation-guard-local.mjs` và `test-negative-input-local.mjs`. Một số tình huống audit sâu được kiểm thử bằng script tạm trong phiên và không phải bộ E2E tự động toàn diện.

## Xác minh

- Quote app: 87 tests pass, typecheck, lint, build và `build:pages` dry-run pass sau các thay đổi. Migration 0001–0009 áp dụng thành công trên D1 local mới.
- Repository root nhánh này: không có script `verify`; 60 tests pass. Lint fail ở `light-cms/src/admin/screens/GbpScreen.tsx`. Typecheck và build fail do thiếu `light-cms/src/admin/screens/HomepageScreen`; không sửa module ngoài phạm vi. Typecheck phải chạy riêng sau build để tránh đua với `.next/types`.
- Test local đã chạy: CSRF 403 khi cookie phiên đổi; same-user reauth; hai nhân viên khác chi nhánh không truy cập chéo; 409 hai tab; mất kết nối; response tạo thất lạc; 500 và D1 batch rollback; dán 50/100/300/500 dòng; preview và PDF giả. Một số kết quả nêu trong báo cáo vòng 2 cần chạy lại trên bản code cuối cùng và nhiều trình duyệt.
- Production logs lịch sử và staging chưa được kiểm tra. Chưa chứng minh mọi lỗi gốc trên production đã được loại bỏ.

Kết quả mới nhất theo bộ T01–T15, trên local: T01–T05 PASS trong kịch bản đã thử; T06 PARTIAL (chưa chờ hết 12 giờ thực tế); T07–T08 PASS trong kịch bản đã thử; T09 PARTIAL (client cũ không gửi khóa); T10 PARTIAL (đã thử nháp mới và nháp chỉnh sửa sau đóng tab, chưa thử mọi trình duyệt/sự cố storage); T11 PASS trong kịch bản đã thử; T12 PARTIAL (đã bổ sung gõ số thập phân, chưa bao phủ mọi định dạng); T13–T14 PASS trong kịch bản đã thử; T15 PARTIAL (PDF đã đối chiếu, chưa thử máy in thật và mọi trường hợp QR).

## Điều kiện còn lại trước production

1. Chạy đầy đủ test hồi quy, `npm run verify` trong đúng phiên bản repository production và xử lý các lỗi root; triển khai staging và kiểm thử đầu cuối thực tế.
2. Rà soát thiết kế nháp trên thiết bị dùng chung, khả năng xung đột/định dạng cũ, quyền tài khoản, dung lượng storage, hành vi xóa thủ công và test đa trình duyệt. Cảnh báo bản nháp trên 30 ngày và nút xóa là thủ công; chưa có chính sách tự động hết hạn được triển khai. Tài liệu rollback cần tính đến nháp mới khi quay về client cũ.
3. Tối ưu hoặc chấp nhận có cơ sở hiệu năng 300–500 dòng; lần đo trước khoảng 11 và 19,5 giây từ bấm lưu tới trang sửa sẵn sàng trên Chrome local, không phải SLA production.
4. Client cũ không gửi idempotency key; sau nâng cấp runtime vẫn tồn tại rủi ro tạo trùng từ client cũ. Theo dõi và xử lý trước khi tuyên bố bảo đảm toàn bộ hệ thống.
5. Xác minh backup D1/R2 và diễn tập khôi phục. Review migration 0009 và áp dụng trước runtime mới sau khi được phép; giữ bảng khi rollback runtime. Kiểm tra cookie, binding, secret, version, quyền và truy cập staging.
6. Sau khi sẵn sàng và được phép deploy: smoke test bằng tài khoản/dữ liệu được duyệt; theo dõi tỉ lệ 401/403/409/422/5xx, độ trễ, data mismatch và duplicate. Dừng rollout/rollback runtime nếu có mất dữ liệu hoặc sai tiền; không tự phục hồi đè database khi chưa đánh giá dữ liệu mới.
