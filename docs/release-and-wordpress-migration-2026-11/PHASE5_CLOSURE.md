# Phase 5 — đóng các hạng mục còn lại

Ngày 15/11/2026. `npm run verify` trong bản sao `/tmp/tungphat-phase6.4KbPvQ` exit 0 với test-mode GA ID giả; lint, typecheck, 765 test frontend, 313 test catalogue, 38 test CMS, build và dry-run CMS, schema, sitemap 2.664 URL và 258.062 liên kết nội bộ theo validator. Không có triển khai. Bản sao được lấy trước khi tạo adapter WordPress cô lập nên kết quả này áp dụng Track A, không chứng minh Track B.

Quyền ảnh: đối chiếu thêm CSS, JS và hash ở `IMAGE_RELEASE_DELTA.md`; `/lien-he/` dùng mới `/images/material-color-hero.webp` so với production, chưa có bằng chứng quyền riêng cho việc sử dụng mới. Không suy quyền từ byte trùng. Ownership CMS/override đã có guard nhưng vẫn cần quy trình editor, theo `phase5/CONTENT_OWNERSHIP.md`.

Playwright: 4/4 analytics và canonical với receiver giả; 67/67 hồi quy catalogue/vật liệu/nội dung và 2/2 CTA trên build không GA ID. Đo lại tại `CATALOGUE_PERFORMANCE.md` không cho thấy cải thiện LCP đáng kể. Không gửi lead thật. Những kiểm tra GA4 DebugView, WAF, GSC, GBP, CrUX cần môi trường/quyền production được tách khỏi gate local.
