#!/bin/bash

# Đường dẫn đến thư mục dự án của bạn (Lấy thư mục hiện tại)
DIR="$(pwd)"
SCRIPT="./deploy.sh"

echo "👀 Đang treo máy và theo dõi thay đổi tại: $DIR"
echo "🚀 Mỗi khi có tệp mới hoặc chỉnh sửa, script deploy sẽ tự động chạy..."

# Theo dõi thư mục, loại bỏ thư mục .git để tránh lặp vô hạn
fswatch -o -e "\.git" "$DIR" | while read num; do
    echo "⚡ Phát hiện có thay đổi mới! Tự động chạy deploy..."
    # Chạy file deploy.sh đã tạo ở bước trước
    $SCRIPT
    # Chờ 5 giây đề phòng bạn lưu nhiều file cùng lúc, tránh spam deploy liên tục
    sleep 5
done
