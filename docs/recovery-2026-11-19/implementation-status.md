# Trạng thái triển khai — 19/11/2026

**PARTIAL / chưa phát hành.** Repository `codex/cloudflare-exit`, HEAD `357bd71`; vẫn có nhiều thay đổi chưa commit từ trước. Ba trang CNC dùng CTA Zalo, không hiển thị checklist gửi file, và giữ liên kết tới xưởng. Các trang CMS động có fallback khi nội dung cũ còn hướng dẫn file; điều kiện và giới hạn được mô tả trong `cnc-editorial-policy.md`.

## Kiểm thử

- `npm run verify`: PASS trong snapshot tách biệt, sử dụng GA và Turnstile test; 833 test frontend, 313 catalogue, 38 CMS. CMS Wrangler chỉ chạy dry-run. Static build và validator sitemap, llms, structured data, metadata và internal links đạt.
- Playwright trên build đó: 130 PASS, 2 SKIPPED; hai test skipped yêu cầu WordPress local. Bộ test responsive ba trang CNC đạt trên mobile và desktop.
- WordPress adapter mock: đã kiểm tra publish/update/unpublish/delete, noindex và lỗi nguồn. Bài published noindex vẫn truy cập được trực tiếp nhưng không vào chỉ mục.
- Plugin WordPress: chưa chạy PHP lint, chưa kiểm thử UI lưu checkbox và REST trên instance thật; PHP CLI và WordPress local không sẵn sàng.
- 33 câu hỏi retrieval: xem `source-discovery-results.md` và `internal-retrieval-results.md`. Chỉ 8/33 đạt top 3 với bộ truy hồi từ vựng nội bộ giới hạn; 25 FAIL theo tiêu chí này. Factual correctness và câu trả lời AI chưa được chạy.

## Gate phát hành còn thiếu

1. Production đang ở Vercel; project local có tên `tungphat`. Script frontend đã đổi sang Vercel team `lmskis`, nhưng CLI chưa có sẵn và không có deployment nào được thực hiện.
2. WordPress production, trigger publish/update/unpublish và pipeline build/retry chưa được kết nối hoặc chứng minh. Static `llms.txt` chỉ cập nhật khi một build mới thành công. Một build lỗi không thay thế deployment cũ; không suy diễn đây là tự đồng bộ production.
3. Plugin noindex mới cần kiểm thử trên WordPress staging và cần kiểm tra tương tác với plugin SEO khác. Bộ lọc nội dung CNC là từ khóa bảo thủ, không thay thế duyệt biên tập.
4. Cần rà soát phạm vi release tách khỏi các thay đổi khác trong working tree, quyền sử dụng ảnh còn ghi BLOCKED trong tài liệu release trước và rollback trước khi deploy.

## Đĩa

Bản sao recovery cũ `/tmp/tungphat-recovery.B74He1` đã xóa sau khi kiểm tra backup gốc. Hai bản kiểm thử do phiên này tạo còn tại `/tmp/tungphat-v4-final.MRwB0c` và `/tmp/tungphat-v4-verify.r2ZYx9`; bản thứ hai chỉ được dọn một phần vì gặp câu hỏi xác nhận từng tệp read-only. Không xóa backup gốc.
