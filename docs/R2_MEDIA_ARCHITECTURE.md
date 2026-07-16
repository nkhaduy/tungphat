# Kiến trúc media trên Cloudflare R2

## Phạm vi

Website tiếp tục là Next.js 15 `output: "export"` trên Cloudflare Pages. HTML/CSS/JS và ảnh legacy nhỏ vẫn nằm trong `out`; ảnh, video, PDF mới nằm trong R2. Pages Functions cung cấp API quản trị, không dùng OpenNext và không chuyển website sang Worker.

Luồng dữ liệu:

1. Decap custom widget tối ưu ảnh trong browser rồi gửi binary cùng origin đến `/api/admin/media/upload`.
2. Cloudflare Access chặn route admin trước Pages Functions; Function kiểm tra Access headers, allowlist tùy chọn, Origin/Host, CSRF, MIME, magic bytes và kích thước.
3. Function sinh key không đoán trước và ghi qua `context.env.MEDIA`; không có R2 credential ở browser.
4. Markdown/JSON chỉ lưu object key và metadata. `mediaUrl()` nối key với `NEXT_PUBLIC_MEDIA_BASE_URL` lúc build.
5. Preview đọc `tung-phat-media-preview`; production đọc `tung-phat-media` bằng cùng binding `MEDIA`.

## Bindings Pages

`wrangler.jsonc` là source of truth:

```jsonc
{
  "pages_build_output_dir": "./out",
  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "tung-phat-media" }
  ],
  "env": {
    "preview": {
      "d1_databases": ["...preview DB giữ nguyên..."],
      "r2_buckets": [
        { "binding": "MEDIA", "bucket_name": "tung-phat-media-preview" }
      ]
    }
  }
}
```

Wrangler `4.111.0` trong lockfile và schema `node_modules/wrangler/config-schema.json` chấp nhận `RawEnvironment.r2_buckets`. R2/D1 là khóa non-inheritable: khi preview override resource binding, block preview phải chứa cả D1 và R2. Không có hai binding `MEDIA` trong một environment; top-level áp dụng production/local, `env.preview` thay thế ở preview. Xem [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

## Public URL

- Preview: bật **R2 → tung-phat-media-preview → Settings → Public Development URL → Enable**. Ghi lại URL `https://pub-….r2.dev`.
- Đặt `NEXT_PUBLIC_MEDIA_BASE_URL` cho môi trường build Preview bằng URL trên. Đặt cùng tên variable cho Pages Functions Preview để API trả URL preview cho picker.
- Production tương lai: đặt `NEXT_PUBLIC_MEDIA_BASE_URL=https://media.mdftungphat.com` chỉ sau khi custom domain đã được kết nối và Active.
- Không đưa Pages preview URL hoặc R2 preview URL vào canonical, sitemap hay production Open Graph.

`r2.dev` bị rate-limit và chỉ dành cho development; production phải dùng custom domain. Không tạo CNAME trỏ vào `r2.dev`. Xem [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Content model

Ưu tiên object key, không lưu preview URL:

```yaml
featuredImage:
  key: images/2026/07/example-uuid.webp
  name: example.webp
  mimeType: image/webp
  size: 182340
featuredImageAlt: Mô tả ảnh
```

Các string legacy như `/images/cnc-service.webp` vẫn được schema và `mediaUrl()` hỗ trợ. Object key R2 yêu cầu `NEXT_PUBLIC_MEDIA_BASE_URL`; thiếu biến sẽ không tự suy ra URL preview.

## API

- `GET /api/admin/media`: `limit` 1–100, `cursor`, `prefix`, filter `mime`; trả key, URL, size, date, ETag và CSRF token.
- `POST /api/admin/media/upload`: raw body, filename encoded ở `X-Media-Filename`; chấp nhận JPEG/PNG/WebP/AVIF/MP4/WebM/PDF, xác minh signature, server sinh key, không overwrite.
- `POST|DELETE /api/admin/media/delete`: yêu cầu `confirmation === key`; copy sang `trash/YYYY/MM/DD/…` rồi mới xóa key gốc.

Giới hạn ứng dụng: ảnh 12 MiB, video 50 MiB, PDF 20 MiB. Đây là giới hạn bảo vệ Worker, thấp hơn giới hạn object R2. Binary không được log; lỗi trả code chung và không trả stack trace.

## Video legacy

Key cố định: `videos/legacy/0619.mp4`, bucket ưu tiên `tung-phat-media-preview`. Bản nguồn local được giữ tại `local-media/0619.mp4` và bị git-ignore cho đến khi upload được xác minh.

```bash
npx wrangler login
npx wrangler r2 bucket dev-url get tung-phat-media-preview
npm run media:upload:r2 -- \
  --environment preview \
  --file local-media/0619.mp4 \
  --key videos/legacy/0619.mp4 \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000, immutable" \
  --public-base-url "https://pub-REPLACE.r2.dev" \
  --confirm
```

Script HEAD-check để tránh overwrite, upload bằng Wrangler remote, rồi HEAD-check lại URL, size 76.129.250 byte và MIME. Không xóa bản local nếu dòng `VERIFIED` chưa xuất hiện.

Video hiện quá nặng cho web. Tạo bản H.264 `faststart`, bỏ audio nền và kiểm tra mục tiêu 5–15 MiB:

```bash
npm run media:compress:video -- local-media/0619.mp4 local-media/0619-web.mp4
```

Upload bản nén vào key version mới, kiểm tra hình ảnh, rồi cập nhật component; không overwrite key đang phục vụ nếu chưa có kế hoạch cache busting.

## Backup và orphan media

- R2 không thay thế backup. Hàng tuần/tháng dùng `rclone sync` hoặc S3-compatible tool từ từng bucket sang storage/versioned bucket khác; kiểm tra restore ngẫu nhiên và lưu manifest `key,size,etag,lastModified` ngoài repo nếu có dữ liệu nhạy cảm.
- Trước thay đổi hàng loạt, export manifest và giữ `trash/` tối thiểu 30 ngày. Lifecycle chỉ xóa `trash/` sau thời gian đã duyệt; không áp lifecycle vào prefix live.
- Job orphan chạy read-only: list có phân trang, quét key đang được tham chiếu trong Markdown/JSON, xuất report. Chỉ chuyển orphan sang trash sau review; không wildcard delete.
- Theo dõi storage, Class A/B, lỗi 429 và alert chi phí. Free tier Standard hiện gồm 10 GB-month, 1 triệu Class A và 10 triệu Class B/tháng; free tier không áp dụng Infrequent Access. Vượt quota có thể bị tính phí. Xem [R2 pricing](https://developers.cloudflare.com/r2/pricing/).
