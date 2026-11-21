# Technical SEO audit: production và build cục bộ

Phạm vi 02–03/11/2026. Bằng chứng raw: `evidence/production-initial.json`, `production-crawl.json`, `production-extra-crawl.json`, `redirect-chains.json`, `bot-simulation.json`, `local-before.json`, `local-after.json`, GSC exports và logs. File JSON lớn có thể được nén `.gz`; giải nén bằng `gzip -dc` trước khi đọc nếu cần. Không thay DNS, hosting, CMS hay dữ liệu production.

## 1. Môi trường thật

| Thành phần | Quan sát |
|---|---|
| Canonical origin | `https://mdftungphat.com`, không www, URL trang có slash |
| Frontend | Next.js **15.5.28**, React 19, `output: export`, `trailingSlash: true`; HTML có sẵn, không phụ thuộc SSR runtime |
| Frontend production | HTTP headers `Server: Vercel`, `X-Vercel-Cache: HIT/MISS`, Vercel edge SIN; **chưa cutover Cloudflare cho domain chính** |
| DNS read-only | A `216.198.79.1`; www CNAME `d69b5815ccf0cf8d.vercel-dns-017.com`; NS `ns-a1/a2/a3.tenten.vn` |
| CMS | `cms.mdftungphat.com` trả `Server: cloudflare`; root tới `/admin/login`; API public đọc được bằng Node fetch |
| Content | Payload API products/pages/articles/projects; build globals đồng bộ từ CMS; supplier catalogues trong `data/catalogs/` và adapters |
| Cấu hình migration | `wrangler.jsonc`, `public/_headers`, `public/_redirects`, Functions `/catalog/*`; `vercel.json` vẫn chứa media rewrite và legacy redirects. Script `deploy:site` trỏ Cloudflare không chứng minh domain thật đã chuyển |
| Repository | `codex/cloudflare-exit`, HEAD ban đầu `357bd71`; fetch origin: branch ahead main 7, behind 0; working tree có thay đổi từ trước được giữ nguyên |

Mẫu production homepage 292.129 byte, `/go-ghep/` 109.283 byte ở lần fetch đầu. Cache HTML `public,max-age=0,must-revalidate`, edge cache vẫn có HIT. Canonical/metadata/H1 production khớp local baseline ở các trang đã so; không khẳng định toàn bộ HTML byte-identical. Nội dung động reviews/build IDs và CMS có thể đổi giữa hai lần build.

## 2. Phát hiện đã đo và xử lý

| ID | Mức | Phát hiện / bằng chứng | Xử lý |
|---|---|---|---|
| SEO-01 | P0 | `/catalogue/` raw HTML indexable nhưng browser chuyển sang `?supplier=thanh-thuy` rồi thêm `noindex, follow` | Sửa hydration: mặc định UI không tạo filter URL/noindex; URL filter thực sự vẫn loại trừ |
| SEO-02 | P1 | Điều hướng chung tới filter; card nhà cung cấp chỉ tới filter. Nhánh An Cường có inbound trong nhánh nhưng không có đường từ homepage trong graph canonical sitemap | Global link về `/catalogue/`, cards về supplier hubs. Local graph reachable 467 → 2.652; không thêm SEO link farm |
| SEO-03 | P1 | GSC ba Product invalid; source bốn trang vật liệu dùng Product dù mô tả nhóm có nhiều quy cách | Dùng CollectionPage cho MDF, MDF chống ẩm, cao su, tràm; giữ Product cho SKU thật tương lai; không fake offers/reviews |
| SEO-04 | P1 | Hub An Cường vẫn noindex trong Google indexed-version từ 31/7; production hiện index | Sửa links hỗ trợ recrawl; một Request Indexing thất bại do Google. Không tuyên bố đã index |
| SEO-05 | P1/P2 | 19 GSC legacy 404 vẫn 404 hiện tại; cao su có đích tương đương rõ | Ghi mapping ứng viên và yêu cầu rà backlink/traffic. Không thay routing trong phiên |
| SEO-06 | P2 | Mobile Lighthouse LCP 3,3s, hero chưa có high fetch-priority hint, image delivery ước tiết kiệm 138KiB | Đề xuất kiểm tra ưu tiên request và responsive source qua trace; giữ chất lượng ảnh, chưa sửa ảnh/CSS đại trà |
| SEO-07 | P2 | 930/2.616 mã sitemap có main text <600 ký tự; descriptions duy nhất nhưng cấu trúc lặp | Chọn mẫu theo nhu cầu và facts để enrich; không lấy word count làm noindex rule |

Không có P0 robots/canonical/sitemap/5xx toàn site trong scope hiện có. Bot simulation chỉ thay User-Agent, không phải bằng chứng yêu cầu xuất phát từ IP Googlebot thật; GSC Crawl Stats cung cấp bằng chứng crawl thực bổ sung.

## 3. Robots, sitemap và canonical

- Production `/robots.txt` HTTP 200, cho `*` crawl `/`, chỉ chặn API/admin/preview và một số query search/sort; sitemap đúng origin. Không chặn nhóm sản phẩm chính. `/cms-preview/` bị chặn đúng mục đích, có header noindex; không phải trang cần phục hồi.
- Query rules dạng `/*?query=` không bao trùm mọi thứ tự tham số. Không coi robots là noindex; URL bị chặn có thể không cho Google thấy meta. Bộ lọc query riêng vẫn canonical về hub; không thay crawler policy diện rộng khi chưa có log crawl traps.
- Sitemap là một XML URL set: **2.652 URL / 469.832 byte** ở fetch đầu; hợp lệ, dưới giới hạn chia shard. 0 URL trùng, 0 canonical mismatch, 0 noindex HTML, 0 redirected sitemap URLs trong crawl. Không thêm 928 generated noindex URLs.
- `app/sitemap.ts` dùng ngày cập nhật record/CMS/source hoặc fallback static-settings, không gán ngày audit cho toàn site. Chưa xác minh mọi ngày phản ánh thay đổi nội dung đáng kể; fallback chung cần quản trị, không tạo ngày giả để ép recrawl.
- GSC sitemap: submitted 01/9, đọc thành công 29/10, 2.652 URLs. Một trường Inspection “temporary processing error” không lấn át kết quả XML và report sitemap thành công.
- HTTP root → HTTPS và www → non-www hoạt động. HTTP+www có hai bước. Nhiều URL thiếu slash hiện trả **200** và canonical tới phiên bản slash, khác category redirect lịch sử; `redirect-chains.json` giữ cả hai bằng chứng. Không đổi routing chỉ để nâng một chỉ số.
- Canonical trong metadata, sitemap và schema khớp cho mọi sitemap URL được fetch. Không staging host/noindex toàn site trong HTML gốc.

## 4. HTML tĩnh, rendered DOM và internal links

Audit toàn bộ sitemap: 2.652 có title/description/một H1; **0 nhóm title trùng, 0 nhóm description trùng**, JSON-LD parse errors 0, img thiếu thuộc tính alt 0. Những kết quả này chỉ là cấu trúc, không chứng minh copy tốt hay alt phù hợp thị giác ở mọi ảnh.

HTML gốc có nội dung chính, H1 và links. Hub catalogue load dữ liệu search bằng client; không nên dựa vào user search, infinite scroll hoặc việc click dropdown để Google khám phá sản phẩm. Các hub supplier và collection đã có link HTML tới mã, nên sửa đường đi tới hub giải quyết tại điểm nguồn.

Graph trước: 467/2.652 canonical sitemap URLs đi được từ homepage, max depth 4; 2.185 URL An Cường ở nhánh tách. Graph sau build: 2.652/2.652 đi được; depth 0:1, 1:40, 2:318, 3:164, 4:2.129. Phạm vi này chỉ đi trên cạnh `<a href>` chính xác giữa các canonical trong sitemap, **không mô phỏng toàn bộ Googlebot**. Parameter pages, nguồn ngoài, sitemap và noindex legacy pages có thể cung cấp discovery bổ sung. “Không có inbound từ bất kỳ trang nào” khác “không đi được từ trang chủ”.

Build link validator sau sửa: 3.580 HTML, 243.239 internal links, 213.374 quan hệ, 3.069 targets; 0 broken, 0 alias redirect links, 0 thiếu slash theo chính sách validator. Đây là local output, không phải crawl production sau deploy.

## 5. Content, on-page và search intent

CMS public trả sáu material landings, hai service pages, ba articles, không project đã publish. Cao su/tràm có availability field `available`, nhưng không có bằng chứng tồn kho realtime. Không xuất bản giá, độ dày, phân hạng hay lời hứa giao hàng từ dữ liệu đối thủ.

Trang gỗ ghép đã có hub, trang cao su/tràm, bài “gỗ ghép là gì”, CTA, breadcrumbs và links giữa nhóm. Không tạo thêm trang riêng cho mỗi cách viết “gỗ ghép thanh/ván gỗ ghép/gỗ ghép TP.HCM”. Metadata local hiện dùng Thủ Đức, phù hợp business address; chưa có đủ query sample để kết luận nên thay toàn bộ title theo TP.HCM. `/go-ghep/` CTR 8,67% trong 150 impressions là baseline tốt nhưng nhỏ.

MDF/MFC/HDF/plywood cần tách rõ cốt, nhóm ván và bề mặt; không tự coi mọi biến thể có sẵn. Category/catalogue mã không tự đại diện tồn kho của Tùng Phát. Các body vật liệu hiện có phần hướng dẫn hỏi hàng khá chung; dữ liệu quy cách thực tế, ảnh tấm/lô và ứng dụng được xác nhận sẽ hữu ích hơn thêm keyword filler.

## 6. Structured data

Các schema hiện có gồm business entity, WebSite/WebPage, BreadcrumbList, Service, Article, CollectionPage và một số Product/FAQ cũ theo template. Source không cho phép fabricated price/review/availability. Bốn material family pages được chuyển sang CollectionPage; không canonicalize chúng về một category khác. Service và Article giữ nguyên.

`validate-structured-data.mjs` parse **3.579 index.html documents**, kiểm tra schema URLs, các trường bị cấm và expected types; được bổ sung chặn Product trên family pages. Unit test 4 trường hợp family thất bại trước, qua sau; future individual SKU vẫn Product. Đã đối chiếu các kiểu và thuộc tính với tài liệu [CollectionPage](https://schema.org/CollectionPage) và [BreadcrumbList](https://schema.org/BreadcrumbList). Đây không phải chứng chỉ toàn bộ Schema.org hay xác nhận Google rich result. GSC đang là bằng chứng Google chẩn đoán Product thiếu required fields; Rich Results Test sau phát hành vẫn cần kiểm tra Breadcrumb và sự biến mất của Product không phù hợp.

Không hứa FAQ rich results. Không thêm rating dù SERP địa phương có review thật vì không có quy trình dữ liệu/eligibility tương ứng trên trang này.

## 7. CWV, tốc độ và caching

| Điều kiện | Mobile lab | Desktop lab |
|---|---:|---:|
| URL | `/go-ghep/` | `/go-ghep/` |
| Lighthouse | 13.6.0, default simulated mobile throttling | 13.6.0, desktop preset |
| Performance | 93 | 95 |
| Accessibility / Best practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 |
| LCP | 3,3s | 1,5s |
| CLS | 0 | 0 |
| TBT | 0ms | 0ms |
| Document server response | 30ms trong run | 30ms trong run |

Một run mỗi device, từ máy audit; có noise/caching. Đây không phải percentile field, không phải cam kết mọi URL có điểm này. TBT không đo INP. GSC CrUX cập nhật 01/11: desktop 412 good / 0 needs improvement / 0 poor; mobile không đủ dữ liệu, không thể kết luận mobile field pass.

LCP insight chỉ tới ảnh `wood-panels.webp`: discoverable trong HTML, không lazy nhưng thiếu high fetch priority hint. Đề xuất trace request trước khi chỉnh preload/fetchPriority; thử responsive derivatives với ảnh vẫn đủ rõ. Không giảm chất lượng toàn bộ ảnh. Font tự host/preload, hero có aspect ratio; CLS lab 0. Chưa có p75 TTFB/INP theo route.

Build JS budget pass: shared 351.450 B, homepage 422.406 B, reference center 444.626 B, catalogue 436.314 B parsed; dưới budget cấu hình. Không có đo before/after hợp lệ để tuyên bố giảm JS bao nhiêu.

## 8. Entity, local và AI readiness

Business identity trong settings/footer/contact nhất quán: Công ty TNHH TMDV Gỗ Tùng Phát, 0909 259 160, hai địa chỉ công bố 14 Tam Bình và 81B Tam Bình, phường Hiệp Bình, TP.HCM. Maps place IDs có trong dữ liệu, không tạo chi nhánh mới. Google SERP cá nhân hóa ở TP.HCM cho “gỗ ghép”/“ván gỗ ghép” hiển thị Tùng Phát 1 tại 14 Tam Bình và số điện thoại đúng; **không coi đây là local rank trung lập hoặc toàn thành phố**. Không sửa GBP.

`/llms.txt` đã có, HTTP 200, nội dung thận trọng, links canonical tới dịch vụ/material reference và contact. `/llms-full.txt` trả 404 ở kiểm tra cuối; không cần tạo chỉ để đáp ứng checklist. Không cần tạo bản dài hoặc cơ chế AI riêng để thay thế HTML. [Google AI features](https://developers.google.com/search/docs/appearance/ai-features) nêu không cần special optimization; llms.txt không tạo lợi thế ranking/visibility trên Google. File chỉ là hỗ trợ hệ thống có sử dụng nó.

Property thực sự có báo cáo AI tạo sinh thử nghiệm: **6.356 impressions**, 01/8–31/10; Melamine An Cường 472, homepage 186, bài file CNC 87. Chỉ có impressions trong report được quan sát; không suy clicks hoặc tổng citation ChatGPT/Gemini, không cộng gộp với Web impressions khi chưa biết overlap.

## 9. Kiểm thử, giới hạn, việc còn lại

`npm run verify` exit 0; unit/integration/typechecks/build/supplier validation/link/sitemap/schema/budgets pass. Playwright SEO 3/3 pass. Đã xem screenshots catalogue ở 390×844 và 1440×1000, giao diện/selection mặc định giữ nguyên. Không claim audit accessibility toàn site từ screenshots hay Lighthouse một trang.

Chưa có edge request logs để xác minh từng IP Googlebot; không truy xuất toàn bộ backlink equity; không xác nhận mọi trường kỹ thuật CMS từ supplier source; không có local field performance. Live Test/Request Indexing của Google bị lỗi; không có Google-rendered live HTML. Production hiện vẫn chứa lỗi catalogue vì **owner yêu cầu không tự deploy**. Đợt phát hành cần chọn đúng frontend Vercel đang phục vụ domain, không chạy mù `deploy:site` đang trỏ Cloudflare.

Baseline kỹ thuật: [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [crawl troubleshooting](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors), [Product snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), [Page Indexing report](https://support.google.com/webmasters/answer/7440203). Kết quả JSON parse hợp lệ khác rich-result eligibility và khác indexability.
