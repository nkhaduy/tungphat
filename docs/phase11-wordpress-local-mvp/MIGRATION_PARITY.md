# Migration parity WordPress local — CHƯA ĐẠT

Kiểm tra ngày 18/11/2026. Phạm vi chỉ gồm bài publish ID 10–12, so với `docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json` và HTML đã lưu trong fixture. Đây là snapshot nguồn frontend hợp nhất, không phải backup CMS/media hay bằng chứng nội dung production hiện tại. Draft 32–34 không được dùng làm nguồn và không bị sửa. Không deploy, không ghi WordPress hoặc production, không reset/commit.

## Dry-run và lõi giao dịch local — cập nhật 18/11/2026

Đã bổ sung `scripts/wordpress/parity-import.mjs --dry-run`, chỉ GET REST tại `127.0.0.1:9400`, đối chiếu mapping ID/slug/status chính xác, metadata cơ bản, nguồn asset và backup. Lệnh xuất JSON và exit 1 khi có blocker; `--apply` và `--rollback` bị từ chối trước khi kết nối. Dry-run không dựng hoặc so sánh đầy đủ payload Gutenberg, không phải bản diff nội dung từng block và chưa thể ghi bài.

Kết quả hiện tại: ba bài 10–12 được map đúng; title/excerpt/ngày đăng khớp kiểm tra cơ bản, nhưng featured media và SEO khác, FAQ/related chưa được map, body/figure/author/ngày cập nhật còn phải đối chiếu đầy đủ. Cả 10 tệp figure và biến thể được preflight kiểm tra; ba featured image sau là blocker riêng vì manifest chỉ ghi `UNCHANGED LEGACY`, chưa chứng minh quyền và file để import:

- ID 10: `https://cdn.mdftungphat.com/uploads/vanchongam.webp`.
- ID 11: `https://cdn.mdftungphat.com/uploads/cnc-service.webp`.
- ID 12: `https://cdn.mdftungphat.com/uploads/wood-panels.webp`.

Blocker khác: sanitizer loại SVG sơ đồ CNC; provider chưa map FAQ/related; chưa có adapter WordPress đáp ứng compare-and-replace nguyên tử, journal bền vững, media mapping và rollback thực. Không coi lõi giả lập là importer thực hoặc bằng chứng end-to-end.

Đã bổ sung `parity-import-core.mjs` với mapping cố định, nhận diện unchanged, chặn blocker/backup lỗi, kiểm tra dữ liệu đổi sau lập kế hoạch, ghi ý định qua callback trước mỗi thay đổi và rollback có kiểm tra xung đột. Lõi này yêu cầu backend cung cấp compare-and-replace **nguyên tử**, callback journal bền vững và xác thực backup thực; hiện chỉ chạy với store/callback giả lập trong test. Chưa có WordPress adapter, journal file thật, import media, áp dụng hoặc rollback trên WordPress. Xử lý phản hồi thất lạc và gián đoạn rollback đã được thử trên fake, không chứng minh tính an toàn của WordPress REST.

`verify-local-backup.py` chỉ đọc, so sánh schema SQLite, nội dung các bảng và hash uploads theo luồng; không tạo bản sao lớn. Backup `phase11-20261118-153438` vẫn `integrity_check=ok`, schema khớp, nhưng không còn khớp toàn bộ database: `sqlite_sequence`, `wp_options`, `wp_postmeta`, `wp_posts`, `wp_term_relationships`, `wp_usermeta`, `wp_users` khác; uploads hiện có 9 file so với 3 trong backup. Một lần đối chiếu riêng cho thấy các hàng thuộc ID 10–12 và 32–34 vẫn khớp backup, nhưng điều đó không làm backup toàn site hiện hành. Kiểm tra đọc snapshot SQLite và uploads không nguyên tử với nhau; chưa diễn tập restore. Không ghi bài và không tạo backup mới trong lượt này.

Kiểm thử: `node --test tests/wordpress-parity-import.test.mjs tests/wordpress-parity-preflight.test.mjs` đạt 13/13; bao gồm sai mapping, thiếu asset, backup sai, no-op, xung đột, mất phản hồi, gián đoạn journal và backup sai schema/dữ liệu/uploads. ESLint cho các file JS mới đạt. Dry-run thực trả exit 1 với các blocker trên. Chưa thử import/rollback trên WordPress, build/render/schema hoặc mobile/desktop. Không đụng draft, plugin, worker, preview hay production; không reset/commit.

## Kiểm tra trước đó — 18/11/2026

REST local hiện trả ba bài ID 10–12 ở trạng thái `publish`, `featured_media=0`, SEO title/description rỗng. Backup SQLite vẫn trả `integrity_check=ok`; các hàng `wp_posts`, `wp_postmeta` và `wp_term_relationships` liên quan ID 10–12 và draft 32–34 vẫn khớp backup. Lượt này không so sánh lại toàn bộ database hoặc uploads và không thử restore. Bộ kiểm thử preflight chạy lại: 3/3 đạt. Kết luận và blocker ở phần cập nhật bên dưới chưa thay đổi; chưa có importer parity, rollback được thử nghiệm hay apply.

## Cập nhật sau khi khôi phục WordPress — 18/11/2026

REST local tại `127.0.0.1:9400` đã trả 200 khi dùng cookie bỏ auto-login Playground. Đã đọc lại đúng ID 10–12: publish, `featured_media=0`, SEO title/description rỗng. Các nhận xét bên dưới về server không chạy chỉ mô tả lần kiểm tra trước, không phản ánh lượt cập nhật này.

Backup người dùng cung cấp tại `~/.wordpress-playground/tungphat-backups/phase11-20261118-153438/` có SQLite và uploads. Kiểm tra lại SQLite backup bằng kết nối chỉ đọc: `PRAGMA integrity_check` trả `ok`. So sánh các hàng `wp_posts`, `wp_postmeta`, `wp_term_relationships` của ID 10–12 và 32–34 giữa backup và database hiện tại: giống nhau; cả 3 file uploads có cùng đường dẫn và SHA-256. Đây là kiểm tra tính toàn vẹn và so sánh tại thời điểm kiểm tra, **không phải diễn tập restore**, không bảo đảm các bảng khác giống nhau hoặc backup vẫn mới nếu có thay đổi sau đó.

Đã thêm `scripts/wordpress/parity-preflight.mjs`: công cụ **chỉ đọc**, đối chiếu URL ảnh với đúng một dòng `APPROVED` trong manifest, đường dẫn trong fixture, file trong `public`, giải mã, kích thước và SHA-256. Không dùng URL gần giống thay quyền của file khác; file thiếu, lỗi hoặc không được duyệt bị báo lỗi. Lệnh `node scripts/wordpress/parity-preflight.mjs` cố ý trả exit 1 vì còn blocker; `--apply` bị từ chối và không kết nối WordPress. Đây **chưa phải** công cụ import, backup hay rollback. Chạy hai lần cho output giống nhau không chứng minh idempotence của import.

Cả 10 file/biến thể figure trong fixture đã có đúng dòng `APPROVED`, đọc và giải mã được: MDF thường 890×886 (400×398, 800×796), MDF chống ẩm 1200×1200 (400×400, 800×800), sơ đồ SVG 1200×820, gỗ ghép 1200×677 (400×226, 800×451). SHA-256 được in trong output preflight để đối chiếu về sau, không phải hash nguồn được chủ quyền xác nhận. Với hai ảnh MDF, so sánh pixel thu nhỏ 64×64 với các file gốc mà manifest nêu cho sai lệch trung bình lần lượt 0,22 và 2,30 trên thang 0–255; đây là dấu hiệu phù hợp với ảnh chuyển đổi, không chứng minh quyền hay xác thực nguồn tuyệt đối. Ảnh gỗ ghép được manifest ghi nguồn Ba Thanh Tây Bắc và quyền theo chỉ dẫn người dùng; chưa đối chiếu byte với file gốc nhà cung cấp. Không truy cập production để kiểm chứng.

**Chưa apply:** ba ảnh featured CDN chỉ có trạng thái `UNCHANGED LEGACY`, chưa có căn cứ xác nhận quyền tái sử dụng; sanitizer loại SVG; provider chưa map FAQ/related. Công cụ import parity, kiểm tra idempotence trên WordPress và rollback được thử khôi phục **chưa được triển khai**, nên không thể kết luận đã đáp ứng yêu cầu migration. Backup hiện hữu không thay thế việc kiểm thử các thao tác này. Không sửa plugin, worker, preview hoặc các draft; không ghi bài local hay production.

Kiểm thử bổ sung: `node --test tests/wordpress-parity-preflight.test.mjs` 3/3 đạt (thiếu ảnh, URL duyệt không khớp/ảnh hỏng và từ chối apply). Preflight thực tế kiểm tra 10 asset và trả exit 1 như thiết kế; hai lượt có output giống nhau. Bộ Vitest WordPress chọn lọc chạy lại 5 files / 19 tests đạt. Chưa kiểm tra rollback, import idempotence, render, schema hay mobile/desktop trong lượt này.

## Bằng chứng đối chiếu ban đầu (trước khi khôi phục server)

WordPress local ở `127.0.0.1:9400` không chạy: yêu cầu REST thất bại kết nối. Thay vào đó đọc SQLite của Playground tại `~/.wordpress-playground/sites/.../wp-content/database/.../.ht.sqlite` bằng `mode=ro`; không khởi động lại hoặc ghi database. Đây là trạng thái lưu trên đĩa, không phải xác minh REST/Gutenberg/render hiện tại. Các bản backup bài tại `~/.wordpress-playground/tungphat-backups/` chỉ là backup bản ghi, không phải bản sao toàn bộ database và media; chưa xác minh khôi phục.

Đã render Markdown body từ fixture bằng `react-markdown` + `remark-gfm`, phân tích HTML so với `post_content` Gutenberg lưu trong SQLite. So sánh theo thứ tự và chuẩn hóa khoảng trắng cho text mỗi `h2`, `h3`, `h4`, `p`, `li`, `th`, `td`, và cặp text/href của link. Kết quả dưới đây **không** chứng minh toàn bộ block, cấu trúc lồng nhau, định dạng inline, thứ tự giữa các loại phần tử, xử lý sanitizer hay giao diện trình duyệt.

| ID / slug | Trường khớp fixture | Thành phần body khớp theo phép so sánh trên | Thiếu so với HTML nguồn |
| --- | --- | --- | --- |
| 10 `mdf-thuong-va-chong-am` | title, slug, excerpt, ngày đăng, category và 3 tags | 6 H2, 8 đoạn, 2 ô tiêu đề + 8 ô bảng, 3 link | Figure 2 ảnh MDF và caption; featured image |
| 11 `chuan-bi-file-cnc` | title, slug, excerpt, ngày đăng, category và 3 tags | 6 H2, 9 đoạn, 5 mục danh sách, 2 ô tiêu đề + 16 ô bảng, 5 link | Sơ đồ CNC và caption; featured image |
| 12 `go-ghep-la-gi` | title, slug, excerpt, ngày đăng, category và 3 tags | 7 H2, 14 đoạn, 8 mục danh sách, 6 link | Figure gỗ ghép, caption và attribution Ba Thanh Tây Bắc; featured image |

Cả ba là `publish`, ngày đăng local và GMT là 2026-07-16; taxonomy được đối chiếu theo tên. Không có `_thumbnail_id` hay SEO meta tương ứng cho ba ID trong database. Author local là ID 1 (`admin`), trong fixture là `Ban biên tập Tùng Phát`. Ngày cập nhật fixture là 2026-11-13; WordPress lưu 2026-11-16 theo lần import. Không suy diễn một trong hai là ngày biên tập thực tế.

Provider hiện trả mảng rỗng cho `relatedProducts`, `relatedArticles`, `faq`; fixture có 2 FAQ và các liên kết liên quan cho mỗi bài. Ba cặp SEO title/description trong fixture chưa nằm trong meta local; provider sẽ fallback sang title/excerpt. Canonical được adapter tạo theo slug `/bai-viet/{slug}/`, nhưng chưa đối chiếu HTML và schema được build trong lượt này. `ArticleLanding` chỉ thêm các figure fixture khi không dùng WordPress. Phase 10 đã bỏ logo làm ảnh đại diện bài thiếu ảnh; không xem fallback chia sẻ là parity ảnh bài.

## Blocker asset và cách xử lý

- Fixture dùng ba featured image CDN legacy (`vanchongam.webp`, `cnc-service.webp`, `wood-panels.webp`). `docs/search-ai-visibility-2026-11/phase5/RELEASE_ASSET_RIGHTS.csv` đánh dấu các URL này là `UNCHANGED LEGACY`: cùng URL không chứng minh quyền tái sử dụng hoặc byte tương đương. Cần xác minh từng nguồn/quyền, file, alt và kích thước trước khi đưa vào WordPress; không tự thay bằng logo.
- Hai ảnh MDF `public/sanpham-media/van-mdf.webp`, `mdf-chong-am.webp` và ảnh `go-ghep-cao-su.webp` tồn tại local. Manifest Phase 5 ghi `APPROVED` cho việc tái sử dụng theo xác nhận và chỉ dẫn của người dùng được ghi lại; ảnh gỗ ghép cần giữ attribution trong caption. Cần kiểm tra phạm vi quyền và ánh xạ file/alt/caption khi import, không coi manifest là chứng minh toàn bộ featured image CDN.
- `public/images/editorial/ban-ve-cnc-minh-hoa.svg` tồn tại và manifest ghi sơ đồ tự tạo `APPROVED`. Sanitizer WordPress hiện chủ động từ chối SVG; cần một cách chuyển/hiển thị an toàn được kiểm chứng, giữ ý nghĩa, alt, caption và khả năng xem trên mobile. Không nới allowlist SVG chỉ để vượt kiểm tra.
- Cần quyết định mô hình lưu FAQ/related và mapping author/modified date, bảo đảm giá trị có thể biên tập và không làm sai lịch sử. Nhập SEO từ fixture cần kiểm chứng ưu tiên metadata và quy trình lưu/build. Các thay đổi trên bài đã publish có thể đổi `modified`; cần backup toàn bộ database **và** media, dry-run/diff, diễn tập restore và đối chiếu giao diện trước khi ghi local. Không có đủ điều kiện này trong lượt kiểm tra, nên không tự sửa bài hay tạo bản import có vẻ đã đạt parity.

## Kiểm thử lượt này

- PASS: `node scripts/wordpress/import-playground.mjs` chạy dry-run, liệt kê đúng ba slug; lệnh không có `--apply`. Dry-run hiện chỉ liệt kê, không chứng minh parity hay khả năng restore.
- PASS: `./node_modules/.bin/vitest run tests/wordpress-migration-fixture.test.ts tests/wordpress-provider.test.ts tests/wordpress-adapter.test.ts tests/wordpress-renderer.test.ts tests/wordpress-sanitize.test.ts --maxWorkers=2` — 5 files, 19 tests. Đây là kiểm thử fixture và adapter/renderer, không phải kiểm thử WordPress đang chạy.
- SQLite chỉ đọc: đối chiếu các trường, taxonomy và thành phần body như mô tả; không có kiểm tra live REST, Gutenberg, build WordPress mode, schema, desktop/mobile hay ảnh đã upload. Không chạy `npm run verify`: không deploy và chuỗi verify có bước đồng bộ dữ liệu/build có thể ghi vào working tree đang có thay đổi.

Kết luận: dữ liệu văn bản cơ bản có bằng chứng khớp theo phạm vi trên; migration parity và local MVP vẫn **chưa đạt**. Bước tiếp theo là chuẩn bị bản sao local có backup/restore được diễn tập, xử lý media và các trường còn thiếu, sau đó so sánh từng block/HTML/schema và ảnh trên desktop/mobile trước khi đánh giá lại.
