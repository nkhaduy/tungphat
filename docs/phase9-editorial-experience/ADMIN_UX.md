# Admin UX local

Trước: dashboard WordPress mặc định tiếng Anh. Sau: gói ngôn ngữ WordPress tiếng Việt 7.1.4, MU-plugin bổ sung tổng quan, lọc/tìm bài, hướng dẫn và trường SEO. Số liệu lấy từ WordPress; dữ liệu thử Phase 8 vẫn hiện trong danh sách. Gutenberg và thư viện ảnh vẫn là chức năng WordPress.

Tài khoản có `manage_options` giữ menu kỹ thuật; tài khoản biên tập không có capability này được chuyển đến tổng quan gọn và ẩn Trang/Bình luận/Công cụ. Chưa kiểm thử đăng nhập role editor riêng; ẩn menu không thay thế kiểm tra quyền WordPress. Bộ lọc chỉ hiển thị tối đa 20 bài gần nhất, liên kết tất cả bài mở danh sách đầy đủ. Các trường SEO lưu được nhưng frontend chưa đọc.

Ảnh thật: [trước](evidence/admin-before.png), [tổng quan desktop](evidence/dashboard-desktop.png), [mobile](evidence/dashboard-mobile.png), [danh sách](evidence/posts.png), [Gutenberg](evidence/editor.png), [chọn ảnh đại diện](evidence/featured-media-picker.png), [SEO](evidence/seo-fields.png), [thư viện](evidence/media.png). Không có ảnh preview Next vì tính năng chưa tồn tại.

Mã nằm trong `wordpress-local/mu-plugins/`; bản local được sao chép vào `wp-content/mu-plugins/` của site Playground. Gói dịch tải từ `https://downloads.wordpress.org/translation/core/7.1.4/vi.zip` và giải nén vào `wp-content/languages/`. Khởi động lại Playground cùng đường dẫn site như Phase 8; không reset dữ liệu. Chưa đóng gói tự động cài đặt hoặc kiểm tra tương thích hosting khác.

Quản trị viên kỹ thuật có thể mở dashboard WordPress gốc bằng `wp-admin/index.php?wp-dashboard=1`; menu bảo trì vẫn còn. Tài khoản Playground mặc định tự đăng nhập admin, do đó ảnh desktop thể hiện menu kỹ thuật đầy đủ.
