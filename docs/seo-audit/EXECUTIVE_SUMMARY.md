# SEO và phục hồi indexing Tùng Phát

Audit bắt đầu tối 02/11, hoàn tất sau 00:00 ngày 03/11/2026 (Asia/Ho_Chi_Minh). Dữ liệu HTTP được lấy trực tiếp từ production; GSC Page Indexing cập nhật **23/10/2026**, không phải số đếm realtime. Các bản sửa chỉ nằm trong repository, **chưa deploy, chưa push**.

## Kết luận để ra quyết định

Website có nền tảng HTML tĩnh tốt, nhưng kiểm tra sau JavaScript phát hiện một lỗi có thể loại hub catalogue khỏi tìm kiếm: `/catalogue/` tự chuyển sang URL bộ lọc và thêm `noindex`. Cùng lúc, các đường dẫn nhà cung cấp chỉ mở bộ lọc, làm nhánh An Cường khó được khám phá qua HTML canonical. Đã sửa cả hai trong source, giữ cách tra cứu mặc định Thanh Thuỳ.

Không có bằng chứng site đang mất chỉ mục hàng loạt. Sau một đợt Google phát hiện rất nhiều URL cuối tháng 8, số trang được index tăng đáng kể. Phần lớn URL chưa index là hàng đợi discovery/crawl của catalogue, không phải lỗi robots, máy chủ hay canonical trên toàn site. Không thể xác định chính xác thuật toán chọn index của Google cho từng URL chỉ bằng Page Indexing.

## Phạm vi và số đếm đã kiểm chứng

| Nguồn / phạm vi | Kết quả |
|---|---|
| GSC domain property | Truy cập trực tiếp bằng phiên Chrome được cấp quyền; owner đã xác minh |
| GSC tất cả URL đã biết, 23/10 | **1.403 indexed / 1.572 chưa indexed**, tổng 2.975 |
| GSC URL đã gửi sitemap | **1.402 indexed / 1.250 chưa indexed**, tổng 2.652 |
| GSC URL chưa gửi | **1 indexed / 322 chưa indexed**, tổng 323 |
| Sitemap production hiện tại | **2.652 URL**, XML hợp lệ, không trùng |
| Crawl toàn bộ sitemap | 2.652 HTTP 200, không noindex trong HTML gốc, canonical self-reference; đủ title, description và một H1 |
| Generated HTML trước và sau sửa | **3.580 file HTML**, sau sửa 2.652 indexable / 928 noindex theo metadata; không thay đổi số URL |
| Inventory hợp nhất | **3.646 URL** trong `URL_AUDIT.csv`; gồm HTML, legacy, tham số và tài nguyên |
| Bằng chứng GSC ở mức URL | 1.333 mẫu URL excluded xuất từ 7 nhóm; **12 URL Inspection**, bao gồm chi nhánh 14 Tam Bình chưa được crawl |
| Performance exports | 28 ngày, 3 tháng, bộ lọc 6 tháng; queries/pages/devices/countries; trang Performance bị giới hạn 1.000 hàng |

Không cộng 3.580 file, 2.652 sitemap và 2.975 GSC với nhau: đó là các tập khác nhau. Không suy trạng thái GSC của một URL chỉ vì nó không nằm trong export.

## Những nguyên nhân chính

| Nhóm GSC | URL | Diễn giải |
|---|---:|---|
| Discovered — currently not indexed | **1.239** | 78,8% URL chưa index. Mẫu 1.000 URL gồm 776 An Cường, 167 Thanh Thuỳ, 56 Ba Thanh và một chi nhánh. Cần tăng khả năng khám phá và giá trị trang; chưa chứng minh Google đánh giá chất lượng thấp toàn bộ nhóm. |
| Excluded by noindex | **258** | 257 ngoài tập submitted, phần lớn legacy/record chưa đủ chất lượng. Một URL submitted là hub An Cường, Google còn lưu noindex từ 31/7; HTML production hiện cho index. |
| Redirect | **28** | Phần lớn alias, HTTP/www hoặc URL cũ. Không phải 28 lỗi redirect. Một số URL không slash hiện trả 200 với canonical có slash. |
| 404 | **19** | Legacy WordPress và tài nguyên cũ. Cần rà equity/replacement; `/san-pham/go-cao-su-ghep-thanh/` là ứng viên khôi phục tốt bằng trang cao su hiện có. |
| 403 | **5** | Đều là đường dẫn WordPress cũ, không phải trang thương mại hiện tại. |
| Robots | **1** | `/cms-preview/`: loại trừ đúng mục đích. |
| Crawled — currently not indexed | **22** | Gồm cả CSV, JSON, font, favicon, manifest và URL legacy; chỉ 10 thuộc submitted. Không nên “phục hồi index” toàn bộ 22 URL. |

## Bản sửa và giá trị dự kiến

1. **P0:** bỏ redirect JavaScript và noindex ngoài ý muốn ở hub canonical; bộ lọc thực sự vẫn noindex.
2. **P1:** nối điều hướng chung tới `/catalogue/`, các thẻ nhà cung cấp tới `/catalogue/{supplier}/`. Đồ thị chỉ dùng URL canonical trong sitemap tăng từ **467/2.652** URL đi được từ trang chủ lên **2.652/2.652** ở build cục bộ. Đây là cải thiện discovery được kiểm chứng, không phải bằng chứng Google đã crawl thêm 2.185 URL.
3. **P1:** chuyển bốn trang nhóm MDF/cao su/tràm từ Product sang CollectionPage. GSC đang báo ba trang Product không hợp lệ do thiếu offer/review/rating. Không thêm giá, tồn kho hoặc đánh giá giả. Việc này sửa ngữ nghĩa và enhancement, không tự tạo rich result hay bảo đảm index.

## Hiệu suất tìm kiếm và cơ hội kinh doanh

| Giai đoạn GSC Web | Clicks | Impressions | CTR tính từ tổng | Position trung bình xấp xỉ |
|---|---:|---:|---:|---:|
| 04–31/10, 28 ngày | **485** | **33.511** | **1,45%** | 9,33 |
| 01/8–31/10, 3 tháng | **606** | **39.371** | **1,54%** | 9,04 |
| Bộ lọc 6 tháng; dữ liệu có 15/7–31/10 | **628** | **39.687** | **1,58%** | 9,06 |

Position tổng gần đúng tính theo impressions từ daily export đã làm tròn; không thay thế số chính xác nội bộ GSC. Không có đủ sáu tháng lịch sử. Trong ba tháng, Việt Nam: 600 clicks / 38.555 impressions. Desktop: 341/24.291; mobile: 263/15.006; tablet: 2/74.

`/go-ghep/` có 13 clicks / 150 impressions / CTR 8,67% / position 6,82. CMS xác nhận gỗ ghép **cao su và tràm**; chưa xác minh offering gỗ thông, mọi độ dày hay giá bán. Cơ hội phù hợp là tăng hiển thị cho các trang sẵn có và bổ sung dữ liệu mua hàng thật. Trang Melamine An Cường có cơ hội định lượng lớn hơn: 9.013 impressions, CTR 0,59%, position 12,88.

## Điểm khỏe và giới hạn

Không có Manual Action hay Security Issue trong GSC. Sitemap đọc thành công 29/10, ghi 2.652 URL. Desktop CWV: 412 URL tốt, 0 cần cải thiện, 0 kém; mobile thiếu field data. Lighthouse `/go-ghep/`: mobile Performance 93, desktop 95; accessibility/best practices/SEO đều 100 trong hai lần đo. Mobile LCP 3,3 giây còn cơ hội tối ưu; CLS 0, TBT 0 ms không có nghĩa INP bằng 0.

Google Live Test trả lỗi; một lần Request Indexing hub An Cường cũng thất bại và chưa được xác nhận vào hàng đợi. Không có quyền/khả năng giải quyết lỗi backend hoặc kết nối reCAPTCHA của Google từ repository. Không bypass xác thực. Không deploy theo yêu cầu; vì vậy lỗi catalogue production vẫn cần phát hành bản sửa trước khi xác minh lại trên `mdftungphat.com`.

Đọc tiếp: [Chẩn đoán GSC](GSC_INDEXING_DIAGNOSIS.md), [Audit kỹ thuật](SEO_TECHNICAL_AUDIT.md), [Từ khóa](KEYWORD_STRATEGY.md), [Nhật ký sửa](SEO_IMPLEMENTATION_LOG.md), [Lộ trình](SEO_ROADMAP.md), [Inventory CSV](URL_AUDIT.csv).
