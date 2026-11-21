# Kiểm tra sơ bộ content gap — 19/11/2026

Các URL có HTTP 200 trên production tại thời điểm kiểm tra. HTTP 200 chỉ xác nhận khả dụng; chưa kiểm tra đầy đủ chất lượng, độ sâu, trùng lặp, technical accuracy, noindex hay search demand. Ưu tiên dưới đây là ưu tiên kiểm tra tiếp, không phải kết luận đã có gap được chứng minh.

| Topic | Search Intent | Existing URL | Gap | Priority | Recommendation |
|---|---|---|---|---|---|
| MDF | Tìm hiểu và chọn ván | /van-mdf/ | Chưa đánh giá chiều sâu | P1 | Đối chiếu đặc tính, ứng dụng và thông số có nguồn |
| MDF chống ẩm | Chọn theo môi trường | /mdf-chong-am/ | Chưa đánh giá giới hạn chống ẩm | P1 | Kiểm tra cách phân biệt chống ẩm/chống nước |
| MFC / Okal | Hiểu vật liệu, chọn sản phẩm | /van-mfc/, /van-okal/ | Chưa đánh giá trùng lặp và kỹ thuật | P1 | So sánh nội dung hai trang, làm rõ cốt và lớp phủ |
| Gỗ ghép | Chọn vật liệu | /go-ghep/ | Chưa đánh giá chiều sâu | P2 | Kiểm tra ứng dụng và các loại công bố |
| So sánh vật liệu | So sánh trước khi mua | /van-mdf/, /van-hdf/, /van-mfc/ | Chưa kiểm kê hết bài so sánh | P1 | Lập danh sách bài hiện có, bổ sung chỉ khi có bằng chứng |
| Bề mặt phủ | Phân biệt bề mặt | /melamine/, /laminate/, /acrylic/, /tam-veneer/ | Chưa đánh giá chiều sâu | P2 | Kiểm tra phân biệt cốt và bề mặt, liên kết catalogue |
| Mã màu, catalogue | Tìm mã theo nhà cung cấp | /catalogue/ | Chưa kiểm tra toàn bộ nhà cung cấp và mã | P1 | Kiểm tra mẫu mã, canonical và tình trạng không đồng nhất tồn kho |
| CNC | Tìm dịch vụ | /gia-cong-cnc/, /cat-cnc-go/, /gia-cong-cnc-mdf/ | Có hướng dẫn gửi file trong trang dịch vụ, trái yêu cầu hiện tại | P1 | Chuyển trọng tâm sang dịch vụ, liên hệ Zalo và bài kiến thức |
| Báo giá | Liên hệ mua hoặc gia công | /bao-gia/, /lien-he/ | Chưa kiểm tra đầy đủ CTA | P1 | Kiểm tra luồng Zalo và tránh giá không có căn cứ |
| Ứng dụng nội thất | Chọn vật liệu theo hạng mục | /bai-viet/, /van-mdf/ | Chưa kiểm kê bài theo ứng dụng | P2 | Đối chiếu bài và nguồn thực tế trước khi đề xuất mới |
| Nhà cung cấp địa phương | Tìm đơn vị gần địa điểm | /lien-he/ | Chưa kiểm tra mức bao phủ và trùng lặp địa phương | P2 | Chỉ đề cập khu vực có bằng chứng kinh doanh |

Phân loại tốt/thiếu chiều sâu/thiếu kỹ thuật/trùng lặp/chưa có/ngoài phạm vi cần kiểm tra nội dung từng trang và dữ liệu kinh doanh; không phân loại từ HTTP status.

## Bổ sung đối chiếu HTML production ngày 19/11

- **MDF/HDF — khả năng chồng intent:** `/van-mdf/` đang có H1 “Ván MDF – HDF” trong khi `/van-hdf/` có H1 riêng “Ván HDF”. Đây là tín hiệu cần so sánh nội dung và truy vấn thực tế trong Search Console, chưa đủ chứng minh cannibalization. Nên làm rõ vai trò MDF của trang đầu và dẫn có ngữ cảnh sang HDF.
- **MFC/Okal — khả năng chồng intent:** `/van-mfc/` và `/van-okal/` có H1 tương ứng “Ván MFC” và “Ván Okal – MFC (Ván dăm)”; cần đối chiếu nội dung, truy vấn và phân biệt cốt ván dăm với lớp phủ trước khi quyết định gộp hay sửa. Chưa đề xuất redirect.
- **Chiều sâu nội dung vật liệu:** các trang MDF, MDF chống ẩm, MFC, Okal, HDF, Melamine, Laminate, Acrylic và Veneer đều có các nhóm H2 “Cấu tạo và đặc điểm”, “Ứng dụng thường gặp”, “Lưu ý khi lựa chọn”. Cấu trúc này giúp tra cứu nhưng chưa tự chứng minh nội dung đủ sâu; ưu tiên đọc và kiểm chứng kỹ thuật cụ thể ở MDF chống ẩm và MFC/Okal.
- **Gỗ ghép:** `/go-ghep/` có mục riêng chọn cao su/tràm và hạng mục CNC; kiểm tra tiếp bài và các trang con trước khi đề xuất nội dung mới.
- **Catalogue:** `/catalogue/` hiển thị các nhóm Thanh Thuỳ, An Cường và Ba Thanh; cần kiểm tra mẫu mã từng nguồn và tránh diễn giải mã màu là xác nhận tồn kho.
- **Liên kết nội bộ:** cả 10 trang vật liệu được lấy mẫu đều có link đến catalogue, bài viết và CNC trong HTML toàn trang. Điều này có thể đến từ điều hướng/footer; chưa chứng minh có liên kết theo ngữ cảnh trong nội dung chính, cần kiểm tra từng vị trí trước khi bổ sung.
- **CNC:** production vẫn có các H2 về chuẩn bị file trên cả ba route; thay đổi local chuyển sang mô tả dịch vụ và CTA Zalo, chưa được deploy.
- **Kiến thức:** `/bai-viet/` đang hiển thị các bài về chuẩn bị CNC, gỗ ghép và so sánh MDF thường/chống ẩm. Đề xuất kiểm kê toàn bộ bài trước khi tạo bài so sánh MFC/MDF hoặc bề mặt phủ; chỉ triển khai nếu nội dung mới giải đáp nhu cầu chưa được đáp ứng và có nguồn kiểm chứng.
- **Địa phương và giá:** `/lien-he/` hiển thị hai chi nhánh, `/bao-gia/` có mục thông tin báo giá. Không suy diễn địa bàn khác, giá cố định hoặc tồn kho từ sự hiện diện của các trang.

## Đánh giá nội dung đã đọc

| Topic | Search Intent | Existing URL | Gap / phân loại | Priority | Recommendation |
|---|---|---|---|---|---|
| MDF và HDF | Tìm hiểu, chọn cốt ván | /van-mdf/, /van-hdf/ | Có nội dung hữu ích; hai trang cùng giải thích MDF/HDF, có khả năng chồng chủ đề | P1 | Định vị trang MDF theo nhu cầu chọn MDF; dùng trang HDF cho HDF và liên kết chéo. Chưa đổi URL khi chưa xem truy vấn thực tế. |
| MDF chống ẩm | Chọn cốt theo môi trường | /mdf-chong-am/ | Có cấu tạo, ứng dụng, giới hạn; thông tin LMR/MMR/HMR cần tra theo từng hãng, không có bảng đối chiếu xác minh | P1 | Chỉ bổ sung bảng hãng/dòng khi có tài liệu nhà sản xuất; giữ cảnh báo không ngâm nước. |
| MFC và Okal | Phân biệt cốt, lớp phủ | /van-mfc/, /van-okal/ | Cả hai giải thích MFC là ván dăm phủ Melamine; có trùng chủ đề tiềm năng | P1 | Trang Okal giải thích cốt mộc, trang MFC tập trung ván phủ và chọn mã; kiểm tra Search Console trước quyết định gộp. |
| Gỗ ghép | Chọn cao su/tràm | /go-ghep/, /bai-viet/go-ghep-la-gi/ | Có trang mua hàng và bài giải thích; chưa xác nhận độ sâu theo ứng dụng hay truy vấn | P2 | Liên kết bài giải thích với trang loại gỗ; ưu tiên ví dụ chọn theo hạng mục có nguồn. |
| So sánh vật liệu | Chọn cốt và bề mặt | /bai-viet/mdf-thuong-va-chong-am/, /van-mfc/, /van-okal/ | Đã có so sánh MDF thường/chống ẩm; chưa xác nhận bài so sánh MFC/MDF riêng trong toàn bộ kho | P1 | Kiểm kê toàn bộ bài, chỉ bổ sung so sánh MFC/MDF nếu chưa có và có chứng cứ kỹ thuật. |
| Melamine và Laminate | Phân biệt bề mặt | /melamine/, /laminate/ | Cả hai đã giải thích cách phủ và chọn mẫu; thiếu so sánh tập trung theo từng hạng mục trong mẫu đọc | P2 | Liên kết chéo và giải thích khác biệt theo tài liệu nhà sản xuất, không tự gán độ bền. |
| Acrylic và Veneer | Tìm hiểu ứng dụng và hoàn thiện | /acrylic/, /tam-veneer/ | Có nội dung về cốt, bề mặt và xử lý cạnh; thông số theo dòng chưa có trong mẫu đọc | P2 | Dẫn tới catalogue hoặc tài liệu nguồn theo từng dòng thay vì công bố thông số chung. |
| Catalogue / mã màu | Tra mã, chọn mẫu | /catalogue/ | Có ba nhóm nhà cung cấp; mã không chứng minh tồn kho hoặc đúng cốt | P1 | Tăng đường dẫn theo ngữ cảnh từ trang bề mặt tới nhóm nhà cung cấp sau khi kiểm tra vị trí link chính. |
| CNC, cắt và dán cạnh | Tìm dịch vụ, hỏi giá | /gia-cong-cnc/, /cat-cnc-go/, /gia-cong-cnc-mdf/ | Production còn tập trung checklist; bản local đã sửa nhưng chưa phát hành | P1 | Kiểm chứng nội dung, CTA và phát hành sau khi đạt gate; hướng dẫn chi tiết đặt trong bài kiến thức. |
| Giá | Hỏi báo giá | /bao-gia/ | Có các yếu tố ảnh hưởng giá; không có bảng giá xác thực | P1 | Giữ liên hệ để xác nhận; không bịa giá, kiểm tra CTA Zalo. |
| Ứng dụng nội thất | Chọn theo tủ, bàn, kệ | /van-mdf/, /van-mfc/, /bai-viet/ | Có ví dụ ứng dụng nhưng chưa kiểm kê hết bài chuyên sâu | P2 | Ưu tiên các tình huống lựa chọn có thông tin tải, khoảng đỡ và môi trường được xác minh. |
| Địa phương | Tìm đơn vị và chi nhánh | /lien-he/ | Có hai điểm liên hệ công bố; chưa có bằng chứng để phủ thêm địa phương | P2 | Dùng địa chỉ đã xác minh, tránh tạo hàng loạt trang địa danh. |
| Ngoài phạm vi | Năng lực, chứng nhận chưa được công bố | Chưa xác định | Không đủ căn cứ kinh doanh/nhà sản xuất | P0 | Không công bố các cam kết, tiêu chuẩn hoặc dịch vụ chưa được xác minh. |

Các phân loại trên dựa trên mẫu nội dung HTML đã đọc, không thay thế dữ liệu hiệu suất tìm kiếm, thông tin kho hay xác nhận kỹ thuật nhà sản xuất. Những nhận định trùng lặp mới là nghi vấn, không phải kết luận từ dữ liệu GSC.
