#!/bin/bash

# 1. Kiểm tra trạng thái Git
echo "🔄 Đang kiểm tra các thay đổi mới..."
git add .

# Nếu không có thay đổi nào thì dừng script
if git diff-index --quiet HEAD --; then
    echo "✅ Không có tệp nào mới hoặc thay đổi."
    exit 0
fi

# 2. Tạo commit với thời gian hiện tại
commit_message="Auto deploy: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📝 Đang commit với nội dung: '$commit_message'"
git commit -m "$commit_message"

# 3. Đẩy code lên GitHub
echo "🚀 Đang đẩy code lên GitHub..."
git push origin main

# LƯU Ý: Vercel thường đã bật tính năng "Auto-deploy khi có commit mới trên GitHub".
# Nếu dự án của bạn đã liên kết với Vercel, bạn KHÔNG CẦN đoạn dưới này.
# Nếu bạn muốn ép buộc deploy ngay bằng CLI, hãy bỏ dấu # ở 2 dòng dưới:
# echo "⚡ Đang kích hoạt deploy Vercel CLI..."
# vercel --prod --yes
