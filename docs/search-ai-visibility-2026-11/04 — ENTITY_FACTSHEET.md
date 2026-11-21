# Entity factsheet — 14/11/2026

Dữ liệu dưới đây là thông tin website/repository đang công bố, chưa phải xác minh pháp lý độc lập hoặc xác nhận giờ hoạt động thực tế. Nguồn gốc chính `content/settings/business.json`, `data/canonical-business-identity.json` (ghi verifiedAt 10/08/2026), `lib/locations.ts`; production `/lien-he/` và trang chi nhánh trong `evidence/production-sample.json`.

| Thuộc tính | Dữ liệu hiện công bố | Mức xác nhận / việc tiếp |
| --- | --- | --- |
| Tên pháp lý trong cấu hình | Công ty TNHH TMDV Gỗ Tùng Phát; MST 0319115830 | Cấu hình và hồ sơ lịch sử; đối chiếu hồ sơ doanh nghiệp gốc trước khi coi là xác minh pháp lý hiện hành. |
| Tên hiển thị | MDF - CNC TÙNG PHÁT | Cấu hình website; Organization JSON-LD dùng tên pháp lý. |
| Trang chính thức | https://mdftungphat.com/ | Production HTTP 200; canonical chính tắc. |
| Điện thoại / email | 0909 259 160; mdftungphat@gmail.com | Cấu hình và thông tin website; chưa gọi thử. |
| Chi nhánh 1 | 14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh | `/chi-nhanh/14-tam-binh/`; Maps Place ID `ChIJ6dw2A6YndTERr5eaiym-l-M` trong cấu hình. |
| Chi nhánh 2 | 81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh | `/chi-nhanh/81b-tam-binh/`; Maps Place ID `ChIJjWMBUikndTERNFK1M-j02ZY` trong cấu hình. |
| Dịch vụ và địa bàn | Website mô tả ván, mã màu và gia công CNC; serviceAreas TP.HCM | Không xác nhận khả năng máy, dung sai, giao hàng hay tồn kho. |
| Social | Zalo và Facebook trong business.json | Liên kết hiện hữu; chưa đăng nhập xác minh quản trị hay tính cập nhật. |
| Logo | `/icon.png` trong Organization graph | Cần kiểm tra asset logo và ảnh thực tế riêng nếu thay. |
| GBP, giờ mở cửa, reviews, quan hệ nhà cung cấp | Chưa xác minh qua tài khoản quản trị | Không thêm dữ liệu hoặc danh xưng độc quyền. Có lịch sử đối chiếu thư mục nhà cung cấp trong `data/external-authority-baseline.json`; không suy phạm vi quyền ảnh. |

Kiểm tra chủ sở hữu sau deploy: truy cập từng GBP, đối chiếu chính xác địa chỉ/số/giờ, map link, danh mục, ảnh được phép và URL; sửa trong kênh quản lý nếu có sai, không tạo đánh giá. Cả hai JSON-LD LocalBusiness trong mẫu liên kết parentOrganization và mã chi nhánh khác nhau; chưa xác minh GBP thực tế.
