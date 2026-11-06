"""
Composites the final map rasters:
  real terrain (AWS Terrain Tiles: SRTM/GMTED land, ETOPO1 bathymetry)
  + 1936 political fills + borders/coasts/rivers (from scripts/build-map.mjs)

  python3 scripts/compose-map.py
Outputs src/assets/map/world1936.jpg and src/assets/map/detail-<id>.jpg
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import terrain  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
ROOT = terrain.ROOT
LAYERS = os.path.join(ROOT, 'data/cache/layers')
OUT = os.path.join(ROOT, 'src/assets/map')


def hex2rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def ramp(values, stops):
    """Piecewise-linear colour ramp. stops: [(value, '#hex'), ...] ascending."""
    xs = np.array([s[0] for s in stops], np.float32)
    cs = np.stack([hex2rgb(s[1]) for s in stops])
    out = np.empty(values.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(values, xs, cs[:, c])
    return out


def hillshade(elev, lats, deg_per_px, exaggeration, azimuth=315, altitude=40):
    dy = deg_per_px * 111320.0
    dx = dy * np.cos(np.radians(lats))[:, None]
    gy, gx = np.gradient(elev)
    gx = gx / dx * exaggeration
    gy = gy / dy * exaggeration
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az = np.radians(360 - azimuth + 90)
    alt = np.radians(altitude)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(hs, 0, 1)


def blur(a, r):
    """Separable box blur (radius r px) via cumulative sums."""
    if r < 1:
        return a
    def run(x, axis):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(x, pad, mode='edge'), axis=axis, dtype=np.float64)
        n = x.shape[axis]
        hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis)
        lo = np.take(c, np.arange(0, n), axis=axis)
        return ((hi - lo) / (2 * r + 1)).astype(np.float32)
    return run(run(a, 0), 1)


def compose(t):
    elev, lats = terrain.elevation(t)
    H, W = elev.shape
    deg_per_px = (t['lon'][1] - t['lon'][0]) / W
    k = t['scale']

    fills = np.asarray(Image.open(os.path.join(LAYERS, f"{t['id']}-fills.png")).convert('RGBA'), np.float32) / 255
    lines = np.asarray(Image.open(os.path.join(LAYERS, f"{t['id']}-lines.png")).convert('RGBA'), np.float32) / 255
    assert fills.shape[:2] == (H, W), (fills.shape, (H, W))
    land_a = fills[..., 3:4]
    pol = fills[..., :3]

    # ---- relief
    # Smooth high-res tiles a little so the relief reads as landform, not noise.
    relief_src = blur(np.maximum(elev, 0), int(k // 2)) if k > 1 else np.maximum(elev, 0)
    hs = hillshade(relief_src, lats, deg_per_px, exaggeration=9.0 / (k ** 0.6))
    flat = np.sin(np.radians(40))  # hillshade value of flat ground
    shade = (hs - flat)[..., None]  # <0 shadowed slopes, >0 lit slopes

    # ---- land: political colour modulated by terrain
    e = np.maximum(elev, 0)[..., None]
    elev_tint = ramp(np.maximum(elev, 0), [(0, '#000000'), (400, '#060504'), (1500, '#14110c'), (3500, '#2a2620')])
    snowline = 4800 - np.clip(np.abs(lats) - 28, 0, 60)[:, None] * 75
    snow = np.clip((np.maximum(elev, 0) - snowline) / 900, 0, 1)[..., None] * 0.45
    land = pol * np.clip(1.0 + shade * 0.95, 0.45, 1.35) + elev_tint
    land = land * (1 - snow) + hex2rgb('#d7d5cc') * snow
    # lowland vs highland: very slight desaturation with height (atmospheric)
    grey = land.mean(axis=2, keepdims=True)
    land = land + (grey - land) * np.clip(e / 6000, 0, 0.35)

    # ---- sea: depth ramp + subtle seafloor relief
    depth = np.maximum(-elev, 0)
    sea = ramp(depth, [(0, '#3a5a62'), (120, '#2c4a54'), (400, '#21404b'), (1500, '#18313c'), (3500, '#112530'), (6000, '#0b1a23')])
    hs_sea = hillshade(blur(np.minimum(elev, 0), int(k)) if k > 1 else np.minimum(elev, 0), lats, deg_per_px, exaggeration=4.0 / (k ** 0.6))
    sea = sea * (1.0 + (hs_sea - flat)[..., None] * 0.5)

    # Coastal shallows glow, sea side only (classic chart look).
    halo = blur(blur(land_a[..., 0], int(4 * k)), int(4 * k))[..., None]
    sea = sea + hex2rgb('#5f8790') * np.clip(halo * 1.6, 0, 1) * 0.55 * (1 - land_a)
    img = sea * (1 - land_a) + land * land_a

    # ---- paper / print texture (very subtle)
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 1, (H // 2 + 1, W // 2 + 1)).astype(np.float32)
    noise = np.kron(noise, np.ones((2, 2), np.float32))[:H, :W]
    img = img * (1 + noise[..., None] * 0.018)

    # ---- vector lines on top
    la = lines[..., 3:4]
    img = img * (1 - la) + lines[..., :3] * la

    img = np.clip(img, 0, 1)
    return Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGB')


def main():
    only = set(sys.argv[1:])
    for t in terrain.targets():
        if only and t['id'] not in only:
            continue
        im = compose(t)
        name = 'world1936.jpg' if t['id'] == 'world' else f"detail-{t['id']}.jpg"
        im.save(os.path.join(OUT, name), quality=90, optimize=True)
        print('wrote', name, im.size)


if __name__ == '__main__':
    main()
