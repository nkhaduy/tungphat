# Chuyển DNS Tùng Phát — bàn giao quyền thực hiện

**NOT READY TO DELETE VERCEL.** Tài khoản hiện có chỉ sửa bản ghi Tenten; tài khoản khác giữ quyền nameserver tại nhà đăng ký. Chưa thay đổi DNS đang có hiệu lực. CMS/CDN đã chạy độc lập trên Cloudflare; apex/www vẫn cần Vercel.

## Việc cần người giữ tài khoản đăng ký tên miền

Không cần giao mật khẩu, chuyển nhà đăng ký hoặc cấp quyền toàn tài khoản. Khi người phụ trách triển khai xác nhận sẵn sàng, người giữ tài khoản đổi bộ nameserver của `mdftungphat.com` từ ba máy Tenten sang đúng hai máy:

```text
lia.ns.cloudflare.com
nero.ns.cloudflare.com
```

Đây là thay đổi tại trang quản lý đăng ký tên miền, không phải thêm bản ghi NS vào bảng DNS. Nếu không liên hệ được người giữ tài khoản, chủ tên miền cần làm việc với Tenten để xin lại quyền quản lý. Không có phương án Pages apex Free được hỗ trợ đáp ứng nguyên yêu cầu hiện tại khi không có quyền đổi delegation. External DNS có thể dùng cho www, nhưng đổi canonical sang www và thêm dịch vụ HTTPS redirect cho apex là thay đổi phạm vi, chưa được chấp thuận.

## Cấu hình đã chuẩn bị

- Cloudflare account `b9ae472cee29c5729ee90ccbb3533f33`.
- Free zone `4cc9a59d98651da1950571a2bf07252e`, chưa delegated.
- Đã sao chép đủ6 bản ghi hiện hành, DNS-only/TTL600. Bản sao vẫn giữ origin Vercel cho apex/www để bước đổi NS tự nó không đồng thời đổi hosting.
- Frontend đích duy nhất: Pages `tungphat` / `tungphat-i9i.pages.dev`. Không gắn đồng thời apex/www vào Pages `tungphat-website` cũ.
- Zone gốc không cấu hình MX/SPF/DKIM/DMARC/CAA tại thời điểm sao lưu. Giữ nguyên mọi bản ghi mới phát sinh kể từ bản sao lưu.

Bản ghi sau cutover hosting đã xác minh:

| Tên | Loại | Đích | Proxy / TTL |
| --- | --- | --- | --- |
| @ | CNAME | tungphat-i9i.pages.dev | Proxied / Auto |
| www | CNAME | tungphat-i9i.pages.dev | Proxied / Auto |
| cms | CNAME | tungphat-light-cms-production.pages.dev | DNS-only /600 |
| cdn | CNAME | tungphat-light-cms-production.pages.dev | DNS-only /600 |
| baogia | CNAME | tungphat-quotes.pages.dev | DNS-only /600 |
| @ | TXT | Giữ nguyên Google verification trong bản sao lưu | DNS-only /600 |

Apex CNAME được Cloudflare flatten. Giá trị TXT chính xác và quy tắc www nằm trong [kế hoạch máy đọc được](evidence/cloudflare-zone-target-plan.json); snapshot đầy đủ ở [bản sao Tenten](evidence/tenten-zone-before.json).

## Trình tự phối hợp

1. Xác nhận staging/CI, CMS/auth/forms/media, Free limits và bản build GitHub mới đều đạt. Dùng revision/deployment trong báo cáo hiện tại; không dùng output cũ chưa kiểm tra.
2. Đưa revision đã kiểm tra qua quy trình release/main hiện có để tạo production deployment trên Pages `tungphat`; xác minh URL Cloudflare trước khi gắn tên miền. Giữ Vercel hoạt động trong quá trình chuyển.
3. Đối chiếu lại toàn bộ zone với Tenten trước delegation. Kiểm tra DS/DNSSEC tại registrar; xử lý delegation DNSSEC có chủ đích để tránh SERVFAIL. Người giữ tài khoản chỉ đổi NS khi người phụ trách triển khai đang phối hợp.
4. Chờ zone Active và xác minh apex, www, cms, cdn, baogia/TXT qua nameserver mới. Bước này vẫn giữ bản ghi origin cũ nên chưa chứng minh frontend đã chuyển hosting.
5. Kiểm tra Universal SSL/certificate và quyền hostname. Chỉ tháo đăng ký apex/www cũ của đúng dự án Tùng Phát nếu xung đột; gắn vào `tungphat` một lần. Áp dụng hai CNAME đích khi hostname/TLS sẵn sàng; SSL Full (strict), HTTPS bật.
6. Áp dụng redirect www→apex HTTP308, giữ nguyên path/query theo JSON đính kèm. Xác minh `https://www.mdftungphat.com/van-mdf/?audit=1` tới `https://mdftungphat.com/van-mdf/?audit=1`, không loop/hop phụ ngoài dự kiến.
7. Chạy lại toàn bộ crawl sitemap2,652URL, các route không index có ích, redirect/404, asset references, browser/API/CORS/auth, catalogue/search, desktop/mobile và mô phỏng chặn endpoint Vercel trên production. Đối chiếu DNS, Pages domain/deployment/bindings cùng HTTP; không chỉ nhìn response headers.
8. Kiểm chứng redeploy/rollback hoàn toàn trên Cloudflare, giữ backup độc lập và secret escrow. Sau khi production đạt mới gỡ cấu hình/integration Vercel của đúng dự án. Chủ dự án tự xóa Vercel khi báo cáo đổi trạng thái READY; không xóa tài khoản/dự án khác.

Nếu người giữ tài khoản chưa thể thao tác, dừng trước bước3. Không thay apex A sang IP Pages dùng chung hoặc dùng ALIAS để lách điều kiện apex. Tài liệu chính thức: [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
