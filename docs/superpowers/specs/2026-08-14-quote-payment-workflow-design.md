# Thiết kế luồng thanh toán và hàng đợi xử lý báo giá

## Mục tiêu

Cho phép nhân viên chọn trạng thái thanh toán ngay khi tạo/chỉnh sửa báo giá; cho phép tài khoản Admin (MR Tùng) theo dõi các đơn chưa thanh toán đủ trên màn hình chính và cập nhật nhanh trạng thái. Đơn đã thanh toán đủ không xuất hiện trong nhóm cần xử lý nhưng vẫn giữ trong lịch sử và danh sách báo giá.

## Phạm vi

- Ứng dụng `quote-app` tại `baogia.mdftungphat.com`.
- Nhân viên tạo báo giá; Admin xem và xử lý toàn hệ thống.
- Không tạo module đơn hàng riêng và không hard-code tên nhân viên.
- Giữ tương thích với dữ liệu hiện có, PDF cũ và quyền truy cập hiện tại.

## Mô hình dữ liệu

Thêm trường `payment_status` cho báo giá với các giá trị:

- `UNPAID`: chưa thanh toán.
- `DEPOSITED`: đã cọc.
- `PARTIAL`: thanh toán một phần.
- `PAID`: đã thanh toán đủ.

Trường `deposit_amount` hiện có tiếp tục là số tiền đã nhận để tránh phá vỡ dữ liệu và PDF cũ; ở giao diện mới gọi là “Số tiền đã nhận”. Dữ liệu cũ được backfill theo quy tắc: `PAID` -> `PAID`, `DEPOSITED` -> `DEPOSITED`, còn lại -> `UNPAID`.

Quy tắc bất biến:

- `0 <= deposit_amount <= grand_total`.
- `PAID` luôn có `deposit_amount = grand_total` và `remaining_amount = 0`.
- `DEPOSITED` và `PARTIAL` phải có số tiền nhận lớn hơn 0 và nhỏ hơn `grand_total`.
- `UNPAID` có số tiền nhận bằng 0.
- `CANCELLED` không được xuất hiện trong hàng đợi xử lý.

## Luồng nhân viên

Trong trang tạo/chỉnh sửa báo giá, khu vực tổng tiền có ba nút:

1. `Đã cọc`: dùng số tiền cọc đã nhập; nếu chưa nhập số tiền thì hiển thị lỗi yêu cầu nhập.
2. `Thanh toán một phần`: mở hộp thoại nhập số tiền thực nhận.
3. `Đã thanh toán`: đặt số tiền nhận bằng tổng thanh toán.

Nút trạng thái hiện tại được đánh dấu rõ; lưu báo giá gửi trạng thái và số tiền lên server. Server tính lại tổng tiền, kiểm tra bất biến và không tin số tiền/tổng tiền do client tự tính.

## Dashboard Admin

Màn hình `/admin` có hàng đợi “Đơn cần xử lý” làm nội dung chính, chia thành bốn nhóm:

- `Cần xử lý`: `UNPAID`.
- `Đã cọc`: `DEPOSITED`.
- `Thanh toán một phần`: `PARTIAL`.
- `Đã thanh toán`: `PAID`.

Mỗi dòng hiển thị mã báo giá, khách hàng, nhân viên tạo, ngày, tổng tiền, số tiền đã nhận, còn lại, trạng thái và nút `Xem đơn`. Ba nhóm chưa thanh toán đủ có thêm thao tác cập nhật trạng thái; nhóm `Đã thanh toán` chỉ để tra cứu. Sau khi cập nhật thành công, đơn chuyển sang nhóm mới mà không cần tải lại toàn trang.

API dashboard chỉ trả dữ liệu mà Admin được phép xem. API cập nhật thanh toán yêu cầu session, CSRF/mutation guard hiện có, kiểm tra trạng thái hợp lệ và ghi audit gồm actor, trạng thái cũ/mới, số tiền cũ/mới, request id và thời gian.

## Tương thích và hiển thị

- `QuoteStatus` hiện tại được giữ để không phá dữ liệu cũ; `payment_status` là nguồn hiển thị thanh toán mới.
- Bộ lọc danh sách báo giá hỗ trợ cả bốn trạng thái thanh toán.
- PDF mới hiển thị “Đã nhận” và “Còn lại”; nếu `PAID` hiển thị “ĐÃ THANH TOÁN ĐỦ” và không hiện QR thanh toán.
- PDF phiên bản cũ không bị thay đổi.

## Xử lý lỗi

- Số tiền âm, vượt tổng, không phải số nguyên VND hoặc trạng thái không khớp bị từ chối với HTTP 422.
- Cập nhật đồng thời dùng `version`/điều kiện cập nhật để trả HTTP 409 nếu báo giá đã thay đổi.
- Lỗi mạng giữ nguyên dữ liệu trên màn hình và hiển thị thông báo có thể thử lại.
- Đơn đã hủy hoặc đã xóa mềm không được cập nhật từ hàng đợi.

## Kiểm thử và kiểm tra

- Unit test quy tắc chuyển trạng thái và số tiền.
- Worker/API test cho quyền Admin, quyền Employee, backfill và audit.
- Component test cho ba nút thanh toán, hộp thoại nhập tiền và cập nhật nhóm dashboard.
- E2E test: MS Lành tạo đơn đã thanh toán -> không vào “Cần xử lý”; tạo đơn cọc/partial -> xuất hiện đúng nhóm; MR Tùng bấm `Xem đơn` và cập nhật -> đơn chuyển nhóm.
- Chạy lint, typecheck, toàn bộ test, build Pages, dry-run Wrangler, audit bảo mật và kiểm tra production desktop/mobile sau deploy.

