# Kiểm thử Phase 3 — 14/11/2026

## Đã chạy

- `npm run verify` trong bản sao `/tmp/tungphat-phase3-verify`: **exit 0**. Lint, typecheck frontend/edge, 748 test website, 313 test catalogue, 38 test CMS, build frontend và CMS, Cloudflare dry-run (không triển khai), kiểm tra nội dung, ảnh, sitemap, metadata, schema và internal links. Không chạy verify trực tiếp trong repository vì một số script sinh/ghi lại dữ liệu.
- Build kiểm tra 3.591 tài liệu JSON-LD qua script dự án; kiểm tra liên kết trong 3.592 HTML, 258.061 liên kết, không phát hiện đích lỗi/redirect hoặc thiếu slash trong tập kiểm tra; sitemap 2.664 URL đạt canonical tự tham chiếu và indexable. Đây là kiểm tra của script, không bảo đảm mọi thuộc tính chính xác hoặc Google chấp nhận rich result.
- Playwright trong bản sao: **63/63** cho `search-phase3`, `seo-indexability`, `supplier-catalogue`, `product-system`. Kiểm tra trang vật liệu desktop/mobile 1440/390, 2 mẫu axe không serious/critical, SSR/metadata mẫu, điều hướng vào catalogue, mã và bộ lọc, hành vi không JavaScript và mobile overflow. **2/2** kiểm tra CTA báo giá và indexability trang báo giá/preview. Không gửi lead hay gọi điện thực.
- Kiểm thử GA4 đơn vị: sự kiện trước config được giữ và replay sau config; không cấu hình hoặc replay nếu cookie opt-out đã bật. Kiểm tra là mô phỏng hàng đợi trong runtime test, chưa xác nhận Google nhận dữ liệu hoặc GA4 DebugView thực. Hàng đợi chỉ trong trang, tối đa 100; có thể mất sự kiện khi đóng trang trước lúc tag tải.
- `git diff --check`: exit 0. ESLint có trong verify; detector Impeccable cho `components/Analytics.tsx`: `[]`. Những file Phase 3 thực thi được so byte với bản sao đã verify. Không thêm dependency.
- Mẫu production 17 URL: HTTP cuối 200, một H1; 15 URL chính self-canonical, alias BT01 canonical về URL mới; không thấy snippet restriction trong HTML mẫu. Hai branch LocalBusiness khớp street/phone hiện có trong `business.json`; cấu trúc mẫu có thể parse. `evidence/production-sample.json` là snapshot thô có schema, links và metadata.
- Kiểm tra 40 truy vấn × 4 nền tảng: tạo 160 dòng có thể lặp; chỉ hai quan sát Google AI Overview trong tài liệu 08/11 được gắn nhãn lịch sử, 158 dòng còn lại NOT TESTED. Không có suy luận về xếp hạng hay khả năng được trích dẫn.

## Chưa kiểm tra hoặc tồn tại

- Không có Lighthouse CLI sẵn trong repository/đường dẫn; không đo field CWV/CrUX hay lab performance trong lượt này. Cảnh báo ảnh nguồn/legacy lớn và một orphan `/du-an/` từ audit local vẫn cần điều tra.
- Không dùng Google Rich Results Test/Schema Validator bên ngoài, không kiểm chứng từng thuộc tính schema, từng SKU, từng ảnh hoặc quyền ảnh. Kiểm thử accessibility chỉ là các mẫu tự động nêu trên.
- Chưa có log crawler thật/WAF, Search Console/GA4/Bing/GBP hiện thời, hoặc quan sát trực tiếp ChatGPT Search, Gemini, Copilot. Spoof user-agent HTTP 200 không chứng minh crawler thật được phép.
- Không xác nhận mọi hành trình báo giá hay end-to-end gửi lead; chỉ xác nhận CTA và metadata được nêu. Không commit, push, deploy hoặc chỉnh CMS production.
