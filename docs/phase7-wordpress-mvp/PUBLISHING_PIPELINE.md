# Preview và publishing

Chưa triển khai preview có xác thực hoặc publishing tự động. Adapter và HMAC primitive Phase 6 không phải webhook endpoint hay durable queue. Chưa có atomic dedup/outbox, retry, rate limiting, build trigger, rollback hoặc thử publish→build; không kích hoạt bất kỳ production build hook nào.

Cần thiết kế và kiểm thử các phần này với bí mật phía server, xác thực preview ngắn hạn, noindex/no-store và HTTPS tại staging trước cutover. Phải giữ deployment trước khi build thất bại, không fallback âm thầm và không đưa draft vào export/sitemap.
