#!/usr/bin/env bash
# Two-pass 7 Mbps H.264 distribution encode of the Remotion master (film grain makes CRF masters large).
# usage: scripts/compress.sh <master.mp4> <output.mp4>
set -euo pipefail
IN=$(realpath "$1")
mkdir -p "$(dirname "$2")"
OUT=$(realpath -m "$2")
cd "$(mktemp -d)"   # x264 2-pass log files go here
ffmpeg -loglevel error -y -i "$IN" -c:v libx264 -preset slow -b:v 7M -pass 1 -an -f null /dev/null
ffmpeg -loglevel error -y -i "$IN" -c:v libx264 -preset slow -b:v 7M -maxrate 10M -bufsize 14M -pass 2 \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "wrote $OUT"
