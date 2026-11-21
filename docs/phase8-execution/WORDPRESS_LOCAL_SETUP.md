# WordPress Playground local

Đã chạy CLI `@wp-playground/cli` **3.1.64**, WordPress **7.1.4**, PHP WASM **8.3**, SQLite. Không cần Docker/PHP/MySQL hệ thống. Admin: http://127.0.0.1:9400/wp-admin/ ; REST: http://127.0.0.1:9400/wp-json/wp/v2/posts ; bản export Next thử: http://127.0.0.1:4186/bai-viet/ (hai server phải còn chạy). Đây là local, không phải staging hay bằng chứng tương thích MySQL production.

Tài liệu CLI: https://developer.wordpress.org/playground/developers/local-development/wp-playground-cli/. `start` lưu site theo hash thư mục làm việc, tại `~/.wordpress-playground/sites/5495a7aaa79a0f44bdd488918873647412a00ed6a5f20a3b8b463b32cf68124b/`; bài thử ID 6 còn sau restart. File database/media không nằm trong Git. CLI tự login admin: chỉ dùng local. CLI bản này gọi `listen(port)` trên mọi giao diện, nên tiến trình thử dùng `wordpress-local/loopback.cjs` để bind loopback; `lsof -nP -iTCP:9400 -sTCP:LISTEN` đã xác nhận `127.0.0.1:9400`. Phải kiểm tra lại sau khi đổi phiên bản.

Thiết lập lại từ thư mục riêng (không mount repository): tạo thư mục tooling, sao chép `wordpress-local/playground-package.json` thành `package.json` và `wordpress-local/loopback.cjs` vào đó; chạy `npm install`, tạo thư mục con `site`, `cd site`, rồi chạy:

```sh
NODE_OPTIONS="--require=../loopback.cjs" node ../node_modules/@wp-playground/cli/wp-playground.js start --wp=7.1.4 --port=9400 --skip-browser --no-auto-mount
```

Không dùng `--reset` với site cần giữ. Hash lưu trữ phụ thuộc đường dẫn `site`; thay đường dẫn sẽ tạo site khác. Việc tải npm và WordPress ở máy thử rất chậm; gói WordPress 7.1.4 tải HTTPS theo đoạn, kiểm tra `unzip -tq`, rồi đặt vào cache CLI. Chưa có checksum độc lập. Không public port hoặc dùng credentials production.

`node scripts/wordpress/import-playground.mjs` là dry-run; thêm `--apply` chỉ nhắm `http://127.0.0.1:9400`, dùng phiên editor Playground và ghi backup/mapping vào `~/.wordpress-playground/tungphat-backups/`. Backup chỉ bao gồm bản ghi bài liên quan, không bao gồm toàn bộ database/media và chưa diễn tập restore. Chưa có nút preview Next cho draft.
