# Regression

- Analytics: Phase 9 build không đặt GA ID. Test build dùng `G-TEST123456`, chặn GA bên ngoài và giả lập `/api/analytics/track`; ba test analytics chạy riêng PASS. `npm run test:e2e` nay đặt ID giả khi build.
- Logo Thanh Thuỳ: ảnh trì hoãn đến khi giao vùng quan sát; test tìm `img` trước khi cuộn. Đã tái hiện FAIL và sửa test cuộn tới thẻ trước khi kiểm tra logo. Test riêng PASS.
- Trustindex, SC015MW, header: Phase 9 báo timeout và teardown kẹt, chưa đủ chứng cứ khẳng định nguyên nhân. Chạy riêng cả ba PASS; không tăng timeout và không suy kết quả riêng thành full suite.
- Full suite cuối: 124 passed, 0 failed, 2 skipped trong một lượt; hai test WordPress local skip ở Payload mode. Xem FINAL_QA.md.
