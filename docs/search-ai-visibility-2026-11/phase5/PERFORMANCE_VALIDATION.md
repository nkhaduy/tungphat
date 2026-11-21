# Kiểm tra hiệu năng Phase 5

Chrome 157 headless, Playwright/CDP, static export trên loopback; mobile 390×844, DPR 1, CPU 4×, cache browser tắt, network CDP 150 ms latency, 1.600 kb/s xuống và 750 kb/s lên, ba lượt độc lập mỗi route. Ngày 14/11/2026. Dùng GA ID giả; request Google/analytics bị chặn. CDN ảnh qua mạng thật, loopback có throttle nhưng không có độ trễ hosting/CDN thực, không phải Lighthouse/CrUX. `PERFORMANCE_RAW.json` giữ từng resource và `performance-measure.cjs` là phép đo; đo đến 2,5 giây sau load, sau đó nhập BT111 tại catalogue và ghi CLS tiếp. Long-task proxy là tổng phần vượt 50 ms, không phải Lighthouse TBT; INP field chưa có.

| Route | LCP ba lượt (ms) | LCP được quan sát | CLS sau tương tác | Long-task proxy (ms) |
|---|---|---|---|---|
| `/` | 2292, 2332, 2332 | hero mobile 768px, high priority | 0 | 36, 18, 13 |
| `/catalogue/` | 10804, 10824, 10808 | `material-color-hero.webp`, high priority | 0,0212 | 22, 16, 15 |
| `/catalogue/ba-thanh/melamine/bt111/` | 3224, 3224, 3228 | ảnh mẫu BT111 CDN | 0 | 16, 10, 14 |

Catalogue dùng ảnh 1.916×821, khoảng 608.155 byte transfer, hiển thị rộng 390px, không có srcset; tổng ảnh đã tải trong lượt khoảng 1,79 MB, gồm một logo 414 KB và một số ảnh mẫu CDN 99–217 KB. BT111 tải ảnh 1.600px khoảng 239 KB cho khung 364px. Hai stylesheet đầu trang được tải; tổng CSS transfer mẫu 18.362 byte, JS 145–164 KB. Có stylesheet chặn render theo cách tải mặc định, nhưng chưa có trace chứng minh phần delay riêng do CSS. LCP của hero catalogue được ưu tiên high, mẫu mã BT111 khởi đầu low. Search index An Cường khoảng 63 KB trên wire ở mẫu; cần trace trước khi kết luận ưu tiên request là nguyên nhân chính.

Không thay ảnh hoặc tạo biến thể mới trong lượt này: tài sản hero hiện hữu chưa được đối chiếu nguồn/quyền riêng; việc thay đổi hoặc tạo biến thể phải dựa trên phạm vi sử dụng đã xác nhận. Việc nén/responsive có tiềm năng lớn, nhưng cần chủ sở hữu xác nhận quyền và kiểm tra độ trung thực ảnh rồi đo lại cùng điều kiện. Các số lab này không chứng minh đạt hoặc không đạt p75 Core Web Vitals production. Cần Lighthouse/trace và CrUX/GSC khi có dữ liệu. Không thay chính sách index hay chức năng catalogue để cải thiện điểm.
