#!/usr/bin/env bash
# Downloads the open datasets the map build needs into data/cache (not committed).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data/cache
NE=https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson
for f in ne_10m_admin_0_countries ne_10m_admin_1_states_provinces ne_10m_rivers_lake_centerlines ne_10m_lakes; do
  [ -s data/cache/$f.geojson ] || curl -fsSL -o data/cache/$f.geojson $NE/$f.geojson
done
python3 scripts/terrain.py fetch
