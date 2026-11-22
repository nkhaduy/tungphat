> **Cập nhật 03/11/2026:** Chủ website đã phê duyệt; release af7de2c đã phát hành lúc 09:31:10 giờ Việt Nam. Production acceptance PASS, không rollback. Xem [DEPLOYMENT_RESULT.md](DEPLOYMENT_RESULT.md) và [GSC_POST_RELEASE.md](GSC_POST_RELEASE.md). Phần chuẩn bị bên dưới là snapshot lịch sử. Trạng thái máy đọc hiện tại: `deployment-result.json`; `release-package.json` giữ snapshot trước deploy.

# SEO release — sẵn sàng phát hành có kiểm soát

03/11/2026. **READY FOR OWNER APPROVAL — chưa deploy, chưa push, chưa thay routing/DNS/CMS production.** Phần còn lại là xác nhận của chủ website, deployment không gắn domain trước, kiểm tra rồi promote và xác minh domain chính. Chưa thể đánh dấu production acceptance hay Google recrawl/index recovery PASS trước các bước đó.

## Gói cần review

Branch cách ly `codex/seo-release-20261103` tại `/Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat`.

- Baseline đã đối chiếu production: `e923022`.
- SEO commit: `af7de2c20374ebdb138f72028fda643e109a218e` — đúng **8 files**, không trộn thay đổi mới của chủ website.
- Patch: `seo-release.patch`; manifest/archive path/hash: `release-package.json`.
- Static artifact: `work/seo-release-vercel`; archive `work/tungphat-seo-release-20261103.tgz` (88.686.923 bytes), SHA256 `7cf59e23bc2d0e232a32435480f408ee4f721d198bba8dd6981804d420e059ef`.

Archive nằm ngoài git, không bị đưa source/env vào deployment. Không triển khai trực tiếp repository root và không dùng `npm run deploy:site` vì script đó trỏ Cloudflare.

## Chính xác những thay đổi SEO

| File | Delta cần phát hành |
|---|---|
| `app/catalogue/page.tsx` | Ba supplier card anchor chuyển query filter → hub canonical |
| `components/catalog/shared/SupplierCatalogSearch.tsx` | Bỏ JS redirect mặc định; noindex dựa filter thật trong URL, giữ default Thanh Thuỳ và search/history |
| `lib/site-content.ts` | Global catalogue navigation tới `/catalogue/` |
| `lib/content-jsonld.ts` | Predicate chung cho bốn material families là CollectionPage |
| `components/content/ProductLanding.tsx` | Dùng predicate trong đường render JSON-LD thật |
| `scripts/validate-structured-data.mjs` | Validator chặn Product giả trên family pages |
| `tests/content-jsonld.test.ts` | Regression family CollectionPage, giữ individual Product case |
| `e2e/seo-indexability.spec.ts` | 6 browser/HTML tests: canonical hydration, explicit filter, supplier links, global nav, search ba hãng, Back/Forward, mobile/desktop |

Chỉ năm runtime/source files ảnh hưởng frontend build; validator/test đi cùng source release để giữ guardrails, không được public như app source. `vercel.json` trong artifact được giữ **byte-identical** từ deployment đang live (framework/build/install null, outputDirectory `.`, redirects/headers/CMS media rewrite cũ). Không cần đổi project default, nameservers, DNS hoặc Cloudflare.

## Target production đã xác minh hai lần

Vercel `lmskis/tungphat`, project ID `prj_53zuxv2QpKkGB1QUzltzj5I7a4mO`. Domain `mdftungphat.com` vẫn alias deployment **`dpl_6r18bisWh8RAWcg4gDee9MPS7Juf`**, `tungphat-1g4kb76x2-lmskis.vercel.app`, READY production. CLI static source, không có Git SHA. Evidence `vercel-live.json`, `vercel-live-final.json`, deployment details và config.

## Kết quả kiểm tra release hiện tại

| Gate | Kết quả / evidence |
|---|---|
| `npm run verify` trong worktree | **Exit 0**, `evidence/release-verify.log`; lint, frontend/edge typecheck, CMS verify/build/dry-run, build, link/sitemap/schema, diff whitespace |
| Frontend Vitest | **141 files / 722 tests pass** |
| Supplier subset trong verify | 44 files / 313 pass; subset của suite, không cộng thành 1.035 unique tests |
| CMS integration local | **9 files / 38 tests pass**; không ghi production |
| SEO Playwright | **6/6 pass**, 11,2s, Chrome; local riêng port 4175, không reuse server ở repository khác |
| Existing Playwright journeys chọn đúng phạm vi | **10/10 pass**, 12,9s: 29 main routes H1/canonical/console, representative breadcrumbs/images/overflow, mobile menu, robots/sitemap/404, supplier hubs/search/sentinel và scroll desktop/tablet/mobile |
| Lint sau khi mở rộng e2e | Exit 0, `release-lint-final.log` |
| Sitemap | **2.652** eligible self-canonical/indexable; byte-identical production baseline |
| Internal links | **3.580 HTML / 243.239 links**, 0 broken/redirect/HTTP 4xx–5xx/trailing-slash lỗi trong static validation |
| JSON-LD | **3.579 index HTML documents pass**; có thêm error HTML dạng file làm tổng link crawl 3.580 |
| Catalogue output | 2.930 pages, 2.621 indexable/309 noindex, 0 invalid JSON-LD/brand mismatch/orphan indexable theo validator template |
| Semantic production → release | **3.580/3.580** title/description/canonical/robots/H1/main text giữ nguyên; links thay trên 3.579 HTML vì global nav; schema chỉ đổi ở bốn family routes |
| URL inventory / assets | Không thêm/xóa HTML route; 95 public assets cùng checksum; sitemap/robots/vercel config không đổi |
| Vercel static dry run | Exit 0, framework **Other / slug null**, 7.315 entries gồm một directory entry; manifest có **7.314 files**. Chưa upload/deploy |
| Visual review | Đã xem screenshots catalogue 390px và 1440px; giữ layout/filter/default hãng; tests không tràn ngang, exact code ba hãng/history PASS |
| Bảo toàn công việc gốc | Tracked diff `/Users/khaduy/tungphat` byte-identical snapshot đầu phiên; không stage/reset/stash original tree |

Không chạy toàn bộ mọi Playwright spec; đã chạy 16 tests tập trung release và shared routes. Không dùng lab/local checks thay acceptance Vercel production. Lần baseline verify đầu lỗi dependency symlink Sharp ở CMS đã giải quyết bằng dependency copy local; lần baseline đầy đủ và release đầy đủ sau đó exit 0, không sửa production hoặc app để vượt lỗi.

## Rủi ro thực tế và cách giới hạn

Rủi ro code/data thấp: delta nhỏ, không đổi DB/CMS/schema database hay mass-noindex, giữ routes/content/assets. **Không bảo đảm zero risk**: deployment static phải đủ HTML/RSC/JS đồng bộ; cache, Vercel routing và cấu hình domain chỉ kiểm chứng dứt điểm sau phát hành. Dùng artifact đã hash, deployment chưa gắn domain, kiểm tra rồi promote; rollback về deployment trước nếu regression P0.

Rủi ro vận hành lớn hơn code: root scripts vẫn trỏ Cloudflare, project default Next.js khác static deployment thật, và branch baseline bao gồm công việc có sẵn đã live. Runbook ghi rõ artifact-only deploy, đúng project/scope; không cherry-pick mù patch lên main thiếu context. Nếu production có release mới sau snapshot, phải reconcile trước promote.

## Kỳ vọng sau deploy

- Canonical `/catalogue/` giữ index eligibility sau hydration; filter query vẫn noindex, không mở crawl trap.
- Navigation và supplier anchor giúp crawler tìm hub An Cường/Thanh Thuỳ/Ba Thanh từ HTML gốc; tiếp tục xuống collections/mã.
- Bốn family pages có schema đúng loại; Product enhancement cũ chỉ có thể thay đổi sau Google recrawl, không tạo rich result mới bằng giá giả.
- Giữ nguyên sitemap 2.652 và các mã có giá trị, không đánh đổi content/URL equity để tăng tỷ lệ index.

Không tuyên bố Google đã index hoặc ranking tăng. GSC audit cho thấy indexed 1.403 / excluded 1.572 ở snapshot 23/10; không có Page Indexing/Inspection mới chứng minh phục hồi sau release vì release chưa diễn ra.

## Nội dung và đo lường đã chuẩn bị

- `CONTENT_PROPOSALS.md`: drafts metadata/khối buyer-information cho ba gỗ ghép, bằng chứng ba ordering steps và hai FAQ tràm bị lặp; ưu tiên sửa nội dung này trong đợt riêng sau owner review.
- `MELAMINE_OPPORTUNITY.md`: export exact page mới; 53 clicks/9.013 impressions, 100 queries chỉ phủ 14,27% impressions. Query bảng màu thường position 32–59, không quy CTR thấp chỉ cho title. Đề xuất copy, search/swatches theo dữ liệu và bảo toàn exact-code pages.
- `WATCHLIST.csv`: **29 URL**; `GSC_BASELINE.csv`: **60 rows**, có scope/period/coverage, absent không coi zero.
- `MEASUREMENT_PLAN.md`: T0 và 7/14/30/60 ngày; baseline mới trước promote; đối chiếu query/device/country; không tự tạo cron monitoring.

**Cần owner xác nhận:** cho phép phát hành artifact/commit này lên đúng Vercel project và thời điểm; duyệt nội dung riêng trước publish; cung cấp quy cách/ảnh/giá có điều kiện nếu muốn bổ sung thông tin mua hàng. Lý do còn chờ deploy là yêu cầu trực tiếp “Chưa deploy khi chưa có xác nhận của tôi”.
