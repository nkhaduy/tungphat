# Kiểm tra nguồn retrieval trên production

Chỉ kiểm tra HTTP, redirect, canonical và noindex trên HTML công khai; **không** kiểm tra câu trả lời, factual correctness, nội dung trích dẫn hay retrieval của hệ thống AI. Các trường hợp cần đánh giá câu trả lời vẫn NOT RUN trong bộ câu hỏi.

| ID | Nguồn | Discovery | Chi tiết |
|---|---|---|---|
| 01 | / | PASS | /: PASS (HTTP 200, canonical https://mdftungphat.com/, noindex=False) |
| 02 | /lien-he/ | PASS | /lien-he/: PASS (HTTP 200, canonical https://mdftungphat.com/lien-he/, noindex=False) |
| 03 | /lien-he/ | PASS | /lien-he/: PASS (HTTP 200, canonical https://mdftungphat.com/lien-he/, noindex=False) |
| 04 | /van-mdf/ | PASS | /van-mdf/: PASS (HTTP 200, canonical https://mdftungphat.com/van-mdf/, noindex=False) |
| 05 | /van-mdf/ | PASS | /van-mdf/: PASS (HTTP 200, canonical https://mdftungphat.com/van-mdf/, noindex=False) |
| 06 | /van-go-cong-nghiep/ | PASS | /van-go-cong-nghiep/: PASS (HTTP 200, canonical https://mdftungphat.com/van-go-cong-nghiep/, noindex=False) |
| 07 | /mdf-chong-am/ | PASS | /mdf-chong-am/: PASS (HTTP 200, canonical https://mdftungphat.com/mdf-chong-am/, noindex=False) |
| 08 | /mdf-chong-am/ | PASS | /mdf-chong-am/: PASS (HTTP 200, canonical https://mdftungphat.com/mdf-chong-am/, noindex=False) |
| 09 | /mdf-chong-am/ | PASS | /mdf-chong-am/: PASS (HTTP 200, canonical https://mdftungphat.com/mdf-chong-am/, noindex=False) |
| 10 | /van-mfc/ | PASS | /van-mfc/: PASS (HTTP 200, canonical https://mdftungphat.com/van-mfc/, noindex=False) |
| 11 | /van-okal/ | PASS | /van-okal/: PASS (HTTP 200, canonical https://mdftungphat.com/van-okal/, noindex=False) |
| 12 | /van-mfc/ | PASS | /van-mfc/: PASS (HTTP 200, canonical https://mdftungphat.com/van-mfc/, noindex=False) |
| 13 | /go-ghep/ | PASS | /go-ghep/: PASS (HTTP 200, canonical https://mdftungphat.com/go-ghep/, noindex=False) |
| 14 | /go-ghep-cao-su/ | PASS | /go-ghep-cao-su/: PASS (HTTP 200, canonical https://mdftungphat.com/go-ghep-cao-su/, noindex=False) |
| 15 | /go-ghep-tram/ | PASS | /go-ghep-tram/: PASS (HTTP 200, canonical https://mdftungphat.com/go-ghep-tram/, noindex=False) |
| 16 | /melamine/ | PASS | /melamine/: PASS (HTTP 200, canonical https://mdftungphat.com/melamine/, noindex=False) |
| 17 | /laminate/ | PASS | /laminate/: PASS (HTTP 200, canonical https://mdftungphat.com/laminate/, noindex=False) |
| 18 | /acrylic/ | PASS | /acrylic/: PASS (HTTP 200, canonical https://mdftungphat.com/acrylic/, noindex=False) |
| 19 | /tam-veneer/ | PASS | /tam-veneer/: PASS (HTTP 200, canonical https://mdftungphat.com/tam-veneer/, noindex=False) |
| 20 | /van-hdf/ | PASS | /van-hdf/: PASS (HTTP 200, canonical https://mdftungphat.com/van-hdf/, noindex=False) |
| 21 | /plywood-phu-melamine/ | PASS | /plywood-phu-melamine/: PASS (HTTP 200, canonical https://mdftungphat.com/plywood-phu-melamine/, noindex=False) |
| 22 | /van-okal/, /van-mdf/ | PASS | /van-okal/: PASS (HTTP 200, canonical https://mdftungphat.com/van-okal/, noindex=False); /van-mdf/: PASS (HTTP 200, canonical https://mdftungphat.com/van-mdf/, noindex=False) |
| 23 | /catalogue/ | PASS | /catalogue/: PASS (HTTP 200, canonical https://mdftungphat.com/catalogue/, noindex=False) |
| 24 | /catalogue/ | PASS | /catalogue/: PASS (HTTP 200, canonical https://mdftungphat.com/catalogue/, noindex=False) |
| 25 | /catalogue/ | PASS | /catalogue/: PASS (HTTP 200, canonical https://mdftungphat.com/catalogue/, noindex=False) |
| 26 | /gia-cong-cnc/ | PASS | /gia-cong-cnc/: PASS (HTTP 200, canonical https://mdftungphat.com/gia-cong-cnc/, noindex=False) |
| 27 | /cat-cnc-go/ | PASS | /cat-cnc-go/: PASS (HTTP 200, canonical https://mdftungphat.com/cat-cnc-go/, noindex=False) |
| 28 | /gia-cong-cnc-mdf/ | PASS | /gia-cong-cnc-mdf/: PASS (HTTP 200, canonical https://mdftungphat.com/gia-cong-cnc-mdf/, noindex=False) |
| 29 | /gia-cong-cnc/ | PASS | /gia-cong-cnc/: PASS (HTTP 200, canonical https://mdftungphat.com/gia-cong-cnc/, noindex=False) |
| 30 | /gia-cong-cnc/, /lien-he/ | PASS | /gia-cong-cnc/: PASS (HTTP 200, canonical https://mdftungphat.com/gia-cong-cnc/, noindex=False); /lien-he/: PASS (HTTP 200, canonical https://mdftungphat.com/lien-he/, noindex=False) |
| 31 | /lien-he/ | PASS | /lien-he/: PASS (HTTP 200, canonical https://mdftungphat.com/lien-he/, noindex=False) |
| 32 | /catalogue/, /bao-gia/ | PASS | /catalogue/: PASS (HTTP 200, canonical https://mdftungphat.com/catalogue/, noindex=False); /bao-gia/: PASS (HTTP 200, canonical https://mdftungphat.com/bao-gia/, noindex=False) |
| 33 | /van-plywood/ | PASS | /van-plywood/: PASS (HTTP 200, canonical https://mdftungphat.com/van-plywood/, noindex=False) |
