# Kiểm thử độ tin cậy báo giá — 18/11/2026

Kết luận: **PARTIAL / chưa sẵn sàng production**. Các kiểm thử ghi dữ liệu chỉ sử dụng Worker, D1 và R2 local với tài khoản và dữ liệu giả. Không áp dụng migration từ xa; không commit, push hay deploy.

## Thay đổi vòng 2

- Giữ khóa tạo báo giá cùng tài khoản trong localStorage để bản nháp mới có thể thử lại sau khi đóng tab. Chỉ xóa khóa khi bản nháp lưu cục bộ vẫn là snapshot vừa được xác nhận; kiểm thử phản hồi thất lạc, đóng tab và tạo lại cho thấy chỉ một báo giá. Bản nháp mới vẫn dùng một khóa lưu cục bộ chung theo tài khoản: hai tab lập hai báo giá mới khác nhau có thể va chạm; cần cải tiến trước production.
- Chặn điều hướng nội bộ và Back khi form đang bẩn bằng router blocker; `beforeunload` bảo vệ reload/đóng tab. Chỉ xác nhận các đường điều hướng đã kiểm thử, chưa kiểm thử tất cả trình duyệt và thao tác hệ điều hành.
- Giới hạn request lưu 30 giây, không tự gửi lại request, giữ bản nháp khi kết quả không xác định; xóa lỗi cũ sau khi tự động lưu thành công.
- Thêm mã lỗi, request ID trong response, log tóm tắt kết quả POST/PUT; không log body, cookie hay chuỗi lỗi nội bộ. Audit mới của `QUOTE_UPDATED` chỉ ghi trạng thái, phiên bản và số dòng. Audit lịch sử và các loại audit khác chưa được làm sạch hay rà soát toàn diện.
- Không âm thầm chuyển số âm thành số dương hoặc cắt giá trị vượt giới hạn/độ chính xác; từ chối cả thao tác paste khi ô số không hợp lệ. Các trường văn bản vẫn được schema hiện có trim đầu/cuối.

Các file được sửa hoặc bổ sung trong vòng 2, tính từ trạng thái chưa commit cuối vòng 1:

- `src/client/api.ts`, `src/client/main.tsx`, `src/client/pages/QuoteEditorPage.tsx`, `src/client/components/QuoteGrid.tsx`, `src/client/styles.css`, `src/client/quote-draft.ts`, `src/client/numeric-input.ts`.
- `src/worker/auth.ts`, `src/worker/http.ts`, `src/worker/index.ts`, `src/worker/quotes.ts`.
- `tests/quote-save-regression.test.ts`, `tests/error-observability.test.ts`, `tests/numeric-validation.test.ts`, `tests/save-timeout.test.ts`, `tests/session-expiry.test.ts`.
- `scripts/test-draft-recovery-local.mjs`, `scripts/test-large-paste-local.mjs`, `scripts/test-navigation-guard-local.mjs`, `scripts/test-negative-input-local.mjs`, và báo cáo này. Script idempotency và migration `0009` được kế thừa từ vòng 1.

## Mười lăm kịch bản

| ID | Trạng thái | Bằng chứng và giới hạn |
|---|---|---|
| T01 | PASS local | Nhân viên giả đăng nhập, tạo và lưu báo giá; đọc lại từ D1. |
| T02 | PASS local | API và giao diện lưu 50/100/300/500 dòng; tên, quy cách, số lượng, đơn vị, đơn giá, ghi chú và thứ tự khớp. |
| T03 | PASS local | Dán bảng TSV qua clipboard Chrome, 50/100/300/500 dòng. Đây là dữ liệu kiểu Excel; chưa chạy ứng dụng Excel thật. |
| T04 | PASS local | Sửa giá/số lượng, đổi thứ tự, lưu, reload và đối chiếu. Sửa khi request tạo còn chờ cũng giữ được phiên bản mới. |
| T05 | PASS local | Đổi cookie phiên ở tab khác làm token cũ trả 403; form được giữ, cập nhật phiên cùng tài khoản rồi lưu. |
| T06 | PARTIAL | Test đơn vị kiểm tra token đúng thời điểm hết hạn; đăng nhập lại và phục hồi đã thử với phiên bị đổi. Chưa chờ hết 12 giờ thực tế. |
| T07 | PASS local | Chuyển browser offline trước khi lưu, không báo thành công, kết nối lại/reload giữ dữ liệu. |
| T08 | PASS local | Chặn PUT trả 500, giữ bản nháp sau reload. Inject lỗi D1 khi thêm dòng tạo 500 và không để lại header. |
| T09 | PARTIAL | Hai POST cùng khóa đồng thời chỉ có một báo giá; mất response rồi đóng tab, mở lại và chủ động lưu lại chỉ có một báo giá. Client cũ không gửi khóa và các tab khác nội dung vẫn cần xem xét. |
| T10 | PARTIAL | Reload khôi phục nháp; link nội bộ và Back có cảnh báo. Nháp của báo giá đã tồn tại chỉ bảo vệ bằng sessionStorage, đóng tab có thể mất bản sửa chưa lưu. |
| T11 | PASS local | Hai tab sửa cùng version: tab sau nhận 409, form giữ dữ liệu và bản lưu của tab đầu còn nguyên. |
| T12 | PARTIAL | Test số âm, giới hạn tiền/số lượng, quá ba chữ số thập phân; paste không nhập dở. Chưa chứng minh mọi dạng số theo locale và trình duyệt. |
| T13 | PASS local | Hai nhân viên hai chi nhánh: tài khoản B nhận 404 khi đọc/sửa báo giá A; nháp A không hiện qua UI B. |
| T14 | PASS local | Đối chiếu sản phẩm và tổng qua API/D1 local, bao gồm chiết khấu, phí, VAT, số nhận và nợ cũ. |
| T15 | PARTIAL | Xuất/tải PDF local; trích xuất xác nhận khách hàng, hai dòng hàng và tổng 370.000 khớp preview. Chưa kiểm thử hộp thoại/máy in thật và mọi tình huống QR. |

## Hiệu năng và dữ liệu

Thử clipboard Chrome local: thời gian từ nhấn lưu đến route sửa sẵn sàng xấp xỉ 0,4 giây / 2,6 giây / 10,9 giây / 19,4 giây cho 50 / 100 / 300 / 500 dòng. Paste/render tương ứng khoảng 64 / 105 / 206 / 297 ms. Đo một môi trường local, không phải SLA hoặc dữ liệu production; 300–500 dòng cần tối ưu và thử lại.

D1 batch rollback khi trigger local cố ý từ chối insert dòng. `quote_counters` tăng riêng trước batch, nên có thể có khoảng trống số. Migration 0001–0009 chạy thành công trên D1 local mới; `0009` bổ sung bảng có khóa chính `(user_id, request_key)` và không thay đổi các báo giá hiện hữu.

`quote-app`: 86 test đơn vị, typecheck, lint và build pass tại lần chạy sau thay đổi validation. Root worktree không có `npm run verify`. Root test 60/60 pass; root lint fail ở `light-cms/src/admin/screens/GbpScreen.tsx`; root typecheck và build fail do thiếu `light-cms/src/admin/screens/HomepageScreen`. Đây là phần ngoài phạm vi được giữ nguyên. Checkout chính có thay đổi chưa commit và script verify của checkout đó có bước sinh dữ liệu; chưa chạy ở đó để tránh ghi đè công việc hiện hữu.

## Chặn triển khai

- Staging và log production chưa được cung cấp/kiểm tra; chưa xác minh nguyên nhân của sự cố production thực tế hoặc tính tương thích backend production.
- Chưa có hạn sử dụng/dọn dẹp an toàn cho bản nháp chưa lưu; dữ liệu nhạy cảm vẫn có thể nằm ở localStorage trên thiết bị chung. Không tự xóa bản nháp chưa lưu.
- `sessionStorage` không bảo vệ bản sửa báo giá đã tồn tại sau đóng tab; cần thiết kế recovery bền vững và cách xử lý nhiều tab độc lập.
- Khóa idempotency là tùy chọn để tương thích client cũ; client cũ không được bảo vệ chống tạo trùng. Hai tab tạo báo giá khác nhau cùng tài khoản có thể dùng chung khóa bền vững và nhận 409; cần thiết kế định danh bản nháp độc lập.
- Chưa có dashboard/cảnh báo tỷ lệ lưu lỗi, thử timeout mạng thực tế 30 giây, mọi kịch bản in và các trình duyệt mục tiêu.

## Triển khai và rollback đề xuất — chưa thực hiện

1. Review các diff, chính sách dữ liệu nháp, quyền truy cập, test 500 dòng và các lỗi root. Chạy `npm run verify` trong môi trường phù hợp với repository production cùng toàn bộ kiểm thử ứng dụng báo giá.
2. Sao lưu D1/R2 và xác minh khả năng phục hồi; diễn tập migration 0009 trên staging có bản sao dữ liệu được phép. Áp dụng migration trước runtime mới, giữ tính tương thích client cũ và kiểm tra quyền/secret/bindings.
3. Sau deploy được người dùng cho phép, smoke test bằng tài khoản và dữ liệu kiểm thử được duyệt; theo dõi tỉ lệ 401/403/409/422/5xx và request ID, chậm/lỗi lưu, mismatch tổng, báo giá trùng.
4. Dừng rollout và rollback runtime theo phiên bản trước nếu tăng lỗi, mất dữ liệu hay sai số. Giữ bảng `quote_create_requests` và backup; không xóa bảng trong lúc rollback. Client cũ trong thời gian rollback không có bảo vệ idempotency mới. Điều tra, đối chiếu dữ liệu và chỉ phục hồi database từ backup sau khi đánh giá ảnh hưởng các ghi mới.
