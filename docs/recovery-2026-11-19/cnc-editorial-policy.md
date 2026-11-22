# Nội dung CMS cho trang CNC

Hai trang `/cat-cnc-go/` và `/gia-cong-cnc-mdf/` vẫn đọc dữ liệu trang đã xuất bản từ Payload. Khi tiêu đề, mô tả, nội dung Markdown, metadata SEO và FAQ không chứa các cụm hướng dẫn gửi file/tệp/bản vẽ, frontend hiển thị nội dung đó; nếu dữ liệu cũ chưa đạt điều kiện, frontend dùng bản nội dung dịch vụ dự phòng trong mã nguồn. CTA báo giá luôn dẫn tới Zalo chính thức.

Bộ lọc trong `lib/cnc-service-editorial.ts` là hàng rào bảo vệ bảo thủ, không thể hiểu đầy đủ mọi cách diễn đạt hoặc xác minh thông tin kỹ thuật. Biên tập viên vẫn cần kiểm tra nội dung, liên kết và sự phù hợp dịch vụ trước xuất bản. Các trường hướng dẫn file cũ trong CMS không được hiển thị trên hai trang này; hướng dẫn kỹ thuật thuộc bài viết kiến thức.

Vì site được xuất tĩnh, cập nhật CMS chỉ hiển thị sau một build/deploy thành công. Hiện chưa chứng minh được trigger publish tự động trên production. Trang `/gia-cong-cnc/` vốn là route mã nguồn riêng và tiếp tục được biên tập trong mã.
