# Audit nội dung, hình ảnh và SEO — 13/11/2026

## Phạm vi và cách đọc

- `URL_AUDIT.csv` liệt kê 2.664 URL trong sitemap production tại thời điểm quét. `production-crawl.json.gz` giữ tín hiệu HTTP/HTML thu thập bằng `docs/seo-audit/crawl.py` (6 luồng, chỉ đọc). Báo cáo này là ảnh chụp production **trước** thay đổi local. Không đại diện cho trạng thái sau triển khai.
- 2.664 URL trả HTTP 200; title và description đều có mặt và khác nhau trong tập sitemap; mỗi URL có một H1, canonical khớp sau chuẩn hóa dấu `/`, không thấy `noindex`, và JSON-LD nhúng được parser đọc không báo lỗi cú pháp. Đây là kiểm tra HTML thô, không xác nhận Google lập chỉ mục, tính chính xác schema hoặc Core Web Vitals.
- 2.664 trang có ít nhất một ảnh không có đủ thuộc tính `width` và `height` trong HTML; nhiều ảnh có thể đã được giữ chỗ bằng CSS. Cần kiểm tra từng template và đo CLS trước khi coi đó là lỗi hiển thị. Không phát hiện ảnh thiếu **thuộc tính** alt trong HTML; điều này không chứng minh alt đúng hay ảnh tải thành công.
- Đồ thị liên kết chỉ dựa trên liên kết HTML giữa các URL sitemap; không phát hiện URL không có inbound trong đồ thị này. Không suy ra độ sâu hợp lý hay không có trang mồ côi ngoài sitemap. `docs/seo-audit/URL_AUDIT.csv` là kiểm kê lịch sử rộng hơn, gồm cả URL ngoài sitemap và mẫu GSC; cần xác minh lại trước khi xử lý.
- Điểm SEO là phép kiểm kỹ thuật cơ bản: bắt đầu 10, trừ 2 nếu thiếu title, 2 nếu thiếu description, 1 nếu số H1 khác một, 2 nếu canonical khác/thiếu, 2 nếu noindex, 1 nếu JSON-LD không parse. Điểm 10 chỉ nói các tín hiệu đó đạt; không phải đánh giá toàn diện. Content đã chấm 21 URL dựa trên nội dung production đã đọc; visual chấm 10 URL đã có căn cứ xem ảnh/bố cục. Các ô chưa đủ bằng chứng ghi “Chưa chấm”. Điểm là nhận định ưu tiên, lý do nằm ngay trong từng dòng; không dùng độ dài làm thước đo chất lượng.
- P0: URL lỗi/ngăn truy cập nghiêm trọng. P1: trang ưu tiên cần biên tập hoặc lỗi SEO cơ bản. P2: cần xem riêng, kiểm chứng hoặc cải thiện sau. Bảng không khẳng định đã xem từng ảnh, nội dung, hay trạng thái tương tác của từng mã.

## Nghiên cứu và nguyên tắc nguồn

[Thanh Thùy — Acrylic](https://www.gothanhthuy.com/products/acrylic/) hữu ích ở cách phân loại dòng và đưa hình sản phẩm; không dùng văn bản hay thông số của họ làm mô tả chung. [An Cường — Matte Acrylic](https://ancuong.com/acrylic/tam-matte-acrylic.html) xác nhận có dòng mặt mờ, chỉ cho dòng đó. [Ba Thanh — ván phủ Melamine](https://bathanh.com.vn/map-ma-melamine/van-phu-keo-melamine) mô tả phủ trên ván nền. Nguồn kỹ thuật khác ở ngay trong nội dung sửa và `docs/product-system/technical-sources.md`. Không suy ra giá, hàng còn, tiêu chuẩn, xuất xứ hoặc quan hệ độc quyền.

## Content change log — local, chưa xuất bản

| URL | Trước / sau | Cần xác minh |
| --- | --- | --- |
| `/acrylic/` | Đoạn giới thiệu chung → giải thích lớp phủ và ván nền, mặt bóng/mờ, cạnh, bảng so sánh và vệ sinh; thêm nguồn. | Quy cách, chỉ cạnh, mã thực tế và tài liệu từng dòng; nguồn ảnh hiện có chưa xác nhận bản chất ảnh chụp. |
| `/van-mdf/` | Các đoạn cấu tạo/ứng dụng ngắn → thêm tải và khoảng đỡ, bảng yêu cầu đặt ván, phân biệt ván nền/bề mặt, nguồn. | Dòng hàng và tài liệu theo nhà sản xuất. |
| `/mdf-chong-am/` | Bổ sung ví dụ vị trí ẩm, điểm có thể bị nước rò và liên kết bài so sánh. | Cấp sử dụng theo từng dòng. |
| `/melamine/` | Bổ sung cách chọn đồng thời mã màu, ván nền và chỉ cạnh; liên kết MFC. | Mẫu màu, số mặt phủ và hàng thực tế. |
| `/laminate/` | Bổ sung phân biệt tấm phủ/ván hoàn thiện, nền, keo, cạnh và gia công cong. | Quy trình và giới hạn theo mã; không áp thông số chéo. |
| `/van-plywood/` | Bổ sung đọc cạnh, giới hạn quan sát và cách xác nhận loại keo/cấp sử dụng. | Hãng, loại keo và cấp sử dụng của tấm cụ thể. |
| `/bai-viet/mdf-thuong-va-chong-am/` | So sánh chung → bảng theo vị trí, ví dụ kệ sách/khoang chậu, giải thích màu lõi và hai ảnh có chú thích. | Tài liệu vật tư cho công trình cụ thể. |
| `/bai-viet/chuan-bi-file-cnc/` | Checklist hiện có → thêm ví dụ cánh tủ, điểm chuẩn, mặt gia công và kiểm tra file. | Quy ước file, khả năng máy và sai số thực tế; chưa có sơ đồ đã duyệt. |
| `/bai-viet/go-ghep-la-gi/` | Hướng dẫn chung → thêm so sánh mặt bàn/cánh tủ và lưu ý độ ẩm, nguồn USDA. | Ảnh cận mối ghép, loại gỗ và nguồn/quyền. |

Ba ví dụ trước/sau: Acrylic trước nói chủ yếu về hiệu ứng bóng, nay giải thích các bộ phận cần chọn và rủi ro vết xước; bài MDF trước đã cảnh báo ẩm không phải nước nhưng nay dùng hai tình huống cụ thể và ảnh đối chiếu; Plywood trước đã mô tả lớp gỗ nhưng nay nói rõ quan sát cạnh không chứng minh loại keo hoặc cấp ngoài trời.

## Image asset report

| Tệp | Nguồn / chủ sở hữu | Quyền và giới hạn | Dùng / alt / tối ưu |
| --- | --- | --- | --- |
| `public/sanpham-media/van-mdf.webp` | `sanpham-media/vanmdf.webp`, ảnh người dùng cung cấp theo `data/product-media.json` | Manifest ghi đã được người dùng xác nhận dùng thương mại. | Tái sử dụng trong bài MDF, alt mô tả các tấm MDF mộc; WebP responsive 400/800/890, lazy, có kích thước và khung tỷ lệ. |
| `public/sanpham-media/mdf-chong-am.webp` | `sanpham-media/mdfchongam.jpg`, ảnh người dùng cung cấp theo manifest | Manifest ghi đã được người dùng xác nhận dùng thương mại; màu lõi không chứng minh cấp ván khác. | Tái sử dụng trong bài MDF, alt mô tả một mẫu có mặt phủ; WebP responsive 400/800/1200, lazy, có kích thước và khung tỷ lệ. |
| `public/images/editorial/acrylic-kitchen-ai-1200.webp` và `acrylic-kitchen-ai-640.webp` | AI tạo bằng công cụ imagegen; bản gốc `assets/acrylic-kitchen-ai-original.png` | Ảnh tổng hợp minh họa, không phải ảnh hàng, mã hay công trình thực tế. | Đặt ở `/acrylic/` cạnh phần phản chiếu; alt và caption ghi AI; WebP 640×427 (19.8 KB) và 1200×800 (47.8 KB), lazy, có kích thước và srcset. |
| `public/sanpham-media/acrylic.webp` | [Thanh Thùy](https://www.gothanhthuy.com/acrylic-la-gi/), bản gốc `sanpham-media/sources/acrylic.jpg` | Manifest ghi có xác nhận dùng thương mại trước đó; chưa xác minh độc lập là ảnh chụp hay ảnh dựng, không đại diện cho mã hàng cụ thể. | Ảnh đang có của trang Acrylic, WebP responsive; không thêm hay thay thế ảnh trong nhiệm vụ này. |

Prompt ảnh AI: “Create a photorealistic editorial illustration for a Vietnamese wood materials educational article: a modest, plausible contemporary kitchen with simple flat-front off-white high-gloss cabinet doors, viewed at a slight angle in natural daylight so reflections and subtle fingerprints on one door are visible. Neutral surroundings, realistic cabinetry and edge details, natural restrained commercial photography. This is a generic conceptual illustration, not a real Tùng Phát project or a particular manufacturer's product, no logos, no text, no labels, no people, no identifiable brand or SKU. Landscape composition.” Công cụ: imagegen tích hợp; bản gốc giữ tại thư mục assets của báo cáo.

Chưa tải ảnh nhà cung cấp mới. Cần ảnh có quyền và đối chiếu đúng SKU cho cạnh Acrylic, cấu tạo Plywood, mặt/mối ghép gỗ và bản vẽ CNC. Không coi quan hệ đối tác là giấy phép tự động. Metadata và ảnh gốc của tài sản đang dùng nằm trong `data/product-media.json` và `docs/product-system/media-table.md`.

## SEO, kỹ thuật và việc còn lại

- Giữ nguyên URL, canonical, sitemap, redirect, chức năng catalogue, mã màu và dữ liệu kinh doanh. Metadata mô tả Acrylic được cải thiện trong local; metadata MDF còn phụ thuộc `getLocalSeoCopy` và cần xem output thực tế. Bài viết giữ metadata đang có. Liên kết ngữ cảnh được bổ sung.
- Article override đặt ở frontend, CMS vẫn quyết định xuất bản. Khi biên tập viên sửa ba bài trong CMS, nội dung override/bổ sung phía frontend cần được cập nhật hoặc chuyển lại về CMS có kiểm soát; tránh hai nguồn nội dung bất đồng.
- Hai mươi mốt URL có thay đổi local (9 URL trong bảng và 12 URL được bổ sung ở phần cập nhật bên dưới), cùng copy trong component tìm kiếm catalogue dùng chung. Các trang khác và 2.600+ mã catalogue mới chỉ được quét tín hiệu HTML; chưa có cơ sở tuyên bố full content/visual overhaul hoặc toàn bộ tab được audit thủ công. Không có số liệu search demand/GSC mới để khẳng định chủ đề mới có nhu cầu; các đề tài nên nghiên cứu tiếp gồm chọn chỉ cạnh theo mặt ván, cách đọc nhãn MDF và bản vẽ khoan bản lề.
- Audit static output của dự án ghi nhận `/du-an/` là 1 trang indexable không có inbound tương đối trong HTML local; phép quét production/sitemap ở trên không phát hiện trường hợp đó. Cần kiểm tra khác biệt điều hướng giữa local và production trước khi sửa liên kết.
- Nên kiểm tra có hệ thống từng template mã catalogue ở desktop/mobile, ảnh tải thực, quyền ảnh, liên kết ngoài sitemap, cannibalization dựa trên GSC và đo Lighthouse/CrUX. Chưa đo CWV/field data. Không tự thêm giá, hàng, chứng nhận hoặc sửa cấu trúc SEO khi chưa có bằng chứng.
- Code: `lib/content-overhaul.ts`, `lib/content.ts`, `lib/product-editorial.ts`, `data/product-intros.json`, `components/content/ArticleLanding.tsx`, `components/content/MarkdownContent.tsx`, `components/products/MaterialLanding.tsx`, `tests/content-overhaul.test.ts`. Không thêm dependency; không thay đổi CMS production. Các file đã bẩn từ trước được giữ và sửa tại chỗ có chọn lọc.

## Kiểm thử đã chạy

- `npm run verify` trong bản sao tạm của workspace: exit 0 sau thay đổi ảnh AI. Gồm lint, typecheck, 740 test frontend, 313 test catalogue, 38 test tích hợp CMS, build frontend/CMS, Cloudflare `--dry-run`, kiểm tra sitemap, JSON-LD và liên kết. `--dry-run` không triển khai. Build báo các ảnh legacy lớn; báo cáo kiểm tra ảnh không chặn build.
- Static output: 3.592 trang HTML được kiểm tra liên kết; 258.050 liên kết nội bộ được kiểm tra, không ghi nhận target lỗi trong lượt chạy. Sitemap output: 2.664 URL hợp lệ. JSON-LD: 3.591 HTML qua kiểm tra của script dự án; kết quả không thay cho kiểm định mọi thuộc tính chuyên ngành.
- Kiểm tra trực quan `/acrylic/`, `/van-mdf/` và bài MDF tại local; 390px không thấy tràn ngang ở các trang đã kiểm tra, ảnh so sánh MDF tải; ảnh AI hiển thị với caption và srcset mobile. Đây không phải kiểm thử mọi thiết bị, alt hay ảnh trên toàn site.
- Một lần `verify` đã vô tình khởi chạy ở repository chính và được ngắt tại build CMS. Các file globals trong `content/` đối chiếu giống bản sao trước lượt chạy; báo cáo Ba Thanh bị đổi timestamp được khôi phục từ bản sao. Báo cáo validation An Cường được ghi lại và vẫn trùng nội dung Git. Không chạy upload, sync media, commit, push hoặc deploy.

- Playwright ban đầu: 53/57 kịch bản đạt; hai kiểm tra axe báo tương phản liên kết nội dung và hai kiểm tra chờ nhãn “Mã màu / Catalogue” cũ, trong khi giao diện working tree hiển thị “Mã màu”. Đã đổi màu liên kết prose sang tông đậm hơn; lượt axe độc lập trên local và hai kiểm thử Playwright chạy lại trên bản build sau sửa ở 390 và 1440 px đều không trả vi phạm serious/critical. Không đổi nhãn giao diện đang được chỉnh sửa.

## Cập nhật tiếp — 13/11/2026

Đã kiểm tra thêm 925 URL ngoài sitemap: 374 URL qua hai lớp liên kết HTML production và 551 URL còn lại từ route HTML của bản build local. Cả 925 trả HTTP cuối 200 và có `noindex`; không ghi nhận chuyển sang URL khác sau chuẩn hóa dấu gạch chéo. Trong 551 URL lấy từ build, 144 URL `/ma-mau-melamine/ba-thanh/` có canonical trỏ sang mã tương ứng dưới `/catalogue/ba-thanh/melamine/`; cần kiểm tra tương đương từng mã trước khi đề xuất đổi chính sách. Chi tiết: `URL_AUDIT_NGOAI_SITEMAP.csv`, dữ liệu gốc `production-linked-extra.json.gz` và `production-build-routes-extra.json.gz`. Tổng cộng đã kiểm tra 3.589 URL, không bao gồm mọi URL có tham số, API hay trang không được phát hiện. Không thay đổi `noindex`, canonical hay redirect.

| URL | Vấn đề trước | Bổ sung local | Còn cần kiểm tra |
| --- | --- | --- | --- |
| `/catalogue/` | Câu giới thiệu khẳng định chung ảnh nguồn đã xác minh, trong khi hồ sơ quyền từng ảnh chưa đối chiếu đầy đủ | Đổi thành hướng dẫn xem mẫu và nguồn; không thay mã/ảnh | Kiểm tra nguồn, quyền và ánh xạ từng SKU |
| `/gia-cong-cnc/` | Hero và phần bản vẽ lặp một ảnh máy | Thay ảnh lặp bằng sơ đồ, dẫn tới bài chuẩn bị file CNC | Ảnh quy trình đúng quyền, khả năng máy và sai số thực tế |
| `/van-hdf/` | Mô tả nhóm ván nhưng ít tiêu chí chọn | Phân biệt tấm nền với sản phẩm hoàn thiện và hỏi hồ sơ tấm | Dòng HDF và thông số thực tế |
| `/van-okal/` | Ít chỉ dẫn cho cạnh, liên kết | Hỏi vị trí vít, tải và số mặt phủ | Tài liệu đúng dòng ván |
| `/van-mfc/` | Cần biết cách nhận đúng ván nền khi xem màu | Hướng dẫn phân biệt MDF phủ Melamine và xem nhãn | Mẫu màu, cốt và chỉ cạnh |
| `/plywood-phu-melamine/` | Chưa nêu rõ kiểm tra cạnh và loại keo | Tách yêu cầu nền, mặt phủ và cạnh lộ | Ảnh cạnh và hồ sơ keo đúng tấm |
| `/go-ghep-cao-su/` | Thiếu ví dụ ảnh hưởng độ ẩm đến liên kết | Bổ sung lựa chọn mặt và liên kết bài đọc | Ảnh mối ghép, mặt cạnh |
| `/go-ghep-tram/` | Chưa có ảnh đúng loại được xác nhận | Bổ sung hướng dẫn hỏi mẫu, tải và liên kết | Ảnh tràm đúng vật liệu, nguồn và quyền |
| `/tam-veneer/` | Cần làm rõ ghi chiều vân trước khi chia tấm | Bổ sung mặt nhìn thấy và yêu cầu hoàn thiện | Mẫu hoàn thiện và nguồn ảnh cận |
| `/pvc-film-pet/` | Thiếu ví dụ về cánh rãnh, bo | Bổ sung câu hỏi gia công theo đúng dòng màng | Khả năng gia công từng dòng |
| `/van-nhua-pvc/` | Cần xem cả hệ phụ kiện và liên kết | Bổ sung các điểm kiểm tra tải, vít, nhiệt và nước | Chỉ tiêu từng loại tấm |
| `/chi-nep-nhua/` | Thiếu hướng dẫn đánh dấu cạnh cắt | Bổ sung cách ghi cạnh và đối chiếu mẫu ván | Loại chỉ, keo và khả năng dán cạnh cong |

Bài `/bai-viet/chuan-bi-file-cnc/` có thêm sơ đồ SVG do Codex tự vẽ, không theo tỉ lệ, minh họa đường bao, lỗ, rãnh, cạnh chuẩn và thông tin kích thước. Sơ đồ có chú thích, alt, kích thước và vùng cuộn ngang dùng được bằng bàn phím; không mô tả năng lực hay sai số của máy. Kiểm tra tại 390 và 1440 px: ảnh tải, không tràn ngang toàn trang; vùng sơ đồ cuộn được ở 390 px.

Bài `/bai-viet/go-ghep-la-gi/` dùng lại ảnh mặt ván ghép cao su từ Ba Thanh Tây Bắc, có chú thích rõ đây là ví dụ cao su và ghi nguồn; không đại diện gỗ ghép tràm. Ảnh WebP có srcset và lazy-load, dùng hồ sơ quyền đã ghi trong `data/product-media.json`.

`IMAGE_ASSET_INVENTORY.csv` lập từ manifest hiện có: 7.415 đường dẫn media catalogue, 20 bản ghi ảnh vật liệu và 2 ảnh minh họa mới/cũ. Với catalogue, các cột nguồn, chủ sở hữu, quyền, trang và alt để trạng thái chưa đối chiếu khi manifest không cung cấp; đây là inventory, không phải chứng nhận quyền hay bằng chứng từng ảnh đang được dùng. Ảnh gỗ ghép tràm vẫn chờ nguồn/quyền; ảnh CMS hiện là ảnh không gian minh họa, không chứng minh đúng vật liệu.

Code bổ sung: `lib/material-wave2.ts`, `lib/cnc-article-diagram.ts`, `components/content/ArticleLanding.tsx`, `app/gia-cong-cnc/page.tsx`, `app/catalogue/page.tsx`, `components/catalog/AnCuongCatalogueSearch.tsx`, `public/images/editorial/ban-ve-cnc-minh-hoa.svg`, `tests/material-wave2.test.ts`, `tests/cnc-diagram.test.ts`, `e2e/cnc-diagram.spec.ts`, `e2e/wood-article-image.spec.ts`, `e2e/supplier-catalogue.spec.ts`; có nối dữ liệu trong `lib/product-editorial.ts`. Không thêm dependency. Trang chi tiết mã catalogue dùng alt khác nhau theo vai trò ảnh: mẫu bề mặt, toàn tấm, ảnh ứng dụng tham khảo hoặc ảnh vật liệu; không suy ra quyền ảnh từ vai trò này.

Kiểm thử trong bản sao tạm: `npm run verify` exit 0 (743 test website, 313 test catalogue, 38 test CMS; build, schema, sitemap và 258.054 liên kết nội bộ); Playwright `product-system.spec.ts`: 28/28 đạt ở desktop/mobile, gồm axe mẫu; `cnc-diagram.spec.ts`: 3/3 đạt, bao gồm trang dịch vụ và cuộn bằng bàn phím. Sau khi cập nhật ba locator test theo nhãn “Mã màu” đang hiển thị, toàn bộ 29 kiểm thử Playwright catalogue đạt; không thay nhãn UI. Chưa đo CWV, chưa xem thủ công từng ảnh/SKU, và chưa xác nhận đầy đủ nội dung của mọi route nên không kết luận toàn site hoàn tất.

`SUPPLIER_SOURCE_RIGHTS.csv` xuất thêm 5.515 dòng nguồn từ ba `data/imports/*/full-media-manifest.json`: URL nguồn, mã tham chiếu, vai trò ảnh, trạng thái và lý do. Các manifest này ghi `rightsStatus: UNCONFIRMED`; chưa có liên kết đầy đủ giữa từng nguồn và 7.415 tệp trong inventory catalogue. Không nên coi số lượng này là số ảnh đang hiển thị hoặc suy ra giấy phép từ tên nhà cung cấp. Các ảnh vật liệu cụ thể được ghi riêng theo `data/product-media.json`; cần kiểm tra phạm vi xác nhận trước khi tái sử dụng thêm.

Lượt kiểm tra tiếp theo: `app/catalogue/[supplier]/[material]/[code]/page.tsx` và `lib/catalog/code-seo.ts` dùng alt theo vai trò ảnh, có `tests/catalogue-image-alt.test.ts` kiểm tra; bản test server-side được cập nhật theo alt mới. Sự phân loại dựa trên metadata của record, chưa thay thế kiểm tra trực tiếp ảnh hoặc quyền theo SKU.

Lượt kiểm thử cuối sau cập nhật ảnh và alt: `npm run verify` exit 0 trong bản sao tạm (743/743 test website, 313/313 test catalogue, 38/38 test tích hợp CMS); Playwright chạy chung bốn file vật liệu, catalogue, sơ đồ CNC và ảnh bài gỗ ghép đạt 61/61. Hai ảnh kiểm tra bài gỗ ghép ở `evidence/go-ghep-mobile.png` và `evidence/go-ghep-desktop.png`. Không gửi yêu cầu báo giá thực.
