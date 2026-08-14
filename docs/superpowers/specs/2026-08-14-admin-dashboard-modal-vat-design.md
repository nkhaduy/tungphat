# Thiết kế tinh gọn dashboard Admin, popup xem đơn và VAT phần trăm

## Mục tiêu

Làm màn hình chính của Admin dễ đọc và tập trung vào xử lý thanh toán; cho phép xem nhanh báo giá mà không rời dashboard; đổi trường VAT từ số tiền tuyệt đối sang phần trăm để nhân viên chỉ cần nhập `8` hoặc `10`.

## Dashboard Admin

- Tiêu đề trang là `Cần xử lý`, không có mô tả phụ.
- Xóa toàn bộ các khối `Tình trạng xử lý`, `Nhân viên tạo nhiều báo giá nhất` và `Quản trị nhanh`.
- Giữ bốn nhóm `Cần xử lý`, `Đã cọc`, `Thanh toán một phần`, `Đã thanh toán` làm nội dung duy nhất của dashboard.
- Tăng kích thước chữ, khoảng cách, vùng bấm và độ tương phản của tab, thẻ đơn và thao tác thanh toán trên desktop lẫn mobile.
- Trong mỗi thẻ đơn, tên khách hàng là thông tin chính; mã đơn và ngày báo giá là thông tin phụ nhỏ hơn.
- Không gọi API metrics cũ từ dashboard. API và dữ liệu metrics phía server vẫn được giữ để tránh thay đổi ngoài phạm vi.

## Popup xem đơn

- Nút `Xem đơn` trên dashboard mở modal ngay trên trang, không đổi route.
- Modal tải chi tiết báo giá qua API hiện có, hiển thị thông tin khách hàng, nhân viên, chi nhánh, danh sách sản phẩm, tổng tiền, VAT, số đã nhận, số còn lại và trạng thái.
- Modal có trạng thái đang tải, lỗi có thể thử lại, nút đóng, đóng bằng phím `Escape` và click vào nền.
- Khi modal mở, nội dung nền không cuộn; focus được đưa vào modal và trả lại nút `Xem đơn` khi đóng.
- Modal chỉ đọc dữ liệu. Các nút cập nhật thanh toán tiếp tục nằm trên thẻ đơn để tránh thao tác nhầm trong bản xem nhanh.

## Điều hướng và nội dung phụ

- Bỏ mục `Lịch sử` khỏi thanh điều hướng Admin và bỏ liên kết lịch sử khỏi dashboard.
- Giữ route, API và dữ liệu audit ở backend; không xóa log và không thay đổi dữ liệu thật.
- Trang danh sách báo giá Admin không hiển thị câu `Tra cứu theo nhân viên, chi nhánh, khách hàng và trạng thái.`.

## VAT phần trăm

- Trường nhập hiển thị nhãn `Thuế VAT (%)` và chấp nhận để trống, `8` hoặc `10`.
- Để trống tương đương VAT `0%`; giao diện không tự ép hiển thị số `0` trong ô nhập.
- Cơ sở tính thuế là tổng trước thuế: `tiền hàng - chiết khấu + phí vận chuyển + phí gia công`.
- Tiền VAT được làm tròn về VND: `round(cơ sở tính thuế * vatRate / 100)`.
- Tổng thanh toán là `cơ sở tính thuế + tiền VAT`.
- Server tự tính lại tiền VAT và tổng thanh toán; không tin số tiền VAT hoặc tổng do client gửi lên.
- Lưu thêm tỷ lệ VAT để mở lại báo giá vẫn hiển thị chính xác `8` hoặc `10`. Migration chỉ thêm cột, không xóa hay ghi đè báo giá hiện có; dữ liệu cũ mặc định để trống/`0%` và giữ nguyên số tiền đã lưu.
- Preview và PDF hiển thị `Thuế VAT (8%)` hoặc `Thuế VAT (10%)` khi có tỷ lệ; không có VAT thì hiển thị `Thuế VAT` với giá trị `0 ₫` như hiện tại.

## An toàn dữ liệu

- Không xóa, sửa hàng loạt hoặc ghi đè báo giá hiện có.
- Migration chỉ mở rộng schema và có bản export D1 trước khi chạy production.
- Số lượng `quotes`, `quote_items`, `quote_versions` và `audit_logs` phải được đối chiếu trước/sau migration.
- PDF phiên bản cũ và audit log hiện có không bị thay đổi.

## Kiểm thử

- Unit test VAT trống, VAT 8%, VAT 10%, chiết khấu/phí và làm tròn VND.
- API/schema test từ chối VAT khác `0`, `8`, `10` và xác nhận server tự tính lại.
- Component test xác nhận dashboard không còn các khối cũ, tên khách hàng là chính, `Xem đơn` mở modal và không điều hướng.
- Component/routing test xác nhận mục `Lịch sử` biến mất khỏi sidebar và mô tả danh sách Admin được bỏ.
- Chạy lint, typecheck, toàn bộ test, build Pages, Wrangler dry-run, deploy production và kiểm tra desktop/mobile, console/network.
