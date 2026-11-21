# Kết nối blog WordPress local

`BLOG_CONTENT_PROVIDER=wordpress`, `WORDPRESS_BASE_URL=http://127.0.0.1:9400`, `WORDPRESS_ALLOW_LOCAL_HTTP=1` chọn WordPress local; mặc định `payload`. HTTP chỉ được cho phép với IP loopback và opt-in rõ ràng; URL HTTPS dùng cho môi trường thực sau này. Provider không âm thầm fallback. WP REST phân trang, kiểm tra duplicate slug, status publish, mật khẩu, ngày tương lai và lỗi API; request có cache key mới mỗi lần để static build không dùng response cũ. Phương án này chưa được đánh giá chi phí API/cache ở production.

`lib/wordpress/provider.ts` chuyển REST sang model blog, `lib/content.ts` chọn nguồn, `ArticleLanding` dùng `WordPressArticleBody` và sanitizer allowlist. Renderer giữ heading, đoạn, list, bảng, figure/caption và ảnh/srcset trên origin được cho phép. HTML REST thật của bài thử được sanitize không cảnh báo; test từ chối URL không an toàn. Nếu block bị loại, renderer báo lỗi thay vì xuất bản im lặng. Chưa kiểm toán bảo mật độc lập, chưa hỗ trợ đầy đủ mọi block Gutenberg.

WordPress mode được export thành công và browser test 2/2: ba route hiện hữu, canonical/Article JSON-LD, sitemap, hình/caption/bảng; draft/private/future bị loại khỏi sitemap và trả 404. Ảnh featured bị thiếu dùng logo dự phòng trong bản local; editorial SEO fields chưa tích hợp; tên tác giả và ngày cập nhật phản ánh WordPress local. Bản sao local không đủ để phê duyệt cutover. Payload catalogue và các material pages tiếp tục nguồn cũ.

Trong bản sao an toàn, sau khi dữ liệu Payload build và các chỉ mục đã được chuẩn bị, lệnh build thử là:

```sh
BLOG_CONTENT_PROVIDER=wordpress WORDPRESS_BASE_URL=http://127.0.0.1:9400 WORDPRESS_ALLOW_LOCAL_HTTP=1 NEXT_PUBLIC_ANALYTICS_TEST_MODE=1 node ./node_modules/next/dist/bin/next build
```

Bản export từ `/tmp/tungphat-phase7-ga.VEZvyB/out` đang được `serve` tại 127.0.0.1:4186. Đây là static snapshot: publish trong WordPress không tự cập nhật nó. Fallback `/og-logo.png` được dùng khi không có featured media; không phải ảnh bài đã migrate và không thể dùng làm bằng chứng parity. Metadata title/description của ba slug cũ còn bị baseline SEO frontend ưu tiên; chưa có quyền sở hữu SEO trong WordPress.
