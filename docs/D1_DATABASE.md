# D1 cho form báo giá và liên hệ

## Schema

`migrations/0001_create_leads.sql` tạo `leads`, `lead_status_history`, `rate_limits` và index. `0002` tạo history khi insert/thay đổi status. D1 không chứa bài viết, ảnh hoặc binary bản vẽ.

Các loại lead hợp lệ: `contact`, `quote`; status do server/quản trị đặt, mặc định `new`. `submission_key` chống insert trùng khi double-click/retry. Retention mặc định cho lead không phát sinh giao dịch: 24 tháng, sau đó review/xóa; hồ sơ giao dịch tuân thời hạn kế toán/pháp lý riêng.

## Tạo và migrate

```bash
npx wrangler d1 create tung-phat-leads
npx wrangler d1 create tung-phat-leads-preview
# chép hai database_id vào production và env.preview trong wrangler.jsonc
npm run cf:typegen
npm run d1:migrate:local
npm run d1:migrate:preview
npm run d1:migrate:remote
```

Không sửa schema trực tiếp trên production. Tạo file migration số tiếp theo, test local, backup rồi apply remote.

## Backup/export

```bash
mkdir -p backups
npm run d1:backup
```

Thư mục backup bị `.gitignore`; file chứa PII không được commit hoặc gửi qua kênh công khai. Có thể export CSV giới hạn cột từ D1 dashboard/CLI cho người được cấp quyền. Giai đoạn này không có `/admin/leads` để tránh SSR và lộ PII vào static output.

Ví dụ truy vấn quản trị (không đưa output vào log công khai):

```bash
npx wrangler d1 execute tung-phat-leads --remote --command "SELECT id,type,status,created_at FROM leads ORDER BY created_at DESC LIMIT 100"
npx wrangler d1 execute tung-phat-leads --remote --command "UPDATE leads SET status='contacted',updated_at=datetime('now') WHERE id='LEAD_ID'"
```

Status hợp lệ: `new`, `contacted`, `quoted`, `won`, `lost`, `spam`, `archived`. Export/xóa theo yêu cầu dữ liệu phải được xác minh danh tính và ghi nhận nội bộ.

## Security controls

- Zod server validation, length limits, control-character cleanup và phone normalization.
- Origin phải đúng site; body tối đa 20 KB; honeypot; Turnstile Siteverify.
- Rate limit 5 request/10 phút/IP hash; IP thô không lưu trong lead.
- SQL parameter binding; client không thể đặt status.
- Error production không có stack trace, log không chứa phone/email/message.
- Upload CNC tắt. Khi cần upload, dùng R2 private, allowlist extension, kiểm MIME/signature thực, giới hạn kích thước, object key random và D1 chỉ lưu metadata.
