# Thử publishing local

Trong Gutenberg UI, đã gõ title/nội dung và bấm Save draft thành công (draft ID 28, ảnh `evidence/wordpress-ui-draft.png`). Tại WordPress Playground thực, bài thử ID 6 được tạo với Gutenberg blocks, lưu draft rồi publish, upload PNG hình học tự tạo, có inline image, alt, caption, table, responsive variants và featured media ID 7. REST và ảnh được kiểm tra, restart giữ bài. Sau publish, build Next WordPress mode thủ công tạo HTML và sitemap; browser test render ảnh/caption/bảng. Draft/private/future thử riêng không vào sitemap và 404.

Chuyển bài thử ID 6 về draft rồi chạy lại static build thủ công: file bài và entry sitemap đều biến mất; sau đó publish lại để giữ demo. Không có webhook/queue/dedup/retry/build trigger hoặc deploy tự động; chu trình này không chứng minh publish tự động. Preview draft bằng giao diện Next có xác thực chưa tồn tại. Không có production build hook và không triển khai.
