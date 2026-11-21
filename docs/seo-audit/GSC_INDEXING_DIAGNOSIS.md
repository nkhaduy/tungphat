# Chẩn đoán indexing từ Search Console

Property `sc-domain:mdftungphat.com`; phiên Chrome được cấp quyền, owner đã xác minh. Audit 02–03/11/2026. Page Indexing cập nhật 23/10; URL Inspection đọc trực tiếp trong phiên audit. Các CSV gốc nằm trong `evidence/gsc/`, quan sát UI trong `evidence/gsc-observations.md`.

## Quy mô và chiều hướng

| Mốc GSC | Indexed | Chưa index | Riêng Discovered |
|---|---:|---:|---:|
| 28/8 | 15 | 83 | 41 |
| 29/8 | 20 | 2.681 | 2.631 |
| 22/9 | 657 | 2.172 | 1.977 |
| 23/10 | **1.403** | **1.572** | **1.239** |

Bước nhảy 29/8 cho thấy Google phát hiện một tập URL rất lớn; không chứng minh ngày xuất bản hay nguyên nhân triển khai nếu chưa đối chiếu log phát hành. Sau đó indexing tăng, không có bằng chứng deindex diện rộng. Cải thiện crawl/discovery có thể giúp nhưng không đồng nghĩa Google bắt buộc chọn toàn bộ trang.

| Phạm vi 23/10 | Indexed | Chưa index | Tổng |
|---|---:|---:|---:|
| Tất cả URL đã biết | 1.403 | 1.572 | 2.975 |
| Submitted | 1.402 | 1.250 | 2.652 |
| Unsubmitted | 1 | 322 | 323 |

Submitted: Discovered 1.239, Crawled 10, noindex 1. Unsubmitted: noindex 257, redirects 28, 404 19, 403 5, robots 1, Crawled 12. Tập sitemap có thể thay đổi theo thời gian; các con số này không gán tự động cho mọi URL hiện có.

## Bảng chẩn đoán bắt buộc

| URL / URL Group | GSC Status | Evidence | Likely Root Cause | Confidence | Indexing Intent | Recommended Fix | Priority |
|---|---|---|---|---|---|---|---|
| 1.239 submitted URL; mẫu `/catalogue/an-cuong/acrylic/acrylic-arc-2402/` | Discovered — currently not indexed | Export 1.000 mẫu; last crawl N/A; mẫu ARC Inspection hiện nói URL unknown; production 200/index/sitemap | Hàng đợi crawl/discovery sau mở rộng catalogue; phân phối liên kết yếu là vấn đề hiện tại đã đo; lý do chọn crawl nội bộ chưa biết | Medium | Chọn theo giá trị mã, ảnh, nhu cầu và traffic | Phát hành links canonical, phân tầng ưu tiên, theo dõi crawl từng cohort; không mass-noindex | P1 |
| `/chi-nhanh/14-tam-binh/` trong mẫu Discovered | Discovered; Inspection mới xác nhận chưa crawl | Một URL trong 1.000 mẫu; Inspection có sitemap, last crawl N/A; production HTTP 200 | Google biết URL nhưng chưa crawl; lý do ưu tiên nội bộ chưa rõ, không suy do nội dung mỏng | Medium | Index, giá trị local cao | Kiểm tra live, giữ liên kết từ liên hệ/chi nhánh, một yêu cầu recrawl khi Google hoạt động | P1 |
| `/catalogue/an-cuong/` | Excluded by noindex; submitted duy nhất | Inspection: crawl 31/7 00:20:29, smartphone, fetch success, noindex meta; production hiện index/self-canonical | Google còn lưu phiên bản noindex cũ; đường link hiện tại không giúp khám phá hub tốt | High | Index | Không cần xóa thẻ vốn đã hết trên production; sửa links, recrawl. Một Request Indexing đã thử nhưng Google báo thất bại | P1 |
| `/catalogue/` canonical | GSC tổng hợp chưa chứng minh exclusion mới này | Raw HTML index; browser tự tới `?supplier=thanh-thuy`, thêm robots noindex; đã tái hiện bằng Playwright | Mặc định UI bị coi là bộ lọc cần noindex và buộc chuyển URL | High | Canonical hub index; biến thể search/filter loại trừ | Đã sửa source: giữ URL canonical, phân biệt filter tường minh | P0 |
| 258 noindex; mẫu `/catalogue/ba-thanh/melamine/bt12/` | Excluded by noindex | BT12: crawl 17/10 15:23:59, Google thấy meta noindex; production noindex/follow, ngoài sitemap; code có tier chất lượng | Có chủ đích cho mã thiếu bằng chứng và legacy; riêng hub An Cường là trạng thái lịch sử cần phục hồi | High cho BT12; Medium cho toàn nhóm | Giữ excluded khi chưa đủ giá trị, rà từng record có nhu cầu/traffic | Bổ sung ảnh/thông tin nguồn trước khi đổi eligibility; không bật index hàng loạt | P2 |
| `/catalogue/thanh-thuy/melamine/610/`, 9 mã An Cường; 10 submitted | Crawled — currently not indexed | 610 crawl 12/10 17:53:10, fetch success, canonical Google N/A; production 200/index/self canonical | Google chưa chọn index; nội dung mã ngắn và giống cấu trúc là giả thuyết có cơ sở, không phải kết luận thuật toán | Medium | Mã có ảnh thật và nhu cầu nên được ưu tiên | Rà giá trị tra cứu, khác biệt thực tế, liên kết đúng bộ sưu tập; theo dõi cohort nhỏ | P1/P2 |
| 12 unsubmitted Crawled, gồm CSV/JSON/font/favicon/manifest/legacy | Crawled — currently not indexed | Full export 22 URL có 8 tài nguyên: 3 CSV, 1 JSON, 2 font, favicon, manifest; còn lại 14 HTML, gồm 4 legacy | Phần lớn unsubmitted không phải landing cần lên Google | High về loại tài nguyên; Low về lý do chọn index | Không cần index tài nguyên làm landing | Giữ tải xuống được; loại khỏi KPI phục hồi, không gửi Indexing API | Monitor |
| `/san-pham/acrylic/thanh-thuy-am-204-sugar-glitter/` | Crawled — currently not indexed | Inspection crawl 11/10 06:49:37; referring `/san-pham/acrylic/`; canonicals N/A | Legacy có thể trùng ý định với mã catalogue; chưa biết Google canonical nên không gán “duplicate” | Medium | Rà equity và khác biệt trước quyết định | So traffic/backlinks/ảnh/spec với URL mã mới; không tự redirect/noindex thêm | P2 |
| 28 redirects; `/san-pham/go-ghep-thanh/`, HTTP/www | Page with redirect | HTTP/www và legacy tới đích 200; `redirect-chains.json`; HTTP+www có hai bước | Alias/chuyển chuẩn là bình thường; báo cáo lịch sử không tương đương lỗi redirect | High | Index đích canonical, không index alias | Giữ redirect có ích; URL không slash hiện 200 + canonical, tránh link mới tới alias | Monitor |
| 19 URLs; `/san-pham/go-cao-su-ghep-thanh/`, `/tin-tuc/`, `/feed/` | Not found (404) | Fetch hiện tại xác nhận 19 URL đều 404; gồm root CDN | URL WordPress cũ không còn route; một số có replacement liên quan | High | Không index 404; phục hồi equity khi có replacement đúng | Cao su → `/go-ghep-cao-su/`, tin tức → `/bai-viet/` là ứng viên cần rà equity; chưa sửa routing | P1 cho URL thương mại; P2 khác |
| 5 `/wp-content/`, `/wp-admin/admin-ajax.php`, `/wp-includes/` | Blocked 403 tại snapshot | Toàn bộ 5 mẫu là WordPress cũ; không thuộc sitemap hiện tại | Tài nguyên hệ thống legacy; không phải Googlebot bị chặn trên sản phẩm hiện tại | High | Không index | Không mở WP paths để tăng tỷ lệ index; giám sát 403 trên canonical thật | Monitor |
| `/cms-preview/` | Blocked by robots.txt | robots và headers noindex cho preview; ngoài sitemap | Loại trừ preview đúng mục đích | High | Exclude | Giữ bảo vệ/robots; không đưa nội dung preview vào index | None |
| `/van-mdf/`, `/mdf-chong-am/`, `/go-ghep-cao-su/` | 3 Product invalid; **không phải category Page Indexing** | GSC enhancement thiếu offers/review/aggregateRating; cao su vẫn indexed | Trang nhóm vật liệu bị khai báo là sản phẩm đơn lẻ | High | Trang vẫn index; không giả offer để lấy rich result | Source dùng CollectionPage cho bốn family routes; validate sau Google recrawl | P1 |
| Duplicate canonical / Alternate / Soft 404 / 5xx / redirect error | Không có active category tương ứng; 5xx và Google-different-canonical hiển thị 0 | Chỉ 7 active reasons; toàn bộ sitemap 200/self-canonical; không có báo cáo loại này để lấy mẫu | Không đủ bằng chứng khẳng định lỗi hoặc không có lỗi ở mọi URL ngoài mẫu | Low ngoài scope crawl | Tùy URL | Giám sát, không bịa category/count | Monitor |

Không coi extension là quyết định Google về giá trị trang; các tệp tải xuống vẫn có thể phục vụ người dùng dù không cần một landing trong kết quả tìm kiếm.

## URL Inspection: bằng chứng quan trọng

| URL | Kết quả | Last crawl UI | Canonical Google | Discovery / crawl |
|---|---|---|---|---|
| `/` | Indexed | 30/10 01:30:20 | Inspected URL | Sitemap; smartphone; allowed; fetch success |
| `/go-ghep/` | Indexed | 23/10 03:33:18 | Inspected URL | Sitemap; referring legacy gỗ ghép; allowed/success |
| `/go-ghep-cao-su/` | Indexed, enhancement invalid | 19/10 11:45:01 | Inspected URL | Sitemap; allowed/success |
| `/catalogue/an-cuong/melamine/` | Indexed | 25/10 22:57:26 | Inspected URL | Sitemap; referring page không báo |
| `/cat-cnc-go/` | Indexed | 29/10 03:44:57 | Inspected URL | Sitemap; allowed/success |
| `/thuong-hieu/ba-thanh/` | Indexed | 09/10 19:10:03 | Inspected URL | Sitemap field báo temporary processing error, không chứng minh XML hỏng |
| `/catalogue/an-cuong/` | Noindex trong phiên bản Google lưu | 31/7 00:20:29 | Inspected URL | Sitemap; smartphone; fetch success |
| `/catalogue/ba-thanh/melamine/bt12/` | Noindex | 17/10 15:23:59 | Inspected URL | Không sitemap; referring collection; Google thấy meta noindex |
| `/catalogue/thanh-thuy/melamine/610/` | Crawled, chưa index | 12/10 17:53:10 | N/A | Sitemap; referring supplier hub; fetch success |
| `/catalogue/an-cuong/acrylic/acrylic-arc-2402/` | URL unknown trong Inspection mới | N/A | N/A | Không discovery báo cáo; export cũ xếp Discovered, giữ cả hai bằng chứng |
| `/san-pham/acrylic/thanh-thuy-am-204-sugar-glitter/` | Crawled, chưa index | 11/10 06:49:37 | N/A | Referring legacy collection, fetch success |
| `/chi-nhanh/14-tam-binh/` | Discovered, chưa crawl | N/A | N/A | Sitemap present; referring page không báo; các crawl/index fields N/A |

Các trang indexed trên có user canonical self; crawl bằng smartphone. Canonical N/A không có nghĩa trang production không có tag canonical. GSC “referring page không phát hiện” cũng không chứng minh orphan.

## Nội dung và template: điều đã biết, điều chưa biết

Trong 2.616 URL mã catalogue thuộc sitemap, **930 có main text dưới 600 ký tự**, 1.432 dưới 1.000 ký tự theo parser HTML. Tiêu đề và description vẫn duy nhất trên toàn bộ 2.652 sitemap URLs; có ảnh mã và CTA hữu ích. Độ dài này là chỉ báo để chọn mẫu rà soát, **không phải ngưỡng chất lượng Google**. Chưa làm semantic similarity trên mọi cặp, chưa có kết luận duplicate toàn bộ catalogue.

Đồ thị sitemap-only có 2.185 URL nhánh An Cường không nối từ trang chủ trước sửa dù mỗi trang vẫn có inbound từ trang cùng nhánh. Điều này giải thích vì sao “orphan count = 0” của auditor cũ chưa đủ. Tuy vậy audit hiện tại diễn ra sau snapshot 23/10: không được quy toàn bộ backlog lịch sử cho một thay đổi navigation mới.

## Ưu tiên phục hồi có đo lường

1. Phát hành bản sửa hub/noindex và links sau khi owner cho phép deploy; kiểm tra rendered HTML production.
2. Ưu tiên hub An Cường và chi nhánh thật, rồi 10 submitted Crawled URLs; mẫu Discovered chọn theo nhu cầu và liên kết, không theo alphabet.
3. Không sửa 403 WordPress hay preview để “làm xanh” GSC. Không mass-noindex 1.239 URL để tăng tỷ lệ.
4. Một Live Test `/go-ghep/` và một Request Indexing hub An Cường đều bị Google trả lỗi; không có queue thành công. Không lặp lại trong phiên. Chờ dịch vụ hoạt động rồi thử một lần cho URL có thay đổi thật.

Theo [Google Page Indexing help](https://support.google.com/webmasters/answer/7440203), danh sách mẫu tối đa 1.000 và không bảo đảm đầy đủ; exclusion hợp lý không cần sửa. [Google về crawl](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors) phân biệt crawl với lựa chọn index. Không dùng lệnh `site:` hoặc IndexNow làm bằng chứng Google đã index.
