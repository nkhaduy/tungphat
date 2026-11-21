# WordPress blog — Phase 7

**NOT READY.** Chưa có WordPress thực, kết nối provider, import, media library, preview hay publishing pipeline end-to-end. Website vẫn sử dụng Payload; không bật nguồn WordPress và không thay đổi catalogue.

Phần làm được trong source: `lib/wordpress/sanitize.ts` lọc HTML bằng allowlist; `components/content/WordPressArticleBody.tsx` render nội dung đã lọc, báo lỗi nếu sanitizer trả cảnh báo. Đây là component thử nghiệm độc lập, chưa được gắn vào route. Test dùng markup mô phỏng, không chứng minh tương thích Gutenberg thật hoặc an toàn đầy đủ. Chưa có xử lý responsive `srcset` (được báo để kiểm tra), taxonomy, SEO fields, media hay block parity. Nội dung có block không hỗ trợ phải được xử lý trước khi gắn vào build.

`wordpress-local/compose.yaml` chuẩn bị WordPress và MySQL riêng, bind 127.0.0.1. Chưa chạy hoặc xác nhận image/compose do máy không có Docker, PHP, MySQL/MariaDB hay WP-CLI. Không có WordPress local hoặc staging đã được tạo.
