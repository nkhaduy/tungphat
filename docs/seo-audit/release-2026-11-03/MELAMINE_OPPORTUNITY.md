# Cơ hội Melamine An Cường — phân tích theo đúng trang

Trang: `https://mdftungphat.com/catalogue/an-cuong/melamine/`. Tiếp nối audit, không chạy lại toàn bộ SERP. Ngày 03/11 có tải thêm export GSC **lọc chính xác URL này**, 3 tháng. Evidence: `evidence/melamine-3m/`, đặc biệt Bộ lọc, Trang, Sơ đồ và Cụm từ tìm kiếm.

## Baseline và giới hạn quan trọng

| Phạm vi | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| Trang, 01/08–31/10/2026 | 53 | 9.013 | 0,59% | 12,88 |
| Trang, 04–31/10/2026, export audit | 37 | 6.422 | 0,58% | 15,03 |
| 100 query được công bố trong export lọc trang 3 tháng | 0 | 1.286 | 0% | Không thay thế page average |

100 query chỉ giải thích **14,27% impressions của trang**. Không được kết luận 53 clicks đến từ query cụ thể nào trong bảng này; không gọi 0 clicks là CTR của toàn bộ traffic. Bảng quốc gia và thiết bị trong export mới cũng cộng thành 0/1.286, khác chart/page 53/9.013: coverage không khớp, chưa xác minh nguyên nhân; không dùng chúng để khẳng định cơ cấu toàn trang. Cần API/export bổ sung trước phân tích đầy đủ device/Vietnam. Không quy hết chênh lệch cho privacy khi chưa chứng minh.

| Query quan sát được | Impressions | Position |
|---|---:|---:|
| màu gỗ melamine an cường | 53 | 51,25 |
| bảng màu melamine an cường | 41 | 41,22 |
| bảng màu gỗ melamine an cường | 40 | 50,65 |
| mã màu an cường | 39 | 53,08 |
| bảng mã màu melamine an cường | 38 | 38,29 |
| catalogue melamine an cường | 38 | 48,50 |
| mã màu melamine an cường | 37 | 32,81 |

Các query bảng màu rộng trong mẫu thường ở vị trí 32–59. Vì vậy chỉ sửa description để tăng CTR không giải quyết được visibility của nhóm này. Average toàn trang 12,88 trộn nhiều query và ngày, không có nghĩa query chính đang gần top 10. Có query sai bề mặt như Laminate trong mẫu: đưa khách về collection Laminate phù hợp, không nhồi chúng vào title Melamine.

## Khoảng trống đã kiểm tra trong HTML

Collection có **367 mã**, H1 “Mã màu melamine · An Cường”, đoạn mở nói về “mã đã xác minh” và loại trừ tài liệu kỹ thuật, sau đó là danh sách mã/tên. Khách tra bảng màu cần xem mẫu và tìm đúng mã, không cần biết cách hệ thống phân loại bản ghi. Hub An Cường và code pages đã có giao diện tra cứu riêng; cần tận dụng cấu trúc này, không tạo bảng mã thứ hai gần trùng.

Audit trước thấy nhánh An Cường tách khỏi graph sitemap-only từ homepage; release kỹ thuật sửa anchor ba supplier hubs và navigation. Sau deploy đo lại crawl/inspection trước kết luận nội dung là nguyên nhân duy nhất. Bốn điều khác nhau cần tách: discovery, indexing, query relevance, CTR.

## Đề xuất nội dung — chưa publish

Title đề xuất: **Bảng màu Melamine An Cường: tra mã và mẫu | Tùng Phát**.
H1: **Bảng màu Melamine An Cường**.
Description: **Tra mã và xem mẫu Melamine An Cường. Chọn mã đầy đủ, kiểm tra bề mặt và gửi cùng quy cách để hỏi vật liệu phù hợp.**

Đoạn mở thay thế:

> Tra mã Melamine An Cường và mở từng mẫu để xem tên, hình bề mặt cùng thông tin tham chiếu. Khi hỏi vật liệu, gửi mã đầy đủ và quy cách cần làm; mã màu chưa mô tả hết cốt ván, độ dày và yêu cầu gia công.

Đây là draft theo skill `tung-phat-writing`, đã HUMAN PASS. Không tự thêm “đại lý chính hãng”, giá, sẵn kho, tiêu chuẩn hay độ dày. Không đưa số 367 vào title để tránh lỗi thời. Chưa diễn giải ký hiệu T, SC, NWM… khi chưa đối chiếu tài liệu nhà sản xuất.

Phần ngắn dưới bảng “Từ mã màu đến yêu cầu vật liệu”: lưu nguyên mã và hậu tố; chọn cốt ván/quy cách theo nhu cầu; ghi số lượng, mặt và cạnh cần xử lý; gửi ảnh/mã qua kênh liên hệ hiện có. Link một lần tới MDF hoặc hướng chọn cốt và một link báo giá. Giải thích Melamine là bề mặt, không dùng nó thay mọi tên MFC/MDF; không hứa mọi mã có trên mọi cốt.

## Hướng cải tiến tính năng cho đợt riêng

1. Giữ danh sách anchor mã trong HTML ban đầu. Thêm tìm mã ngay trên collection bằng index/mẫu ảnh đã có nguồn, thay vì bắt khách quay về hub; chuẩn hóa mã có/không khoảng trắng như search hiện tại.
2. Nếu thêm swatch grid, dùng ảnh nguồn đang xác minh, alt đúng mã, kích thước cố định, lazy load ngoài vùng đầu; không tải 367 ảnh lớn hoặc toàn index mọi supplier ngay đầu trang. Kiểm tra mobile và không làm mất links khi JS tắt.
3. Bộ lọc màu/vân chỉ dựa taxonomy có dữ liệu. Kết quả query/filter vẫn canonical collection và noindex theo policy; không tạo hàng loạt landing indexable mới.
4. Links từ hub An Cường đến Melamine; từ code về collection; gợi ý code liên quan bằng dữ liệu thật. Không chọn “bán chạy” chỉ từ impressions.
5. Giữ các code có traffic: ví dụ `/mfc-ms-852-t/` 15 clicks/48 impressions/CTR 31,25%/position 1,96 trong 3 tháng. Không canonical mã này về collection. Theo dõi MS 530 NWM, MS 274 SH và các code trong WATCHLIST.

Phần tính năng chưa nằm trong release 8 file. Cần review thiết kế hiện có, test exact code/keyboard/mobile và ngân sách JS trước publish. Không lấy việc có nhiều query giống nhau làm bằng chứng cannibalization; cần query × page cùng kỳ để kiểm tra hub/collection/code có thay nhau hiển thị bất lợi hay phục vụ intent khác.

## Thí nghiệm và đánh giá

Đợt A chỉ kỹ thuật discovery/schema. Đợt B sau đó đổi đoạn mở/title/H1, ghi ngày riêng. Đợt C mới cân nhắc tìm mã/swatches. Tách thời điểm giúp đọc tác động, nhưng không khẳng định quan hệ nhân quả từ một site không có randomized control.

Sau 14 ngày xem Google đã recrawl chưa, canonical/noindex và query mix. Sau 30/60 ngày so page cluster, query tra bảng màu rộng, query exact code, non-brand clicks/impressions; CTR chỉ so cùng device/country và dải position. Dùng catalogue collection chưa đổi nội dung làm nhóm tham chiếu, ghi thay đổi mùa vụ/SERP. Không đặt mục tiêu CTR 2% hoặc top 3 khi dữ liệu hiện tại chưa hỗ trợ.
