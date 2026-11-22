# Hệ thống sản phẩm — chỉnh sửa danh mục 03/11/2026

## Phạm vi

Danh mục chính dùng một registry chung, thứ tự: Ván MDF – HDF (`/van-mdf/`), MDF chống ẩm (LMR – MMR – HMR) (`/mdf-chong-am/`), Ván Okal – MFC (Ván dăm) (`/van-okal/`), Ván ép – Plywood (`/van-plywood/`), Gỗ ghép cao su (`/go-ghep-cao-su/`), Melamine (`/melamine/`), Laminate (`/laminate/`), Ván phủ Veneer (`/tam-veneer/`), Ván nhựa (`/van-nhua-pvc/`), Chỉ dán cạnh (`/chi-nep-nhua/`). Chi tiết file ảnh, nguồn và quyền xem [media-table.md](media-table.md) và `data/product-media.json`.

Các trang `/van-hdf/`, `/van-mfc/`, `/plywood-phu-melamine/`, `/go-ghep-tram/`, `/acrylic/`, `/pvc-film-pet/` được giữ làm tài liệu phụ, không thêm card chính hoặc redirect. Các trang được liên kết từ nhóm có liên quan. Trang thuộc CMS vẫn phụ thuộc trạng thái công khai; nếu CMS rút trang, frontend không tự xuất bản lại. Không có dữ liệu traffic thực tế trong repository để kết luận mức truy cập của từng URL.

MDF/HDF và Okal/MFC được phân biệt trong phần giới thiệu và cấu tạo. Các trang còn lại giữ nội dung riêng về cấu tạo, ứng dụng và lựa chọn; CTA dùng hệ thống báo giá và Zalo hiện có. Plywood có ảnh cốt nhiều lớp phủ Melamine và ảnh mặt tấm; gallery dùng nút chọn ảnh, không tự chạy. Ảnh Melamine được thay bằng ảnh nguồn Thanh Thùy 1080×738, không nội suy lên cỡ lớn hơn.

## Kiểm tra

- Trình duyệt local ở 1440 và 390 px: 10 card homepage đúng thứ tự; kiểm tra 10 trang có phản hồi 200, H1 và canonical, không phát hiện tràn ngang hoặc lỗi JavaScript trong lượt quét. Các nút gallery Plywood đã được thử ở hai kích thước trước khi đổi thứ tự ảnh.
- Trên bản build tĩnh: 28/28 Playwright cho trang sản phẩm đạt, bao gồm canonical sau refresh, ảnh, breadcrumb, CTA, gallery và axe mẫu ở hai kích thước. Menu desktop và mobile đã được đối chiếu đủ 10 nhóm. Bộ catalogue: 29/29 Playwright đạt, gồm tìm kiếm và lọc.
- `npm test`: 732 test đạt trong lần verify. Kiểm tra taxonomy cũng xác nhận ảnh chính có file và nguồn được phép; điều này không thay thế kiểm tra nội dung hình thực tế.
- `npm run verify` chạy lại tuần tự: exit 0; lint, typecheck, test, CMS, build và kiểm tra link đều đạt. Build tĩnh chạy lại sau thay đổi key gallery cũng exit 0. 3.592 HTML được quét, không có liên kết nội bộ lỗi; 2.664 URL sitemap hợp lệ; structured data của 3.591 trang hợp lệ.
- Screenshot: `evidence/corrective-home-1440.png`, `evidence/corrective-home-390.png`, `evidence/corrective-plywood-1440.png`, `evidence/corrective-plywood-390.png`.

## Giới hạn còn phải kiểm tra

Trang tràm là trang CMS cũ ngoài 10 nhóm chính; chưa có ảnh tràm phù hợp từ hai nguồn được chỉ định. Record hướng dẫn này hiện không vượt yêu cầu ảnh bắt buộc của `productSchema` và được kiểm thử ghi nhận rõ, không dùng ảnh cao su thay thế. Việc ảnh Melamine và Laminate có phải ảnh chụp gốc hay là ảnh dựng trong catalogue nhà cung cấp chưa xác minh độc lập; manifest ghi nguồn, không suy diễn xuất xứ. Chưa chạy Lighthouse hoặc đo Core Web Vitals. CTA được kiểm tra đích liên kết, không gửi yêu cầu báo giá thực. Chưa thể xác nhận ảnh catalogue Laminate và Melamine có phải ảnh chụp thực tế hay ảnh dựng; cần xác minh với chủ ảnh trước khi khẳng định đáp ứng yêu cầu ảnh thật.

Không commit, push hoặc deploy production.

## Cập nhật theo phản hồi về nội dung và hình ảnh

Ảnh Chỉ dán cạnh được thay bằng ảnh người dùng đính kèm trực tiếp, lưu bản gốc tại `sanpham-media/sources/chi-dan-canh-user.png` và tạo bản WebP responsive. Nội dung của 16 trang vật liệu được viết lại theo giọng tư vấn dễ đọc hơn; hai card cuối được căn giữa trên lưới desktop.
