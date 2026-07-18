# Backup và khôi phục

## Ma trận backup

| Thành phần | Bản chính | Backup/khôi phục |
|---|---|---|
| Code/content/ảnh | GitHub `main` | Git history, clone/mirror riêng định kỳ |
| Pages static | deployment theo commit | rollback deployment hoặc revert commit |
| D1 leads | D1 production | export mã hóa + D1 Time Travel ngắn hạn |
| OAuth config | Worker config + secrets | password manager, rotate/redeploy |
| DNS/Access | Cloudflare account | export/chụp cấu hình trước cutover |
| Vercel fallback | project hiện tại | giữ hoạt động trong giai đoạn chuyển đổi |

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

1. Xác định commit lỗi trong GitHub/Pages.
2. Pages Dashboard → deployment tốt gần nhất → **Rollback to this deployment**
   để phục hồi nhanh.
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
  `GITHUB_OAUTH_SECRET` và `OAUTH_STATE_SECRET`, redeploy Worker, kiểm collaborator.
- Access khóa nhầm: sửa đúng application `/admin/*`; không bỏ GitHub OAuth.
- Tài khoản quản trị bị lộ: remove ở GitHub và Access, revoke OAuth grant, kiểm
  commit bất thường và revert trên `main`.

## Quay lại Vercel

Trước cutover Cloudflare, chụp và lưu:

- record DNS apex/www hiện tại;
- project/domain Vercel;
- environment variables;
- commit deployment cuối đã biết tốt;
- TTL và thời điểm thay đổi.

Nếu Pages lỗi nghiêm trọng:

1. Thử rollback Pages deployment trước.
2. Nếu vẫn lỗi, build cùng commit đã biết tốt trên Vercel.
3. Xác minh Vercel deployment qua URL preview nhưng canonical vẫn là
   `https://mdftungphat.com`.
4. Khôi phục DNS chính xác theo bản ghi đã lưu; chờ TTL.
5. Giữ redirect www → apex, HTTPS và domain canonical.
6. Kiểm tra site/form/SEO, rồi mới đóng incident.

Vercel Hobby không phù hợp để coi là hosting doanh nghiệp miễn phí lâu dài; đây
chỉ là đường quay lại tạm thời nếu project hiện tại còn hợp lệ. Nếu cần vận hành
thương mại dài hạn trên Vercel, phải xem lại plan và chi phí tại thời điểm đó.

## Tiêu chí phục hồi hoàn tất

- Public site trả 200, slideshow và menu hoạt động.
- Form mới được lưu đúng database, không mất/nhân đôi lead.
- `/admin` cần Access rồi GitHub OAuth.
- Canonical/sitemap/robots chỉ dùng `https://mdftungphat.com`.
- Không có secret/PII trong Git, log hoặc artifact công khai.
- Incident, commit rollback, thời điểm và người xác nhận được ghi nội bộ.
