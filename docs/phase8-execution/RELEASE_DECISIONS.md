# Ba quyết định

**A — Existing website: NO-GO.** LCP lab giảm median 10.804 → 5.736 ms nhưng còn trên mục tiêu nội bộ 4 giây; quyền xử lý hero và quyền ảnh legacy chưa được xác nhận. Các checks production/field cần quyền riêng. Regression và verify xem `FINAL_QA.md`; không tự chấp nhận rủi ro ảnh.

**B — WordPress local MVP: NOT READY.** Playground, REST, import, provider và static rendering chạy thật; tuy nhiên parity ba bài chưa đạt (featured media, figures/caption/attribution, metadata/FAQ/related/author), draft preview và publishing tự động chưa có. Không gán nhãn LOCAL MVP READY chỉ vì ba body render được.

**C — WordPress production cutover: NOT READY.** Playground không phải staging. Chưa có host WP độc lập, bảo mật/auth/preview HTTPS, durable authenticated publishing pipeline, giám sát, backup khôi phục, parity và owner review. Không đổi `cms.mdftungphat.com`, không deploy hoặc dùng dữ liệu production.
