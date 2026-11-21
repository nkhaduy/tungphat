# CTR Optimization Plan

## Chẩn đoán

CTR tổng latest 28 ngày là 1,5%, gần như ngang previous 28 days 1,5%. Trong cùng so sánh, impressions tăng từ khoảng 9,23K lên 38,8K, clicks 138 lên 570, average position từ 6,7 xuống 10,2. Vấn đề chính hiện có bằng chứng là **mix/position**, không phải biến động CTR giảm sau sửa title. Trong query export tới 31/10, các query position 21+ có 2.647 impressions/0 click; nhưng query export chỉ chứa 5.365 trong 39.371 impressions toàn property.

Trang title hiện tại có nhiều trang đã nói đúng địa danh/ý định; không thay hàng loạt. Google tự tạo title link từ title, H1, nội dung và anchor text; snippet cũng có thể lấy từ nội dung. Title/description là thử nghiệm chứ không khóa kết quả hiển thị. Google hướng dẫn title cần rõ, riêng biệt, mô tả chính xác và snippets có thể được tạo tự động từ nội dung: [title links](https://developers.google.com/search/docs/appearance/title-link), [snippets](https://developers.google.com/search/docs/appearance/snippet).

## Portfolio 15 URL — draft only

Copy đề xuất dưới đây theo skill `tung-phat-writing`, chưa publish. Nhóm “hold/control” giữ title hiện tại để không thay một trang đang làm tốt hoặc thiếu dữ liệu truy vấn. Mã SEO không đổi URL/canonical.

| URL | Hiện tại | Draft/control title | Draft/control description | Ý định/evidence | Đợt |
|---|---|---|---|---|---|
| `/catalogue/an-cuong/melamine/` | Mã màu melamine An Cường | **Bảng màu Melamine An Cường: tra mã \| Tùng Phát** | **Tra mã và xem mẫu Melamine An Cường. Mở mã màu để kiểm tra tên, bề mặt và thông tin tham chiếu; gửi mã cùng quy cách nếu cần hỏi vật liệu.** | 10.287 imps/57 clicks live; SERP intent là bảng màu + ảnh; confidence cao | A, title + nội dung |
| `/catalogue/an-cuong/laminate/` | Mã màu laminate An Cường | **Bảng màu Laminate An Cường: tra mã \| Tùng Phát** | **Tra mã Laminate An Cường theo mã màu và tên bề mặt. Mở mã cần xem rồi gửi quy cách khi hỏi vật liệu hoặc gia công.** | 2.221/7 live; historical pos18,34; rank relevance ưu tiên | B, sau nội dung |
| `/catalogue/` | Mã màu vật liệu | **Tra mã màu An Cường, Thanh Thuỳ, Ba Thanh \| Tùng Phát** | **Tìm mã màu hoặc tên mã của An Cường, Thanh Thuỳ và Ba Thanh; chọn đúng hãng và loại bề mặt để xem thông tin tham chiếu.** | Nội dung/3 supplier đã xác minh; chưa có current page-specific metric sau release | Hold tới khi kiểm tra indexed-version |
| `/catalogue/an-cuong/` | Mã màu An Cường | **Tra mã An Cường: Melamine, Laminate, Acrylic \| Tùng Phát** | **Chọn nhóm bề mặt An Cường rồi tìm theo mã hoặc tên. Thông tin ở trang mã là dữ liệu tham chiếu, không thay cho xác nhận quy cách khi hỏi hàng.** | Page hiện có mã các loại; GSC từng lưu noindex cũ, chưa có recrawl mới | Hold tới recrawl |
| `/` | Tùng Phát \| Ván gỗ công nghiệp & Gia công CNC tại Thủ Đức | **Giữ nguyên** | **Giữ nguyên** | 1.167/64 live; historical 5,12 pos và CTR 5,34%; control | Control |
| `/go-ghep/` | Gỗ Ghép Thủ Đức – Cao Su, Tràm & Gia Công | **Gỗ ghép cao su, tràm và gia công tại Thủ Đức \| Tùng Phát** | **Tìm hiểu hướng gỗ ghép cao su, tràm và cách gửi mặt sử dụng, kích thước, số lượng để hỏi hàng hoặc cắt/CNC.** | 171/14 live, historical 150/13 pos6,82; high CTR, low volume | A/control, ưu tiên nội dung |
| `/go-ghep-cao-su/` | Gỗ Ghép Cao Su Thủ Đức \| Quy Cách & Báo Giá \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | 24 impressions trong export cũ; sample nhỏ, business quy cách cần xác nhận | Control |
| `/go-ghep-tram/` | Gỗ Ghép Tràm Thủ Đức \| Quy Cách & Báo Giá \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | 38 impressions/3 clicks cũ; page copy cần khử lặp trước title experiment | Control |
| `/van-mdf/` | Ván MDF Thủ Đức \| Quy Cách & Báo Giá \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | Search appearance trước đây invalid Product; đã chuyển schema CollectionPage trong release, không bịa offer | Control; đọc lại GSC |
| `/mdf-chong-am/` | MDF Chống Ẩm Thủ Đức \| Quy Cách & Báo Giá \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | Same: không dùng schema giả; chưa có current page CTR evidence | Control |
| `/catalogue/thanh-thuy/` | Mã màu Thanh Thuỳ \| Tùng Phát | **Tra mã màu Thanh Thuỳ: tìm theo mã và tên \| Tùng Phát** | **Tìm mã và tên bề mặt Thanh Thuỳ trong catalogue; mở mã để xem thông tin tham chiếu rồi gửi yêu cầu theo quy cách.** | 280/10 live, CTR 3,57%; historical 252/9, position6,11 | Hold/control |
| `/catalogue/thanh-thuy/melamine/` | Mã màu Melamine Thanh Thuỳ \| Tùng Phát | **Tra mã Melamine Thanh Thuỳ theo tên và mã \| Tùng Phát** | **Tìm mã Melamine Thanh Thuỳ, kiểm tra tên bề mặt rồi gửi mã cùng quy cách cần hỏi.** | 347/7 live; historical 310/6, pos6,5 | B, query review trước |
| `/bai-viet/chuan-bi-file-cnc/` | Chuẩn bị file CNC gỗ \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | 254/11 live; 230/11 historical; pos5,42; content service relevance | Control; thêm CTA liên kết |
| `/gia-cong-cnc/` | Gia Công CNC Thủ Đức \| Cắt & Gia Công Ván Gỗ \| Tùng Phát | **Cắt ván và gia công CNC theo yêu cầu tại Thủ Đức \| Tùng Phát** | **Gửi vật liệu, độ dày, kích thước, số lượng và file để trao đổi yêu cầu cắt ván, CNC hoặc dán chỉ cạnh.** | Query opportunity from current SERP/commercial intent; page-level GSC rows not observed | B, only after query export |
| `/cat-cnc-go/` | Cắt CNC Gỗ Thủ Đức \| Gửi File & Báo Giá \| Tùng Phát | **Giữ nguyên** | **Giữ nguyên** | Indexed at prior inspection; current live metadata accurately instructs file/spec submission | Control |
| `/bao-gia/` | Báo giá ván MDF, MFC và gia công CNC TP.HCM \| Tùng Phát | **Báo giá ván MDF, MFC và gia công CNC tại TP.HCM \| Tùng Phát** | **Chuẩn bị hãng, cốt/bề mặt, độ dày, kích thước, số lượng và yêu cầu cắt/CNC để Tùng Phát kiểm tra báo giá.** | Price intent; site does not publish a price list; retain transparent quote process | B after quote tracking |

The table covers 15 requested URLs including controls; only Melamine is ready for a controlled title/snippet test. Others are proposals or intentionally held. Do not publish as a batch.

## Test order and scenario model

**Test A — Melamine collection only:** current title/meta and visible lead-in vs proposed variant; keep code URLs/canonical and URLs unchanged. Freeze other titles during the observation window. Record changed-at date and Google first recrawl if observable. Compare 28–42 day complete windows after recrawl with previous period, Vietnam/device and query cluster. Control with supplier collection page not changed, but note it is not a randomized control. One site and one page cannot establish causality.

**Math, not forecast:** Additional clicks = impressions × absolute CTR delta.

| Page/assumption | Conservative +0,25 pp | Moderate +0,50 pp | Ambitious +1,00 pp |
|---|---:|---:|---:|
| Melamine An Cường, 10.287 impressions | 26 | 51 | 103 |
| Laminate An Cường, 2.221 impressions | 6 | 11 | 22 |

The values hold impressions constant and assume a CTR gain at the same query, country, device and comparable ranking. A position or query-mix change can dominate this result. Laminate remains a later cohort because its historical position was 18,34. Do not tell the business these numbers are expected.

## Measurement safeguards

- Capture baseline query × page × country × device, specifically exact code vs broad “bảng màu/mã màu” queries; GSC export today was blocked by Chrome `ERR_BLOCKED_BY_CLIENT`, so use UI/API with owner-authorized method next time.
- Report impressions, clicks, CTR, position and click differences as absolute counts; annotate when the page was crawled again.
- Treat Google rewrite of title/snippet as an observed outcome; do not assume HTML equals rendered SERP.
- Stop/roll back a title only for material mismatch or an unexpected drop at comparable position/query mix, not for one weekly fluctuation.
