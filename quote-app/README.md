# BÁO GIÁ TÙNG PHÁT

Ứng dụng lập báo giá nội bộ cho `baogia.mdftungphat.com`. Ứng dụng nằm độc lập
trong `quote-app/`, không thay đổi cơ chế static export hoặc deployment của
website chính `mdftungphat.com`.

## Kiến trúc

- React 19 + Vite: SPA đăng nhập, editor dạng spreadsheet và dashboard admin.
- Hono trên Cloudflare Worker runtime: API, session, phân quyền và tạo PDF.
- Cloudflare D1: người dùng, chi nhánh, khách hàng dùng chung, báo giá, dòng sản phẩm, phiên bản PDF,
  audit log, session, rate limit và settings.
- Cloudflare R2 private: PDF phiên bản và logo tùy chỉnh.
- Cloudflare Pages Advanced Mode: phương án production ưu tiên vì DNS hiện ở
  TenTen; subdomain dùng CNAME mà không cần chuyển nameserver.
- `pdf-lib` + Noto Sans: PDF A4 tiếng Việt được tạo hoàn toàn ở server.

Mọi API báo giá và file PDF đều yêu cầu session. Employee chỉ đọc/sửa bản ghi
có `created_by` là chính mình; Admin có quyền toàn hệ thống. Client không được
quyết định tổng tiền, trạng thái hoặc URL QR.

## Database migration

Các migration hiện tại nằm trong `migrations/` và được áp dụng theo thứ tự.
`0001_initial.sql` là schema baseline; `0002_quote_integrity.sql` nâng cấp
database đã từng chạy baseline mà không làm mất dữ liệu.

Các bảng nghiệp vụ bắt buộc:

- `users`
- `branches`
- `quotes`
- `quote_items`
- `quote_versions`
- `audit_logs`
- `settings`
- `customers`

Các bảng hạ tầng bổ sung:

- `sessions`
- `login_attempts`
- `quote_counters`

Không có thao tác xóa cứng trong API. Admin xóa báo giá bằng soft-delete (`deleted_at`),
giữ nguyên version PDF và audit; báo giá dùng trạng thái `CANCELLED`, tài
khoản/chi nhánh dùng `is_active`, các dòng thay thế được đánh dấu `deleted_at`.

## Biến môi trường

Secret duy nhất bắt buộc:

```text
SESSION_SECRET=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
```

Biến không bí mật nằm trong `wrangler.jsonc` (Pages) và
`wrangler.worker.jsonc` (Vite/Worker local):

```text
ENVIRONMENT=production
APP_ORIGIN=https://baogia.mdftungphat.com
TIMEZONE=Asia/Ho_Chi_Minh
```

Không commit `.dev.vars`. File `.dev.vars.example` chỉ là mẫu.

## Chạy local

```bash
cd quote-app
npm install
cp .dev.vars.example .dev.vars
npm run d1:migrate:local
```

Tạo admin local mà không đưa mật khẩu vào source code:

```bash
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
export ADMIN_USERNAME=admin
export ADMIN_FULL_NAME="Quản trị Tùng Phát"
npm run admin:create
unset ADMIN_PASSWORD
```

Chạy Vite + Worker local:

```bash
npm run dev
```

Mở `http://localhost:5173`. Nếu dùng bản build Pages:

```bash
npm run preview:pages
```

## Chuẩn bị Cloudflare production

Chưa có lệnh nào dưới đây được chạy cho production.

1. Tạo resource:

```bash
npx wrangler d1 create tung-phat-quotes
npx wrangler r2 bucket create tung-phat-quotes-pdf
npx wrangler pages project create tungphat-quotes --production-branch main
```

2. Cập nhật `database_id` trong `wrangler.jsonc` và `wrangler.worker.jsonc`
   bằng UUID D1 vừa tạo, rồi xác minh lại binding trước khi deploy.

3. Cấu hình secret qua prompt bảo mật:

```bash
npx wrangler pages secret put SESSION_SECRET --project-name tungphat-quotes
```

4. Chạy migration và tạo admin production:

```bash
npm run d1:migrate:remote
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
export ADMIN_USERNAME=admin
export ADMIN_FULL_NAME="Quản trị Tùng Phát"
npm run admin:create -- --remote
unset ADMIN_PASSWORD
```

5. Khi được phép deploy:

```bash
npm run deploy:pages
```

## Gắn `baogia.mdftungphat.com`

Vì nameserver hiện vẫn ở TenTen, dùng Pages custom subdomain thay vì Worker
Custom Domain (Worker Custom Domain yêu cầu một Cloudflare zone active).

1. Cloudflare Dashboard → Workers & Pages → `tungphat-quotes` → Custom domains.
2. Chọn **Set up a domain**, nhập `baogia.mdftungphat.com` và hoàn tất bước xác nhận.
3. Tại TenTen tạo DNS record:

```text
Type: CNAME
Name: baogia
Target: tungphat-quotes.pages.dev
```

Phải thêm custom domain trong Cloudflare Dashboard trước khi chỉ tạo CNAME;
nếu chỉ tạo CNAME thủ công, Pages có thể trả lỗi 522. Không thay đổi record apex,
`www`, `cms`, nameserver hoặc DNSSEC của website hiện tại.

## Quality gate

```bash
npm run lint
npm run typecheck
npm test
npm run build:pages
npx wrangler deploy --dry-run --config wrangler.worker.jsonc
```

Test bao phủ phép tính, số lượng thập phân, paste grid, tiền cọc/còn lại, định dạng
và tính duy nhất của mã theo counter, VietQR có kiểm soát nguồn ảnh, quyền
Employee/Admin, PDF có asset, PDF nhiều trang, ẩn QR khi đã thanh toán đủ và
snapshot PDF cũ không đổi khi settings thay đổi.

## Màn hình

- `/login`: logo, tên hệ thống, username/password và thông báo lỗi đăng nhập.
- `/bao-gia`: danh sách báo giá thuộc nhân viên đang đăng nhập.
- `/bao-gia/moi`: thông tin khách hàng, grid nhập liệu bằng bàn phím/dán Excel,
  autosave, tổng tiền sticky và các nút lưu/xem trước/PDF/in.
- `/bao-gia/:id`: bản xem trước nội bộ, VietQR hoặc trạng thái đã thanh toán đủ,
  lịch sử PDF và nút tải file qua route có session.
- `/admin`: KPI hôm nay, tiền cọc/còn lại, nháp/hủy và top nhân viên.
- `/admin/bao-gia`: bảng toàn hệ thống với đầy đủ bộ lọc.
- `/admin/nhan-vien`: tạo, sửa, khóa tài khoản và reset mật khẩu.
- `/admin/chi-nhanh`: tạo, sửa và khóa chi nhánh.
- `/admin/cai-dat`: công ty, logo, ngân hàng và ghi chú mặc định.
- `/admin/lich-su`: audit log đăng nhập và thay đổi dữ liệu.

## Quy ước mã báo giá

Mã dùng `TP14-DDMMYY-STT` hoặc `TP81-DDMMYY-STT`:

- Tùng Phát 1 — `TP14` — 14 Tam Bình, Hiệp Bình, TP.HCM — Mr. Tùng: 0909 259 160
- Tùng Phát 2 — `TP81` — 81B Tam Bình, Hiệp Bình, TP.HCM — Mr. Tùng: 0909 259 160

Ví dụ ngày 22/07/2026: `TP81-220726-001`. `quote_counters` cấp số bằng một câu
lệnh SQLite `UPSERT ... RETURNING`, nên hai request đồng thời không nhận cùng số.
