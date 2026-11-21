# Lộ trình SEO 30 / 60 / 90 ngày

Mốc kế hoạch lập ngày 03/11/2026. **Ngày 0 là ngày owner cho phép và thực sự phát hành bản sửa**, không phải ngày audit. Không có bảo đảm top 1 hoặc thời hạn Google index. Ưu tiên số lượng và visibility của canonical có giá trị, không tỷ lệ index toàn bộ URL.

## Ngày 0–30: phục hồi nền tảng và baseline

| Việc | Owner đề xuất | Điều kiện hoàn tất / KPI |
|---|---|---|
| Review các hunks audit trong working tree; phát hành đúng frontend Vercel | Developer + owner | Full verify ở commit release; production `/catalogue/` không redirect/noindex sau hydration; query filter vẫn excluded |
| Kiểm tra links canonical và bốn CollectionPage | Developer | 2.652/2.652 sitemap URLs đi được trong graph HTML; 0 Product family markup; 0 broken/5xx/noindex ngoài ý muốn trên cohort quan trọng |
| Kiểm tra hub An Cường và chi nhánh 14 Tam Bình trong GSC | SEO | Ghi Last crawl/status/canonical trước/sau; một request mỗi URL khi có thay đổi và Google service hoạt động; không coi request là indexed |
| Lập cohort tối đa 30 URL | SEO + kinh doanh | Bao gồm 6 material landings, 3 services, 2 branches, supplier hubs/collections có impressions và khoảng 10 mã có nhu cầu; không chọn ngẫu nhiên chỉ để đủ số |
| Rà 10 submitted Crawled + legacy 404 có replacement thật | SEO + developer | Ma trận business value/traffic/backlinks/canonical, quyết định từng URL; triển khai redirect chỉ sau duyệt routing phù hợp |
| Xác minh bảng gỗ ghép thật | Kinh doanh/kho | Cao su/tràm: ảnh, quy cách, độ dày, cấp mặt, điều kiện hỏi giá, ngày xác minh; ghi “chưa xác minh” ở phần chưa có |
| Chuẩn hóa đo chuyển đổi | Analytics + kinh doanh | Kiểm tra form success thực và phone/Zalo events, loại internal/test; baseline qualified leads trước khi đặt target |

Không yêu cầu Google index font, CSV, preview hoặc toàn bộ 928 generated noindex URLs. Không sửa WordPress 403 thành 200 để làm đẹp report.

## Ngày 31–60: làm rõ offering, phục vụ buyer intent

- Hoàn thiện `/go-ghep/` và hai child từ bảng dữ liệu đã được kinh doanh xác nhận. Giữ một hub cho các biến thể keyword; bổ sung ảnh/thông số hữu ích trước nội dung dài.
- Phân biệt intent: hub chọn mua; bài kiến thức giải thích gỗ ghép; trang báo giá nhận thông tin; bài file CNC hướng dẫn gia công. Thêm contextual links đúng nhu cầu, không danh sách keyword lặp.
- Tối đa một bài so sánh cao su/tràm hoặc một hướng dẫn chọn mặt/quy cách nếu đủ facts; không thêm chuỗi doorway địa danh. Gỗ thông chỉ làm trang bán hàng sau khi offering được xác nhận.
- Tập trung collection Melamine/Laminate An Cường đang có impressions, title/snippet và hướng chọn mã/cốt; theo dõi CTR cùng position/query mix. Không chỉ tối ưu code pages vốn không có nhu cầu.
- Rà cohort 10–20 mã: có ảnh độc nhất, source mapping, khác biệt mặt/vân/quy cách và nhu cầu. Enrich theo bằng chứng; quyết định index intent từng nhóm sau khi xem traffic/backlinks, không mass-noindex.
- Đo LCP mobile lại với trace. Thử fetch priority/responsive image của hero trên nhánh test, giữ độ rõ ảnh. Đánh giá qua nhiều run tương đương; không hứa CrUX đổi ngay.
- Kiểm tra GBP/NAP hai chi nhánh thật và links trang chi nhánh; cập nhật business facts theo owner. Không thêm địa điểm giả hoặc mua review.

## Ngày 61–90: kiểm tra tác động và mở rộng có điều kiện

- So 28 ngày với 28 ngày trước, thêm so theo country/device; dùng page/query cohorts cố định. Ghi thay đổi content, phát hành và thời điểm Google crawl để tránh kết luận sai quan hệ nhân quả.
- Rà lần hai các URL còn Discovered/Crawled: chưa biết, đã crawl, đã index, đã có impressions. Google vẫn chưa crawl thì xử lý discovery/demand; đã crawl nhưng không chọn index thì rà usefulness/canonical theo Inspection, không tăng word count máy móc.
- Chỉ mở rộng landing MFC/HDF/plywood hoặc dán cạnh khi có phạm vi hàng/dịch vụ và nội dung khác biệt thật. Không mở “gỗ thông” vì thấy đối thủ có traffic.
- Thu thập case/ảnh công việc thật được phép công bố và câu hỏi buyer thật; cập nhật bài/canonical sẵn có trước khi tạo URL mới.
- Đánh giá lead quality và organic revenue nếu analytics/kế toán cho phép; dừng nội dung có traffic sai intent dù impressions cao.

## Dashboard đo lường

| KPI | Baseline audit | Tần suất / cách đọc | Mục tiêu quản trị |
|---|---|---|---|
| Lỗi rendered noindex trên canonical hub | Có trên `/catalogue/` production | Sau deploy và mỗi release, Playwright + DOM | **0** |
| Sitemap URL 200/self-canonical/indexable HTML | 2.652/2.652 | Mỗi release; không nhầm raw với rendered | Duy trì toàn bộ eligible canonical |
| Graph canonical sitemap đi từ homepage | Production 467/2.652; local sau sửa 2.652 | Sau deploy; cùng graph definition | **2.652/2.652**, max depth 4 hiện tại |
| GSC priority cohort: indexed, eligible, canonical đúng, last crawl | Dùng 12 Inspection audit + cohort chọn sau | Hằng tuần lúc đầu; ghi trạng thái URL, không chỉ tỷ lệ | Hết lỗi kỹ thuật ngoài ý muốn; xu hướng crawl/index tốt hơn cho URL có giá trị |
| Submitted Discovered / Crawled / noindex | 1.239 / 10 / 1, snapshot 23/10 | Theo từng lần report update, không theo giờ | Giảm backlog URL quan trọng; noindex sai chủ đích về 0 sau recrawl |
| Web clicks / impressions 28 ngày | 485 / 33.511, 04–31/10 | GSC cùng phạm vi Web/country/device | Tăng organic clicks có intent; đặt target tăng trưởng sau baseline chuyển đổi, không cam kết bằng % index |
| `/go-ghep/` 28 ngày | **5 clicks / 65 impressions / CTR 7,69% / position 6,51** | 28-day rolling; sample nhỏ, không A/B title vội | Tăng impressions/clicks liên quan và lead hữu ích; giữ relevance |
| Gỗ ghép 3-month page cluster (3 canonical) | 18 clicks / 212 page-impressions | Chu kỳ dài để giảm noise | So cùng tập URL; page-impressions không phải unique query/property impressions |
| Melamine An Cường 28 ngày | 37 clicks / 6.422 impressions / CTR 0,58% / position 15,03 | Hằng tháng; segment query/device | Cải thiện clicks ở query đúng buyer intent; so CTR khi position ổn định |
| Phone/Zalo/form đủ điều kiện từ organic | Chưa có baseline đã xác minh | Hằng tháng, gắn CRM/manual qualification | Tạo baseline trước; tăng leads đủ thông tin, không dùng event clicks giả làm đơn hàng |
| AI Search thử nghiệm | 6.356 impressions/3 tháng; chỉ metric impressions được quan sát | Hằng tháng riêng report | Theo dõi trend; không gộp thành clicks/citations/Google Web traffic |
| CWV field | Desktop 412 good; mobile insufficient data | Mỗi 28 ngày, phân biệt group/URL | Giữ desktop good; lấy đủ RUM mobile, không gán lab vào field |
| Lab `/go-ghep/` mobile | LCP 3,3s, CLS 0, TBT 0ms | Nhiều run tương đương khi sửa hiệu năng | LCP hướng ≤2,5s mà không giảm độ rõ; không coi TBT là INP |

Số trang indexed tăng không đủ để kết luận kinh doanh tốt hơn. Báo cáo tháng cần đặt cạnh non-brand search visibility, qualified leads và phạm vi offering có thật. Google recrawl/ranking là kết quả cần quan sát sau phát hành; các số đo local hiện tại chỉ chứng minh sửa kỹ thuật.
