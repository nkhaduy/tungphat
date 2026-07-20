# Quyền riêng tư Analytics

## Thu thập

- UUID v4 ngẫu nhiên `tp_vid` (12 tháng) và `tp_sid` (30 phút);
- path không có query nhạy cảm, title giới hạn độ dài;
- content ID/title/category đã public;
- loại CTA, vị trí, scroll milestone và thời gian visible;
- UTM, `gclid`, `fbclid` theo allowlist;
- source/medium, nhóm thiết bị/browser/OS và quốc gia/khu vực tổng quát.

IP chỉ được xử lý tạm tại edge để tạo rate-limit bucket có salt và TTL ngắn.
Database không lưu raw IP. User-Agent chỉ được parse server-side thành nhóm
tổng quát; chuỗi đầy đủ không được lưu.

## Không thu thập

Không fingerprint canvas/WebGL/font/audio/screen/hardware, không cross-domain
tracking/cookie sync, session replay, quay màn hình, keystroke, extension
detection, nội dung form trước submit, nội dung Zalo, Authorization/Cookie
header, tên/email/phone trong event analytics.

Lead form vẫn lưu dữ liệu khách chủ động gửi trong hệ thống lead riêng theo
chính sách hiện có; analytics chỉ nhận `form_submit`.

## Opt-out và internal traffic

Cookie `tp_analytics_opt_out=1` ngăn tạo visitor/session và ngăn first-party/GA4
event. Dashboard có nút bật/tắt cho thiết bị hiện tại. `/admin`, `/analytics`,
CMS preview, localhost, Vercel/Pages preview, bot và test automation bị loại.

## Retention

- raw event/session: 90 ngày;
- test event: 7 ngày;
- visitor không còn session: xóa;
- aggregate: tối đa 25 tháng;
- Search Console cache: TTL bốn giờ và cleanup khi hết hạn.

## Giới hạn diễn giải

Click phone/Zalo chỉ chứng minh link đã được bấm/mở, không chứng minh cuộc gọi
hoặc tin nhắn hoàn tất. Search Console tổng hợp query và có độ trễ; không được
gán một query organic cho một khách/session. Query-level conversion chỉ có thể
được đo chính xác với campaign hoặc `utm_term` do Tùng Phát chủ động gắn.
