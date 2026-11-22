# Baseline SEO, AEO và GEO — 14/11/2026

## Phạm vi và nguồn

Production là website công khai hiện tại; code local chứa nhiều thay đổi chưa commit từ hai vòng trước và Phase 3, chưa deploy. Không dùng số liệu của local để khẳng định kết quả production. Audit trước: `../content-visual-audit-2026-11/REPORT.md` cùng bốn CSV inventory/URL; kiểm tra HTML production 13/11 gồm 2.664 sitemap và 925 URL ngoài sitemap, không chứng minh index thực tế hay kiểm tra thủ công mọi ảnh/nội dung. Trong lượt này lấy mẫu 17 URL, bằng chứng `evidence/production-sample.json`; không quét lại toàn bộ.

GSC **lịch sử**, đọc 08/11, dữ liệu đến 06/11: 570 clicks, khoảng 38.800 impressions, CTR 1,5%, vị trí TB 10,2 trong 10/10–06/11. Không phải dữ liệu hiện hành hoặc kết quả thay đổi local. Nguồn và các giới hạn query export: `../seo-audit/growth-2026-11/02 — GSC_DEEP_DIVE.md`; 57 clicks/10.287 impressions ở trang catalogue Melamine An Cường và 7/2.221 ở Laminate là số cấp trang trong cửa sổ ba tháng, không chứng minh một query cụ thể dẫn tới trang đó.

## Crawl và index

- 15 trang chính/chi nhánh trong mẫu và 2 URL BT01 trả 200, một H1 và canonical; 15 trang chính self-canonical, hai URL BT01 canonical về URL mới. Các trang chính mẫu có index/follow; hai BT01 có noindex/follow. Không có `nosnippet`, `data-nosnippet` hoặc `max-snippet` được thấy trong HTML mẫu; max-image-preview:large không đồng nghĩa max-snippet. Đây là kiểm tra chuỗi/HTML, không phải mọi header ở mọi URL.
- `robots.txt` production cho `User-agent: *` allow `/`, chặn API, admin, preview và tham số tìm/lọc; có sitemap. Request mô phỏng Googlebot, bingbot, OAI-SearchBot, GPTBot và ChatGPT-User tới `/van-mdf/` đều nhận 200 ngày 14/11. User-agent có thể giả mạo; chưa kiểm tra IP thật, log CDN/WAF hoặc điều kiện theo địa lý. Không có căn cứ bot tìm kiếm bị chặn để sửa robots. Wildcard hiện cho phép GPTBot ở trang công khai: **đây là trạng thái hiện tại, không phải xác nhận chủ sở hữu muốn cho phép training**; giữ nguyên.
- Phân tích lại 925 URL cũ: 260 alias mã Ba Thanh canonical đến mã mới; theo hai CSV snapshot 13/11, 257 đích cũng ở nhóm ngoài sitemap/noindex, 3 đích ở sitemap. Mẫu `/ma-mau-melamine/ba-thanh/bt01/` và `/catalogue/ba-thanh/melamine/bt01/` hiện đều noindex. `buildCatalogueCodeSeo` chỉ index tier A dựa vào dữ liệu/ảnh; alias dùng noindex/follow. Đây là chủ đích hạn chế trang thông tin yếu, nhưng chưa đánh giá tương đương, nhu cầu và giá trị 260 cặp. Không thay đổi noindex, redirect, canonical hoặc sitemap.
- Nội dung chính có HTML xuất sẵn trong mẫu; component tìm mã vẫn cần JS cho tìm/lọc. Đường dẫn `?group=` có xử lý cho người dùng nhưng thuộc nhóm bị robots chặn; Phase 3 thêm các link ngữ cảnh tới trang nhóm hãng không tham số. Không kết luận toàn bộ crawl depth hay phát hiện mọi trang mồ côi; audit local trước đó có `/du-an/` cần điều tra khác biệt đồ thị.

## Structured data và local

Mẫu JSON-LD parse được: Organization/WebSite toàn site, CollectionPage cho vật liệu, Article/Breadcrumb cho bài, Service cho CNC, LocalBusiness riêng 2 địa chỉ. `@id` tổ chức và chi nhánh đã liên kết. Đây là kiểm tra cú pháp và một số loại/thuộc tính, chưa phải Google Rich Results Test hay kiểm chứng toàn bộ thuộc tính và ảnh. Không thêm giá, tồn kho, đánh giá, GTIN hoặc schema riêng cho AI. FAQ hiện hữu không phải cam kết rich result.

Tên, địa chỉ, điện thoại từ `content/settings/business.json`; nguồn và giới hạn ở `04 — ENTITY_FACTSHEET.md`. Chưa truy cập GBP, WAF, GSC/GA4/Bing hiện thời. Chưa có field CWV hoặc Lighthouse trong lượt này; không suy CLS từ ảnh thiếu width/height khi chưa xem CSS/đo thực tế.

## Hướng dẫn chính thức

- [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features), [tối ưu AI](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [nội dung hữu ích](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): nội dung có thể crawl/index, hữu ích và nhất quán; không có schema đặc biệt bắt buộc. AI features gộp trong báo cáo Web, không tự suy citation từ GSC tổng hợp.
- [OpenAI bots](https://developers.openai.com/api/docs/bots): search, training và user-triggered là các tác nhân riêng; cho phép search không đảm bảo được trích dẫn. Nếu cần exception WAF, xác minh IP theo danh sách chính thức và phạm vi hẹp, không tin user-agent đơn lẻ.
- [Bing AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/): citation và grounding query chỉ trong các bề mặt được hỗ trợ, mang tính tổng hợp/lấy mẫu; cần tài khoản và đủ dữ liệu. [Google FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes): chủ yếu giới hạn các trang chính phủ/y tế có thẩm quyền.
- `llms.txt` hiện có là thử nghiệm, không phải yêu cầu hay bảo đảm indexing; không mở rộng nó để đánh lừa crawler.
