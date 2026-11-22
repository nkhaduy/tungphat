# So sánh retrieval BM25 nội bộ

Corpus chỉ gồm các URL nguồn dự kiến trên production; không trộn bản local. Chuẩn hóa Unicode và dấu, BM25 trên main và cộng điểm H1/H2. Nguồn kỳ vọng và câu hỏi giữ nguyên; câu nhiều nguồn chỉ yêu cầu một nguồn ở top 3, không chứng minh đủ căn cứ. Không phải kết quả công cụ tìm kiếm hoặc chatbot, không đánh giá tính đúng của câu trả lời.

| ID | Top 3 | Hạng nguồn đầu tiên | Kết quả |
|---|---|---:|---|
| 01 | /mdf-chong-am/, /van-mdf/, / | 3 | PASS |
| 02 | /van-okal/, /van-mdf/, /mdf-chong-am/ | 10 | FAIL |
| 03 | /catalogue/, /bao-gia/, /van-go-cong-nghiep/ | 8 | FAIL |
| 04 | /gia-cong-cnc-mdf/, /van-go-cong-nghiep/, /bao-gia/ | 4 | FAIL |
| 05 | /van-go-cong-nghiep/, /go-ghep/, /cat-cnc-go/ | 11 | FAIL |
| 06 | /van-hdf/, /van-go-cong-nghiep/, /go-ghep-cao-su/ | 2 | PASS |
| 07 | /mdf-chong-am/, /gia-cong-cnc-mdf/, /gia-cong-cnc/ | 1 | PASS |
| 08 | /mdf-chong-am/, /van-go-cong-nghiep/, /van-hdf/ | 1 | PASS |
| 09 | /van-go-cong-nghiep/, /van-hdf/, /mdf-chong-am/ | 3 | PASS |
| 10 | /van-mfc/, /van-okal/, /bao-gia/ | 1 | PASS |
| 11 | /van-okal/, /van-mfc/, /melamine/ | 1 | PASS |
| 12 | /van-go-cong-nghiep/, /catalogue/, /van-mfc/ | 3 | PASS |
| 13 | /go-ghep/, /go-ghep-tram/, /go-ghep-cao-su/ | 1 | PASS |
| 14 | /go-ghep-cao-su/, /go-ghep-tram/, /tam-veneer/ | 1 | PASS |
| 15 | /go-ghep/, /go-ghep-tram/, /van-go-cong-nghiep/ | 2 | PASS |
| 16 | /catalogue/, /van-go-cong-nghiep/, /gia-cong-cnc-mdf/ | 6 | FAIL |
| 17 | /laminate/, /, /van-plywood/ | 1 | PASS |
| 18 | /acrylic/, /, /catalogue/ | 1 | PASS |
| 19 | /tam-veneer/, /van-plywood/, /go-ghep-tram/ | 1 | PASS |
| 20 | /van-hdf/, /tam-veneer/, /van-mdf/ | 1 | PASS |
| 21 | /laminate/, /lien-he/, /plywood-phu-melamine/ | 3 | PASS |
| 22 | /gia-cong-cnc/, /, /gia-cong-cnc-mdf/ | 6 | FAIL |
| 23 | /catalogue/, /bao-gia/, /van-mfc/ | 1 | PASS |
| 24 | /catalogue/, /bao-gia/, /van-mdf/ | 1 | PASS |
| 25 | /van-okal/, /van-mfc/, /melamine/ | 16 | FAIL |
| 26 | /catalogue/, /van-go-cong-nghiep/, /bao-gia/ | 11 | FAIL |
| 27 | /, /catalogue/, /van-go-cong-nghiep/ | 6 | FAIL |
| 28 | /catalogue/, /van-go-cong-nghiep/, /bao-gia/ | 19 | FAIL |
| 29 | /, /lien-he/, /van-okal/ | 14 | FAIL |
| 30 | /van-hdf/, /van-plywood/, /catalogue/ | 21 | FAIL |
| 31 | /van-go-cong-nghiep/, /catalogue/, /bao-gia/ | 12 | FAIL |
| 32 | /van-go-cong-nghiep/, /go-ghep/, /van-mdf/ | 16 | FAIL |
| 33 | /plywood-phu-melamine/, /van-plywood/, /go-ghep-tram/ | 2 | PASS |

Đánh giá được 33/33; Recall@1: 12/33; Recall@3: 19/33; MRR: 0.496. Factual correctness, completeness và citation support: NOT RUN.
