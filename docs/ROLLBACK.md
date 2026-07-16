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

## Tiêu chí hoàn tất rollback

Homepage, hero, money pages, form, canonical, robots/sitemap, 404 và Pages/Vercel logs bình thường; không mất lead; Search Console không thấy redirect loop hay canonical domain khác.
