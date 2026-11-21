# Bảo mật và QA Phase 11

Nguồn: HEAD `357bd71`, nhánh `codex/cloudflare-exit`; working tree có nhiều thay đổi chưa commit từ các phase trước. Không triển khai production trong phase này.

## Next.js

Phase 10 ghi nhận `SecurityFatalError` khi build Payload nhưng không lưu thông báo gốc đầy đủ. Mã Next.js 16.4.3 có cơ chế kiểm tra advisory và cho phép chạy lại trong một khoảng thời gian; điều này phù hợp với hiện tượng ghi nhận, nhưng không xác định được advisory cụ thể đã kích hoạt lỗi ở Phase 10.

Ba advisory chính thức sau liệt kê Next 15 đến 15.5.28 và Next 16 đến 16.4.4 là các phiên bản bị ảnh hưởng: [GHSA-7qx7-33qx-rqx2](https://github.com/vercel/next.js/security/advisories/GHSA-7qx7-33qx-rqx2), [GHSA-f3mh-rxg3-f5g2](https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2), [GHSA-pc58-hwjq-p385](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385). Điều kiện khai thác phụ thuộc cấu hình và runtime; sự hiện diện của phiên bản trong phạm vi advisory không tự chứng minh production bị khai thác.

Đã cập nhật local `next` và `eslint-config-next` website 15.5.28 → 15.5.29; Payload 16.4.3 → 16.4.5, cùng hai lockfile. Payload 3.92.1 khai báo peer range hỗ trợ Next 16.4.5. React không đổi. Website vẫn cấu hình static export; tương thích build phải được xác nhận bằng regression thực tế. Bản vá local chưa được triển khai production.

Ngày 18/11/2026, `npm audit --omit=dev --json` báo root 0 mục; Payload 24 mục (10 moderate, 14 high), gồm các dependency chuyển tiếp qua Payload/OpenNext. Kết quả audit không phải đánh giá khả năng khai thác trên production; cần điều tra riêng các chuỗi phụ thuộc trước quyết định phát hành. Không chạy `npm audit fix --force`.

Host có Node 22.23.2 và 24.20.0 dưới mức yêu cầu của Payload (`^22.23.4 || >=24.22.1`); Node 26.7.0 có sẵn và nằm trong engine range của cả hai package. Các lệnh cài dependency phát cảnh báo engine vì npm dùng Node 24.20.0; khi chạy QA cần chọn rõ Node 26.

## Kiểm thử đã chạy trên source đang phát triển

- `git diff --check`: PASS tại thời điểm chạy.
- `node --test wordpress-local/preview-app/preview.test.mjs`: 3 PASS.
- `node_modules/.bin/vitest run tests/wordpress-publishing-worker.test.ts tests/wordpress-sanitize.test.ts tests/wordpress-provider.test.ts --maxWorkers=2`: 18 PASS.
- Đăng nhập Editor local thật; truy cập trực tiếp `/wp-admin/plugins.php`, `/wp-admin/themes.php`, `/wp-admin/options-general.php`: đều HTTP 403. SEO title và description trên bài thử local ID 45 tồn tại sau Save, REST và reload Gutenberg.
- Trên bản sao `/private/tmp/tp-phase11-qa` (source chụp giữa quá trình, chưa phải source cuối), Node 26.7.0: `npm run lint`, `./node_modules/.bin/tsc --noEmit`, `npm run typecheck:edge` đều PASS; `./node_modules/.bin/vitest run --maxWorkers=2` 802/802 PASS; `./node_modules/.bin/vitest run supplier thanh-thuy ba-thanh ancuong --maxWorkers=2` 313/313 PASS. Chạy trực tiếp `vitest` để tránh pretest đồng bộ dữ liệu vào source chính.
- Cùng bản sao: `npm --prefix payload-cms run lint`, `npm --prefix payload-cms run typecheck`, `npm --prefix payload-cms run integration` PASS; integration migrate database **local trong bản sao** và có 38/38 test PASS. Chưa chạy Payload build hoặc Wrangler dry-run.
- Sau khi hoàn tất các thay đổi code preview và migration, đã đồng bộ lại bản sao và chạy lại `npm run lint`, `tsc --noEmit`, `npm run typecheck:edge`, `vitest run --maxWorkers=2`: PASS, 802/802 test. `node --test tests/wordpress-parity-preflight.test.mjs tests/wordpress-parity-import.test.mjs`: 13/13 PASS trên dữ liệu giả lập; CLI import thật vẫn khóa apply/rollback. Các báo cáo được cập nhật sau lượt test này.
- Tài khoản Subscriber local đã đăng nhập nhận HTTP 404 khi truy cập preview draft 45. Preview native Gutenberg, hình ảnh, bảng và caption được kiểm tra trong trình duyệt; xem `PREVIEW_E2E.md` và ảnh desktop/mobile trong `evidence/`.

Các kết quả trên là targeted checks, không thay thế `npm run verify`, full Playwright hay build cuối. Xem `FINAL_DECISIONS.md` để biết trạng thái cuối và các mục chưa chạy.
