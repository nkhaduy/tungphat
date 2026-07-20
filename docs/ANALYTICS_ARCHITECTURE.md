# Kiến trúc Analytics Tùng Phát

## Tổng quan

Website public là Next.js 15 static export trên Vercel. Decap CMS và Pages
Functions chạy tại `cms.mdftungphat.com`; D1 `tung-phat-leads` và
`tung-phat-leads-preview` đã tồn tại. Analytics tái sử dụng D1 nhưng chỉ dùng
các bảng có prefix `analytics_`.

```text
Browser mdftungphat.com
  ├─ beacon/fetch không chặn → cms.mdftungphat.com/api/analytics/track
  │                           └─ validate → rate limit → D1 analytics_*
  └─ GA4 gtag (nếu đã cấu hình, send_page_view=false)

GitHub OAuth callback đã xác minh email
  └─ cookie tp_cms_admin HttpOnly, ký HMAC, 12 giờ
      └─ /analytics/ + /api/admin/analytics/* → D1 / GA4 Data API / GSC API
```

## Các lớp

- **First-party:** visitor/session UUID ngẫu nhiên, page/content/engagement/CTA
  events và journey ẩn danh. Collector lỗi không ảnh hưởng website.
- **GA4:** script tải `afterInteractive`, page view do App Router provider gửi
  một lần; opt-out tắt cả first-party và GA4.
- **Search Console:** service account gọi Search Analytics API; kết quả cache
  D1 bốn giờ. Không nối query organic với một người hoặc session cụ thể.
- **CMS dashboard:** static route-split bundle, bảy tab tiếng Việt, API tính
  server-side và không chuyển raw dataset hàng loạt xuống browser.

## Authentication và failure modes

OAuth callback chỉ phát session sau khi GitHub trả token hợp lệ và email đã
verify nằm trong allowlist. Static dashboard được Pages middleware bảo vệ; API
kiểm tra lại session. Admin POST kiểm tra Origin. Response admin luôn
`private, no-store` và `noindex`.

Nếu GA4/GSC thiếu biến hoặc lỗi, endpoint trả trạng thái an toàn và báo cáo
first-party vẫn dùng được. Nếu collector lỗi, client bỏ lỗi và không retry vô
hạn. Không có code analytics trong server rendering hoặc critical path.

## Aggregation và retention

Migration tạo daily aggregate để sẵn sàng cho dữ liệu dài hạn; báo cáo 90 ngày
hiện dùng raw events qua composite indexes. Nút **Làm mới dữ liệu** chạy
maintenance idempotent:

- raw events/session: 90 ngày;
- test events: 7 ngày;
- visitor không còn session: xóa;
- cache GSC: xóa theo TTL;
- aggregate: có thể giữ 25 tháng.

Journey luôn phân trang và giới hạn 100 dòng/request. Khi lưu lượng tăng, có thể
đưa cùng routine maintenance vào Cloudflare Cron mà không đổi schema/API.

## Deployment

Website tiếp tục deploy qua Vercel Git Integration. Collector, dashboard, auth
và D1 nằm trong Cloudflare Pages project `tungphat-cms`. Rollback bằng cách
rollback Pages deployment và `git revert`; migration 0004 chỉ tạo bảng/index,
không sửa dữ liệu lead.
