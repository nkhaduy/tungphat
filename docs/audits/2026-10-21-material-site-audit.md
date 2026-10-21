# Audit vat lieu va website - 2026-10-21

## Pham vi va baseline

- Baseline Git: `9af6b0f` tren `main`. Worktree co thay doi san o `data/imports/ba-thanh/validation-report.json` va thu muc `quote-app/`; ca hai duoc giu nguyen.
- Bay tuyen duoc yeu cau (`/`, `/san-pham/`, `/catalogue/`, hai catalogue thuong hieu, hai trang thuong hieu) deu tra HTTP 200 truoc khi sua. HTML `/catalogue/` khoang 2.2 MB vi nhet gan 3.000 ban ghi tim kiem vao trang ban dau.
- Trang chu cu dung nen xanh nhat va anh hero toan khung, the be mat tro den An Cuong, muc thuong hieu hien An Cuong truoc Thanh Thuy. `/san-pham/` la trang gioi thieu theo the, chua co tim kiem truc tiep.
- Kien truc giu nguyen: Next.js static export tren Vercel, Payload CMS Worker/Pages va D1/R2; anh catalogue duoc phuc vu qua `cdn.mdftungphat.com`. Khong co migration database.
- Thu truy van D1 production bang Wrangler `--remote --env production` chi doc schema; Cloudflare tra 7403 (account khong hop le/khong duoc cap quyen). Vi vay so lieu ben duoi den tu artifact duoc version trong repository, chua duoc doi chieu truc tiep voi D1 production.

## Nguon nha cung cap va taxonomy

- Nguon Thanh Thuy da truy cap: `/products/`, `/products/melamine/`, `/products/laminate/`, `/products/acrylic/`, `/products/pvc-film/`, `/products/pvc-edge/` tren `gothanhthuy.com`. File `data/catalogs/thanh-thuy/catalog.json` co 348 muc nguon: Melamine 221, Laminate 69, Acrylic 26, PVC Film 24, veneer 3, chi nep 5. Cac series dang co gom Oak, Walnut, Maple, Cherry, Elm, Beech; LE/LP don sac va van go, LP van da/van vai; Glass/Ultra; mang PET bong. Khong suy ra co Teak trong file hien tai.
- Nguon Ba Thanh da truy cap: `bathanhtaybac.com`, `/san-pham/mdf-hdf`, `/san-pham/lmr-mmr-hmr`, `/catalogue/fullsize`, `/catalogue/laminate-way`, `/catalogue/catalogue-pdf`. Trang fullsize cong khai 214 ma Melamine, trang Laminate Way ghi 94 ma. Menu nguon co MDF/HDF, LMR/MMR/HMR, Okal/MFC, go ghep, Veneer, van nhua, van san, Plywood, Plywood phu Melamine, Melamine, Laminate, chi canh va keo. Cac nhom chua co ban ghi/quy cach rieng tai Tung Phat duoc giu o muc tham khao nguon. Gia nha cung cap khong duoc dung lam gia Tung Phat.
- Data model hien tai da co ID, slug, supplier, ma, series/nhom van, kich thuoc, anh, URL nguon, checksum, `seoStatus`, `published`, `rightsStatus` va duong CDN. Can doi chieu them quan he cot van - be mat - do day - ton kho truoc khi dua thanh cau hinh co the dat hang. Khong them ban ghi trung/khong co chung cu.

## Vi sao cac so dem khac nhau

| Tap du lieu | Thanh Thuy | Ba Thanh | An Cuong |
| --- | ---: | ---: | ---: |
| Muc nhap/legacy theo san pham | 348 | 260 | Khong dung lam tong ma |
| Ma mau trong `supplier-color-codes.json` | 342 | 373 | 2.195 |
| Muc tim kiem sau khi ghep ca family | 348 | 376 | 2.268 |

`Thanh Thuy 348` gom muc nguon khong co ma rieng va mot so ma trung theo bien the; khong the coi la 348 ma mau duy nhat. `Ba Thanh 260` la tap legacy Melamine, khong phai toan bo catalogue; 373 gom nhieu nhom be mat. So lieu tren trang cong khai phai ghi ro pham vi va tinh tu index hien tai, khong hardcode.

## Media va quyen su dung

- Chi muc ma mau co 4.722 tham chieu anh, 4.018 checksum khac nhau, 4.721 tham chieu co duong noi bo/CDN. Tat ca 4.722 tham chieu van co `rightsStatus: UNCONFIRMED`. Ba Thanh co 48 ma khong co anh trong chi muc; khong dung anh ma khac de lap cho trong.
- Mau CDN da kiem tra: anh chi nhanh, swatch Thanh Thuy va duong anh Ba Thanh dang dung trong chi muc tra HTTP 200. Mot duong Ba Thanh **legacy** cu tra 404; duong BT01 trong chi muc hien tai tra 200. Khong co bang chung de tai/dang them anh nha cung cap trong dot nay.
- Dot nay khong upload anh nha cung cap moi; dung lai anh Tùng Phát va anh CDN da co. Da loai EXIF khoi 7 asset public cu (trong do 2 JPEG co truong GPS), doi chieu pixel hash truoc/sau khong doi. Script `npm run images:strip-exif` va build check giup ngan EXIF tai xuat hien. Khong chay `media:sync`, `media:publish` hoac upload du lieu nguon khi quyen su dung chua ro.

## SEO va rollback

- Giu nguyen URL catalogue, ma mau va trang thuong hieu; khong doi slug/redirect va khong xoa An Cuong khi quan he kinh doanh chua duoc xac minh. Giam uu tien An Cuong tren trang chu, van giu trang catalogue de bao toan tuyen dang index.
- Trang filter/search dung co che robots hien tai de tranh index URL tham so. Can tiep tuc kiem tra thin content, anh thieu va duong dan CDN sau moi lan build/deploy.
- Rollback ma nguon bang mot commit revert moi (khong rewrite history), tro lai build tu `9af6b0f` neu can. Data D1/R2 khong bi thay doi trong dot nay.
