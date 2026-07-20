# Analytics maintenance Worker

Worker chạy mỗi ngày lúc 18:15 UTC (01:15 `Asia/Ho_Chi_Minh`) để:

- ghi lại aggregate của ngày Việt Nam vừa kết thúc;
- xóa raw event/session quá 90 ngày;
- xóa test event quá 7 ngày;
- xóa visitor không còn session;
- xóa Search Console cache và rate-limit bucket hết hạn;
- xóa daily aggregate quá 25 tháng.

Preview Worker không có Cron Trigger. Production và preview dùng hai D1 database
riêng. Worker không có HTTP API công khai và không cần secret.
