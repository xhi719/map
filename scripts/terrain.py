"""
Terrain utilities: fetch AWS Terrain Tiles (Terrarium encoding; SRTM/GMTED/ETOPO1 incl. bathymetry)
and resample them into the trailer's equirectangular map space.

  python3 scripts/terrain.py fetch     # download the tiles needed by src/config/map.json into data/cache/terrarium
"""
import io, json, math, os, ssl, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CFG = json.load(open(os.path.join(ROOT, 'src/config/map.json')))
CACHE = os.path.join(ROOT, 'data/cache/terrarium')
URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
BASE_ZOOM = 5
PATCH_ZOOM = 7


def lat_to_ty(lat, z):
    lat = max(min(lat, 85.05), -85.05)
    r = math.radians(lat)
    return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * (2 ** z)


def lon_to_tx(lon, z):
    return (lon + 180) / 360 * (2 ** z)


def targets():
    """Every raster we produce: the world base and the detail patches."""
    w = CFG['width']
    ppd = w / 360
    out = [dict(id='world', lon=[-180, 180], lat=[CFG['latBottom'], CFG['latTop']], scale=1, zoom=BASE_ZOOM)]
    for p in CFG.get('detailPatches', []):
        out.append(dict(id=p['id'], lon=p['lon'], lat=p['lat'], scale=p['scale'], zoom=PATCH_ZOOM))
    for t in out:
        t['px_w'] = round((t['lon'][1] - t['lon'][0]) * ppd * t['scale'])
        t['px_h'] = round((t['lat'][1] - t['lat'][0]) * ppd * t['scale'])
    return out


def tile_range(t):
    z = t['zoom']
    x0 = int(math.floor(lon_to_tx(t['lon'][0], z)))
    x1 = int(math.ceil(lon_to_tx(t['lon'][1], z))) - 1
    y0 = int(math.floor(lat_to_ty(t['lat'][1], z)))
    y1 = int(math.ceil(lat_to_ty(t['lat'][0], z))) - 1
    n = 2 ** z
    return z, max(0, x0), min(n - 1, x1), max(0, y0), min(n - 1, y1)


def _ctx():
    ca = '/root/.ccr/ca-bundle.crt'
    return ssl.create_default_context(cafile=ca) if os.path.exists(ca) else ssl.create_default_context()


def fetch_one(args):
    z, x, y = args
    path = os.path.join(CACHE, str(z), str(x), f'{y}.png')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return 0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(URL.format(z=z, x=x, y=y), context=_ctx(), timeout=30) as r:
                data = r.read()
            open(path, 'wb').write(data)
            return 1
        except Exception as e:  # noqa
            err = e
    print('failed', z, x, y, err, file=sys.stderr)
    return 0


def fetch():
    jobs = []
    for t in targets():
        z, x0, x1, y0, y1 = tile_range(t)
        jobs += [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    jobs = sorted(set(jobs))
    print('tiles needed', len(jobs))
    with ThreadPoolExecutor(24) as ex:
        n = sum(ex.map(fetch_one, jobs))
    print('downloaded', n)


def elevation(t):
    """Elevation (m) grid for target t, resampled to equirectangular px_w x px_h."""
    z, x0, x1, y0, y1 = tile_range(t)
    mosaic = np.zeros(((y1 - y0 + 1) * 256, (x1 - x0 + 1) * 256), np.float32)
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            im = np.asarray(Image.open(os.path.join(CACHE, str(z), str(x), f'{y}.png')).convert('RGB'), np.float32)
            e = im[..., 0] * 256 + im[..., 1] + im[..., 2] / 256 - 32768
            mosaic[(y - y0) * 256:(y - y0 + 1) * 256, (x - x0) * 256:(x - x0 + 1) * 256] = e
    W, H = t['px_w'], t['px_h']
    lons = t['lon'][0] + (np.arange(W) + 0.5) / W * (t['lon'][1] - t['lon'][0])
    lats = t['lat'][1] - (np.arange(H) + 0.5) / H * (t['lat'][1] - t['lat'][0])
    fx = (lon_to_tx(lons, z) - x0) * 256 - 0.5
    fy = (np.array([lat_to_ty(l, z) for l in lats]) - y0) * 256 - 0.5
    fx = np.clip(fx, 0, mosaic.shape[1] - 1.001)
    fy = np.clip(fy, 0, mosaic.shape[0] - 1.001)
    ix, iy = fx.astype(int), fy.astype(int)
    ax, ay = (fx - ix)[None, :], (fy - iy)[:, None]
    a = mosaic[iy][:, ix]
    b = mosaic[iy][:, ix + 1]
    c = mosaic[iy + 1][:, ix]
    d = mosaic[iy + 1][:, ix + 1]
    return (a * (1 - ax) + b * ax) * (1 - ay) + (c * (1 - ax) + d * ax) * ay, lats


if __name__ == '__main__':
    if sys.argv[1:] == ['fetch']:
        fetch()
