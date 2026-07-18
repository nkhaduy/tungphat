#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: scripts/compress-video-for-web.sh INPUT.mp4 OUTPUT.mp4" >&2
  exit 2
fi

input=$1
output=$2

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg is required" >&2; exit 1; }
[[ -f "$input" ]] || { echo "Input file not found: $input" >&2; exit 1; }
[[ ! -e "$output" ]] || { echo "Refusing to overwrite: $output" >&2; exit 1; }

ffmpeg -i "$input" \
  -map 0:v:0 -an \
  -c:v libx264 -preset slow -crf 28 \
  -vf "scale='min(1080,iw)':-2:flags=lanczos" \
  -pix_fmt yuv420p -movflags +faststart \
  "$output"

echo "Created $output. Inspect visual quality and target roughly 5–15 MiB before uploading."
