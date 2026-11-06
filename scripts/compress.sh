#!/usr/bin/env bash
# Two-pass 7 Mbps H.264 distribution encode of the Remotion master (film grain makes CRF masters large).
set -euo pipefail
IN=$1; OUT=$2
mkdir -p "$(dirname "$OUT")"
cd "$(mktemp -d)"
ffmpeg -loglevel error -y -i "$OLDPWD/$IN" -c:v libx264 -preset slow -b:v 7M -pass 1 -an -f null /dev/null 2>/dev/null || ffmpeg -loglevel error -y -i "$IN" -c:v libx264 -preset slow -b:v 7M -pass 1 -an -f null /dev/null
SRC=$([ -f "$OLDPWD/$IN" ] && echo "$OLDPWD/$IN" || echo "$IN")
DST=$([[ "$OUT" = /* ]] && echo "$OUT" || echo "$OLDPWD/$OUT")
ffmpeg -loglevel error -y -i "$SRC" -c:v libx264 -preset slow -b:v 7M -maxrate 10M -bufsize 14M -pass 2 \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$DST"
echo "wrote $DST"
