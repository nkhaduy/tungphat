# Thiết lập WordPress local — chưa được kiểm chứng

Máy tại thời điểm làm việc không có Docker, PHP, MySQL/MariaDB hoặc WP-CLI. `wordpress-local/compose.yaml` và `.env.example` chỉ là cấu hình chuẩn bị, chưa được khởi chạy hoặc xác thực. Khi có Docker, sao chép `wordpress-local/.env.example` thành `.env`, đặt hai mật khẩu ngẫu nhiên khác nhau, rồi chạy `docker compose --env-file .env up -d` trong thư mục `wordpress-local`; truy cập `http://127.0.0.1:8088`. Chỉ tạo tài khoản thử nghiệm. Không dùng thông tin production. Không đưa `.env` vào Git. Local HTTP không đáp ứng yêu cầu HTTPS của staging.

Chưa có tích hợp preview, webhook hay migration để sử dụng sau khi cài. Không sửa DNS `cms.mdftungphat.com`: hostname này đang phục vụ Payload. Chưa chọn hosting WordPress, media origin hay hạ tầng queue/preview.

Adapter Phase 6 hiện chỉ chấp nhận base URL HTTPS; chưa có đường kết nối HTTP localhost được kiểm soát, nên cấu hình Compose một mình chưa tạo thành luồng tích hợp. Cần giải quyết ranh giới local an toàn và kiểm thử thực trước khi sử dụng.
