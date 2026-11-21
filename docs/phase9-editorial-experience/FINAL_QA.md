# QA Phase 9

| Hạng mục | Kết quả / giới hạn |
|---|---|
| Playground persistence | PASS: khởi động lại đúng thư mục, bài 10–12 còn publish; draft 32–34 còn trong WordPress. |
| Dashboard | PASS có điều kiện: số liệu thật, tìm + lọc draft trả ba bản; desktop/mobile đã chụp. Role editor riêng chưa thử. |
| Mobile | PASS chiều rộng tài liệu 390/390 px; bảng cuộn ngang trong vùng riêng. Axe còn 5 nút `aria-allowed-role` mức minor thuộc thanh admin WordPress; chưa có audit accessibility đầy đủ. |
| Gutenberg và SEO | PASS có điều kiện: ba bản draft tạo bằng block, trường SEO lưu và còn sau reload; chưa nối frontend. Ảnh chụp editor và hộp chọn ảnh thật. |
| Media / featured image | NOT TESTED lại việc upload hoặc lưu ảnh đại diện trong Phase 9; chỉ mở hộp chọn. Không có ảnh mới được gán. |
| Migration parity | FAIL: xem `WORDPRESS_PARITY.md`. |
| Draft preview / pipeline | NOT IMPLEMENTED: xem `PREVIEW_AND_PUBLISH.md`. Không kết luận bảo mật preview hoặc anonymous REST. |
| Visual audit | Dashboard có hierarchy rõ, không dùng số giả; bảng cần cuộn ngang trên mobile. Không đánh giá toàn bộ Gutenberg. Không có Lighthouse hoặc đo hiệu năng mới. |
| `npm run verify` | PASS trước sửa HTML nhỏ của MU-plugin: 788 frontend, 313 catalogue, 38 CMS; build và link validation pass. MU-plugin không thuộc các kiểm thử đó. |
| Playwright full suite | FAIL: 119 passed, 5 failed, 2 skipped; thêm 3 lỗi ngoài test. Lượt đầy đủ chạy sau sửa UI cuối. Xem chi tiết dưới bảng. |
| Role, schedule, publish/unpublish, upload, anonymous REST | NOT TESTED trong Phase 9; không suy từ Phase 8. |

Không commit, push hoặc deploy. Không chạy lại thí nghiệm catalogue LCP.

Playwright: analytics không thấy `config` trong dataLayer; test yêu cầu GA ID thử nghiệm nhưng build không đặt biến `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Trustindex, SC015MW và header có timeout/teardown timeout. Test catalogue không tìm thấy logo Thanh Thuỳ. Worker bị buộc dừng; chưa xác định nguyên nhân gốc của các timeout hoặc logo. Log: `/tmp/tungphat-phase9-playwright-final.log`; không coi chạy lại một phần là full PASS.

Ảnh Next.js bài biên tập và preview được yêu cầu: NOT AVAILABLE vì bridge chưa được xây. Snapshot 4186 được phục hồi từ bản Phase 8 cũ, không phải preview draft.
