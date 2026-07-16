# Rollback runbook

## Nội dung/code

1. Xác định commit gây lỗi trong GitHub Actions/Pages deployment.
2. Tạo `git revert <commit>` trên nhánh mới, mở PR và chạy toàn bộ CI.
3. Không force-push `main`. Với một bài, có thể khôi phục riêng file Markdown từ Git history.
4. Pages có thể rollback ngay về deployment tốt gần nhất trong lúc PR chạy.

## Cloudflare Pages về Vercel

Trước cutover, ghi lại DNS record Vercel, TTL và chụp cấu hình domain. Nếu lỗi nghiêm trọng: rollback Pages deployment trước; nếu vẫn lỗi, đổi DNS về record Vercel đã xác nhận. Giữ Vercel project/domain hoạt động ít nhất qua giai đoạn ổn định; canonical vẫn là apex nên không đổi URL SEO.

## D1

Export trước mọi migration remote. D1 migration là forward-only; ưu tiên migration sửa tiếp. Nếu dữ liệu/schema hỏng, tạo database phục hồi từ export, test, sau đó đổi binding `DB`. Không đưa backup PII vào Git.

## CMS/OAuth/Access

- Có thể tắt route OAuth Worker mà không ảnh hưởng website public; biên tập tạm qua PR GitHub.
- Nếu secret lộ: revoke OAuth App secret/token, rotate cả ba Worker secret và kiểm collaborator/audit log.
- Nếu Access policy khóa nhầm callback, khôi phục Bypass `/callback` rồi test state/login/logout; không bỏ auth `/admin`.

## R2 media

1. Rollback code/Pages deployment không tự rollback object R2. Giữ key cũ khi đổi media để deployment cũ còn đọc được.
2. Nếu upload sai nhưng key chưa được tham chiếu, chuyển exact key sang `trash/`; không wildcard delete.
3. Nếu delete nhầm, đọc `originalKey` trong custom metadata của object `trash/`, copy lại key gốc cùng HTTP metadata, HEAD-check size/MIME/ETag rồi mới cập nhật content.
4. Nếu bucket preview bị lỗi binding, rollback commit Wrangler hoặc khôi phục `env.preview.r2_buckets` → `tung-phat-media-preview`; tuyệt đối không trỏ preview vào production bucket.
5. Nếu production media domain lỗi sau cutover tương lai, rollback Pages về deployment dùng key cũ và khôi phục `NEXT_PUBLIC_MEDIA_BASE_URL` đã ghi nhận. Không xóa custom domain/DNS trước khi deployment cũ hoạt động.
6. Nếu R2 mất/ghi sai hàng loạt, ngừng upload/delete bằng Access policy, khôi phục từ backup vào bucket mới, kiểm manifest, sau đó đổi duy nhất binding `MEDIA` của environment bị ảnh hưởng.

Bản local `local-media/0619.mp4` chỉ được xóa sau khi `scripts/upload-media-to-r2.mjs` in `VERIFIED` cho `tung-phat-media-preview/videos/legacy/0619.mp4` và backup/restore tối thiểu đã được cân nhắc.

## Tiêu chí hoàn tất rollback

Homepage, hero, money pages, form, canonical, robots/sitemap, 404 và Pages/Vercel logs bình thường; không mất lead; Search Console không thấy redirect loop hay canonical domain khác.
