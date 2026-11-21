# Thay đổi Phase 3 — local, chưa deploy

| File | Thay đổi và lý do | Giới hạn |
| --- | --- | --- |
| `lib/content-overhaul.ts` | MDF giải thích cốt sợi so với MFC và dẫn bài chuẩn bị CNC; Acrylic, Melamine, Laminate dẫn nhóm mã hãng có URL riêng để người đọc tra tiếp và crawler có link HTML. | Link nhóm mã không chứng minh hàng có sẵn hay quyền sử dụng từng ảnh. |
| `data/product-intros.json` | Mở đầu MDF chống ẩm nói rõ không chống nước và điểm nước có thể xâm nhập. | Cấp sử dụng và chỉ tiêu phải đối chiếu đúng dòng. |
| `lib/analytics/client.ts`, `lib/analytics/ga4-bootstrap.ts`, `components/Analytics.tsx` | Hàng đợi GA4 riêng giữ tối đa 100 sự kiện sớm; cấu hình tag xong mới phát lại theo thứ tự. Chỉ chạy bootstrap với ID đúng định dạng và không có cookie opt-out. Giảm rủi ro event trước config theo hướng dẫn Google. | Cần kiểm tra DebugView trên property thật sau deploy; không chứng minh GA4 đang cấu hình. Queue chỉ giữ trong vòng đời trang, có thể mất khi rời trang trước khi tag tải. Không sửa thu thập bên thứ nhất hay gửi lead. |
| `tests/search-phase3.test.ts`, `tests/ga4-bootstrap.test.ts`, `tests/analytics.test.ts`, `e2e/search-phase3.spec.ts` | Kiểm tra đáp án/link, thứ tự GA4, opt-out, SSR và giao diện đại diện. | Kết quả và giới hạn thực chạy ở `07 — VALIDATION.md`. |

Không thay đổi robots, canonical, URL, schema, sitemap, giá hay CMS production. Tên file trên là phần thay đổi Phase 3; working tree đã có nhiều thay đổi từ trước. Không thêm dependency. Nội dung product/article override vẫn là một nguồn biên tập phía frontend; CMS thay đổi body có thể không phản ánh nếu bị override, cần quy trình đồng bộ như báo cáo vòng trước.
