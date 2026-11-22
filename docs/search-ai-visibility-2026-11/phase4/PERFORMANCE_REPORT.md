# Hiệu năng — 14/11/2026, bản build local

Chrome 157 headless qua Playwright; static export Next 15 phục vụ qua `serve` trên loopback, không có throttling mạng, mỗi route một context mới; mobile 390×844, CPU throttle 4×; desktop 1440×900, CPU mặc định; dừng quan sát 2,5 giây sau load. CDN vẫn là mạng thật, máy host và cache hệ điều hành ảnh hưởng kết quả. LCP/CLS lấy PerformanceObserver; đây là một lượt lab tự đo, không phải Lighthouse, field p75 hay điều kiện mobile network chuẩn. Với LCP thường là logo, cần trace để kiểm tra phần tử chính và khả năng ảnh lớn hiển thị muộn. `LCP` ở đây chỉ là giá trị cuối được quan sát trong cửa sổ ngắn.

| Trang | Thiết bị | LCP ms | CLS | TTFB ms | Long-task proxy ms | JS transfer bytes |
|---|---:|---:|---:|---:|---:|---:|
| `/` | mobile | 196 | 0.000 | 22 | 6 | 139502 |
| `/san-pham/` | mobile | 192 | 0.000 | 62 | 12 | 141981 |
| `/catalogue/` | mobile | 1028 | 0.000 | 3 | 13 | 152230 |
| `/van-mdf/` | mobile | 88 | 0.000 | 2 | 11 | 143698 |
| `/acrylic/` | mobile | 152 | 0.000 | 5 | 6 | 143698 |
| `/gia-cong-cnc/` | mobile | 84 | 0.000 | 2 | 5 | 139961 |
| `/bai-viet/mdf-thuong-va-chong-am/` | mobile | 416 | 0.000 | 4 | 11 | 140881 |
| `/catalogue/ba-thanh/melamine/bt111/` | mobile | 444 | 0.000 | 2 | 22 | 156610 |
| `/thuong-hieu/ba-thanh/` | mobile | 104 | 0.000 | 4 | 13 | 147137 |
| `/` | desktop | 56 | 0.000 | 3 | 0 | 142797 |
| `/san-pham/` | desktop | 60 | 0.000 | 6 | 0 | 143559 |
| `/catalogue/` | desktop | 900 | 0.000 | 3 | 0 | 153808 |
| `/van-mdf/` | desktop | 56 | 0.000 | 4 | 0 | 145276 |
| `/acrylic/` | desktop | 56 | 0.000 | 3 | 0 | 155676 |
| `/gia-cong-cnc/` | desktop | 44 | 0.000 | 2 | 0 | 140621 |
| `/bai-viet/mdf-thuong-va-chong-am/` | desktop | 356 | 0.000 | 3 | 0 | 146196 |
| `/catalogue/ba-thanh/melamine/bt111/` | desktop | 568 | 0.000 | 9 | 0 | 159905 |
| `/thuong-hieu/ba-thanh/` | desktop | 48 | 0.000 | 4 | 0 | 147797 |

Long-task proxy = tổng phần vượt 50 ms của long task trong cửa sổ quan sát; **không phải Total Blocking Time Lighthouse** (khác cửa sổ FCP/TTI). `jsBytes` là tổng encodedBodySize resource script mà browser báo, có thể thiếu dữ liệu cross-origin; không phải tổng kích thước bundle. TTFB loopback không đại diện hosting/CDN. Không có INP field, CrUX hoặc Lighthouse/TBT chuẩn; không kết luận đạt ngưỡng field 2,5 s / 0,1 / 200 ms. `PERFORMANCE_RAW.json` và `measure.cjs` giữ dữ liệu và cách đo.

Mẫu catalogue mobile có LCP 1.028 ms, phần tử ảnh CDN; 103 thẻ ảnh, không có `srcset` trong DOM tại thời điểm kiểm tra. Có ảnh không `srcset` không tự chứng minh tải quá lớn; cần trace kích thước hiển thị và transfer trên mobile network trước khi thay. Các lượt đã đo không báo ảnh hoàn tất nhưng lỗi và không tràn ngang; không chứng minh mọi ảnh tải vì ảnh lazy có thể chưa được yêu cầu. Cả 18 lượt báo 3 CSS resource; chưa đo thời gian chặn render. Hai font local WOFF2 được preload, `font-display: swap`. Trang catalogue, mã và một số trang nạp CDN, có Google Maps lazy; bản build thử không cấu hình ID GA4 nên không đại diện tác động của Google tag. JS đo 139.502–159.905 byte; xem raw để so từng trang.

Không thực hiện tối ưu hiệu năng chưa có bằng chứng tác động, không xóa ảnh/chức năng. Bước tiếp: Lighthouse/DevTools trace mobile có network throttle và 3+ lượt; xác định LCP element thực, kích thước ảnh đã tải, CSS blocking, long tasks và tác động third-party khi cấu hình đúng. Sau deploy lấy CrUX/GSC theo p75 nếu đủ dữ liệu. `images:check` báo ảnh PNG nguồn/legacy >1,5 MB; chưa kết luận chúng là ảnh đang chặn LCP.
