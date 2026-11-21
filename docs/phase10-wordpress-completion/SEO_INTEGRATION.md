# SEO — một phần

MU-plugin local xuất `tungphat_seo.title` và `description` qua REST; adapter đọc giá trị và fallback title/excerpt, metadata WordPress mode bỏ qua các override cũ. Next vẫn tạo canonical và metadata. Unit test xác minh mapping và ưu tiên. REST bài 10 trả hai trường rỗng; yêu cầu bài draft ID 32 không đăng nhập trả 401. Chưa hoàn tất thử Editor sửa/lưu/reload, build WordPress và kiểm tra HTML thực với giá trị mới. Chưa kết luận acceptance end-to-end. Không có trường social riêng; featured image được dùng khi có.
