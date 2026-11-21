# Phạm vi V6 và gate phát hành — 19/11/2026

Đây là danh sách công việc V6 đã xác định, **không phải manifest release đầy đủ**. Working tree chứa nhiều thay đổi từ các phiên trước, bao gồm file chưa tracked; không deploy trực tiếp toàn bộ tree chỉ dựa vào bảng này. Branch `codex/cloudflare-exit`, HEAD `357bd71` tại lúc kiểm tra.

| File | Change | Related Feature | Test | Risk |
|---|---|---|---|---|
| `lib/wordpress/posts.ts` | Giới hạn mỗi lần gọi REST bằng AbortSignal 15 giây | WordPress build adapter | `tests/wordpress-adapter.test.ts`, server loopback không phản hồi | Timeout không thay thế retry, outbox hoặc kiểm thử WordPress thật |
| `tests/wordpress-adapter.test.ts` | Kiểm tra timeout và fail closed | WordPress adapter | Vitest | Mock HTTP server không phải WordPress |
| `scripts/recovery-retrieval-bm25.py` | BM25, chuẩn hóa dấu, trọng số heading, metrics | Benchmark nội bộ | Chạy 33 baseline + 10 câu mới | Corpus giới hạn, nguồn kỳ vọng cần review |
| `docs/recovery-2026-11-19/retrieval-holdout.md` | 10 câu mới | Retrieval | Chạy benchmark | Cùng người soạn sau khi biết baseline, không mù |
| `docs/recovery-2026-11-19/bm25-retrieval-results.md`, `bm25-holdout-results.md` | Kết quả trên production | Retrieval | Chạy script | Không chứng minh tính đúng/đủ của câu trả lời |

Những file CNC, llms, adapter và CMS đã thay đổi trong các phiên trước vẫn cần phân loại phụ thuộc và so sánh với deployment hiện hành trước khi hình thành manifest đầy đủ. Tài liệu `docs/release-and-wordpress-migration-2026-11/RELEASE_GATE.md` còn ghi gate quyền ảnh và CMS ownership chưa xác nhận. Chưa chứng minh deployment frontend có thể rollback; chưa tạo preview hay deploy V6.

## Kiến trúc đồng bộ

Frontend Next.js dùng `output: "export"`, `app/llms.txt/route.ts` dùng `force-static`, sitemap và bài viết cũng tạo khi build. Mặc định `BLOG_CONTENT_PROVIDER` là `payload`; WordPress là adapter tùy chọn. Do vậy chỉ làm động `llms.txt` có thể đưa ra URL bài mới trong khi trang bài và sitemap vẫn cũ hoặc 404. Webhook HMAC hiện là primitive, chưa có endpoint, durable queue, retry hoặc production trigger. Không bật WordPress production khi chưa có instance, parity, authentication và staging end-to-end. Chuyển đổi frontend sang runtime động đòi hỏi kiểm chứng toàn bộ postbuild, sitemap, redirect, preview và deployment; còn phương án static cần trigger an toàn kèm build/deploy và cơ chế theo dõi. Cả hai hiện chưa được triển khai hay chứng minh.

## Giới hạn benchmark

Baseline cũ và BM25 đều dùng danh sách nguồn kỳ vọng để định nghĩa corpus. Phương pháp này không đại diện toàn site, không kiểm tra các nguồn thay thế, không xác minh canonical tại mỗi lần chạy BM25, và chỉ cần một trong nhiều nguồn kỳ vọng nằm top 3. Baseline cũ chỉ lấy thẻ `h1`–`h3`, `p`, `li` trong `main`; có thể bỏ địa chỉ hoặc CTA nằm trong các phần tử khác. BM25 lấy tất cả text trong `main` trừ nav/footer/script/style, nhưng cũng không trích href hay ngữ nghĩa ảnh. Chưa chấm bằng chứng cho 33 câu hoặc phân loại nguyên nhân từng thất bại; không xem điểm số như lỗi SEO hay kết quả chatbot.

## Đối chiếu Vercel chỉ đọc

Ngày 19/11, Vercel CLI 66.2.0 qua `npx` xác thực được. `vercel inspect https://mdftungphat.com --scope lmskis` trả project `tungphat`, production Ready, deployment `tungphat-kohpvt1iz-lmskis.vercel.app`, tạo ngày 03/11/2026. Danh sách deployment còn các bản production Ready cũ. Điều này là bằng chứng có phiên bản để khảo sát rollback, không chứng minh thao tác rollback đã được diễn tập hoặc tài khoản đủ quyền thực thi. Danh sách cũng có các preview lỗi gần đây; chưa điều tra nguyên nhân hoặc xem chúng là lỗi của thay đổi V6.

## Kiểm thử V6 và dung lượng

- WordPress adapter, webhook primitive, llms lifecycle: 16 test PASS, gồm HTTP server loopback không phản hồi; đây không phải instance WordPress.
- `npm run verify` chạy trong snapshot `/tmp/tungphat-v4-final.MRwB0c` sau khi sao chép hai file adapter/test V6: log ghi 835 frontend, 313 catalogue và 38 CMS test passed, build đạt tới các validator cuối, link validator và sitemap validator pass; `git diff --check` trên snapshot chạy riêng exit 0. Mã thoát tổng của lệnh verify không được ghi lại, nên không đánh dấu toàn bộ gate PASS theo mã thoát. Snapshot dùng GA và Turnstile test, không kiểm tra tích hợp production.
- Playwright trên snapshot: exit 0, 130 passed, 2 skipped do thiếu WordPress local.
- Production `/llms.txt` HTTP 200, 10 URL HTTPS duy nhất; build thử 49 URL HTTPS duy nhất. Không có nghĩa các URL đã được xác minh đầy đủ hoặc production đã cập nhật.
- Dung lượng `/tmp` giảm từ khoảng 6,5 GiB còn 3,1 GiB sau build và `npx`. Hai snapshot cũ vẫn tồn tại; chưa xóa trong V6. Cần cleanup được hỗ trợ, xác nhận phạm vi trước khi xóa và đo lại dung lượng.
