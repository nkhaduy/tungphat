# Publishing — CHƯA TRIỂN KHAI

Chưa có webhook WordPress kết nối queue bền vững, worker build, activation nguyên tử hoặc recovery. `lib/wordpress/webhook.ts` chỉ là primitive xác minh chữ ký và interface claim, không phải pipeline chạy thật. Publish/update/unpublish, scheduled publication và các tình huống lỗi chưa được chứng minh tự động. Snapshot 4186 không tự cập nhật.
