# Xử lý blocker Phase 5

## A. CMS/frontend — PARTIAL

Nguyên nhân: body bài MDF và nhiều trường bốn material CMS-managed bị repository thay thế; section bổ sung dựa heading, figure phụ thuộc split, ngày bị ghi đè. `lib/content.ts`, `data/cms-editorial-baselines.json` chặn build khi body MDF hoặc trường product bị che thay đổi so với fingerprint CMS snapshot, bao gồm null; CMS vẫn sở hữu publication và canonical. `applyArticleEditorial` phát hiện anchor CNC thiếu/trùng; section gỗ ghép dùng slot cuối rõ ràng, nếu CMS đã có heading section thì không chèn. `splitEditorialImage` giữ figure ở cuối khi anchor thiếu/trùng và cảnh báo; không cắt mất body. Giữ ngày CMS mới hơn và cập nhật ngày biên tập material 13/11. Test guard, heading, cập nhật ngày và render mẫu tại `tests/content-conflicts-phase5.test.ts`, `tests/content-render-phase5.test.ts`, `tests/cnc-diagram.test.ts`, `tests/product-editorial.test.ts`.

Cơ chế này làm xung đột hiển thị và có quy tắc nhưng **chưa chứng minh mọi dữ liệu CMS thay đổi đều render đúng**, chưa có thử nghiệm đầy đủ với mọi field và chưa có owner chấp nhận quy trình. Có nguy cơ duplicate ngữ nghĩa khi editor dùng heading khác; cần preview/editor review. `CONTENT_OWNERSHIP.md` có ma trận, migration/rollback. Không cập nhật CMS.

## B. GA4/conversion — PARTIAL

Nguyên nhân: queue chưa xóa khi opt-out lúc bootstrap; first-party idle callback không kiểm tra lại opt-out; header tel dùng `request_quote` chỉ ghi quote. Đã sửa `lib/analytics/ga4-bootstrap.ts`, `lib/analytics/client.ts`, `lib/analytics.ts`, `components/TrackedLink.tsx`; đổi `countLeadSessions` thành `countContactIntentSessions`. Test đơn vị có red/green; test browser receiver giả ở `e2e/analytics-phase5.spec.ts`. Browser không chứng minh Google hay CRM nhận event. Xem `ANALYTICS_VERIFICATION.md` cho test còn thiếu, queue có thể mất khi rời trang và giới hạn opt-out trong cùng session.

## C. Ảnh — CHƯA ĐỦ BẰNG CHỨNG TOÀN RELEASE

So sánh HTML sản xuất đang chạy với export local trên 23 URL ưu tiên; `RELEASE_ASSET_RIGHTS.csv` ghi 12 URL ảnh/biến thể mới render và bằng chứng quyền theo manifest, 96 URL legacy trùng trong mẫu và một bản gốc không public. Đã so ba chỉ mục tìm kiếm catalogue: 2.992 record ID, 0 record thêm/mất, 0 mapping thumbnail đổi; 2.596 URL thumbnail khác nhau được bổ sung vào CSV và tổng hợp trong `CATALOGUE_MAPPING_COMPARISON.json`. Trùng URL không chứng minh byte/quyền. Đây là so sánh `img/srcset` HTML thô; ảnh CSS, các nguồn JS khác, thứ tự và mọi trạng thái route catalogue chưa được đối chiếu đầy đủ, nên không thể khẳng định **chính xác toàn bộ** release asset delta hay không còn asset mới UNCONFIRMED. 5.515 supplier source records UNCONFIRMED là inventory, không đồng nghĩa 5.515 ảnh mới/rendered. Không mở rộng, xóa hay thay hình catalogue. Cần đối chiếu thay đổi mapping/ảnh client và nguồn hero trước quyết định quyền. Không tự nhận rủi ro thay owner.

## D. Indexing — GIỮ CHÍNH SÁCH

Đã kiểm tra tier A/B/C và bài test hiện hữu; `e2e/phase5-indexing.spec.ts` kiểm tra alias BT01 → canonical BT01 noindex, đích BT01 noindex, BT111 indexable, hub nhóm đơn sắc noindex → hub. Không sửa index/redirect/sitemap. Sáu nhóm canonical khác intent và 257 đích noindex cần xem GSC, nhu cầu và sản phẩm sau release; không dựa vào số URL làm KPI. Không chứng minh Google chọn canonical.

## E. Performance — PHÁT HIỆN BOTTLENECK

Ba lượt mobile network+CPU throttle: catalogue LCP ~10,8s trong lab; hero 594 KiB/1916px hiển thị 390px, nhiều ảnh tải cạnh tranh. Đây không phải field CWV. Chưa tạo biến thể hoặc thay ảnh vì chưa xác minh riêng quyền/source hero. `PERFORMANCE_VALIDATION.md` và raw có điều kiện, resource và CLS. Cần khắc phục và đo lại sau khi có nguồn/quyền phù hợp.

## Verification

`npm run verify` trong bản sao, GA ID giả và test mode; kết quả chính xác được tổng hợp trong `RELEASE_DECISION.md`. Playwright chạy riêng với request analytics thật bị chặn. Dữ liệu `content/` sync chỉ ghi trong bản sao; không đưa các file sinh ngược vào working tree. Lần verify đầu fail do go-ghep thực tế không có heading `## Gửi` (trước đó dùng fallback nối cuối); đã thay bằng slot cuối rõ ràng và chạy lại, không xóa test.
