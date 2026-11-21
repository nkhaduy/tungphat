> **Cập nhật 03/11/2026:** Chủ website đã phê duyệt; release af7de2c đã phát hành lúc 09:31:10 giờ Việt Nam. Production acceptance PASS, không rollback. Xem [DEPLOYMENT_RESULT.md](DEPLOYMENT_RESULT.md) và [GSC_POST_RELEASE.md](GSC_POST_RELEASE.md). Phần chuẩn bị bên dưới là snapshot lịch sử. Trạng thái máy đọc hiện tại: `deployment-result.json`; `release-package.json` giữ snapshot trước deploy.

# Phát hành Vercel và rollback — chờ chủ website xác nhận

**Không chạy các lệnh deploy/promote/rollback dưới đây trong phiên chuẩn bị.** Chủ website đã yêu cầu chưa deploy khi chưa xác nhận. Không đổi DNS, domain assignment thủ công, Cloudflare routing hay dữ liệu CMS.

## Target đã xác minh

- Domain chính: `https://mdftungphat.com`; Vercel scope/team `lmskis`, project `tungphat`, ID `prj_53zuxv2QpKkGB1QUzltzj5I7a4mO`.
- Deployment đang phục vụ trước release: `dpl_6r18bisWh8RAWcg4gDee9MPS7Juf`, URL `https://tungphat-1g4kb76x2-lmskis.vercel.app`. Alias có domain chính và www. Nguồn CLI, không có Git SHA để suy ra commit từ production.
- Đây là **static artifact**, deployment-level framework/build/install `null`, outputDirectory `.`. Project default Next.js không đại diện cách deployment này được tạo. `evidence/vercel-static-config.json` trích config thật, gồm redirects, `/catalog/*` rewrite đến CMS và security/cache headers.
- `npm run deploy:site` hiện trỏ **Cloudflare**. Không dùng lệnh này hay `deploy:cloudflare` cho domain chính. Giữ CMS Cloudflare Worker/Pages/D1/R2 nguyên trạng.

## Artifact đã chuẩn bị

Thư mục: `/Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat/work/seo-release-vercel`.

Nội dung là `out/` đã verify, loại `_headers`, `_redirects`, `_routes.json`, `_worker.js` chỉ dành Cloudflare; giữ nguyên `vercel.json` từ production. Giữ public `indexnow-key.txt` từ artifact đang live; không in nội dung hay commit key. Không chứa source, node_modules, .env hoặc .vercel credentials. Website build vẫn được phép dùng postbuild cũ để validate, nhưng đường deploy cuối chỉ Vercel static này.

`vercel deploy ... --dry --json --project tungphat --scope lmskis` đã chạy **không deploy**, detect framework Other, slug null. Chi tiết số file/bytes trong evidence dry-run; hash từng file tại `release-artifact-manifest.json`, archive/hash trong `release-package.json`. Thay đổi bất kỳ artifact file nào phải verify/hash lại trước phát hành.

## Trước khi chủ website chấp thuận

Review commit SEO so baseline, source patch và readiness. Xác nhận dùng artifact đã hash, scope/project và thời điểm thực hiện. Nội dung gỗ ghép/Melamine là đợt sau, không gộp vào release kỹ thuật. Không push branch lên pipeline không rõ hành vi.

## Sau khi có xác nhận deploy

1. Kiểm tra domain vẫn trỏ đúng deployment baseline; nếu có release khác kể từ lúc chuẩn bị, **dừng promote**, đối chiếu diff/public content để không ghi đè cập nhật mới. Chạy lại `npm run verify` nếu rebuild source. Nếu chỉ dùng archive frozen, kiểm tra SHA và manifest. Refresh GSC baseline theo MEASUREMENT_PLAN.

```sh
npx --yes vercel@65.10.0 inspect https://mdftungphat.com --scope lmskis --json
```

2. Tạo deployment static ở đúng project nhưng **chưa gắn domain**. Lệnh dưới đây là thao tác phát hành, hiện CHƯA chạy:

```sh
npx --yes vercel@65.10.0 deploy /Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat/work/seo-release-vercel --project prj_53zuxv2QpKkGB1QUzltzj5I7a4mO --scope lmskis --prod --skip-domain --archive=tgz
```

Lưu URL/ID mới và inspect deployment. Xác nhận framework Other/static, build/install null, output `.` và config redirects/headers/rewrite giữ nguyên. Test URL deployment trước promote; nếu Vercel protection chặn, dùng cơ chế authorized của Vercel, không đưa bypass secret vào log hay tắt bảo vệ để test. Không nhầm access protection của preview với Googlebot bị chặn trên domain chính.

3. Khi deployment mới pass acceptance, promote đúng URL mới (thay token chữ dưới đây bằng URL thật đã ghi nhận):

```sh
npx --yes vercel@65.10.0 promote REPLACE_WITH_NEW_DEPLOYMENT_URL --scope lmskis
```

Không thay domain bằng Cloudflare cutover. Vercel promote sử dụng routing sẵn của project; chỉ thực hiện trong phạm vi chấp thuận release của owner.

## Acceptance production ngay sau promote

Thực hiện trên **mdftungphat.com**, không chỉ deployment URL/local:

- `vercel inspect` xác nhận aliases sang ID mới; HTTPS/non-www và legacy redirects vẫn như trước, không chain/loop mới.
- GET `/`, `/catalogue/`, ba supplier hubs, `/catalogue/an-cuong/melamine/`, hai chi nhánh Tam Bình, ba gỗ ghép và codes trong WATCHLIST: HTTP 200, một H1/canonical đúng; không X-Robots/meta noindex ngoài ý muốn.
- Browser desktop/mobile: `/catalogue/` giữ URL sau hydration, mặc định Thanh Thuỳ; không meta noindex. Chọn supplier/search → filter URL noindex/follow, canonical hub; Back/Forward đúng. Exact codes MS465SC04, BT99, 0029 vẫn mở đúng trang sau chọn hãng.
- Bốn family routes `/van-mdf/`, `/mdf-chong-am/`, `/go-ghep-cao-su/`, `/go-ghep-tram/`: CollectionPage, không Product/Offer giả. Code pages phù hợp vẫn có schema hiện hữu. Kiểm tra JSON-LD parse và schema phù hợp nội dung.
- Sitemap XML 2.652 URL, canonical/indexable, robots byte tương ứng artifact; không cache bản cũ gây noindex. Các filter query không vào sitemap.
- Assets CSS/JS, ảnh catalogue từ CDN/CMS và legacy `/catalog/*` rewrite không lỗi. Navigation, Zalo/call, CMS admin redirects còn đúng; không gửi lead thử lên production để test.
- Lưu response/HTML/screenshots, thời gian, deployment ID. Chỉ sau đó ghi “production fix verified”. GSC index status chỉ cập nhật khi có Inspection/report mới, không dựa local PASS.

Có thể chạy bộ SEO e2e với `PLAYWRIGHT_BASE_URL=https://mdftungphat.com`; chỉ chọn các test đọc/tương tác frontend. Không chạy toàn suite có API submission vào production. Test local `robots...` không thay thế kiểm tra Vercel redirect/headers thực tế.

## Rollback

Rollback khi xuất hiện regression P0 do release: canonical hub noindex/redirect sai, search/navigation hỏng, route/asset critical 4xx/5xx, hoặc mất rewrite CMS/media. Ghi bằng chứng và ID mới trước rollback. Ranking dao động/GSC chưa recrawl không phải trigger rollback.

Sau khi owner cho phép xử lý release/rollback, dùng deployment trước đã xác minh:

```sh
npx --yes vercel@65.10.0 rollback https://tungphat-1g4kb76x2-lmskis.vercel.app --scope lmskis --yes
```

Nếu đã có deployment production khác sau baseline, chọn ID ngay trước lần promote thực tế, không dùng mù ID trong báo cáo. Rollback CLI syntax đã đọc help; quyền/điều kiện rollback thực tế chưa thử bằng mutation. Giữ archive artifact trước làm phương án redeploy dự phòng chỉ khi được cho phép. Không xóa deployment/resources và không rollback D1/R2 vì release này không ghi dữ liệu backend.

Sau rollback: inspect aliases; mở domain chính, search, liên hệ, sitemap và media; ghi Trollback trong measurement log. Không chạy git reset trên working tree của chủ website.
