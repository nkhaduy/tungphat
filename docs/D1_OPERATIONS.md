# Vận hành D1 và form

## Phạm vi dữ liệu

D1 chỉ lưu dữ liệu động từ `/api/contact` và `/api/quote`; bài viết, sản phẩm,
dự án và ảnh nằm trong Git.

| Bảng | Mục đích |
|---|---|
| `leads` | yêu cầu liên hệ/báo giá và trạng thái xử lý |
| `lead_status_history` | lịch sử tạo/thay đổi trạng thái |
| `rate_limits` | bucket chống spam, tự dọn |

`leads.type` là `contact` hoặc `quote`. Trường gồm tên, phone, email, company,
city, product, material, thickness, dimensions, quantity, CNC note, message,
source/referrer/UTM, status, timestamps, IP hash và user-agent. IP thô chỉ được
gửi tạm cho Turnstile và không được ghi D1.

## Tạo, migrate và kiểm tra

Làm theo phần D1 trong `CLOUDFLARE_DEPLOYMENT.md`. Quy trình an toàn cho migration
mới:

1. Thêm file `cloudflare-cms/migrations/NNNN_description.sql`; không sửa
   migration đã chạy.
2. `npm run d1:migrate:local`.
3. Chạy test và form smoke test local.
4. `npm run d1:migrate:preview`; kiểm preview.
5. Export production.
6. Chỉ khi được phê duyệt: `npm run d1:migrate:remote`.

## Xem yêu cầu

Giai đoạn miễn phí này không có admin CRM để tránh thêm SSR/quyền truy cập và
không đưa PII vào static HTML. Người được cấp quyền Cloudflare xem bằng D1
Dashboard hoặc Wrangler.

Danh sách tối thiểu, không in message/email/phone:

```bash
npx wrangler d1 execute tung-phat-leads --remote --command \
  "SELECT id,type,status,created_at FROM leads ORDER BY created_at DESC LIMIT 100"
```

Xem một yêu cầu chỉ trong terminal riêng tư:

```bash
npx wrangler d1 execute tung-phat-leads --remote --command \
  "SELECT * FROM leads WHERE id='COPY_ID_HERE' LIMIT 1"
```

Không dán output vào issue, chat hoặc CI log.

## Cập nhật trạng thái

Status hợp lệ: `new`, `contacted`, `quoted`, `won`, `lost`, `spam`, `archived`.

```bash
npx wrangler d1 execute tung-phat-leads --remote --command \
  "UPDATE leads SET status='contacted',updated_at=datetime('now') WHERE id='COPY_ID_HERE'"
```

Trigger ghi history. Kiểm tra:

```bash
npx wrangler d1 execute tung-phat-leads --remote --command \
  "SELECT from_status,to_status,changed_at FROM lead_status_history WHERE lead_id='COPY_ID_HERE' ORDER BY changed_at"
```

## Bảo vệ form

- Zod ở server; giới hạn độ dài và chuẩn hóa phone.
- Chỉ nhận cross-origin `POST` từ allowlist apex/`www`, JSON tối đa 20 KB.
- Honeypot trả thành công giả để bot không học rule.
- Turnstile kiểm server-side.
- Tối đa 5 lần/10 phút cho mỗi IP hash và loại form.
- `submission_id` unique chống double-click/retry.
- Prepared statement chống SQL injection.
- Không cho client đặt status; log không chứa phone/email/message.
- `IP_HASH_SALT` là secret ≥32 ký tự và khác giữa preview/production.

Không có gửi email/notification trong phiên bản này: yêu cầu được lưu D1 và phải
được nhân sự kiểm tra theo lịch. Đây là lựa chọn có chủ đích để không thêm dịch
vụ, secret và điểm lỗi. Có thể thêm notification Worker sau khi xác định kênh
miễn phí và quy trình bảo vệ PII.

## Backup, retention và xóa

Trước migration production:

```bash
npm run d1:backup
```

File nằm trong `backups/` và bị Git ignore vì có PII. Lưu bản mã hóa ở nơi chỉ
người có trách nhiệm truy cập. D1 Time Travel là lớp khôi phục ngắn hạn, không
thay export độc lập.

Rà dữ liệu không còn nhu cầu giao dịch sau 24 tháng; yêu cầu kế toán/pháp lý có
thể có thời hạn khác. Trước khi xóa theo yêu cầu, xác minh danh tính và phạm vi,
backup, rồi xóa đúng `id`—không dùng wildcard.

## Khi lỗi

- `503 service_unavailable`: kiểm `IP_HASH_SALT`.
- `503 verification_unavailable`: Siteverify/Turnstile secret đang không khả
  dụng; retry sau khi kiểm cấu hình.
- `500 internal_error`: kiểm D1 binding, migration và log theo request ID.
- `403 origin_rejected`: frontend origin không nằm trong allowlist.
- `429 rate_limited`: đợi 10 phút; không xóa rate limit để bỏ qua tấn công.
- `verification_failed`: kiểm hostname/site key/secret Turnstile.
- Duplicate trả `200`: submission đã được lưu, không tạo bản thứ hai.

Không log body request để điều tra. Dùng request ID, status code và timestamp.
