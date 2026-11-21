# Kết quả phát hành SEO production — 03/11/2026

**SUCCESS — production đã nhận đúng gói `af7de2c`, kiểm tra sau promote PASS; không rollback.** Không phát hành đợt nội dung gỗ ghép hoặc Melamine An Cường. Không thay CMS/D1/R2/DNS hoặc cấu hình Cloudflare. Không push git, không rebuild từ working tree gốc.

## Deployment và thời điểm

- Vercel scope/project: **`lmskis/tungphat`**, project `prj_53zuxv2QpKkGB1QUzltzj5I7a4mO`.
- Deployment mới: **`dpl_Evtrh3JBPekkiKqSwtmKB7sUY5zG`**.
- URL deployment: https://tungphat-7o3cu8abq-lmskis.vercel.app (Vercel Authentication được giữ nguyên).
- Production: **https://mdftungphat.com**.
- Promote/alias assigned: **03/11/2026 09:31:10, giờ Việt Nam** (02:31:10 UTC), lấy từ Vercel project production target/alias metadata.
- Deployment hợp lệ ngay trước promote: `dpl_6r18bisWh8RAWcg4gDee9MPS7Juf`, https://tungphat-1g4kb76x2-lmskis.vercel.app. Giữ làm rollback target cho lần release này.
- Source commit: `af7de2c20374ebdb138f72028fda643e109a218e`; baseline cách ly `e923022`.

`deployment-result.json` chứa machine-readable outcome. Domain alias API `/v4/aliases/mdftungphat.com` xác nhận deployment ID mới, đồng thời project production target và inspect domain trùng ID. Trường `deployment.alias` rỗng sau promote không được dùng làm bằng chứng domain chưa gắn: resource alias của domain mới là đối chiếu trực tiếp. Evidence: `domain-alias-confirmation.json`, `production-inspect.json`, `production-aliases-final.json`.

## Gate trước phát hành

Baseline ID vẫn đúng ở đầu phiên, trước archive upload và **ngay trước promote**. Không có production release khác chưa đối chiếu. Archive SHA256 **`7cf59e23bc2d0e232a32435480f408ee4f721d198bba8dd6981804d420e059ef`** khớp; **7.314 files** khớp manifest toàn bộ trước upload, trước promote và sau release. Source tracked sạch tại commit đã duyệt; tracked diff của `/Users/khaduy/tungphat` vẫn byte-identical snapshot đầu phiên.

Deploy static artifact bằng CLI đúng scope/project, `--prod --skip-domain --archive=tgz`; không chạy Next build trên Vercel. Deployment READY với framework/build/install null, outputDirectory `.`; chưa có aliases trong giai đoạn acceptance. `vercel.json`, redirects, headers và media rewrite được giữ nguyên từ artifact production trước.

Chủ website đã phê duyệt cụ thể production release và rollback nếu regression trong cuộc trò chuyện ngày 03/11. Chỉ promote sau khi mọi acceptance gate bên dưới pass; `promotion-gates.json` ghi thời điểm và điều kiện.

## Acceptance trước và sau promote

| Kiểm tra | Deployment chưa gắn domain | Domain production public |
|---|---:|---:|
| 29 URL WATCHLIST HTTP/canonical/robots/H1/JSON-LD | PASS | PASS |
| HTML 29 URL so artifact đã duyệt | Byte-identical | Byte-identical |
| CSS/JS từ các trang kiểm tra | 24 PASS | 24 PASS |
| Redirect/admin/preview/404 + media/CDN | 12 PASS | 12 PASS |
| Playwright Chrome | **16/16, 46,8s** | **16/16, 46,2s** |
| Sitemap XML | 2.652 URLs, unique, byte-identical | 2.652 URLs, unique, byte-identical |
| robots.txt | Byte-identical artifact | Byte-identical artifact |
| HTTP→HTTPS và www→non-www | Config giữ nguyên | Hai kiểm tra đều 308 đúng canonical |
| Visual review | 390/1440 px | 390/1440 px, screenshots được lưu |

Các browser tests bao gồm default catalogue giữ URL sau hydration; canonical không có noindex; filter tường minh noindex/follow và canonical hub; supplier switch, exact code An Cường/Ba Thanh/Thanh Thuỳ, Back/Forward; main routes H1/canonical/console; breadcrumbs/images/overflow; mobile menu; supplier hubs, search/sentinel và scroll desktop/tablet/mobile. Không chạy các API submission tests trên production, không tạo lead thử.

Bốn family routes `/van-mdf/`, `/mdf-chong-am/`, `/go-ghep-cao-su/`, `/go-ghep-tram/` có CollectionPage, không Product giả. Catalogue SKU pages giữ schema phù hợp hiện có. Supplier anchors hiện hữu trong initial HTML, global navigation tới `/catalogue/`. CSS/JS và ba swatch CDN/legacy `/catalog/*` rewrite trả 200; CMS admin redirects giữ đúng.

23/24 CSS/JS resources byte-identical. Một webpack runtime giữ toàn bộ artifact nguyên vẹn làm prefix, được Vercel nối đúng đoạn Toolbar opt-in `__vercel_toolbar=1`, tải `vercel.live`, có deployment ID mới. Harness kiểm tra riêng chữ ký đoạn nối này; không bỏ qua mọi hash mismatch. Đây là biến đổi nền tảng, không phải source hoặc content change.

Đây là kiểm tra release có phạm vi rõ, không phải tuyên bố đã crawl lại toàn site production hay chứng nhận không thể có lỗi ngoài mẫu. Full static validation và full verify của artifact vẫn được bảo toàn bằng manifest. Không có P0/P1 regression do release được quan sát; **không chạy rollback**.

## Các vướng mắc đã xử lý

1. Upload từng file bị Hobby `api-upload-free` giới hạn hơn 5.000 requests, chưa tạo deployment thành công. Đổi **transport** sang `--archive=tgz` theo đề xuất CLI; không đổi artifact, không trả phí/nâng gói và không thay routing. Runbook được cập nhật cờ này.
2. Harness ban đầu thiếu SameSite cho Playwright request fixture; Python cookie jar không đọc cookie HttpOnly trong môi trường hiện tại. Đã dùng cookie phiên được cấp bởi **`vercel curl`**, chỉ gắn vào đúng host deployment, không tắt Deployment Protection. Credential/cookie không lưu trong docs.
3. HTTP harness được sửa decode đường dẫn `%5Bslug%5D` khi đối chiếu file local, duyệt schema arrays/@graph, và nhận diện chính xác Toolbar trailer. Một assert ban đầu kỳ vọng `deployment.alias` chứa domain đã được thay bằng xác minh resource alias trực tiếp. Tất cả là logic kiểm tra, không chỉnh source/artifact để vượt gate.
4. GSC Request Indexing một lần cho catalogue thất bại ở dịch vụ reCAPTCHA. Không có xác nhận queue, không lặp request hay giải/vượt CAPTCHA. Hai Google Live Tests riêng vẫn thành công; chi tiết tại GSC_POST_RELEASE.md.

## Google Search Console

GSC đăng nhập hoạt động. Đã refresh baseline 28 ngày: report vẫn kết thúc **31/10**, chưa có traffic hậu release. Đã kiểm tra indexed-version các URL ưu tiên và Live Test catalogue/An Cường. **Live eligibility không phải indexed status mới.** Tổng Page Indexing cũ không được gắn nhãn số hiện tại.

Xem `GSC_POST_RELEASE.md` và `evidence/deployment/gsc-t0-observations.json`. Chưa có bằng chứng Googlebot thông thường đã recrawl sau T0 và cập nhật indexed-version của tất cả các bản sửa, chưa có bằng chứng tăng traffic/ranking.

## Theo dõi sau T0

| Mốc | Ngày Việt Nam | Trọng tâm |
|---|---|---|
| 7 ngày | **10/11/2026** | 29 URL/critical flows; last crawl mới, canonical/noindex, sitemap fetch; không kết luận traffic từ tuần đầu |
| 14 ngày | **17/11/2026** | GSC cohort catalogue/code/gỗ ghép/local; ghi URL chưa recrawl; so 14 ngày hoàn chỉnh cùng ngày tuần |
| 30 ngày | **03/12/2026** | Cửa sổ 28 ngày trước/sau, query × page, country/device, CTR theo position/query mix; leads nếu đã đo hợp lệ |
| 60 ngày | **02/01/2027** | Visibility/clicks/URLs giá trị có bằng chứng indexed; quyết định nội dung tiếp theo dựa dữ liệu |

Dùng WATCHLIST.csv (29 URL), GSC_BASELINE.csv và MEASUREMENT_PLAN.md. Các ngày trên là kế hoạch, **không có automation/cron mới được tạo**. Nội dung gỗ ghép/Melamine đề xuất tiếp tục ở đợt riêng khi được duyệt; không gộp vào lần phát hành này.

## Bằng chứng

Thư mục `evidence/deployment/`: artifact preflight, inspect baseline/candidate/production, promotion gates/result, domain alias confirmation, HTTP JSON/logs, 16 browser tests mỗi giai đoạn, routing/media/host checks, raw production HTML/robots/sitemap gzip, response headers, screenshots và test harness không chứa cookie. Các logs lỗi harness đầu được giữ với tên riêng để giải thích quá trình kiểm tra.
