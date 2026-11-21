# QA Phase 10

HEAD: `357bd71` trên nhánh `codex/cloudflare-exit`; working tree có nhiều thay đổi từ các phase trước và Phase 10, không commit. Không deploy hoặc thay đổi production.

- WordPress local trả lời tại 127.0.0.1:9400, bind loopback. Public REST trả ba bài gốc 10–12, featured_media=0. Draft 32 anonymous REST trả 401. Chưa kiểm tra lại persistence sau restart hoặc role Editor.
- SEO unit: 8/8 PASS (`wordpress-provider`, `live-seo-migration-baseline`). Test mới đã FAIL trước thay đổi và PASS sau thay đổi. Chưa xác minh luồng UI → REST → build → HTML thực.
- Targeted Playwright: analytics 3/3 với GA ID giả; logo 1/1 sau cuộn; Trustindex/SC015MW/header 3/3 khi chạy riêng. Không tính gộp thành full suite.
- `npm run verify`: PASS trên source cuối sau một lượt chạy lại; 789 test frontend, 313 catalogue, 38 CMS; build và kiểm tra liên kết đạt. Các lượt trước có lần dừng tại build Payload bởi `SecurityFatalError` và khuyến nghị nâng cấp Next.js; chạy lại từng có thể tiếp tục. Cảnh báo bảo mật chưa được giải quyết.
- Full Playwright trên source cuối: 124 passed, 0 failed, 2 skipped trong một lượt (2,7 phút); hai test WordPress local bị skip ở Payload mode. WordPress mode build riêng PASS; hai test bị skip ở lượt trên chạy riêng 2/2 PASS, gồm route/canonical/sitemap và ảnh/caption/bảng. Ảnh chụp [bài MDF đã import](evidence/wordpress-published-mdf.png) là static export local, không phải preview hoặc bằng chứng publish tự động. Snapshot 4186 không phải preview.

Xem các báo cáo khác về hạng mục chưa thực hiện. LOCAL MVP NOT READY.
