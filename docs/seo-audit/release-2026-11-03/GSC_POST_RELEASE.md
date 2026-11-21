# GSC sau phát hành — 03/11/2026

Production T0 **09:31:10 giờ Việt Nam**. Đã truy cập trực tiếp GSC property `sc-domain:mdftungphat.com` qua phiên Chrome được cấp quyền. Không suy trạng thái index từ HTTP 200, sitemap hay local tests. Evidence có cấu trúc: `evidence/deployment/gsc-t0-observations.json`.

## Baseline gần lúc promote

Đã chọn lại 28 ngày trong UI: **04–31/10/2026**, Web, mọi quốc gia/thiết bị. Report vẫn kết thúc 31/10, hiển thị lần cập nhật 12,5 giờ trước; không phải dữ liệu traffic sau release.

- Toàn property: 485 clicks, UI 33,5K impressions, CTR 1,4%, position 9,3. CSV audit đã lưu exact 33.511 impressions; không dùng số UI làm số exact mới.
- Exact page Melamine An Cường: 37 clicks, UI 6,42K impressions, CTR 0,6%, position 15; CSV audit exact 6.422 và 15,03. Vẫn cùng baseline, chưa có evidence tăng trưởng.

## Indexed-version và Live Test là hai nguồn khác nhau

| URL | Indexed-version đọc sau release | Last crawl ghi trong GSC | Bằng chứng live mới / hành động |
|---|---|---|---|
| `/catalogue/` | URL nằm trên Google; canonical người dùng và Google đều URL kiểm tra; sitemap được nhận | **08/10/2026 10:36:20**, Googlebot smartphone | **Live Test 03/11 09:34:26 PASS**: Google có thể index, crawl allowed Có, fetch Thành công, indexing allowed Có; canonical `/catalogue/`. Google-selected canonical chỉ xác định sau indexing |
| `/catalogue/an-cuong/` | URL không trên Google, Excluded by noindex; sitemap “Lỗi xử lý tạm thời”; canonical URL kiểm tra | **31/07/2026 00:20:29**, Googlebot smartphone | **Live Test 03/11 09:38:08 PASS**: fetch Thành công, crawl/index allowed Có; canonical đúng hub; một Breadcrumb hợp lệ. Noindex trong bản lưu cũ không phải noindex production hiện tại |
| `/chi-nhanh/14-tam-binh/` | **Google không xác định được URL**, chưa index; không có referring sitemap/crawl/canonical trong kết quả này | **Không áp dụng** | URL exact có trailing slash; production HTTP 200, canonical đúng và có trong sitemap đã kiểm tra. Audit cũ ghi Discovered ở report/sample trước: giữ cả hai quan sát có thời điểm/phạm vi riêng; chưa chứng minh nguyên nhân khác biệt |
| `/go-ghep-cao-su/` | URL trên Google nhưng có vấn đề; một Product item không hợp lệ, một Breadcrumb hợp lệ; canonical tự tham chiếu được Google chọn | **19/10/2026 11:45:01**, Googlebot smartphone | Production mới có **CollectionPage**, không Product giả, đã kiểm tra HTTP/JSON-LD. Chưa có indexed-version recrawl mới chứng minh Google đã bỏ lỗi Product cũ |

Các giờ crawl/live trên là giờ GSC hiển thị trong phiên, ghi nguyên giá trị. Không gọi Live Test là crawl sản xuất thông thường; đây là Google Inspection Tool smartphone.

**Đã xác minh sau deploy:** Google có thể tìm nạp và lập chỉ mục hai URL catalogue/hub trong Live Test. **Chưa xác minh:** indexed-version được cập nhật sau T0, An Cường đã vào index, chi nhánh đã được crawl/index, Product enhancement đã hết lỗi, hoặc traffic/ranking tăng.

## Request Indexing

Đã thử **một lần** với `/catalogue/` sau Live Test thành công và bản sửa hydration có ý nghĩa. GSC trả:

> Chúng tôi gặp sự cố khi gửi yêu cầu lập chỉ mục của bạn. Vui lòng thử lại sau.

UI đồng thời báo không kết nối được dịch vụ reCAPTCHA. **Không có xác nhận request được nhận vào queue.** Không lặp request, không giải/bypass CAPTCHA, không dùng Indexing API. Không gửi thêm cho An Cường/chi nhánh khi lỗi này còn xuất hiện. Đây là blocker dịch vụ/xác thực GSC cho thao tác request, không phải evidence website production hỏng.

Khi dịch vụ bình thường, có thể gửi một yêu cầu cho URL ưu tiên đã sửa sau khi kiểm tra live; không yêu cầu lại hằng ngày. Google crawl qua sitemap/internal links vẫn cần được quan sát độc lập.

## Việc cần theo dõi

- **10/11:** catalogue/An Cường last crawl indexed-version có sau 03/11 09:31 không; canonical/robots đúng; kiểm tra discovery chi nhánh exact URL.
- **17/11:** đối chiếu bốn family schemas với Google enhancement/indexed-version mới; không đánh dấu đã hết lỗi chỉ vì local validator pass.
- **03/12 và 02/01/2027:** dùng các cửa sổ và cohort trong MEASUREMENT_PLAN, đọc clicks/impressions/query mix; tách technical fix với đợt nội dung chưa phát hành.

Không có tổng indexed/not-indexed mới được xuất trong lần kiểm tra release này. Số Page Indexing 23/10 của audit chỉ là baseline lịch sử, không dùng làm số realtime sau deploy.
