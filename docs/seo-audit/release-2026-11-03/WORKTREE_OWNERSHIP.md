# Phân biệt công việc có sẵn và SEO release

Không reset/stash/stage/commit ở repository chủ website `/Users/khaduy/tungphat`. Snapshot trước phiên tại `/tmp/tungphat-seo-release-before.patch` và porcelain-z; audit cũ có `../evidence/pre-existing-diff.txt`. Đối chiếu cuối: **tracked git diff của repository gốc byte-identical với đầu phiên**. Chỉ thêm tài liệu/evidence mới trong docs/seo-audit/release-2026-11-03. Không xóa untracked files của chủ website.

Worktree cách ly: `/Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat`, branch `codex/seo-release-20261103`, tạo từ `357bd71`. Không push. Không pull/merge vào cây dirty gốc. `origin/main` sau fetch không có commit mới cần kéo vào; HEAD lịch sử ahead 7 commits, không coi các commit đó là phần SEO mới.

## Baseline đã live

Các thay đổi homepage, carousel CNC, product finder, taxonomy/search, header/footer/mobile navigation, trang sản phẩm/báo giá/404 và tests từ công việc có sẵn được **giữ lại** làm ngữ cảnh release. Danh sách 30 source/test files ở `evidence/separation-manifest.json`; thêm 7 file ảnh/manifest CNC. Ba file overlap (`app/catalogue/page.tsx`, SupplierCatalogSearch, `lib/site-content.ts`) được tái lập phần trước SEO riêng; không áp toàn bộ dirty diff như thể là SEO.

Baseline commit cách ly `e923022` ghi nhận 37 files của ngữ cảnh đã live, **không phải 37 SEO changes mới**. Build baseline so artifact lấy từ deployment thật: 3.580/3.580 HTML cùng title, description, canonical, robots, H1, main text và links; 95 public assets cùng checksum; sitemap/robots byte-identical. Vì production là CLI static deployment không Git SHA, đây là bằng chứng output parity, không tuyên bố tìm được source commit production tuyệt đối.

## SEO delta

Commit `af7de2c` chỉ 8 files (5 runtime/source, 1 validator, 2 test files). Review bằng:

```sh
git -C /Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat diff e923022..af7de2c --stat
git -C /Users/khaduy/.codex/worktrees/tungphat-seo-release/tungphat show af7de2c
```

`seo-release.patch` chứa riêng commit SEO, parent là baseline. **Không cherry-pick mù lên origin/main**: nơi đó có thể thiếu context đã live như `lib/site-content.ts` và carousel. Dùng branch cách ly đã kiểm chứng hoặc đối chiếu khi tích hợp về canonical repository, giữ toàn bộ công việc chủ website.

## Dữ liệu và môi trường

Build đọc snapshot/CMS public/reviews về local, không chạy supplier upload, sync-production, delete hay database migration production. Verify CMS chạy integration database local và build/dry-run. Lần verify đầu bị lỗi resolve Sharp vì node_modules symlink ra ngoài worktree; đã dùng bản sao dependency vật lý trong worktree rồi verify lại pass. Không sửa app để che lỗi môi trường.

Generated timestamp ở `data/imports/ba-thanh/validation-report.json` được bỏ khỏi delta **chỉ ở worktree riêng** bằng nội dung HEAD của chính file đó. Không đụng file gốc của chủ website. Dependency directories, env symlinks, .vercel, archive và production source extraction chỉ local/ignored; không commit credentials.

Có thêm README/tài liệu/evidence để review; chúng không nằm trong artifact frontend. Nếu frontend/production được người khác cập nhật trước khi phát hành, phải đối chiếu lại và rebuild, tránh ghi đè release mới bằng archive cũ.
