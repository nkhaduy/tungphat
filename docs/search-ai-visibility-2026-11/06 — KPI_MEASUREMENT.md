# Đo lường sau deploy

Không có số liệu hiện hành về GA4, Bing AI Performance, citations, conversion hay field CWV trong lượt này. Baseline GSC lịch sử xem `01 — BASELINE.md`; tránh so sánh kỳ mới với số liệu không cùng ngày, filter hoặc loại property.

| Mục tiêu | Nguồn / phép đo | Diễn giải và giới hạn |
| --- | --- | --- |
| Search | GSC Web: clicks, impressions, CTR, vị trí TB theo page, query, device, country; so 28 ngày trước/sau và cùng kỳ nếu đủ lịch sử | AI Overview/AI Mode nằm trong Web tổng hợp; không tách tỷ lệ AI hay nhân quả từ tổng số. Query bị ẩn/lấy mẫu, không cộng rows để ra tổng property. |
| Index | GSC Page Indexing và URL Inspection cho mẫu quan trọng/nhóm tier | So ngày cập nhật, Google-selected canonical và lần crawl; sitemap không bằng chứng index. |
| AI Bing | BWT AI Performance nếu property có quyền và tính năng/dữ liệu sẵn: citation count, cited pages, grounding query, khoảng thời gian, bề mặt | [Microsoft](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/): query mẫu; citation không phải visit, lead, rank hoặc từng prompt người dùng. |
| AI referral | GA4 session source/medium và landing page; kiểm tra `utm_source=chatgpt.com`, referrer chatgpt.com hoặc nguồn AI khác khi có | [OpenAI mô tả UTM](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq); chỉ đếm traffic đến site, không suy toàn bộ citations hay thiếu UTM là không có referral. |
| Hành động | Các event code hiện có `click_phone`, `click_zalo`, `click_maps`, `click_catalogue`, `click_quote`, `product_view`, `form_submit` | `request_quote` qua Zalo được map thành click_quote + click_zalo, hai event có thể cùng một lần bấm; không cộng để ra lead. Click không xác nhận cuộc gọi, gửi tin, form được xử lý hay đơn hàng. |
| Chất lượng | GSC/GA4 landing + engagement và số phiên có hành động, phân đoạn kênh, thiết bị | Xem định nghĩa session, opt-out, chặn tag, timezone và bộ lọc; không ghi dữ liệu cá nhân vào tham số. |
| Web vitals | CrUX hoặc Search Console CWV theo nhóm URL khi đủ dữ liệu; Lighthouse mobile/desktop kiểm tra lab | LCP, CLS, INP field khác lab; ghi thời gian, thiết bị và điều kiện, không xem điểm tổng là bằng chứng duy nhất. |

Quy trình: ghi ngày deploy, commit/version được người dùng cho phép sau này; xuất baseline 28 ngày trước deploy có độ trễ hoàn chỉnh, nhãn theo nhóm intent trong `02`, sau đó kiểm tra sau 7/28/56 ngày và so kỳ tương ứng. Không chạy thử bằng cách gửi yêu cầu thật. Trên môi trường thử, chặn outbound, dùng DebugView hoặc đầu thu giả để kiểm chứng duy nhất một page_view và từng click. Xác minh property GA4 đang thực sự được cấu hình, thứ tự config-event, attribution sau điều hướng, opt-out, đồng ý riêng tư và dữ liệu hiển thị trong báo cáo trước khi dùng làm KPI. `NEXT_PUBLIC_GA_MEASUREMENT_ID` là cấu hình build; không suy ID hay trạng thái thu thập từ code.

Bộ câu hỏi `05` gồm 40 truy vấn × 4 nền tảng. Khi chạy, giữ nguyên ngôn ngữ, vùng, thiết bị, thời điểm, tài khoản/cá nhân hóa, phiên mới và nguồn chụp; ghi URL kết quả, trích dẫn, vị trí nếu thực sự thấy, đối thủ, bằng chứng và mức tin cậy. Chạy lặp nhiều thời điểm; `NOT TESTED` là thiếu quan sát, không phải không xuất hiện. Hai quan sát Google 08/11 là lịch sử, không đủ để kết luận xu hướng.
