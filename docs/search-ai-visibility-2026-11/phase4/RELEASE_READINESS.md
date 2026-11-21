# Release readiness — 14/11/2026

**Khuyến nghị: chưa đưa vào bước phê duyệt deploy production.** Kiểm tra local đã giảm rủi ro nhưng ownership CMS/frontend và kiểm thử đo lường còn khoảng trống; các trạng thái dưới đây không đánh đồng snapshot production với build local. Không có commit, push hoặc deploy.

| Gate | Trạng thái | Bằng chứng / giới hạn |
|---|---|---|
| Lint, typecheck, unit/integration, build | PASS | `npm run verify` exit 0 trong bản sao; 749 test frontend, 313 catalogue, 38 CMS; build frontend và CMS dry-run, lint/typecheck/edge. |
| Playwright | PASS | 63/63 trên export local: material, search, catalogue, SEO; thêm 2/2 CTA/báo giá; gồm HTML link CNC → `/du-an/`; không đại diện toàn bộ hành trình. |
| Runtime / broken links | PASS | Validator local kiểm tra 3.592 HTML và 258.062 liên kết nội bộ, không lỗi target; không bảo đảm mọi liên kết ngoài hoặc tương tác runtime. |
| Canonical, sitemap, robots, indexability | PASS | Local validator: 2.664 URL sitemap self-canonical, indexable; output robots wildcard và mẫu alias theo snapshot. Không thay chính sách hàng loạt; không chứng minh Google chọn canonical. |
| Schema có căn cứ | NOT VERIFIED | 3.591 HTML parse/validate bằng script repo; chưa xác nhận mọi thuộc tính, Rich Results Test hoặc dữ kiện ngoài website. |
| Duplicate URLs và content | NOT VERIFIED | Không có bằng chứng sinh duplicate hàng loạt từ các sửa Phase 4; 260 cặp mã và 6 hub/nhóm còn cần đối chiếu từng nội dung/quyền. Không khẳng định toàn bộ 3.589 trang đã review. |
| Catalogue tìm kiếm/lọc | PASS | Playwright supplier catalogue, mã và không JS trong phạm vi test; không xác minh từng SKU và ảnh. |
| Zalo, Maps, CTA, app báo giá | NOT VERIFIED | Code chứa Zalo và hai place IDs nhất quán; chưa xác nhận đích Maps/ứng dụng ngoài và toàn bộ hành trình hiện tại. Không gửi lead thật. |
| Content/CMS, trùng section, ảnh và quyền | NOT VERIFIED | Frontend thay body/metadata ở một số slug; heading insertion mong manh và 5.515 nguồn ảnh UNCONFIRMED chưa ánh xạ từng file. Cần owner xác nhận quy trình và review mẫu; không tuyên bố mất nội dung CMS đã giải quyết. Không thêm ảnh Phase 4. |
| GA4 và conversion | NOT VERIFIED | Test queue/config/opt-out mô phỏng đạt; không có bằng chứng property nhận event, browser receiver đầy đủ hoặc dedup liên miền. Hai event quote+Zalo có thể phát từ cùng click; chưa được coi là lead. |
| Mobile và performance | NOT VERIFIED | 18 lượt Chrome local, không overflow ở mẫu, không có field CWV/Lighthouse, chưa đủ kết luận ngưỡng. Xem `PERFORMANCE_REPORT.md`. |
| AI Search, local entity | NOT VERIFIED | Hai quan sát Google trong session, một có citation website; không đủ suy xu hướng. Không có quyền GBP/WAF, GSC/GA4/Bing hiện hành hoặc xác nhận crawler thật. |
| Production verification | NOT APPLICABLE | Chưa deploy theo chỉ đạo; checklist được chuẩn bị cho sau khi duyệt. |

Rủi ro ưu tiên: (1) nội dung CMS có thể bị che bởi override; (2) cấu hình GA4 và định nghĩa chuyển đổi thực chưa xác nhận; (3) quyền ảnh catalogue chưa đối chiếu theo SKU; (4) canonical alias/noindex cần kiểm tra có chọn lọc, không xử lý đồng loạt. Khuyến nghị owner xác nhận luồng biên tập và kiểm tra preview với dữ liệu CMS mới trước khi phê duyệt; hoàn tất test tracking/CTA an toàn và các gate còn NOT VERIFIED. Không cần đợi đủ 160 truy vấn AI để sửa các vấn đề độc lập.
