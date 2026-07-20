# Tracking plan

## Event allowlist

| Event | Trigger | Trường chính |
|---|---|---|
| `page_view` | Lần tải đầu và App Router đổi path | path, page_title |
| `article_view` | Mở bài viết | content_id/title/category |
| `article_engaged` | Visible 30 giây hoặc cuộn 50% | content fields |
| `product_view` | Mở chi tiết sản phẩm | content fields |
| `scroll_depth` | 25/50/75/90%, một lần/mốc | scroll_percent |
| `engagement_time` | hidden/pagehide, chỉ tính tab visible | engagement_seconds |
| `click_phone` | Mọi `tel:` | target_type=phone, cta_location |
| `click_zalo` | Mọi link Zalo | target_type=zalo, cta_location |
| `click_email` | Mọi `mailto:` | target_type=email |
| `click_maps` | Link Google Maps/chỉ đường | target_type=maps |
| `click_catalogue` | Mở/tải PDF hoặc catalogue | target_type=catalogue |
| `click_quote` | CTA nhận báo giá | target_type=quote |
| `form_start` | Focus đầu tiên trong form | không có field value |
| `form_submit` | API lead trả thành công | không có PII |

CTA location chỉ nhận:

`header`, `hero`, `floating_button`, `mobile_bottom_bar`,
`homepage_section`, `product_card`, `product_detail`, `article_inline`,
`article_footer`, `contact_page`, `footer`, `catalogue_section`, `unknown`.

Legacy location hiện có được map vào enum; không đưa slug động vào dimension.
Native anchors chưa dùng `TrackedLink` được event delegation phân loại nên
email, Maps, catalogue và CTA ở mọi component vẫn được phủ.

## Payload đã loại PII

```json
{
  "event_id": "random-uuid-v4",
  "visitor_id": "random-uuid-v4",
  "session_id": "random-uuid-v4",
  "event_name": "click_zalo",
  "occurred_at": 1784512800,
  "path": "/go-ghep",
  "page_title": "Gỗ ghép",
  "content_type": "product",
  "content_id": "go-ghep",
  "cta_location": "hero",
  "target_type": "zalo",
  "attribution": { "utm_source": "facebook", "utm_medium": "social" }
}
```

Không chấp nhận metadata tùy ý, email, phone, form values, raw query string,
Authorization/Cookie header hoặc full URL.

## Metric definitions

- Người truy cập: distinct `visitor_id`.
- Phiên: distinct `session_id`; timeout 30 phút.
- Page views/CTA: số event tương ứng.
- Khách tiềm năng: distinct session có phone/Zalo/email/quote/form submit.
- Conversion rate: lead sessions / total sessions; 0 khi không có session.
- Đọc thực sự: distinct session có `article_engaged`.
- Đọc gần hết: scroll 90%.
- Assisted conversion: content view xảy ra trước contact event trong cùng session.
- Hoạt động gần đây: session có activity trong 30 phút, không gọi là “online”.
