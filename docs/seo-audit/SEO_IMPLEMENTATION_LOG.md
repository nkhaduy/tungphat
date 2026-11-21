# Nhật ký triển khai và kiểm chứng

Audit tối 02/11 đến rạng sáng 03/11/2026, múi giờ Việt Nam. **Chỉ sửa local; không commit/push/deploy, không sửa DNS/NS/routing production, không viết D1/R2/CMS production.**

## Bảo toàn công việc có sẵn

Workspace đã có nhiều file modified/untracked trước audit, gồm homepage/navigation/catalogue và writing skill. Snapshot danh sách nằm trong `evidence/pre-existing-diff.txt`. Không reset, stash, đổi branch, merge hoặc stage toàn bộ workspace. `git fetch` xác nhận HEAD ahead origin/main 7, behind 0 nên không cần pull/merge vào cây làm việc đang dirty. Không coi mọi dòng trong `git diff` là thay đổi của audit.

Các lệnh verify chạy đồng bộ **đọc** globals/reviews về local và build/validate; không chạy supplier upload/sync/delete hay deployment. CMS integration chạy local development database; không migrate D1 production. Các giá trị local development dummy trong log không phải credential production.

## Source thay đổi trong audit

| File | Thay đổi riêng của audit | Nguyên nhân / phạm vi |
|---|---|---|
| `components/catalog/shared/SupplierCatalogSearch.tsx` | Bỏ `window.location.replace` ép supplier query; theo dõi `hasUrlFilters` từ URL tường minh; filter vẫn chèn noindex khi người dùng lọc | Canonical hub bị redirect + noindex sau hydration; giữ supplier Thanh Thuỳ mặc định và chức năng search |
| `app/catalogue/page.tsx` | Ba supplier-card href đổi từ query filter sang `/catalogue/{supplier}/` | Cung cấp đường HTML tới hub canonical và collections/codes; không thêm block keyword |
| `lib/site-content.ts` | Chỉ đổi `DEFAULT_CATALOGUE_URL` từ query Thanh Thuỳ sang `/catalogue/` | Đây là file untracked có sẵn từ công việc khác; giữ nguyên company description; navigation chung giờ trỏ canonical, UI vẫn mặc định Thanh Thuỳ |
| `lib/content-jsonld.ts` | Thêm predicate `isMaterialCollection`: guide hoặc một trong bốn material-family slugs | Availability “available” không biến một nhóm vật liệu thành SKU; không fake offer/rating |
| `components/content/ProductLanding.tsx` | Dùng cùng predicate để CollectionPage thay Product trên bốn family routes | Đường render thật trước đây tự dựng schema, không dùng helper test; sửa cả runtime chứ không chỉ helper |
| `scripts/validate-structured-data.mjs` | Expected family types thành CollectionPage; chặn Product xuất hiện cùng family collection | Tránh regression sau build; giữ validation JSON-LD/canonical hiện có |
| `tests/content-jsonld.test.ts` | Bốn regression cases family + giữ test Product cho individual SKU | Red: 4 fail/3 pass; green: 7 pass |
| `e2e/seo-indexability.spec.ts` | Ba browser/output regression tests | Canonical giữ index sau hydration, query thật noindex, provider hubs có anchor HTML, global nav tới canonical |

Không đổi robots policy, sitemap eligibility, title public hàng loạt, giá, tồn kho, capability hay production records. Không mass-noindex hay bỏ URL. Copy business hiện có được giữ nguyên; báo cáo keyword không phải nội dung đã publish.

## Trước và sau

| Kiểm tra | Trước | Sau local build |
|---|---|---|
| Mở `/catalogue/` trong browser | Tới `?supplier=thanh-thuy`; có meta index lẫn meta noindex | Giữ `/catalogue/`; không có meta noindex sau dữ liệu search load |
| Search `0330` | Filter URL và noindex | Vẫn filter URL và noindex; không mở index các query |
| Global nav | `/catalogue/?supplier=thanh-thuy` | `/catalogue/` |
| Supplier cards | Query-only targets | Ba hub canonical trong HTML gốc |
| Graph canonical sitemap từ homepage | 467/2.652 reachable; nhánh 2.185 An Cường tách | 2.652/2.652 reachable, max depth 4 |
| Material family schema | Product ở bốn trang; GSC đang bắt 3 invalid | CollectionPage, không thêm giá/rating/offer; trang vẫn indexable |
| Sitemap / generated HTML count | 2.652 / 3.580 | 2.652 / 3.580 |

Graph là sitemap-only, không phải mô phỏng toàn bộ Google crawl. Production chưa nhận bản sửa này.

## Lệnh và kết quả đã đọc

| Lệnh / bằng chứng | Kết quả |
|---|---|
| `npx vitest run tests/content-jsonld.test.ts --maxWorkers=2` trước sửa | 4 failed / 3 passed; `evidence/schema-red.log` |
| Cùng lệnh sau sửa | **7/7 pass**; `schema-green.log` |
| Playwright SEO trước sửa | Canonical bị chuyển query, provider link thiếu; global-nav test riêng cũng fail đúng nguyên nhân; logs `catalogue-red.log`, `navigation-red.log` |
| `npm run verify` sau các thay đổi cuối | **Exit 0**; `evidence/verify-final.log` |
| Frontend Vitest | **141 files / 722 tests pass** |
| Supplier test suite (chạy lại tập con theo project verify) | **44 files / 313 tests pass**; không cộng vào 722 như tests duy nhất |
| Payload integration | **9 files / 38 tests pass** |
| Lint, frontend/edge typechecks, CMS verify/dry-run | Pass trong full verify |
| Build | Pass; schema validator 3.579 index.html; internal-link validator 3.580 HTML (có thêm error HTML dạng file) |
| Link / sitemap validation | 243.239 links, 0 broken; sitemap 2.652 hợp lệ/self canonical/indexable |
| `npx playwright test e2e/seo-indexability.spec.ts --project=chromium --reporter=line` | **3/3 pass, 8,7s**, `catalogue-green.log` |
| `git diff --check` | Pass tại full verify và kiểm tra cuối |
| Lighthouse production `/go-ghep/`, mobile/desktop | Performance 93/95; A11y, Best Practices, SEO 100 trong hai runs; không coi là toàn-site certification |
| Screenshots xem trực tiếp | `catalogue-mobile-after.png` 390×844; `catalogue-desktop-after.png` 1440×1000; mặc định/filter UI và bố cục giữ nguyên |

`npm run verify` đã chạy lại khi đổi global catalogue constant sau lần build đầu. Không báo test local là production fix.

## Công cụ audit và dữ liệu mới

- `crawl.py`: GET read-only, tối đa 6 luồng; crawl toàn bộ sitemap, giữ HTTP/metadata/canonical/links/main text. Không gửi indexing requests hay upload.
- `build_inventory.py`: hợp nhất sitemap/crawl, local HTML, GSC samples/Performance/Inspection thành `URL_AUDIT.csv` và thống kê graph. Không mặc định “not indexed” khi một URL vắng trong export. Khi giữ evidence dưới dạng `.gz`, đọc qua gzip hoặc giải nén trước khi chạy lại.
- `URL_AUDIT.csv`: 3.646 URL; HTTP chưa fetch hoặc GSC chưa quan sát được ghi rõ; local-only rows không được mô tả là đã kiểm tra live.
- Sáu báo cáo yêu cầu, plan, GSC CSV gốc, observations, metrics/performance summary, chain checks, screenshots và logs trong `evidence/`.

Inventory trước khi bổ sung Inspection chi nhánh có 11 inspections, bản cuối có 12. Dữ liệu cuối phải dùng `inventory-summary.json` mới nhất.

## Hạn chế và rủi ro còn lại

1. Production `/catalogue/` vẫn có redirect/noindex JS cho tới khi deploy có chủ đích; script deploy mặc định hiện nhắm Cloudflare trong khi domain đang Vercel. Không chạy script đó trong audit.
2. Google Page Indexing trễ; export tối đa 1.000 Discovered / 1.000 page Performance. 239 Discovered không có URL-level sample. Không có full backlink/edge logs để quyết định hàng loạt legacy URLs.
3. Google Live Test `/go-ghep/` báo lỗi. Request Indexing An Cường thử một lần báo không gửi được. Rich Results Test production cao su cũng báo lỗi/kết nối reCAPTCHA. **Không có xác nhận Google queue/Google live rendered HTML/Rich Results Test pass**. Không bypass CAPTCHA, không lặp lại requests.
4. Local schema validation pass không đảm bảo rich result, index hoặc ranking. Chuyển family thành CollectionPage là sửa ngữ nghĩa; sẽ giảm Product enhancement errors sau recrawl, không tạo Product rich result.
5. Google có thể tiếp tục loại nhiều mã đúng kỹ thuật vì nhu cầu/giá trị/canonical lựa chọn nội bộ; chưa có bằng chứng để gán chắc nguyên nhân cho toàn bộ cohort.

## Runbook sau khi được phép phát hành

Review chính xác các hunks audit trong cây dirty; xác định Vercel frontend project `lmskis/tungphat`; giữ nguyên CMS/Cloudflare architecture. Chạy lại verify tại commit dự định release. Sau deploy, mở production `/catalogue/` và filter để kiểm tra URL/robots, GET ba supplier hubs, bốn family pages và sitemap. Kiểm tra graph/links và schema thật. Sau đó mới dùng GSC live test/Request Indexing một số URL quan trọng nếu Google hoạt động; quan sát Page Indexing và Performance theo thời gian, không yêu cầu lặp hằng ngày.
