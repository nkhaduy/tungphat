# Catalogue: thí nghiệm Phase 8

Điều kiện cả năm mẫu: Chrome headless, 390×844 DPR 1, cache tắt, CPU 4×, CDP download 1.600 kb/s, upload 750 kb/s, latency 150 ms, analytics bị chặn, static export local. LCP và CLS là số lab, không phải field CWV. Mỗi dòng ba context mới. LCP trước thao tác; CLS đo sau nhập tìm mã. `evidence/*.json` có timing/priority/transfer đã bỏ response headers, các script và trace/screenshot giúp tái lập.

| Mẫu | LCP ba lượt (ms) | Median | Image bytes xấp xỉ | Ghi chú |
|---|---|---:|---:|---|
| Baseline | 10.808 / 10.804 / 10.804 | 10.804 | 1.792 KB | Hero 608.155 byte transfer, High |
| Probe giữ logo/thumbnail đến khi hero tải xong | 5.248 / 5.252 / 5.248 | 5.248 | 746 KB ở thời điểm thu thập | Can thiệp request bằng Playwright, không phải implementation |
| Implementation trước khi giới hạn phạm vi | 5.728 / 5.732 / 5.728 | 5.728 | 755 KB | Phát hiện regression An Cường; đã sửa |
| Implementation cuối, chỉ catalogue tổng | 5.736 / 5.728 / 5.736 | 5.736 | 755 KB | Hero giữ nguyên byte; khoảng −47%; CLS 0,02124 |
| Hero hình học thử độc lập | 6.592 / 5.884 / 5.936 | 5.936 | 1.184 KB | SVG tự tạo được inject qua route, không áp vào sản phẩm |
| Implementation + hero thử | 4.208 / 1.316 / 1.092 | 1.316 | 49–148 KB | LCP đổi phần tử; inject qua route có thể bỏ qua điều kiện tải thực, chỉ là probe |

Implementation trì hoãn ảnh thẻ và logo nhà cung cấp đến khi vào viewport, không trì hoãn fetch index tìm kiếm; có fallback `noscript` và nếu thiếu IntersectionObserver. Screenshot được chụp sau khi nhập tìm kiếm. Bảng không chứng minh trải nghiệm cuộn hoặc web vitals thực địa: xem kết quả browser riêng. Hero hình học chỉ nằm trong evidence; không phát hành, không dựa trên ảnh nguồn. Chưa tạo responsive derivative của `public/images/material-color-hero.webp` vì chưa có bằng chứng quyền chỉnh sửa. Cần chủ website xác nhận quyền hoặc cung cấp ảnh có quyền; kết quả 5,7 giây vẫn vượt mục tiêu nội bộ 4 giây.
