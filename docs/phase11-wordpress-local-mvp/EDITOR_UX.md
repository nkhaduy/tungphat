# Kiểm thử Editor local

Đã khởi động lại Playground từ đúng thư mục dữ liệu hiện có và xác nhận ID 32, 33, 34 vẫn là draft. Một tài khoản WordPress role `Editor` riêng được tạo chỉ trên máy local. Không sử dụng tài khoản production.

## Đã quan sát trong trình duyệt

- Đăng nhập Editor thật và mở dashboard tiếng Việt: [ảnh dashboard](evidence/editor-dashboard.png). Menu hiển thị Bài viết, Thư viện, Hướng dẫn và Hồ sơ.
- Truy cập trực tiếp `plugins.php`, `themes.php`, `options-general.php` bằng phiên Editor đều trả HTTP 403. Đây là kiểm tra quyền phía server, không chỉ kiểm tra menu.
- Tạo bài thử riêng ID 45 bằng Gutenberg, nhập tiêu đề và đoạn văn, lưu draft: [trình soạn thảo](evidence/gutenberg-editor.png). Bài thử không phải ba bản biên tập chờ duyệt.
- Nhập SEO title/description và lưu; WordPress REST `context=edit` trả đúng hai giá trị và sau reload Gutenberg hai trường vẫn giữ nguyên: [trước khi lưu](evidence/seo-before-save.png), [sau reload](evidence/seo-after-reload.png). Chưa coi đây là bằng chứng SEO đã tới HTML public.
- Mở thư viện media, upload ảnh thử local, nhập alt và caption, chọn ảnh đại diện, lưu nháp. REST trả featured media ID 48 và đúng alt/caption: [upload](evidence/media-upload.png), [ảnh đại diện](evidence/featured-image.png). Các ảnh này là ảnh thử, không phải asset được duyệt cho bài production.

## Chưa hoàn tất

Native preview đã được thử bằng trình duyệt; draft thử ID 45 có thêm ảnh inline, caption và bảng để xác nhận hiển thị trong Next, như báo cáo preview ghi nhận. Việc tìm kiếm/lọc dashboard, tạo heading, bảng và ảnh inline hoàn toàn bằng thao tác giao diện chưa được xác nhận đầy đủ. Publish/update/unpublish tự động, trạng thái build hiển thị rõ trong WordPress và SEO → HTML cần bằng chứng riêng. Hướng dẫn hiện còn câu mô tả kết nối SEO cũ; cần đồng bộ hướng dẫn với hành vi đã kiểm chứng trước khi coi UX hoàn tất.

Ảnh chụp là bằng chứng từng bước quan sát, không phải xác nhận toàn bộ hành trình biên tập đạt.
