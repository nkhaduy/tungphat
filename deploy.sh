#!/usr/bin/env bash
set -euo pipefail

npm ci
npm ci --prefix payload-cms
npm run verify

echo "Kiểm tra hoàn tất. Hãy xem 'git status' và commit có chủ đích trước khi push; script không tự git add hoặc force-push."
