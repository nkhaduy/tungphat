# Track A — website hiện tại

**NO-GO.** Đã khôi phục `app/lien-he/page.tsx` sang `/images/cnc-service.webp` cùng alt cũ như production; test đã đổi theo. Điều này loại bỏ việc dùng mới `material-color-hero.webp` tại liên hệ, nhưng không xác nhận quyền của ảnh CNC legacy. Những giới hạn quyền ảnh khác trong Phase 6 vẫn cần owner xác nhận; không tự chấp nhận thay owner.

Catalogue mobile median 10.800 ms trong ba lượt đối chứng với Phase 6 10.804 ms: chưa cải thiện có ý nghĩa; xem `CATALOGUE_LCP.md`. Không thay asset hoặc tạo phiên bản mới.

`npm run verify` exit 0 trong bản sao cô lập của source: lint, typecheck, 780 frontend tests, 313 catalogue tests, 38 CMS tests, build, validation SEO/schema/sitemap/links. Payload build sync chỉ đọc public API và ghi trong bản sao; integration dùng local D1 (`remoteBindings: false`); lệnh Wrangler nằm trong verify là `--dry-run`. Không triển khai.

Playwright: lượt đầu 116/120 đạt; bốn test homepage thất bại do kỳ vọng cũ về H1, tên section, số bản đồ, nhóm vật liệu và thông tin aggregate đánh giá. Các kỳ vọng đã được đối chiếu với source/DOM; bốn test chạy lại sau cập nhật đạt 4/4. Carousel, liên kết nguồn và bố cục tiếp tục được kiểm tra. Không coi đây là một lượt 120/120 trên source cuối. Bộ analytics/canonical build với GA ID giả đạt 4/4; test analytics chặn Google và giả lập endpoint. Các kiểm tra GA4 production, GSC/Bing, WAF, GBP, field CWV và lead thật vẫn chưa kiểm tra và là phụ thuộc production riêng.
