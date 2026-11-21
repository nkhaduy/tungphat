# Rà soát 25 thất bại baseline

A = nguồn dự kiến xếp ngoài top 3 của bộ từ vựng cũ; E = corpus là production cũ, khác nội dung CNC local; G = vấn đề trích đoạn đã quan sát. A mô tả trực tiếp kết quả xếp hạng, chưa chứng minh nguyên nhân sâu hơn. Cần đối chiếu từng passage và nhãn nguồn trước khi kết luận B/C/D/F/H; không suy từ benchmark thành lỗi SEO. Hạng mới là kết quả BM25 từ `bm25-retrieval-results.md` tại thời điểm chạy.

| ID | Quan sát và nhóm | Hạng BM25 | Việc tiếp theo |
|---|---|---:|---|
| 02 | A: trang liên hệ hạng thấp | 10 | Kiểm tra trích xuất địa chỉ và intent địa điểm |
| 03 | A: trang liên hệ hạng thấp | 8 | Kiểm tra text và href kênh liên hệ |
| 04 | A: trang MDF bị trang khác vượt | 4 | Kiểm tra H1 MDF/HDF và từ đồng nghĩa |
| 05 | A: đoạn được chọn không trả lời ứng dụng | 11 | Đánh giá passage theo intent ứng dụng |
| 06 | A: trang chọn vật liệu xếp thấp | 2 | Kiểm tra đoạn chọn theo môi trường |
| 09 | A: nguồn chống ẩm xếp thấp | 3 | Xác minh đoạn giới hạn ẩm, tránh đồng nhất chống nước |
| 10 | A: nguồn MFC xếp thấp | 1 | Kiểm tra phân biệt ván dăm và lớp phủ |
| 12 | A: nguồn MFC xếp thấp | 3 | Đối chiếu passage ứng dụng |
| 13 | A: trang gỗ ghép xếp thấp | 1 | Kiểm tra đoạn định nghĩa thay vì CTA |
| 14 | A: nguồn cao su xếp thấp | 1 | Kiểm tra đoạn đặc điểm và tính có nguồn |
| 16 | A: nguồn Melamine xếp thấp | 6 | Kiểm tra ý định cốt/lớp phủ và passage |
| 17 | A: nguồn Laminate xếp thấp | 1 | Kiểm tra mô tả và trích dẫn |
| 18 | A: nguồn Acrylic xếp thấp | 1 | Kiểm tra passage lưu ý sử dụng |
| 19 | A: nguồn Veneer xếp thấp | 1 | Kiểm tra mô tả lớp gỗ và cốt |
| 20 | A: nguồn HDF xếp thấp | 1 | Kiểm tra nguồn so sánh, không suy tỷ trọng |
| 22 | A: cả hai nguồn ngoài top 3 | 6 | Cần kiểm tra đủ cả hai nguồn; chấm một nguồn là không đủ cho câu so sánh |
| 25 | A: catalogue xếp thấp | 16 | Kiểm tra câu hỏi tồn kho; không suy tồn kho từ mã |
| 26 | A, E: dịch vụ CNC xếp thấp trên production cũ | 11 | So với local corrected build và kiểm tra ngữ cảnh dịch vụ |
| 27 | A, E: production còn hướng dẫn file | 6 | So với local và kiểm tra phạm vi dịch vụ |
| 28 | A, E: production còn hướng dẫn file | 19 | So với local, không đưa hướng dẫn file trở lại |
| 29 | A, E: CNC production cũ xếp thấp | 14 | Đối chiếu bằng chứng cắt ván/dán cạnh ở nguồn thích hợp |
| 30 | A, E: nguồn giá/liên hệ xếp thấp | 21 | Kiểm tra intent báo giá, không suy giá cố định |
| 31 | A, G: không tìm được đoạn khớp ở nguồn dự kiến | 12 | Đọc href và nhãn CTA Zalo trong main, không suy URL từ text |
| 32 | A: nguồn catalogue/báo giá xếp thấp | 16 | Đối chiếu cả giá lẫn tồn kho, không coi một nguồn là đủ |
| 33 | A: plywood phủ melamine vượt plywood | 2 | Kiểm tra phân biệt cốt plywood và lớp phủ |

Hạng mới cải thiện với 11/25 ID đạt top 3; điều đó không chứng minh đúng nội dung. So sánh local/production CNC, đánh giá citation và xác định B/C/D/F/H vẫn NOT RUN.
