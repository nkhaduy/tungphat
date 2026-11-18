# MDF Tùng Phát — Topical Map & editorial backlog (18/11/2026)

**Trạng thái:** kế hoạch biên tập, CHƯA phải danh sách keyword đã xác nhận nhu cầu bằng GSC/Keyword Planner. Không tự gán volume, thứ hạng, giá hoặc tồn kho. Mọi bài phải kiểm chứng bởi Tùng Phát trước khi xuất bản. Số ý tưởng: **86** (MDF: 20; MFC / VÁN DĂM: 18; GỖ GHÉP: 20; CATALOGUE / BỀ MẶT / MÃ MÀU: 20; CNC / GIA CÔNG: 8).

## Nguyên tắc triển khai

- Trang Core là trang sản phẩm / catalogue / dịch vụ hiện có; bài Outer ở `/bai-viet/<slug>/` hỗ trợ chọn mua và liên kết về Core. Không tạo một URL mới nếu ý định tìm kiếm giống hẳn trang đã có. `UPD` là tối ưu bài đã tồn tại, không tạo bản sao.
- Bài trả lời trực tiếp ngay đầu (50–90 từ), sau đó bảng so sánh/giới hạn/ứng dụng; ít nhất một liên kết đến nguồn kỹ thuật chính thức, một liên kết Core, một liên kết bài có liên quan; CTA cuối bài **'Yêu cầu báo giá qua Zalo'** trỏ đến `https://zalo.me/0909259160`.
- Phân biệt dữ liệu kỹ thuật chung với tồn kho, giá, mã màu: số liệu thương hiệu phải kiểm chứng theo SKU và ngày, không suy diễn rằng mọi mã đều có sẵn hoặc áp dụng cho mọi cốt.
- Không có form, upload, chatbot thu thập khách hàng, trang tính báo giá hoặc hướng dẫn gửi file trên trang dịch vụ CNC.
- Không spin/copy nội dung đã crawl; chỉ trích xuất facts được kiểm chứng và viết góc nhìn có ích cho khách hàng Tùng Phát. Với bài cần trải nghiệm thực tế, thêm ảnh/quan sát của xưởng trước xuất bản.
- `P1` = ưu tiên thương mại hoặc nội dung nền tảng; `P2` = mở rộng sâu; `UPD` = cập nhật bài đã có. `I` = information; `C` = commercial research; `N` = navigation/catalogue. Đây là ưu tiên biên tập, **không** phải kết quả đo search volume.

## Phân quyền URL và tránh cannibalization

- `/van-mdf/`: mô tả vật liệu, loại cốt, ứng dụng, CTA Zalo; `/mdf-chong-am/`: sản phẩm chống ẩm. Bài blog chỉ giải thích câu hỏi chuyên sâu, không lặp lại trang bán hàng.
- `/van-mfc/`: tổng quan MFC; `/van-okal/`: ván dăm chưa phủ và quan hệ với MFC, tránh hai trang cùng target 'MFC là gì' không phân biệt.
- `/go-ghep/`: hub; `/go-ghep-cao-su/`, `/go-ghep-tram/`: nhóm hàng. Bài phân loại theo lựa chọn, kỹ thuật, ứng dụng.
- `/catalogue/`: công cụ tra mã; các nhánh An Cường, Thanh Thuỳ, Ba Thanh làm hub. Bài blog không nhân bản hàng nghìn trang cho từng biến thể từ khóa/mã; chỉ tạo trang mã riêng nếu có dữ liệu xác thực đủ khác biệt.
- `/gia-cong-cnc/`: nêu phạm vi, vật liệu, yếu tố chất lượng, Zalo báo giá; chi tiết kỹ thuật để blog xử lý.

## Backlog theo ngách

| Nhóm | Chủ đề / H1 dự kiến | Slug bài viết | Intent | Ưu tiên | Trang Core nhận link |
|---|---|---|---|---|---|
| MDF | MDF là gì: cấu tạo và ứng dụng | `mdf-la-gi` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF và HDF khác nhau thế nào | `so-sanh-mdf-hdf` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF và plywood: chọn theo hạng mục | `so-sanh-mdf-plywood` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF 9mm, 12mm, 15mm, 17mm, 18mm dùng khi nào | `do-day-van-mdf` | C | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | Kích thước tấm MDF phổ biến và sai số cần kiểm tra | `kich-thuoc-van-mdf` | C | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF thường và MDF chống ẩm: chọn theo môi trường | `mdf-thuong-va-chong-am` | I | UPD | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF chống ẩm có chống nước không | `mdf-chong-am-co-chong-nuoc-khong` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | Cốt MDF lõi xanh có đồng nghĩa chống ẩm tốt không | `mdf-loi-xanh-la-gi` | I | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF E0, E1 và tiêu chuẩn phát thải: đọc đúng chứng chỉ | `mdf-e0-e1-phat-thai` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF phủ Melamine: cốt và mã bề mặt là hai thông tin khác nhau | `mdf-phu-melamine` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF phủ Laminate: khi nào cần | `mdf-phu-laminate` | I | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF phủ Acrylic: ưu nhược theo vị trí | `mdf-phu-acrylic` | I | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF sơn PU hay phủ Melamine | `mdf-son-pu-hay-melamine` | I | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF dùng cho tủ bếp: cánh, thùng và khu vực gần nước | `mdf-lam-tu-bep` | C | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF làm tủ quần áo có phù hợp không | `mdf-lam-tu-quan-ao` | C | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF làm kệ sách: độ dày và nhịp đỡ | `mdf-lam-ke-sach` | C | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF làm vách, lam trang trí: điều kiện sử dụng | `mdf-lam-vach-trang-tri` | C | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF bị phồng mép: nguyên nhân và cách hạn chế | `mdf-bi-phong-mep` | I | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | MDF bị cong võng: nguyên nhân và điểm cần kiểm tra | `mdf-bi-cong-vong` | I | P2 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MDF | Những yếu tố tạo chênh lệch giá ván MDF | `yeu-to-anh-huong-gia-mdf` | C | P1 | /van-mdf/ (phụ: /mdf-chong-am/) |
| MFC / VÁN DĂM | MFC là gì: phân biệt với ván dăm chưa phủ | `mfc-la-gi` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC và MDF: khác nhau ở cốt và bề mặt | `so-sanh-mfc-mdf` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Ván Okal và MFC có phải một loại không | `van-okal-va-mfc` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC phủ Melamine được cấu tạo ra sao | `mfc-phu-melamine` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC chống ẩm khác MFC thường như thế nào | `mfc-chong-am` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC E1, E0: chứng chỉ áp dụng cho sản phẩm nào | `mfc-e1-e0` | I | P2 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Độ dày MFC phổ biến và cách chọn | `do-day-van-mfc` | C | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Khổ ván MFC: lưu ý khi đọc catalogue | `kho-van-mfc` | C | P2 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC có dùng làm tủ bếp được không | `mfc-lam-tu-bep` | C | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC làm tủ quần áo: điểm mạnh và giới hạn | `mfc-lam-tu-quan-ao` | C | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC làm bàn làm việc, kệ hồ sơ | `mfc-lam-ban-lam-viec` | C | P2 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC bị trương nở cạnh: nguyên nhân | `mfc-bi-truong-no-canh` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Dán chỉ cạnh MFC: vì sao quan trọng | `dan-chi-canh-mfc` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC và MDF phủ Melamine: đọc đúng tên sản phẩm | `mfc-va-mdf-phu-melamine` | I | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | MFC vân gỗ hay màu trơn cho nội thất | `mfc-van-go-hay-mau-tron` | I | P2 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Vít trên ván dăm: các yếu tố ảnh hưởng độ bám | `vit-tren-van-dam` | I | P2 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Các yếu tố ảnh hưởng giá ván MFC | `yeu-to-anh-huong-gia-mfc` | C | P1 | /van-mfc/ (phụ: /van-okal/) |
| MFC / VÁN DĂM | Mua MFC theo mã: phân biệt mã màu, cốt, độ dày | `mua-mfc-theo-ma` | C | P1 | /van-mfc/ (phụ: /van-okal/) |
| GỖ GHÉP | Gỗ ghép là gì: nguyên lý và cách nhìn tấm | `go-ghep-la-gi` | I | UPD | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép cao su và tràm: cách chọn | `so-sanh-go-ghep-cao-su-tram` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép thanh và gỗ nguyên tấm: khác biệt | `go-ghep-va-go-nguyen-tam` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép AA, AB, AC, BC: kiểm tra cách phân hạng | `phan-hang-go-ghep-aa-ab-ac` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép finger joint và ghép song song | `finger-joint-va-ghep-song-song` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép ngang và ghép dọc: đọc đúng mối ghép | `go-ghep-ngang-ghep-doc` | I | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép cao su làm mặt bàn có phù hợp không | `go-ghep-cao-su-lam-mat-ban` | C | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép tràm làm kệ, tủ nội thất | `go-ghep-tram-lam-ke-tu` | C | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Độ dày gỗ ghép 12, 15, 18, 20, 25mm | `do-day-go-ghep` | C | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Khổ tấm gỗ ghép và cách tính nhu cầu | `kho-tam-go-ghep` | C | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Độ ẩm gỗ ghép ảnh hưởng cong vênh thế nào | `do-am-go-ghep` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép bị nứt/hở đường keo: yếu tố cần kiểm tra | `go-ghep-ho-duong-keo` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép bị cong vênh sau hoàn thiện | `go-ghep-bi-cong-venh` | I | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép cao su và thông: góc nhìn vật liệu | `so-sanh-go-ghep-cao-su-thong` | I | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép có cần sơn phủ không | `go-ghep-co-can-son-phu` | I | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Sơn PU, dầu lau và bảo vệ gỗ ghép | `hoan-thien-be-mat-go-ghep` | I | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Chọn mặt A/B của tấm gỗ ghép | `chon-mat-a-b-go-ghep` | C | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép dùng nơi ẩm: giới hạn cần biết | `go-ghep-dung-noi-am` | I | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Các yếu tố ảnh hưởng giá gỗ ghép | `yeu-to-anh-huong-gia-go-ghep` | C | P1 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| GỖ GHÉP | Gỗ ghép làm bậc cầu thang: cần kiểm tra gì | `go-ghep-lam-bac-cau-thang` | C | P2 | /go-ghep/ (phụ: /go-ghep-cao-su/, /go-ghep-tram/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Cách tra mã màu gỗ công nghiệp theo nhà cung cấp | `cach-tra-ma-mau-go` | N | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Phân biệt mã Melamine và mã cốt ván | `phan-biet-ma-melamine-va-cot-van` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Catalogue An Cường: tìm đúng bộ sưu tập và mã | `huong-dan-tra-ma-an-cuong` | N | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Catalogue Thanh Thuỳ: đọc mã và loại bề mặt | `huong-dan-tra-ma-thanh-thuy` | N | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Catalogue Ba Thanh: đọc mã Melamine/Laminate | `huong-dan-tra-ma-ba-thanh` | N | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Melamine, Laminate, Acrylic: chọn theo nhu cầu | `so-sanh-melamine-laminate-acrylic` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Melamine là gì: không đồng nghĩa với MDF | `melamine-la-gi` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Laminate là gì: khác Melamine ở đâu | `laminate-va-melamine` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Acrylic là gì: ưu và hạn chế | `acrylic-noi-that-la-gi` | I | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Veneer là gì: khác vân gỗ in như thế nào | `veneer-va-melamine-van-go` | I | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Mã màu vân sồi: cách chọn và đối chiếu mẫu | `ma-mau-van-soi` | N | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Mã màu vân óc chó: lưu ý ánh sáng, độ bóng | `ma-mau-van-oc-cho` | N | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Màu trắng nội thất: khác biệt giữa mã và bề mặt | `ma-mau-trang-noi-that` | N | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Màu xám và beige: chọn phối với sàn, ánh sáng | `ma-mau-xam-beige` | N | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Bề mặt bóng, mờ và vân sần khác nhau | `be-mat-bong-mo-van-san` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Vì sao ảnh catalogue khác màu thực tế | `mau-catalogue-khac-mau-thuc-te` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Mã chỉ cạnh và mã bề mặt có cần trùng tuyệt đối | `ma-chi-canh-va-ma-be-mat` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Một mã màu có dùng được cho nhiều loại cốt không | `mot-ma-mau-nhieu-loai-cot` | I | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Cách đọc mã MFC và mã MDF Melamine An Cường | `doc-ma-mfc-mdf-melamine-an-cuong` | N | P1 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CATALOGUE / BỀ MẶT / MÃ MÀU | Chọn mã màu tủ bếp hay tủ quần áo | `chon-ma-mau-tu-bep-tu-ao` | C | P2 | /catalogue/ (phụ: /catalogue/an-cuong/, /catalogue/thanh-thuy/, /catalogue/ba-thanh/) |
| CNC / GIA CÔNG | CNC gỗ là gì: các dạng gia công phổ biến | `cnc-go-la-gi` | I | P1 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | CNC MDF và CNC gỗ ghép: lưu ý vật liệu | `cnc-mdf-va-go-ghep` | I | P1 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | Cắt thẳng, cắt biên dạng và soi rãnh khác nhau | `cat-thang-cat-bien-dang-soi-ranh` | I | P1 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | CNC trên ván phủ Melamine: lưu ý cạnh và bề mặt | `cnc-tren-van-phu-melamine` | I | P2 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | Gia công CNC có thể ảnh hưởng mép cắt thế nào | `chat-luong-mep-cat-cnc` | I | P2 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | Những yếu tố ảnh hưởng giá CNC gỗ | `yeu-to-anh-huong-gia-cnc-go` | C | P1 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | CNC và dán cạnh: vai trò của từng công đoạn | `cnc-va-dan-canh` | I | P2 | /gia-cong-cnc/ |
| CNC / GIA CÔNG | Khi nào nên chọn CNC thay vì cắt ván thông thường | `khi-nao-can-cnc-go` | C | P1 | /gia-cong-cnc/ |

## Sprint xuất bản khởi điểm (theo thứ tự đề xuất)

1. Kiểm toán 3 bài cũ và tối ưu theo search intent, không tạo bài trùng: `mdf-thuong-va-chong-am`, `go-ghep-la-gi`, `chuan-bi-file-cnc` (bài CNC cũ chỉ giữ nếu còn hữu ích; không kéo nội dung checklist lên trang dịch vụ).
2. Xuất bản loạt phân biệt cốt và bề mặt: `so-sanh-mfc-mdf`, `mfc-va-mdf-phu-melamine`, `phan-biet-ma-melamine-va-cot-van`, `so-sanh-go-ghep-cao-su-tram`.
3. Bổ sung loạt commercial research: `do-day-van-mdf`, `do-day-van-mfc`, `chon-mat-a-b-go-ghep`, `cach-tra-ma-mau-go`.
4. Bổ sung ảnh thật, catalogue nguồn, thí dụ mã thực tế được kiểm chứng và liên kết đầy đủ. Chỉ xuất bản khi pass checklist nội dung.
5. Định kỳ kiểm tra GSC 28/90 ngày: `^(?:\\S+\\s+){7,}\\S+$` (8 từ trở lên) là bộ lọc phát hiện, không phải điều kiện chọn bài duy nhất; so truy vấn, landing page, CTR, vị trí, conversion Zalo trước khi đổi title/H1.

## Dữ liệu nghiên cứu đã đối chiếu

- Site hiện có 3 bài chính: https://mdftungphat.com/bai-viet/ (đọc 18/11/2026).
- Trang tra mã hiện có: https://mdftungphat.com/catalogue/ và các trang nhà cung cấp (đọc 18/11/2026).
- Ví dụ cấu tạo, nhãn cốt và nhóm ván của An Cường: https://ancuong.com/melamine/303000070.html và https://ancuong.com/melamine/303003344.html. Kiểm chứng chính xác từng SKU trước khi gắn chuẩn phát thải hoặc khả năng chống ẩm.
- Catalogue nhà sản xuất Thanh Thuỳ: https://vangocongnghieplongthanh.com/upload/filemanager/Thanh%20Thuy%20MELAMINE%20E-CTL%202024%20%281%29%20%282%29.pdf (cần rà soát niên đại và đối chiếu bộ sưu tập hiện hành).
- Tham khảo mô tả gỗ ghép: https://www.kimthanha.com/Product1.php?l=vn; nguồn ngành https://goghep.org/ (không sao chép nội dung).
- Google nội dung hữu ích/AI: https://developers.google.com/search/docs/fundamentals/creating-helpful-content và https://developers.google.com/search/docs/fundamentals/using-gen-ai-content; quy tắc spam https://developers.google.com/search/docs/essentials/spam-policies.
- GSC regex và hạn chế dữ liệu: https://support.google.com/webmasters/answer/17011165?hl=en.

## Checklist trước public mỗi bài

- [ ] Đối chiếu SERP và GSC để kiểm tra intent, tránh keyword cannibalization; chốt URL.
- [ ] Fact-check tên nhà sản xuất, chứng chỉ, thông số; ghi nguồn và ngày đối chiếu.
- [ ] Biên tập bằng tiếng Việt tự nhiên, thêm điều kiện/giới hạn thực tế, không phóng đại.
- [ ] Không công bố giá/giảm giá/tồn kho/khẳng định sản phẩm đang bán khi chưa xác minh.
- [ ] Có title, description, H1, direct answer, H2 khác biệt, FAQ hữu ích (không tạo FAQ schema chỉ để lấy rich result).
- [ ] Có hình thật hoặc ảnh có quyền sử dụng; alt trung thực, không tự ý lấy hình đối thủ.
- [ ] Link về trang Core + 1 bài liên quan hợp lệ, không link 404/draft.
- [ ] CTA Zalo duy nhất cho yêu cầu báo giá; có tracking `request_quote` cho Zalo.
- [ ] Xem trước WordPress/Payload theo hệ thực tế; không bật index khi ảnh/source chưa xong.
- [ ] Sau xuất bản: test HTML render, canonical self, sitemap, structured data, GSC indexing và CTA.
