# Migration nội dung blog

`fixtures/final-payload-articles.json` là fixture export read-only ngày 15/11/2026 từ `getArticles()` hiện tại, đã áp dụng body override/bổ sung, kèm HTML `<article>` render từ `ArticleLanding`; không phải bản backup CMS/media, không phải WordPress import, và chưa được xác nhận là parity với HTML build được owner duyệt. Các file ảnh vẫn ở repo/CDN; phải tạo backup độc lập có hash trước migration.

| Slug hiện hữu | Nội dung cần giữ | Figure cần migrate |
|---|---|---|
| `mdf-thuong-va-chong-am` | Body repository đã biên tập, bảng, metadata, liên kết `/van-mdf/` và `/mdf-chong-am/` | Hai ảnh MDF, alt và caption trong renderer |
| `chuan-bi-file-cnc` | Body CMS + section repository, bảng, metadata và link | Sơ đồ SVG, alt, caption và khả năng cuộn |
| `go-ghep-la-gi` | Body CMS + section repository cuối bài, metadata và link | Ảnh gỗ ghép cao su, alt, caption và attribution |

Mỗi bài: backup raw document gốc + export renderer đã duyệt + media/manifest/quyền; transform thành Gutenberg-compatible blocks, kiểm tra không mất bảng/heading/ảnh/caption/alt/link, ngày và taxonomy. [Cấu trúc Gutenberg](https://developer.wordpress.org/block-editor/getting-started/fundamentals/markup-representation-block/) có block delimiters; HTML được bảo toàn chưa chứng minh là block editable hợp lệ. Import chỉ vào staging khi có instance; so sánh nội dung, schema, canonical `/bai-viet/{slug}/`, sitemap, trạng thái public, SEO và responsive trước đề xuất cutover. WordPress permalink không quyết định URL công khai.

Ghi chú: renderer hiện thêm figure ngoài Markdown body; export raw Payload sẽ thiếu phần đó. SEO hiện có baseline riêng trong `lib/content-metadata.ts`, vì vậy phải đối chiếu metadata thực trước khi chuyển ownership. Không xóa frontend override/guard hoặc source cũ đến khi WordPress parity được owner duyệt. Rollback bằng deployment frontend cũ và snapshot đã xác minh; không migrate production trong lượt này.
