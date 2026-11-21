# GSC Deep Dive

## Nguồn, thời điểm và độ tin cậy

- Property `sc-domain:mdftungphat.com`, phiên Chrome đã đăng nhập và hiển thị property. Đọc ngày 08/11/2026; Performance ghi cập nhật 3 giờ trước, dữ liệu đến **06/11/2026**.
- Latest 28 days: 10/10–06/11/2026. Previous period: 12/09–09/10/2026.
- Latest 3 months: 07/08–06/11/2026. Previous 3 months bắt đầu trước lúc property được tạo 16/07; phần lớn kỳ cũ không có đủ lịch sử.
- GSC Indexing: lần cập nhật mới nhất 23/10/2026; không phải trạng thái hiện thời.
- CSV cũ trong `../evidence/gsc/` có Performance đến 31/10; bộ query/page export chịu giới hạn số dòng và khác tổng property. Các con số cấp property lấy từ chart/UI, không cộng hàng query/page.

## Performance tổng hợp

| Cửa sổ / source | Clicks | Impressions | CTR | Avg position | Diễn giải |
|---|---:|---:|---:|---:|---|
| 10/10–06/11, live GSC | 570 | ~38.800 | 1,5% | 10,2 | Latest 28 days; CTR/Impressions hiển thị làm tròn |
| 12/09–09/10, live compare | 138 | ~9.230 | 1,5% | 6,7 | Previous 28 days; so sánh tương đương độ dài |
| 07/08–06/11, live GSC | 752 | ~49.000 | 1,5% | 9,5 | Latest 3 months |
| 07/05–06/08 tương đương, live compare | 28 | 397 | 7,1% | 11 | Chỉ khoảng 23 ngày sau khi property được tạo; không dùng làm baseline đủ kỳ |
| 04/10–31/10, export cũ | 485 | 33.511 | 1,45% | 9,33 | Kỳ cũ nằm phần lớn trong cửa sổ mới 10/10–06/11; hợp với việc hiển thị tăng trong tháng 10 |

Click/impression tăng khoảng 4 lần giữa hai latest 28-day windows, CTR tổng gần như đứng yên, position trung bình giảm 3,5 bậc. Diễn giải có bằng chứng: website nhận thêm nhiều impressions ở nhóm vị trí kém hơn, làm CTR tổng bị pha loãng. GSC không cung cấp nguyên nhân truy vấn mới trong bảng tóm tắt này; chưa thể kết luận tăng do release, mùa vụ hay nhóm URL cụ thể. Release kỹ thuật 03/11 chỉ nằm trong 4 ngày cuối của cửa sổ gần nhất.

## Trang có cơ hội

Latest live 3-month page table so với 3 tháng trước; trang dưới đây chỉ là những hàng thấy trực tiếp trên UI. CTR tính từ clicks/impressions live, làm tròn; vị trí current không hiện trong bảng so sánh. Cột vị trí lịch sử lấy export đã lưu tới 31/10 và không phải vị trí hiện hành.

| URL | Clicks / impressions live 3m | CTR tính | Position lịch sử đến 31/10 | Chẩn đoán |
|---|---:|---:|---:|---|
| `/catalogue/an-cuong/melamine/` | 57 / 10.287 | 0,55% | 12,88 | Ưu tiên 1; từ khóa rộng ở trang 32–59 trong query export đã lọc trang |
| `/catalogue/an-cuong/laminate/` | 7 / 2.221 | 0,32% | 18,34 | Ranks thấp; nâng relevance/internal discovery trước khi test title |
| `/` | 64 / 1.167 | 5,48% | 5,12 | Trang điều hướng tốt; giữ làm nhóm control |
| `/catalogue/an-cuong/melamine/mfc-ms-852-t/` | 27 / 82 | 32,93% | 1,96 | Exact-code demand và match mạnh; bảo vệ URL, tăng liên kết nội bộ |
| `/go-ghep/` | 14 / 171 | 8,19% | 6,82 | Tín hiệu CTR tốt, lượng hiển thị còn thấp; mở rộng nội dung mua hàng thật |
| `/bai-viet/chuan-bi-file-cnc/` | 11 / 254 | 4,33% | 5,42 | Bài hướng dẫn có thể đưa người đọc sang dịch vụ CNC |
| `/catalogue/thanh-thuy/` | 10 / 280 | 3,57% | 6,11 | Giữ hub rõ nhà cung cấp; thêm CTA tra mã/đi đến sản phẩm |
| `/catalogue/an-cuong/melamine/mfc-ms-998-fr/` | 8 / 144 | 5,56% | N/A | Không đổi title khi chưa biết exact query |
| `/catalogue/an-cuong/melamine/mfc-ms-530-nwm/` | 7 / 365 | 1,92% | 5,32 | Mã có impressions; kiểm tra truy vấn và ảnh code trước snippet |
| `/catalogue/thanh-thuy/melamine/` | 7 / 347 | 2,02% | 6,50 | Cần tách cụm theo hãng và mã, chưa đủ để thay metadata |

Các tỷ lệ và live values trên đọc từ bảng trang 3 tháng có so sánh trong GSC ngày 08/11. Các URL mã có impressions khác 0 nhưng query-page mapping chưa lấy được; không nói rằng impression chắc chắn đến từ truy vấn đúng mã.

### Nhóm CTR thấp nhưng vị trí 4–10 trong export cũ

- `/catalogue/an-cuong/melamine/mfc-ms-446-fr/`: 0/190, position 6,48.
- `/catalogue/an-cuong/melamine/mfc-ms-230-pl/`: 0/154, position 7,89.
- `/catalogue/an-cuong/melamine/mfc-ms-106-mm/`: 1/231, CTR 0,43%, position 9,47.
- `/catalogue/an-cuong/melamine/mfc-ms-230-sc/`: 1/182, CTR 0,55%, position 6,55.

Đây là ưu tiên xem đúng query, device và title được Google hiển thị; không mass-change title dựa vào bảng URL tổng hợp.

## Phân tầng position — query rows quan sát được

Export query 01/08–31/10 chứa 719 query rows, tổng hiển thị **22 clicks / 5.365 impressions**, so với tổng property 606/39.371. Phần query bị thiếu quá lớn để suy ra phân bố toàn property. Phân tầng được tính bằng cách làm tròn position trung bình của từng query tới số nguyên gần nhất để không bỏ các giá trị thập phân nằm giữa hai nhãn; đây là phép nhóm mô tả, không phải rank cố định. Trong phần rows có sẵn:

| Position segment | Query rows | Clicks | Impressions | CTR mẫu |
|---|---:|---:|---:|---:|
| 1–3 | 80 | 11 | 163 | 6,75% |
| 4–5 | 95 | 2 | 447 | 0,45% |
| 6–10 | 334 | 8 | 1.965 | 0,41% |
| 11–20 | 28 | 1 | 143 | 0,70% |
| 21–50 | 93 | 0 | 1.644 | 0% |
| 51+ | 89 | 0 | 1.003 | 0% |

Đây là CTR của các query rows được xuất, không phải benchmark thị trường. Mẫu cho thấy cơ hội nằm ở impressions lớn bên ngoài top 10. Nhóm 11–20 có CTR mẫu nhỉnh hơn 6–10 vì query mix khác; không lấy thứ tự CTR này làm bằng chứng vị trí thấp tốt hơn.

## Query, thương hiệu và ý định

Query export 3 tháng chỉ có 22 clicks. “tùng phát” có 8/56 trong bảng đó nhưng chỉ là 1,3% impressions toàn property; đây không phải tỷ trọng brand của website. Exact code queries như `MS 388 EV`, `MS 495 EL`, `9205 An Cường`, `LL2276` hiện trong các hàng GSC và SERP exact-code; query-to-page table chưa được lấy. Vì vậy:

- **Brand vs non-brand:** có thể gắn nhãn cho các query thấy được, nhưng tỷ trọng toàn site là **unknown**.
- **Commercial vs informational:** phân loại theo từ ngữ query khi có query; không suy intent của mọi clicks.
- **Catalogue vs product/service/article:** cấp URL có thể xếp cohort; hiện chưa có click/conversion join trong GA4.
- **Search appearance:** export tới 31/10 ghi 2 impressions và 0 click dạng Product snippet. Local Pack, AI Overview và Google Images không được đếm như cùng một appearance bucket này.

## Device / country

Export 01/08–31/10:

- Desktop: 341 clicks / 24.291 impressions / 1,40% / position 8,26.
- Mobile: 263 / 15.006 / 1,75% / 10,34.
- Tablet: 2 / 74 / 2,70% / 6,69.
- Việt Nam: 600 / 38.555 / 1,56% / 9,03.

GSC device tiếng Việt dịch Mobile thành “Sơ đồ trang web dành cho điện thoại di động” trong export. So sánh position/mobile với desktop không điều chỉnh query mix. GSC live mới nhất chưa được tải breakdown device/country theo date range mới.

## Indexing và release regression

Page Indexing UI vẫn **cập nhật 23/10**. Số lần kiểm tra được đọc ngày 08/11: 1.403 indexed/1.572 chưa index; 1.239 Discovered, 258 noindex, 28 redirect, 22 Crawled, 19 404, 5 403, 1 robots; các nhóm 5xx và Google-selected canonical khác hiển thị 0. Đây là cùng snapshot cũ của audit 02–03/11, không chứng minh thay đổi sau phát hành. Release 03/11 có production acceptance trong tài liệu release; GSC indexed-version chưa có recrawl mới chứng minh Google đã thấy code mới.

## Hành động dữ liệu kế tiếp

- Lưu export mới riêng cho cùng 28 ngày và so sánh; hiện browser export CSV bị Chrome `ERR_BLOCKED_BY_CLIENT`, nên không lưu được raw export từ giao diện hôm nay. Số live UI đã ghi tại `evidence/live-gsc-2026-11-08.md`.
- Trích query × page cho Melamine, Laminate, gỗ ghép và CNC; giữ “not observed” khác 0.
- Lấy device/country/search appearance cho latest period cùng filter; ghi ngày data và giới hạn report.
- Kiểm tra query/position cohort vào 10/11, 17/11 và 03/12; không đưa metric chưa recrawl thành kết quả deployment.
