# Hướng dẫn CMS cho người quản trị

## Đăng nhập

1. Mở `https://cms.mdftungphat.com/`. `/admin` trên website cũng redirect tới
   URL này.
2. Chọn **Login with GitHub**, đăng nhập đúng GitHub account đã được thêm vào
   repository.

Cloudflare Access không được dùng làm security boundary khi nameserver vẫn ở
TenTen. Quyền publish được bảo vệ bằng GitHub OAuth, email allowlist server-side
và quyền GitHub collaborator.

## Đăng sản phẩm

1. Chọn **Sản phẩm → New Sản phẩm**.
2. Nhập tên; slug chỉ dùng chữ thường không dấu, số và dấu `-`, ví dụ
   `mdf-chong-am-17mm`.
3. Chọn ảnh đại diện, điền alt mô tả đúng nội dung ảnh; thêm album nếu cần.
4. Điền vật liệu, độ dày, kích thước, bề mặt, ứng dụng, ưu điểm, giới hạn và
   hướng dẫn đặt hàng. Không ghi chứng nhận/đại lý nếu chưa có bằng chứng.
5. Điền SEO title 20–65 ký tự và description 80–170 ký tự. Thường để trống
   canonical tùy chỉnh để hệ thống tự sinh canonical apex.
6. Bật **Bản nháp** trong khi soạn; tắt khi nội dung đã được duyệt.
7. Chọn **Publish** khi nội dung đã được duyệt. Publish commit trực tiếp vào
   `main`, kích hoạt Vercel production build.

## Đăng bài viết

Chọn **Bài viết → New Bài viết**. Nhập tiêu đề, slug, tóm tắt, nội dung, ảnh,
danh mục, tag, tác giả và ngày. `Ngày cập nhật` không được trước `Ngày đăng`.
Liên kết sản phẩm/bài liên quan bằng đúng slug đã tồn tại. Draft không vào route
public hoặc sitemap.

## Thêm dự án CNC

Chọn **Dự án CNC → New Dự án**. Không đưa tên, số điện thoại hay địa chỉ chi
tiết của khách vào nội dung/ảnh. Điền vật liệu, loại gia công, khu vực ở mức
thành phố/tỉnh, quy trình, kết quả, ngày thực hiện và album. Publish tạo URL
`/du-an/<slug>`.

## Sửa cấu hình doanh nghiệp

Chọn **Cấu hình website → Thông tin doanh nghiệp** để sửa hotline, Zalo, email,
địa chỉ, bản đồ, social, footer và CTA. Canonical website bắt buộc là
`https://mdftungphat.com`. Dữ liệu này đồng thời cấp nguồn cho footer và
LocalBusiness schema, nên phải kiểm tra trước khi publish.

## Upload ảnh

- Chỉ dùng ảnh có quyền sử dụng và đã bỏ dữ liệu nhạy cảm.
- Khuyến nghị WebP/AVIF, cạnh dài tối đa 2.000 px, mỗi file tối đa 1,5 MiB.
- Tên file chữ thường không dấu, số và dấu `-`.
- Không upload SVG, ảnh gốc dung lượng lớn, bản vẽ khách hàng hoặc video qua CMS.
- Sau khi CMS commit vào `main`, workflow tối ưu ảnh sẽ chuyển JPEG/PNG mới
  sang WebP/AVIF, tạo thumbnail và commit kết quả trở lại `main`.

Kiểm tra local dành cho kỹ thuật:

```bash
npm run images:optimize
npm run images:check
npm run validate:content
```

Ảnh nằm trong `public/uploads`, được backup cùng Git. Khi repository tăng nhanh
hoặc binary tiến gần hàng GB, mới đánh giá R2; không tự đổi đường dẫn media.

## Draft, preview và publish

- **Draft**: chưa public, không sitemap.
- **Publish**: commit thay đổi trực tiếp vào `main`; Vercel tự build production.

Preview trong CMS giúp kiểm bố cục, nhưng URL preview deployment mới là bằng
chứng cuối cùng. Nếu build báo schema/content lỗi, không bỏ qua; sửa field được
nêu trong log.

## Lịch sử, rollback và quyền

Mỗi lần publish là commit Git. Trong GitHub, mở file → **History** để xem ai sửa
và diff. Để rollback, chạy quality gate rồi `git revert` commit lỗi trên `main`;
không force-push.

Thêm quản trị viên:

1. GitHub repository → Settings → Collaborators → Add people, cấp quyền ghi tối
   thiểu cần cho Decap.
2. Thêm email vào allowlist OAuth server-side trong Cloudflare Pages và
   redeploy CMS.
3. Yêu cầu bật 2FA, rồi test login/publish draft.

Xóa quản trị viên: remove ở GitHub Collaborators và allowlist OAuth. Nếu thiết
bị/tài khoản bị lộ, revoke OAuth grant và rotate GitHub OAuth client secret.

## Lỗi thường gặp

- `403 Invalid CMS site`: `site_domain`/`CMS_SITE_ID` không khớp.
- OAuth callback lỗi: callback GitHub App phải chính xác
  `https://cms.mdftungphat.com/callback`.
- Publish lỗi: kiểm quyền GitHub và kết quả CI/build của commit trên `main`.
- Build báo ảnh thiếu: chọn lại ảnh nằm trong `public/uploads`.
- Slug trùng: đổi slug; validator không cho hai route public giống nhau.
- Slug sản phẩm/dịch vụ mới bị từ chối: đổi slug nếu trùng route hệ thống hoặc
  sửa các field được content validator nêu trong log.
