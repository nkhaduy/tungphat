# So sánh retrieval BM25 nội bộ

Corpus chỉ gồm các URL nguồn dự kiến trên production; không trộn bản local. Chuẩn hóa Unicode và dấu, BM25 trên main và cộng điểm H1/H2. Nguồn kỳ vọng và câu hỏi giữ nguyên; câu nhiều nguồn chỉ yêu cầu một nguồn ở top 3, không chứng minh đủ căn cứ. Không phải kết quả công cụ tìm kiếm hoặc chatbot, không đánh giá tính đúng của câu trả lời.

| ID | Top 3 | Hạng nguồn đầu tiên | Kết quả |
|---|---|---:|---|
| 01 | /van-mdf/, /van-hdf/, /van-okal/ | 1 | PASS |
| 02 | /mdf-chong-am/, /gia-cong-cnc-mdf/, /van-go-cong-nghiep/ | 1 | PASS |
| 03 | /van-go-cong-nghiep/, /gia-cong-cnc-mdf/, /catalogue/ | 7 | FAIL |
| 04 | /go-ghep/, /go-ghep-cao-su/, /go-ghep-tram/ | 2 | PASS |
| 05 | /tam-veneer/, /van-plywood/, /go-ghep-tram/ | 1 | PASS |
| 06 | /catalogue/, /van-go-cong-nghiep/, /laminate/ | 1 | PASS |
| 07 | /van-go-cong-nghiep/, /go-ghep/, /laminate/ | 16 | FAIL |
| 08 | /cat-cnc-go/, /gia-cong-cnc-mdf/, /catalogue/ | 1 | PASS |
| 09 | /van-plywood/, /plywood-phu-melamine/, /go-ghep-cao-su/ | 1 | PASS |
| 10 | /van-hdf/, /van-mdf/, /van-okal/ | 1 | PASS |

Đánh giá được 10/10; Recall@1: 7/10; Recall@3: 8/10; MRR: 0.771. Factual correctness, completeness và citation support: NOT RUN.
