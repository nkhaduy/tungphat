> **T0 đã xác nhận:** 03/11/2026 09:31:10 giờ Việt Nam; deployment `dpl_Evtrh3JBPekkiKqSwtmKB7sUY5zG`. Mốc thực tế: 10/11, 17/11, 03/12/2026 và 02/01/2027. Xem DEPLOYMENT_RESULT.md. Nội dung phương pháp bên dưới giữ lại từ trước release.

# Baseline và đánh giá 7/14/30/60 ngày

Baseline audit **không phải số liệu realtime ngay trước release**. Dữ liệu Performance cuối kỳ 31/10/2026; Page Indexing chart cuối 23/10. Export/inspection lấy 02–03/11, mỗi URL có last crawl riêng. Chưa có deploy trong phiên chuẩn bị này. T0 là thời điểm chủ website phát hành thật, không lấy ngày báo cáo làm T0.

`GSC_BASELINE.csv`: 60 hàng, 29 URL × 2 kỳ và hai property totals. Kỳ 3 tháng 01/08–31/10, 28 ngày 04–31/10; Web, tất cả quốc gia/thiết bị. Số page/query không nhìn thấy trong export 1.000 hàng để trống với cờ NOT OBSERVED, **không điền 0**. CTR giữ số GSC công bố, position là trung bình impressions theo GSC. Property total lấy chart theo ngày; không cộng page rows để thay tổng property.

Baseline Page Indexing: 1.403 indexed, 1.572 not indexed; submitted 1.402 indexed/1.250 excluded theo audit. Không trừ/cộng thành “URLs bị lỗi” vì exclusions có chủ đích và report có phạm vi/timing riêng. Nhóm nguyên nhân chi tiết giữ tại `../GSC_INDEXING_DIAGNOSIS.md`. Các URL có clicks trong Performance nhưng không có Inspection không tự được gắn trạng thái Indexed hiện tại.

## T0 — trước và ngay sau phát hành

Trước khi promote, tải lại 28 ngày hoàn chỉnh mới nhất, cùng 28 ngày trước đó và cùng kỳ năm trước nếu có; lưu query × page, device và Vietnam riêng, gồm bộ lọc. Giữ baseline audit để so lịch sử, thêm baseline mới với ngày thật. Ghi deployment ID, thời gian Việt Nam/UTC, source commit, artifact SHA256 và mọi thay đổi nội dung cùng lúc. Nếu có release khác xen vào, ghi confounder.

Ngay sau promote: kiểm tra production domain, default catalogue sau hydration, filtered URL, canonical, robots, sitemap, bốn family schemas, ba supplier hubs, exact code ba hãng, liên hệ/Zalo và mobile. Thu evidence HTTP/HTML/screenshots. Technical acceptance cần pass trước theo dõi SEO. Không gửi yêu cầu index với URL vẫn chưa nhận bản sửa.

`WATCHLIST.csv` gồm An Cường, hai chi nhánh Tam Bình, ba gỗ ghép, collections và tám mã có clicks. Inspection có hạn mức: lấy mẫu `/catalogue/`, `/catalogue/an-cuong/`, `/chi-nhanh/14-tam-binh/`, cao su, tràm, Melamine collection và 1–2 mã có giá trị; không cần inspect toàn bộ hằng ngày. Nếu hỗ trợ live test và owner cho phép sau release, test/request một lần các URL đã có thay đổi ý nghĩa. Không dùng Indexing API cho product pages.

## Ngày 7

- Kiểm tra lại kỹ thuật, lỗi JS, noindex/canonical và sitemap fetch; đối chiếu availability bằng quan sát/edge logs nếu có, không giả có telemetry.
- GSC Inspection: last crawl có sau T0 chưa; Google canonical so declared; Page Indexing và sitemaps processing. Phân biệt indexed-version với Live Test.
- Performance chỉ tín hiệu sớm, dùng ngày đã hoàn chỉnh và ghi độ trễ. Không tuyên bố ranking/CTR tăng sau một tuần từ sample nhỏ.

## Ngày 14

So 14 ngày hoàn chỉnh sau T0 với 14 ngày trước, cùng ngày trong tuần; tách gỗ ghép, collection, exact-code và local. Lưu clicks/impressions/CTR/position, số URL có impressions/clicks trong watchlist, query mix và country/device. Nếu recrawl chưa tới, ghi “chưa có evidence mới”, không gọi fix thất bại hay indexed. Theo dõi hub An Cường có bỏ trạng thái noindex cũ trong indexed-version chưa.

## Ngày 30

Dùng cửa sổ 28 ngày đã hoàn chỉnh sau T0 so 28 ngày trước T0; tách brand/non-brand bằng quy tắc được lưu. Với Melamine, so query bảng màu rộng và exact code riêng; chỉ đánh giá CTR ở dải position/device/country tương đương. Dùng collection Laminate/Acrylic chưa đổi nội dung làm nhóm tham chiếu, không xem đó là kiểm chứng nhân quả. Đọc query × page để phát hiện intent overlap thực tế trước sửa canonical.

Gỗ ghép có baseline rất nhỏ: báo cả số tuyệt đối, không chỉ % (2 → 4 clicks chưa đủ kết luận). Nếu có tracking hợp lệ, ghi số yêu cầu báo giá đủ loại gỗ/kích thước/số lượng; không tự cài pixel hay thu dữ liệu cá nhân trong task này.

## Ngày 60

So hai cửa sổ 28 ngày sau release với baseline và kỳ trước; tổng hợp số URL quan trọng được Google xác nhận indexed, số URL có impressions/clicks, non-brand cluster visibility và leads đủ thông tin khi đo được. Rà mẫu Discovered/Crawled có giá trị và internal links, nội dung độc đáo; không mass-noindex mã vắng traffic trong export giới hạn. Quyết định tiếp tục nội dung/UX dựa dữ liệu này.

## KPI và ngưỡng hành động

| KPI | Mục tiêu hợp lý / trigger |
|---|---|
| Kỹ thuật | 100% URL watchlist kiểm tra trả đúng HTTP/canonical/robots kỳ vọng; catalogue giữ URL sau hydration; 0 regression search 3 hãng |
| Sitemap | Giữ 2.652 URL eligible hiện tại trừ thay đổi business có chủ đích; không thêm query/noindex/redirect |
| Schema | Bốn material families là CollectionPage; không Product/Offer giả; code SKU phù hợp giữ schema đúng |
| Discovery | Hub/collection/code quan trọng có anchor HTML, không orphan trong graph kiểm tra; GSC last crawl mới là bằng chứng Google tới |
| Indexing | Số URL giá trị xác nhận indexed tăng hoặc exclusions có giải thích; không đặt 100% tổng URLs |
| Search visibility | Theo dõi absolute clicks/non-brand impressions và query coverage theo cohort; đặt mục tiêu tăng trưởng sau khi có baseline đủ mẫu, không hứa tỷ lệ |
| Rollback | P0 technical regression mới do release: canonical/noindex sai trên canonical, search hỏng, assets/critical routes lỗi, routing CMS/media mất. GSC chưa recrawl hoặc ranking dao động đơn lẻ không phải lý do rollback |

Không tạo automation theo dõi định kỳ trong yêu cầu này. Lịch trên là phương pháp vận hành sau khi có T0 thật.
