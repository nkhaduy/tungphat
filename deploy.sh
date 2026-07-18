#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run validate:links

echo "Kiểm tra hoàn tất. Hãy xem 'git status' và commit có chủ đích trước khi push; script không tự git add hoặc force-push."
