# Thiết lập Decap CMS

## 1. GitHub OAuth App

Trong GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.

- Application name: `Tùng Phát CMS`
- Homepage URL: `https://mdftungphat.com/admin/`
- Authorization callback URL: `https://cms-auth.mdftungphat.com/callback`

Lấy Client ID và tạo Client Secret. Không ghi chúng vào repo, frontend hay Pages variable công khai.

## 2. Deploy OAuth Worker

```bash
npx wrangler secret put GITHUB_OAUTH_ID --config workers/cms-oauth/wrangler.jsonc
npx wrangler secret put GITHUB_OAUTH_SECRET --config workers/cms-oauth/wrangler.jsonc
npx wrangler secret put OAUTH_STATE_SECRET --config workers/cms-oauth/wrangler.jsonc
npx wrangler deploy --config workers/cms-oauth/wrangler.jsonc
```

`OAUTH_STATE_SECRET` phải là chuỗi random dài tối thiểu 32 byte. Worker dùng cookie HttpOnly/Secure/SameSite=Lax, state HMAC hết hạn sau 10 phút, callback cố định và target origin allowlist. Repo hiện là public nên scope mặc định `public_repo`; nếu chuyển private, đặt `GITHUB_REPO_PRIVATE=1` và review lại scope `repo`.

## 3. Cloudflare Access

Tạo Access application cho `mdftungphat.com/admin*`; policy **Allow** chỉ gồm email/group quản trị. Tạo application riêng cho `cms-auth.mdftungphat.com`:

- `/auth`: Allow cùng group quản trị.
- `/callback`: Bypass Access nhưng chỉ callback OAuth Worker xử lý; Worker vẫn xác minh state/cookie/origin. Không chặn callback vì GitHub sẽ không mang Access session trong mọi trường hợp.
- `/logout`: Allow group quản trị.
- `/health`: có thể Bypass để monitor, không chứa secret.

Không dùng mật khẩu hard-code. Muốn thêm quản trị viên: thêm email vào Access group **và** cấp quyền collaborator phù hợp trong GitHub repo. Muốn xóa: gỡ cả hai nơi, đồng thời revoke OAuth grant nếu cần.

## 4. Sử dụng `/admin`

1. Mở `https://mdftungphat.com/admin/`, đăng nhập GitHub.
2. Chọn Bài viết/Sản phẩm/Dự án CNC/Trang dịch vụ/Dữ liệu website.
3. Điền title, slug, SEO description và alt ảnh; tạo **Draft**.
4. Chuyển sang **In review** để người phụ trách kiểm tra thông số, hình ảnh và tuyên bố kinh doanh.
5. Dùng preview; sau duyệt chọn **Publish**. Decap merge thay đổi vào `main`, GitHub Actions build và Pages deploy.
6. Unpublish/archive bằng editorial workflow hoặc đặt `draft: true`, `noindex: true`; không xóa case study đang cần lưu lịch sử.

Hook admin chặn publish thiếu title/slug/SEO description, slug sai, ảnh không phải định dạng web hoặc thiếu alt. Duplicate slug/content schema/ảnh quá cỡ được CI chặn với thông báo.

## R2 custom widget

Các field quan trọng dùng widget `r2-media`: ảnh đại diện, gallery, video, PDF/catalogue và Open Graph. Widget gọi Pages Functions cùng origin; binary đi vào R2, còn commit Decap chỉ chứa key/name/MIME/size/alt. Ảnh JPEG/PNG/WebP/AVIF được browser sửa orientation qua decoder, resize cạnh dài tối đa 2.000 px, mã hóa WebP quality 0,84 và loại metadata/EXIF trong quá trình re-encode. WebP giữ transparency; video/PDF không đi qua canvas compressor. UI hiển thị dung lượng trước/sau, tiến độ, lỗi, phân trang và thao tác trash.

Đây là custom widget cho field quan trọng, **không tuyên bố thay thế hoàn toàn media library mặc định của Decap**. Không dùng nút chèn/upload ảnh mặc định trong toolbar Markdown vì nó vẫn theo Git media folder legacy. Muốn chèn ảnh vào body, upload bằng R2 widget rồi dùng URL/key qua field có cấu trúc; giai đoạn tiếp theo có thể viết editor component riêng. Các file cũ trong `/public` vẫn đọc được nhưng upload mới phải dùng `r2-media`.

Trước khi mở `/admin`:

1. Bảo vệ `/api/admin/media*` bằng Cloudflare Access cho cả production hostname và preview hostname được dùng.
2. Đặt Pages Function variable `NEXT_PUBLIC_MEDIA_BASE_URL` đúng môi trường; tùy chọn `MEDIA_ADMIN_EMAILS=email1,email2` làm allowlist thứ hai.
3. Đặt Pages build variable `NEXT_PUBLIC_MEDIA_BASE_URL` cho Preview bằng Public Development URL bucket preview.
4. Không đặt `MEDIA_LOCAL_DEV_BYPASS=1` trên Cloudflare. Chỉ dùng trong `.dev.vars` với localhost khi test local.

## Draft, preview, expired session và logout

- Draft không xuất hiện trong route, sitemap hay search index.
- Preview trong CMS chỉ là bản xem nội dung; preview production không được index.
- Token/session GitHub hết hạn: Decap yêu cầu login lại; OAuth state hết hạn sau 10 phút và callback bị từ chối an toàn.
- Logout CMS rồi mở `https://cms-auth.mdftungphat.com/logout`; nếu máy dùng chung, logout GitHub/Access.

## Rollback bài viết

Mỗi publish là commit/merge trong GitHub. Revert commit hoặc khôi phục file từ Git history, mở PR review và merge; không sửa lịch sử bằng force push. Build mới sẽ cập nhật trang và sitemap. Xem thêm `ROLLBACK.md`.
