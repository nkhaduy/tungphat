# Backup và khôi phục

## Ma trận backup

| Thành phần | Bản chính | Backup/khôi phục |
|---|---|---|
| Code/content/ảnh | GitHub `main` | Git history, clone/mirror riêng định kỳ |
| Website Vercel | deployment theo commit | rollback deployment hoặc revert commit |
| Cloudflare CMS | Pages deployment | rollback Pages deployment |
| D1 leads | D1 production | export mã hóa + D1 Time Travel ngắn hạn |
| OAuth config | Pages Functions + secrets | password manager, rotate/redeploy |
| DNS | TenTen + Pages custom domain | ghi lại chính xác ba record đang dùng |

## Backup định kỳ

Hàng tuần và trước mọi migration:

```bash
git fetch origin
git bundle create tung-phat-YYYY-MM-DD.bundle --all
npm run d1:backup
```

Không lưu D1 export trong Git. Mã hóa file và lưu ở hai nơi do người có trách
nhiệm kiểm soát. Hàng tháng, thử đọc Git bundle và import D1 export vào database
test; backup chưa thử restore chưa được coi là hoàn chỉnh.

## Rollback nội dung/code

1. Xác định commit lỗi trong GitHub/Vercel.
2. Vercel Dashboard → deployment tốt gần nhất → **Promote to Production** để
   phục hồi nhanh.
3. Trên `main`, chạy `git revert <commit>`.
4. Chạy toàn bộ quality gate, rồi push `main`; không force-push.
5. Với một bài, khôi phục riêng file content/ảnh, chạy gate và commit vào `main`.

Kiểm homepage, slideshow, menu mobile, money pages, forms, canonical, sitemap,
robots, manifest và 404 sau rollback.

## Khôi phục D1

Migration là forward-only. Nếu lỗi nhỏ, tạo migration sửa tiếp và test preview.
Nếu database hỏng:

1. Chặn tạm form ở edge hoặc chuyển CTA sang điện thoại/Zalo.
2. Xác định thời điểm tốt bằng D1 Time Travel hoặc export gần nhất.
3. Tạo database mới, ví dụ `tung-phat-leads-recovery-YYYYMMDD`.
4. Import export vào database mới; chạy truy vấn đếm/spot-check không in PII.
5. Bind Preview vào database recovery và smoke test.
6. Sau phê duyệt, đổi binding Production `DB`; giữ database cũ read-only cho tới
   khi đối soát xong.

Không trỏ Preview vào production và không commit export.

## Sự cố CMS/OAuth/Access

- OAuth lỗi không làm website public ngừng chạy; kỹ thuật có thể sửa nội dung
  trực tiếp trên `main` sau khi chạy quality gate.
- Secret lộ: revoke GitHub OAuth client secret, tạo secret mới, rotate
  `GITHUB_OAUTH_SECRET` và `OAUTH_STATE_SECRET`, redeploy Pages CMS, kiểm
  collaborator.
- OAuth/allowlist khóa nhầm: kỹ thuật vẫn có thể sửa trực tiếp trên `main`; sửa
  Pages secret/variable rồi redeploy CMS.
- Tài khoản quản trị bị lộ: remove ở GitHub và OAuth allowlist, revoke OAuth
  grant, kiểm commit bất thường và revert trên `main`.

## Khi Cloudflare CMS/API lỗi

Website public trên Vercel vẫn hoạt động. Rollback Pages CMS deployment trước;
nếu form API còn lỗi, chuyển CTA tạm sang hotline/Zalo và không đổi DNS
apex/`www`. Canonical vẫn là `https://mdftungphat.com`.

## Tiêu chí phục hồi hoàn tất

- Public site trả 200, slideshow và menu hoạt động.
- Form mới được lưu đúng database, không mất/nhân đôi lead.
- `/admin` redirect 308 tới CMS; publish cần GitHub OAuth và allowlist email.
- Canonical/sitemap/robots chỉ dùng `https://mdftungphat.com`.
- Không có secret/PII trong Git, log hoặc artifact công khai.
- Incident, commit rollback, thời điểm và người xác nhận được ghi nội bộ.
