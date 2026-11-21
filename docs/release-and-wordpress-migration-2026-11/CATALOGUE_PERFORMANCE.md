# Hiệu năng catalogue — Phase 6

## Kết luận

**Chưa đóng blocker LCP catalogue.** Phase 5 đo ba lượt mobile network/CPU throttle được 10.804, 10.824, 10.808 ms (median 10.808 ms), với LCP là `/images/material-color-hero.webp`. Ảnh nguồn 1.916×821, 607.864 byte, hiển thị trên viewport 390px và không có `srcset`; hero đã có preload và `fetchpriority=high` trong HTML. Các kết quả lab không phải CWV/CrUX thực địa.

File hero đã có sẵn từ commit `6ecc337` nhưng commit và inventory không xác định nguồn gốc hay quyền tạo biến thể. Theo chỉ đạo không tạo asset phái sinh khi quyền chưa được xác minh, Phase 6 không tạo hoặc thay ảnh, và không chuyển sang hình khác chưa được cấp quyền. Đây là blocker cụ thể: chủ sở hữu cần xác nhận nguồn và quyền xử lý `public/images/material-color-hero.webp`, sau đó mới tạo biến thể mobile, kiểm tra hình và đo lại. Không xóa thumbnail SKU hoặc hoãn tương tác catalogue chỉ để cải thiện điểm.

## Điều kiện đo

Chrome headless 157, Playwright và CDP, static export local Next.js, viewport 390×844, DPR 1, cache browser tắt, CPU 4×, mạng CDP 150 ms, 1.600 kb/s tải xuống và 750 kb/s tải lên. Mỗi route ba lần, context mới; Google tag và endpoint analytics bị chặn. Đo LCP PerformanceObserver sau load, CLS sau thao tác nhập tìm mã, long-task proxy = phần thời gian task vượt 50 ms; không phải Lighthouse TBT, không phải INP hay p75 field. CDP là mô phỏng, mạng CDN thực tế có biến thiên. Không so sánh trực tiếp với CrUX.

## Chẩn đoán

Baseline Phase 5 cho catalogue tải tổng ảnh khoảng 1,79 MB: hero khoảng 608 KB transfer, logo Ba Thanh khoảng 414 KB và một số thumbnail 99–217 KB. Hero được phát hiện trong HTML ban đầu, priority high; nguồn lớn và các request ảnh cạnh tranh băng thông là vấn đề đo được. Stylesheet chặn render theo browser mặc định, tổng transfer CSS khoảng 18 KB; chưa có căn cứ khẳng định CSS/JS là nguyên nhân chính. Không gộp decode time với render delay: PerformanceObserver và Resource Timing chỉ cho biết khoảng còn lại sau response, không tách chính xác decode khỏi render. Không có Lighthouse TBT.

Read-only HEAD ngày 15/11/2026: hero từ domain website `cache-control: public, max-age=604800, stale-while-revalidate=86400`, `content-length: 607864`, `x-vercel-cache: MISS` tại một thời điểm. Ảnh mẫu BT111 từ CDN `cache-control: public, max-age=31536000, immutable`, `content-length: 238024`. Một header không chứng minh cache hit phổ biến hay latency thực tế cho mọi người dùng.

## Lần đo Phase 6

| Trang | Ba lượt Phase 6 (ms) | Median Phase 6 | Median Phase 5 | CLS sau thao tác | Long-task proxy (ms) |
|---|---|---:|---:|---:|---|
| `/catalogue/` | 10.800, 10.808, 10.804 | 10.804 | 10.808 | 0,0212 | 15, 18, 16 |
| `/catalogue/ba-thanh/melamine/bt111/` | 3.224, 3.224, 3.232 | 3.224 | 3.224 | 0 | 9, 11, 9 |

Mẫu catalogue: TTFB 152 ms; hero request bắt đầu 169 ms, responseEnd 10.790 ms, LCP 10.800 ms, priority High, 608.155 byte transfer; ảnh tổng 1.791.648 byte, CSS 18.362 byte, JS 158.958 byte trong lượt đầu. Như vậy discovery không muộn, thời gian từ request đến responseEnd chiếm phần lớn; khoảng 10 ms từ responseEnd tới LCP không đo riêng được decode đã chạy trước đó. Các request ảnh và fetch cạnh tranh có thể đóng góp, nhưng không có đối chứng kiểm soát để quy toàn bộ delay cho từng tài nguyên. Ảnh detail BT111: priority High, 238.583 byte transfer, request 170 ms, responseEnd 3.214 ms, LCP 3.224 ms. Giá trị encodedBodySize cross-origin bằng 0 vì thiếu Timing-Allow-Origin; byte dùng CDP `Network.loadingFinished`.

So với trước khi tăng priority cho ảnh đầu trang mã, median BT111 không đổi ở điều kiện này; không tuyên bố cải thiện. Hero catalogue cũng chưa được thay đổi và median hầu như không đổi. `performance-evidence/measurements.json` chứa dữ liệu đã bỏ response headers, `measure.cjs` tái lập phép đo; các ảnh `phase6-catalogue.png`, `phase6-code.png` và Playwright `*-trace.zip` ghi lại phiên đầu mỗi trang. Trace là Playwright trace/network, không phải Chrome DevTools Performance trace; LCP phần tử được PerformanceObserver xác định. Cần đối chiếu quyền hero rồi thử biến thể phù hợp và so sánh ít nhất ba lượt; cần CrUX/field để kết luận trải nghiệm người dùng thật.
