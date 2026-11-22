# Phase 11 — local publishing worker

## Kết quả thực tế

**E2E build/publish/update/unpublish chưa chạy; chưa sẵn sàng production.** Ngày 18/11/2026 phân vùng giảm từ khoảng 3,7 xuống 2,7 GiB trong lúc kiểm tra nhỏ; chưa xác định nguyên nhân. Build cũ từng dùng khoảng 1,2 GiB `.next` và 615 MiB `out`, trong khi dependencies khoảng 741 MiB; do không thể bảo đảm giới hạn tăng trưởng, không chạy sao chép lớn hay build thật. Worker yêu cầu tối thiểu 8 GiB trống trước khi sao chép; đây là ngưỡng chặn thận trọng, không phải bảo đảm build sẽ không hết đĩa sau đó.

Thử CLI `--once` với WordPress hiện hữu trên `127.0.0.1:9400` đã đọc REST công khai, lưu job thất bại với lý do thiếu 8 GiB và exit 1 **trước khi copy source/dependencies**. Thư mục trạng thái tạm cho thử nghiệm đã được dọn. REST đọc riêng trước đó trả 5 bài công khai; không tạo bài thử vì không thể hoàn tất vòng build an toàn. Draft 32–34 và tiến trình WordPress không bị thay đổi. Cổng 4186 không có tiến trình lắng nghe khi kiểm tra; không khởi động server hoặc thay output hiện có.

Kiểm thử tự động sử dụng thư mục tạm, REST giả và build giả. Lệnh Vitest với worker, adapter và webhook đạt 20/20; ESLint và kiểm tra cú pháp worker/preload đạt. Chúng kiểm tra phát hiện thay đổi, xuất bản giả lập, bỏ bài khỏi tập công khai, retry sau lỗi, giữ release tốt, sự cố build/REST, thay đổi trong build, lock, phân trang, whitelist sao chép và preload snapshot. Các test này không chứng minh HTML/sitemap thật. Thử sandbox macOS riêng: REST loopback trả HTTP 200, kết nối `https://1.1.1.1` bị chặn `EPERM`.

## Cơ chế

Worker `scripts/wordpress/publishing-worker.mjs` polling toàn bộ REST bài publish có `_embed`, so hash với manifest của `current`, build một release và kiểm tra REST lần nữa trước khi đổi symlink bằng rename. Không có endpoint webhook, event ID, HMAC hay hàng đợi delivery; primitive `lib/wordpress/webhook.ts` không được gọi. Polling có thể gộp/bỏ lỡ trạng thái trung gian. Scheduled post chỉ được nhận ra khi WordPress thực sự chuyển sang publish; WP-Cron còn phụ thuộc cấu hình và traffic.

Mỗi build có danh sách nguồn cho phép rõ ràng: `app`, `components`, `lib`, `data`, `public`, `content`, `config`, `schemas` và các file cấu hình liệt kê trong worker. `backups`, `reports`, `quote-app`, `.wrangler`, `.git`, `.next`, `out`, WordPress local, các file `.env*`, credentials/secret có tên thuộc danh sách chặn và symlink ra ngoài không được copy. Worker chỉ copy dependencies riêng sau kiểm tra 8 GiB; build ghi vào bản sao riêng, HOME riêng, môi trường tối thiểu. Quy tắc loại theo tên **không thể bảo đảm phát hiện mọi secret nằm trong nội dung hoặc tên tùy ý**; phải kiểm tra source/dependencies và loại bí mật trước khi chạy. Không dùng credentials production.

Trên macOS, build chạy dưới `sandbox-exec`: chặn mạng ra ngoài và cho phép kết nối loopback; các biến URL Payload trỏ tới loopback đóng. Đây là hạn chế mạng cấp OS được thử bằng probe riêng, không chứng minh mọi đường kết nối/IPC trong ứng dụng đều an toàn; local services vẫn có thể được truy cập. Trên hệ điều hành khác worker từ chối build. Không dùng tài khoản, endpoint hay deployment production.

Snapshot REST được lưu vào release và preload `scripts/wordpress/snapshot-fetch.cjs` chặn các lần Node `fetch` tới danh sách bài WordPress trong build, trả đúng danh sách đã chụp với phân trang. REST được đọc lại sau build, nếu hash khác thì không kích hoạt. Điều này giảm rủi ro các lần fetch trong build nhìn thấy nội dung khác nhau; **chưa được xác minh bằng build Next thật**, không bao phủ cách truy cập HTTP không qua global `fetch`, các asset/media thay đổi riêng, thay đổi đồng thời khi phân trang hoặc biến đổi A→B→A giữa hai lần đọc. Kiểm tra `index.html` không chứng minh đầy đủ output.

`job.json` ghi trạng thái, số lần lỗi và thời điểm thử lại; polling dùng backoff tăng dần tối đa 5 phút, giữ lại qua restart. Lock được thu hồi tự động chỉ khi có owner hợp lệ, PID đã chết và phase `polling`; PID tái sử dụng được xử lý thận trọng như còn sống. Nếu chết trong `building`, owner thiếu/hỏng hoặc recovery bị gián đoạn, worker dừng và cần người vận hành xác minh cả process lẫn build con trước khi xử lý lock thủ công. PID không đủ để chứng minh an toàn trong mọi tình huống; không có distributed lock hoặc bảo đảm fsync khi mất điện. Release cũ không tự dọn; cần giám sát dung lượng và dọn thủ công sau khi xác định rõ bản cần giữ. Ngưỡng đĩa chỉ kiểm tra đầu build, không giám sát liên tục.

## Vận hành sau khi đã xử lý dung lượng

Tạo thư mục trạng thái **riêng, trống và tồn tại sẵn** ngoài repository; không sử dụng đường dẫn có dữ liệu khác. Worker không tự chạy sau đăng nhập/reboot; cần supervisor local và theo dõi `job.json`, log và dung lượng. `--once` chạy một vòng và trả exit 1 khi lỗi. Không chạy nếu còn tiến trình build cũ, hoặc chưa xác minh mạng và bí mật.

```bash
mkdir -p /tmp/tungphat-wp-publisher
WP_PUBLISH_STATE_DIR=/tmp/tungphat-wp-publisher \
WORDPRESS_BASE_URL=http://127.0.0.1:9400 \
WP_PUBLISH_INTERVAL_MS=30000 \
node scripts/wordpress/publishing-worker.mjs --run
```

Worker không tự serve output. Nếu sau này phục vụ `current`, phải kiểm tra server giải quyết symlink cho mỗi request và không thay thế server hiện hữu ngoài ý muốn. Build gọi trực tiếp `next build`, không chạy prebuild/postbuild hay toàn bộ `npm run verify`; input sinh sẵn và chất lượng output cần được xác minh riêng. Thay đổi source không tự kích hoạt build.

Cần E2E tiếp theo trong môi trường có đủ chỗ, cách ly và giám sát đĩa: tạo một bài test disposable riêng, kiểm tra publish/update/unpublish và sitemap thực, lỗi build/REST, restart và scheduled post, sau đó xóa đúng bài test. Không dùng draft 32–34. Các thiếu như webhook delivery, queue, giám sát, kiểm soát dung lượng khi đang build, media consistency và backup/restore vẫn ngăn production cutover.
