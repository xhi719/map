/**
 * Builds the vector layers of the 1936 world map (reference date: mid-1936).
 *
 * Geometry strategy
 *   - Coastlines and borders that did not change come from Natural Earth 10m (modern, high resolution).
 *   - Each modern country is re-assigned to its 1936 owner, using the historical 1938 basemap
 *     (aourednik/historical-basemaps, GPL-3.0) for ownership and for borders that differ from today
 *     (e.g. Germany–Poland, Poland–USSR, Romania's Bessarabia, Italian Istria, Finnish Petsamo).
 *   - Hand-specified 1936 corrections are applied on top: Austria, Danzig, Manchukuo, Tuva,
 *     Spanish Morocco/Ifni/Cape Juby, Kwantung, and the Chinese warlord map of 1936.
 *
 * Outputs
 *   data/cache/layers/<target>-fills.png   political fills (transparent sea)        → scripts/compose-map.py
 *   data/cache/layers/<target>-lines.png   borders, coasts, rivers, lakes, graticule → scripts/compose-map.py
 *   data/cache/layers/world1936.svg        vector master (fills + lines, ~40 MB, not committed)
 *   src/assets/data/polities.json          simplified outlines of powers for animated highlights
 *   src/assets/textures/{clouds,grain}.png
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {geoEquirectangular, geoPath, geoGraticule10, geoArea} from 'd3-geo';
import pc from 'polygon-clipping';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/map.json'), 'utf8'));
const W = cfg.width;
const PX_PER_DEG = W / (cfg.lonRight - cfg.lonLeft);
const H = Math.round((cfg.latTop - cfg.latBottom) * PX_PER_DEG);
const LAYERS = path.join(ROOT, 'data/cache/layers');
fs.mkdirSync(LAYERS, {recursive: true});

const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, cfg.latTop * PX_PER_DEG]).precision(0.05);
const pathGen = geoPath(projection);
pathGen.digits?.(1);

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const g38 = readJSON('data/source/world_1938.geojson');
const g30 = readJSON('data/source/world_1930.geojson');
const adm0 = readJSON('data/cache/ne_10m_admin_0_countries.geojson');
const adm1 = readJSON('data/cache/ne_10m_admin_1_states_provinces.geojson');
const rivers = readJSON('data/cache/ne_10m_rivers_lake_centerlines.geojson');
const lakes = readJSON('data/cache/ne_10m_lakes.geojson');

// ---------------------------------------------------------------------------
// Geometry helpers (planar lon/lat via polygon-clipping)
// ---------------------------------------------------------------------------
const toMP = (g) => (!g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
};
const mpArea = (mp) => mp.reduce((s, poly) => s + ringArea(poly[0]) - poly.slice(1).reduce((t, h) => t + ringArea(h), 0), 0);
const bbox = (mp) => {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) {
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y;
  }
  return b;
};
const bboxHit = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
// Snap coordinates to a 1e-5° grid on failure; polygon-clipping is sensitive to near-degenerate input.
const snap = (mp) => mp.map((p) => p.map((r) => r.map(([x, y]) => [Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5])));
let CTX = '';
const safe = (fn, ...args) => {
  try {
    return fn(...args);
  } catch (e) {
    try {
      return fn(...args.map(snap));
    } catch (e2) {
      console.warn(`  clip warning [${CTX}]:`, e2.message);
      return args[0];
    }
  }
};
const inter = (a, b) => (a.length && b.length ? safe(pc.intersection, a, b) : []);
const diff = (a, b) => (a.length && b.length ? safe(pc.difference, a, b) : a);
const union = (...ms) => {
  const xs = ms.filter((m) => m.length);
  if (!xs.length) return [];
  return xs.length === 1 ? xs[0] : safe(pc.union, ...xs);
};
const box = (x0, y0, x1, y1) => [[[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]];
const poly = (pts) => [[[...pts, pts[0]]]];

// ---------------------------------------------------------------------------
// 1936 polities
// ---------------------------------------------------------------------------
const HIST_NAME = {
  'Cambodia': 'FRA', 'Cochin China': 'FRA', 'Laos': 'FRA', 'French Indo-China': 'FRA',
  'Israel': 'GBR', 'Jordan': 'GBR', 'Mandatory Palestine (GB)': 'GBR',
  'Libya': 'ITA', 'Ethiopia (Italy)': 'ITA', 'Eritrea (Italy)': 'ITA', 'Italian Somaliland': 'ITA', 'Dodecanese Islands': 'ITA',
  'Hejaz': 'SAU', 'Hail': 'SAU', "Emirate of Bin Shal'an": 'SAU', 'Saudi Arabia': 'SAU',
  'Mesopotamia (GB)': 'IRQ', 'Yemen (UK)': 'GBR', 'Yemen': 'YEM', 'Egypt': 'EGY', 'Sudan': 'GBR',
  'Philippines': 'USA', 'Puerto Rico': 'USA', 'Guam': 'USA', 'American Samoa': 'USA', 'United States Virgin Islands': 'USA',
  'Chinese warlords': 'CHI', 'Tibet': 'TIB', 'Xinjiang': 'XIN', 'Empire of Japan': 'JAP', 'Saipan': 'JAP',
  'Canada': 'DOM', 'Australia': 'DOM', 'New Zealand': 'DOM', 'Union of South Africa': 'DOM', 'Dominion of Newfoundland': 'DOM',
  'Walbis Bay': 'DOM', 'Papua New Guinea': 'DOM',
  'India': 'GBR', 'British Raj': 'GBR', 'Ireland': 'IRL', 'Oman (British Raj)': 'GBR',
  'United Kingdom': 'GBR', 'United Kingdom of Great Britain and Ireland': 'GBR',
  'Hong Kong': 'GBR', 'Ceylon': 'GBR', 'Malaysia': 'GBR', 'Brunei': 'GBR', 'Kuwait': 'GBR', 'Qatar': 'GBR',
  'Trucial Oman': 'GBR', 'Muscat and Oman': 'GBR', 'Bahamas': 'GBR', 'Jamaica': 'GBR', 'Trinidad': 'GBR', 'Belize': 'GBR',
  'Guyana': 'GBR', 'Gambia, The': 'GBR', 'Fiji': 'GBR', 'Malawi': 'GBR', 'Gold Coast': 'GBR', 'Sierra Leone': 'GBR',
  'Togo': 'FRA', 'French Somaliland': 'FRA', 'French Guiana': 'FRA', 'Martinique': 'FRA', 'Guadeloupe': 'FRA',
  'Guinea-Bissau': 'PRT', 'Burundi': 'BEL', 'Suriname': 'NLD', 'Netherlands Antilles': 'NLD', 'Equatorial Guinea': 'ESP',
  'USSR': 'SOV', 'Armenia': 'SOV', 'Mongolia': 'MNG',
};
const HIST_SUBJECT = {
  'United Kingdom': 'GBR', 'United Kingdom of Great Britain and Ireland': 'GBR', 'France': 'FRA', 'Italy': 'ITA',
  'Belgium': 'BEL', 'Portugal': 'PRT', 'Spain': 'ESP', 'Netherlands': 'NLD', 'United States': 'USA', 'USSR': 'SOV',
};
const HIST_SELF = {
  Germany: 'GER', Poland: 'POL', Czechoslovakia: 'CZE', Hungary: 'HUN', Romania: 'ROM', Yugoslavia: 'YUG',
  Bulgaria: 'BUL', Greece: 'GRE', Turkey: 'TUR', Iran: 'PER', Afghanistan: 'AFG', Sweden: 'SWE', Norway: 'NOR',
  Finland: 'FIN', Denmark: 'DEN', Estonia: 'EST', Latvia: 'LAT', Lithuania: 'LIT', Switzerland: 'SWI', Austria: 'AUS',
  Brazil: 'BRA', Argentina: 'ARG', Mexico: 'MEX', Siam: 'SIA', Spain: 'ESP', Portugal: 'PRT', Italy: 'ITA',
  France: 'FRA', Netherlands: 'NLD', Belgium: 'BEL', Albania: 'ALB', 'Kingdom of Iceland': 'ICE',
};
const histKey = (p) => {
  const n = p.NAME;
  if (!n) return null;
  return HIST_NAME[n] ?? HIST_SELF[n] ?? HIST_SUBJECT[p.SUBJECTO] ?? 'N:' + n;
};

/** Modern countries whose whole territory belonged to one 1936 polity (overrides the historical overlay). */
const FORCE = {
  AUT: 'AUS', CZE: 'CZE', SVK: 'CZE', HUN: 'HUN', DEU: 'GER', IRL: 'IRL', ISL: 'ICE', GRL: 'DEN', FRO: 'DEN',
  ETH: 'ITA', ERI: 'ITA', LBY: 'ITA', SDN: 'GBR', SDS: 'GBR', EGY: 'EGY', KOR: 'JAP', PRK: 'JAP', TWN: 'JAP',
  HKG: 'GBR', MAC: 'PRT', MNG: 'MNG', MDA: 'ROM', ROU: 'ROM', SRB: 'YUG', BIH: 'YUG', MNE: 'YUG', MKD: 'YUG', KOS: 'YUG',
  SYR: 'FRA', LBN: 'FRA', ISR: 'GBR', PSX: 'GBR', JOR: 'GBR', VNM: 'FRA', LAO: 'FRA', KHM: 'FRA',
  MMR: 'GBR', IND: 'GBR', PAK: 'GBR', BGD: 'GBR', LKA: 'GBR', KAS: 'GBR', NPL: 'NEP', BTN: 'BHU', IRQ: 'IRQ',
  SAU: 'SAU', KWT: 'GBR', QAT: 'GBR', ARE: 'GBR', OMN: 'GBR', BHR: 'GBR', IRN: 'PER', AFG: 'AFG',
  SAH: 'ESP', GNQ: 'ESP', NAM: 'DOM', ZAF: 'DOM', LSO: 'GBR', SWZ: 'GBR', BWA: 'GBR', ZWE: 'GBR', ZMB: 'GBR', MWI: 'GBR',
  TZA: 'GBR', KEN: 'GBR', UGA: 'GBR', NGA: 'GBR', SLE: 'GBR', GMB: 'GBR', COD: 'BEL', RWA: 'BEL', BDI: 'BEL',
  AGO: 'PRT', MOZ: 'PRT', GNB: 'PRT', CPV: 'PRT', STP: 'PRT', TLS: 'PRT', LBR: 'LBA', DJI: 'FRA', MDG: 'FRA',
  MYS: 'GBR', SGP: 'GBR', BRN: 'GBR', IDN: 'NLD', PNG: 'DOM', PHL: 'USA', AUS: 'DOM', NZL: 'DOM', CAN: 'DOM',
  USA: 'USA', PRI: 'USA', ALB: 'ALB', ESP: 'ESP', PRT: 'PRT', FRA: 'FRA', ITA: 'ITA', CHE: 'SWI', BEL: 'BEL',
  NLD: 'NLD', LUX: 'LUX', DNK: 'DEN', NOR: 'NOR', SWE: 'SWE', GBR: 'GBR', LVA: 'LAT', JPN: 'JAP', THA: 'SIA',
  // modern disputed/minor units
  TUR: 'TUR', GRC: 'GRE', GEO: 'SOV', AZE: 'SOV', ARM: 'SOV', CMR: 'FRA', GHA: 'GBR', TGO: 'FRA',
  KAB: 'SOV', ESB: 'GBR', CYP: 'GBR', CYN: 'GBR', MLT: 'GBR', GIB: 'GBR', SOL: 'ITA', BRT: 'GBR', SPI: 'ARG',
};
/** Modern countries split between several 1936 polities: use the historical polygons inside them. */
const SPLIT = new Set(['POL', 'RUS', 'UKR', 'BLR', 'LTU', 'EST', 'SVN', 'HRV', 'BGR', 'SOM', 'FIN']);

// Low-saturation strategic palette; accents are handled by overlays, not the base map.
const PALETTE = {
  GER: '#5b6064', ITA: '#6e7650', JAP: '#ad965e', MAN: '#a3a064', GBR: '#93605a', DOM: '#a37a6f', FRA: '#47607f',
  SOV: '#62302f', USA: '#6d8299', ESP: '#94753f', PRT: '#4f7458', NLD: '#a8794c', BEL: '#8a8455', POL: '#8d6f7c',
  CZE: '#5f7380', HUN: '#7d6d55', ROM: '#8a8358', YUG: '#6a5f78', BUL: '#5f7262', GRE: '#6f8597', TUR: '#7a8269',
  PER: '#7e7a5b', AFG: '#6f6a58', SWE: '#7f8a9a', NOR: '#7a6a62', FIN: '#8e8f86', DEN: '#87716a', EST: '#6f7d8a',
  LAT: '#8a7678', LIT: '#7d8a6c', SWI: '#8f6b6b', AUS: '#8b8577', BRA: '#5f7a5f', ARG: '#7f97a3', MEX: '#6f7f5f',
  SIA: '#6c7c8a', SAU: '#8a7f5e', IRQ: '#7b6f58', EGY: '#9a8a68', YEM: '#6f6655', IRL: '#5f7d62', ICE: '#7f8f99',
  ALB: '#8a6a5a', LUX: '#7a8a8a', NEP: '#7a6f6a', BHU: '#7f7a5e', LBA: '#6c7e6c', MNG: '#7a6a72', TUV: '#7d6672',
  DAN: '#9b8e7e',
  // China, mid-1936
  CHI: '#8b7a66', GXC: '#6f8b5c', GDC: '#a06d55', YUN: '#5d8784', SIC: '#978748', SHX: '#5f6f90', XSM: '#7e9787',
  SHD: '#866c8c', HCC: '#a3906c', EHA: '#c3a458', MGG: '#97784c', CCP: '#9e443a', XIN: '#7a7566', TIB: '#8e8070',
};
const NEUTRALS = ['#6b6a5c', '#5f6862', '#6f6563', '#626672', '#706c60', '#5d6658', '#6a6270', '#67705f'];
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const colorOf = (key) => PALETTE[key] ?? NEUTRALS[hash(key) % NEUTRALS.length];

// ---------------------------------------------------------------------------
// Historical reference polygons
// ---------------------------------------------------------------------------
const hist = [];
for (const f of g38.features) {
  const key = histKey(f.properties);
  const mp = toMP(f.geometry);
  if (!key || !mp.length) continue;
  hist.push({key, mp, bb: bbox(mp)});
}
const hist30 = (name) => toMP(g30.features.find((f) => f.properties.NAME === name)?.geometry);
const histJapan = union(...hist.filter((h) => h.key === 'JAP').map((h) => h.mp));

// ---------------------------------------------------------------------------
// 1. Assign modern countries to 1936 owners
// ---------------------------------------------------------------------------
const pieces = []; // {key, mp, src}
const addPiece = (key, mp, src) => mp.length && pieces.push({key, mp, src});

for (const f of adm0.features) {
  const a3 = f.properties.ADM0_A3;
  CTX = a3;
  const mp = toMP(f.geometry);
  if (!mp.length || a3 === 'ATA' || a3 === 'CHN' || a3 === 'YEM') continue;
  if (FORCE[a3]) {
    addPiece(FORCE[a3], mp, a3);
    continue;
  }
  const bb = bbox(mp);
  const areas = new Map();
  const parts = new Map();
  for (const h of hist) {
    if (!bboxHit(bb, h.bb)) continue;
    const x = inter(mp, h.mp);
    const ar = mpArea(x);
    if (ar <= 0) continue;
    areas.set(h.key, (areas.get(h.key) ?? 0) + ar);
    parts.set(h.key, union(parts.get(h.key) ?? [], x));
  }
  if (!areas.size) {
    // Small islands with no historical polygon: nearest historical owner within 4°.
    const c = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
    let best = null;
    let bd = 4;
    for (const h of hist) {
      const d = Math.max(0, h.bb[0] - c[0], c[0] - h.bb[2]) + Math.max(0, h.bb[1] - c[1], c[1] - h.bb[3]);
      if (d < bd) { bd = d; best = h.key; }
    }
    addPiece(best ?? 'N:' + f.properties.NAME, mp, a3);
    continue;
  }
  const ranked = [...areas.entries()].sort((x, y) => y[1] - x[1]);
  const major = ranked[0][0];
  if (!SPLIT.has(a3)) {
    addPiece(major, mp, a3);
    continue;
  }
  let rest = mp;
  for (const [key, ar] of ranked.slice(1)) {
    if (ar < 0.45) continue; // ignore slivers caused by coarse historical borders
    const part = inter(parts.get(key), mp);
    addPiece(key, part, a3);
    rest = diff(rest, part);
  }
  addPiece(major, rest, a3);
  console.log('split', a3, ranked.filter(([, ar]) => ar >= 0.45).map(([k, ar]) => `${k}:${ar.toFixed(1)}`).join(' '));
}

// ---------------------------------------------------------------------------
// 2. China in mid-1936: Manchukuo, Japanese puppets, warlords, the Communist base
// ---------------------------------------------------------------------------
const PROV = {
  Xinjiang: 'XIN', Xizang: 'TIB', Qinghai: 'XSM', Ningxia: 'XSM', Gansu: 'CHI', Shaanxi: 'CHI', Sichuan: 'SIC',
  Chongqing: 'SIC', Yunnan: 'YUN', Guizhou: 'CHI', Guangxi: 'GXC', Guangdong: 'GDC', Hainan: 'GDC', Hunan: 'CHI',
  Hubei: 'CHI', Henan: 'CHI', Anhui: 'CHI', Jiangsu: 'CHI', Zhejiang: 'CHI', Jiangxi: 'CHI', Fujian: 'CHI',
  Shanghai: 'CHI', Shandong: 'SHD', Shanxi: 'SHX', Hebei: 'HCC', Beijing: 'HCC', Tianjin: 'HCC',
  Heilongjiang: 'MAN', Jilin: 'MAN', Liaoning: 'MAN', 'Inner Mongol': 'MGG', 'Paracel Islands': 'GDC',
};
// Sub-provincial 1936 boundaries (approximate, lon/lat).
const MASK = {
  suiyuan: poly([[106.4, 37.6], [108.6, 38.0], [110.4, 38.9], [111.3, 39.7], [112.2, 40.3], [113.9, 40.7], [113.9, 41.5], [112.3, 42.0], [110.0, 42.5], [106.4, 42.4]]),
  alxa: box(96.5, 37.3, 106.4, 43.0),
  eastHebei: poly([[116.7, 40.7], [118.2, 40.5], [119.9, 40.3], [119.9, 39.2], [118.6, 38.95], [117.75, 39.1], [117.25, 39.45], [116.7, 39.75]]),
  kwantung: poly([[120.9, 38.6], [122.6, 38.6], [122.6, 39.45], [121.9, 39.65], [120.9, 39.65]]),
  soviet: poly([[106.9, 36.9], [107.8, 36.3], [109.3, 36.4], [110.3, 36.9], [110.4, 37.7], [109.7, 38.3], [108.4, 38.1], [107.3, 37.8]]),
  spanishMorocco: poly([[-6.3, 34.95], [-6.45, 35.6], [-6.2, 36.2], [-5.0, 36.2], [-3.0, 35.6], [-1.85, 35.35], [-1.95, 34.95], [-3.3, 34.85], [-4.6, 34.82]]),
  ifni: poly([[-10.45, 29.0], [-9.75, 29.05], [-9.75, 29.65], [-10.45, 29.6]]),
  capeJuby: poly([[-13.6, 27.66], [-8.67, 27.66], [-8.67, 28.72], [-11.2, 28.72], [-13.6, 28.1]]),
};
for (const f of adm1.features) {
  if (f.properties.admin !== 'China') continue;
  const name = f.properties.name;
  CTX = name;
  let mp = toMP(f.geometry);
  let key = PROV[name] ?? 'CHI';
  if (name === 'Inner Mongol' || name === 'Hebei') {
    // Jehol and eastern Inner Mongolia belonged to Manchukuo.
    const man = inter(mp, histJapan);
    addPiece('MAN', man, name);
    mp = diff(mp, man);
  }
  if (name === 'Inner Mongol') {
    for (const [k, m] of [['SHX', MASK.suiyuan], ['XSM', MASK.alxa]]) {
      const part = inter(mp, m);
      addPiece(k, part, name);
      mp = diff(mp, part);
    }
  }
  if (name === 'Hebei' || name === 'Tianjin') {
    const part = inter(mp, MASK.eastHebei);
    addPiece('EHA', part, name);
    mp = diff(mp, part);
  }
  if (name === 'Liaoning') {
    const part = inter(mp, MASK.kwantung);
    addPiece('JAP', part, name);
    mp = diff(mp, part);
  }
  if (name === 'Shaanxi' || name === 'Gansu' || name === 'Ningxia') {
    const part = inter(mp, MASK.soviet);
    addPiece('CCP', part, name);
    mp = diff(mp, part);
  }
  addPiece(key, mp, name);
}
// Yemen: the Kingdom (north) vs the British Aden Protectorate (south).
const ADEN = new Set(['`Adan', 'Lahij', "Al Dali'", 'Abyan', 'Shabwah', 'Hadramawt', 'Al Mahrah', 'Socotra']);
for (const f of adm1.features) {
  if (f.properties.admin === 'Yemen') addPiece(ADEN.has(f.properties.name) ? 'GBR' : 'YEM', toMP(f.geometry), 'YEM');
}
// Any part of modern China not covered by admin-1 (e.g. disputed slivers) stays Nationalist.

// ---------------------------------------------------------------------------
// 3. Other 1936 carve-outs
// ---------------------------------------------------------------------------
const carve = (key, mask, fromKeys) => {
  CTX = 'carve ' + key;
  let taken = [];
  for (const p of pieces) {
    if (fromKeys && !fromKeys.includes(p.key)) continue;
    if (!bboxHit(bbox(p.mp), bbox(mask))) continue;
    const x = inter(p.mp, mask);
    if (mpArea(x) <= 0) continue;
    p.mp = diff(p.mp, x);
    taken = union(taken, x);
  }
  addPiece(key, taken, 'carve');
};
const tuva = toMP(adm1.features.find((f) => f.properties.admin === 'Russia' && /Tuva/.test(f.properties.name))?.geometry);
carve('TUV', tuva, ['SOV', 'MNG']);
carve('DAN', hist30('Danzig'), ['POL', 'GER']);
carve('GER', union(hist30('East Prussia'), box(20.4, 54.85, 21.3, 55.32)), ['POL', 'SOV']); // incl. the Curonian Spit
// Western Ukraine by oblast: interwar Poland (Galicia, Volhynia), Czechoslovakia, Romania (Bukovina).
const UA = (n) => toMP(adm1.features.find((f) => f.properties.admin === 'Ukraine' && f.properties.name === n)?.geometry);
carve('POL', union(UA('Volyn'), UA('Rivne'), UA("L'viv"), UA("Ternopil'"), UA("Ivano-Frankivs'k")), ['SOV', 'CZE', 'ROM']);
carve('CZE', UA('Transcarpathia'), ['SOV', 'POL', 'HUN', 'ROM']);
carve('ROM', UA('Chernivtsi'), ['SOV', 'POL']);
carve('FRA', toMP(adm1.features.find((f) => f.properties.admin === 'Turkey' && f.properties.name === 'Hatay')?.geometry), ['TUR']);
carve('ITA', box(26.7, 35.3, 28.4, 37.55), ['GRE']); // Dodecanese
carve('ESP', union(MASK.spanishMorocco, MASK.ifni, MASK.capeJuby), ['FRA']);

const final = pieces.filter((p) => p.mp.length && mpArea(p.mp) > 0);
console.log('pieces', final.length);

// ---------------------------------------------------------------------------
// 4. Dissolve by polity (clean national borders)
// ---------------------------------------------------------------------------
const byKey = new Map();
for (const p of final) byKey.set(p.key, [...(byKey.get(p.key) ?? []), p.mp]);
const dissolved = new Map();
for (const [key, mps] of byKey) {
  CTX = 'dissolve ' + key;
  dissolved.set(key, union(...mps));
}

// d3-geo is winding-aware on the sphere; make every polygon's exterior the small side.
const rewindPolygon = (rings) => (geoArea({type: 'Polygon', coordinates: rings}) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings);
const geo = (mp) => ({type: 'MultiPolygon', coordinates: mp.map(rewindPolygon)});
const toPath = (mp) => pathGen(geo(mp)) ?? '';

// ---------------------------------------------------------------------------
// 5. SVG layers
// ---------------------------------------------------------------------------
const fillPaths = [...dissolved.entries()].map(([key, mp]) => `<path d="${toPath(mp)}" fill="${colorOf(key)}"/>`).join('');
const internal = final.map((p) => `<path d="${toPath(p.mp)}"/>`).join('');
const borders = [...dissolved.values()].map((mp) => `<path d="${toPath(mp)}"/>`).join('');
const lakePaths = lakes.features.filter((f) => (f.properties.scalerank ?? 0) <= 6).map((f) => pathGen(f)).filter(Boolean).join(' ');
const riverPaths = (maxRank) =>
  rivers.features
    .filter((f) => (f.properties.scalerank ?? 9) <= maxRank && f.properties.featurecla !== 'Lake Centerline')
    .map((f) => `<path d="${pathGen(f)}" stroke-width="${(1.9 - f.properties.scalerank * 0.14).toFixed(2)}"/>`)
    .join('');
const grat = pathGen(geoGraticule10());
const landAll = [...dissolved.values()].map((mp) => toPath(mp)).join(' ');

const svgOpen = (vb = `0 0 ${W} ${H}`, w = W, h = H) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">`;
const fillsSVG = (vb, w, h) => `${svgOpen(vb, w, h)}<g>${fillPaths}</g><path d="${lakePaths}" fill="#2c4651"/></svg>`;
const linesSVG = (vb, w, h, detail) => `${svgOpen(vb, w, h)}
<path d="${grat}" fill="none" stroke="#8fb0b8" stroke-opacity="0.13" stroke-width="1.4"/>
<g fill="none" stroke="#5d7f8c" stroke-opacity="${detail ? 0.85 : 0.7}" stroke-linecap="round" stroke-linejoin="round">${riverPaths(detail ? 8 : 6)}</g>
<path d="${lakePaths}" fill="none" stroke="#6f93a0" stroke-opacity="0.7" stroke-width="0.8"/>
<path d="${landAll}" fill="none" stroke="#a9bcb6" stroke-opacity="0.6" stroke-width="1.6" stroke-linejoin="round"/>
<g fill="none" stroke="#1b1f21" stroke-opacity="0.35" stroke-width="0.9" stroke-dasharray="${detail ? '3 2' : 'none'}" stroke-linejoin="round">${internal}</g>
<g fill="none" stroke="#14181a" stroke-opacity="0.9" stroke-width="1.9" stroke-linejoin="round">${borders}</g>
</svg>`;

fs.writeFileSync(path.join(LAYERS, 'world1936.svg'), fillsSVG().replace('</svg>', '') + linesSVG().replace(/^<svg[^>]*>/, ''));

// ---------------------------------------------------------------------------
// 6. Highlight outlines (simplified, map pixel space)
// ---------------------------------------------------------------------------
const simplifyRing = (pts, tol) => {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0;
    let mi = -1;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol && mi > 0) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const simplifiedPath = (mp, tolDeg = 0.04, minArea = 0.02) =>
  toPath(
    mp
      .filter((p) => ringArea(p[0]) > minArea)
      .map((p) => p.map((r) => simplifyRing(r, tolDeg)).filter((r) => r.length >= 4)),
  );
const HIGHLIGHT = ['GER', 'ITA', 'JAP', 'MAN', 'GBR', 'FRA', 'SOV', 'USA', 'CHI', 'ESP', 'AUS', 'POL', 'CZE',
  'GXC', 'GDC', 'YUN', 'SIC', 'SHX', 'XSM', 'SHD', 'HCC', 'EHA', 'MGG', 'CCP', 'XIN', 'TIB'];
const polities = {};
for (const k of HIGHLIGHT) if (dissolved.has(k)) polities[k] = simplifiedPath(dissolved.get(k));
polities.ETH = simplifiedPath(toMP(adm0.features.find((f) => f.properties.ADM0_A3 === 'ETH').geometry));
polities.JAPAN_SPHERE = simplifiedPath(union(dissolved.get('JAP'), dissolved.get('MAN'), dissolved.get('EHA') ?? []));
fs.writeFileSync(path.join(ROOT, 'src/assets/data/polities.json'), JSON.stringify({width: W, height: H, palette: PALETTE, paths: polities}));

// ---------------------------------------------------------------------------
// 7. Rasterise layers for every target (world + detail patches)
// ---------------------------------------------------------------------------
const targets = [{id: 'world', x0: 0, y0: 0, w: W, h: H, scale: 1}];
for (const p of cfg.detailPatches ?? []) {
  targets.push({
    id: p.id,
    x0: (p.lon[0] + 180) * PX_PER_DEG,
    y0: (cfg.latTop - p.lat[1]) * PX_PER_DEG,
    w: (p.lon[1] - p.lon[0]) * PX_PER_DEG,
    h: (p.lat[1] - p.lat[0]) * PX_PER_DEG,
    scale: p.scale,
  });
}
const {chromium} = require('playwright');
// One fresh browser per layer keeps memory bounded; retry because huge captures occasionally fail.
const rasterise = async (svg, pw, ph, out) => {
  for (let attempt = 1; ; attempt++) {
    const b = await chromium.launch();
    try {
      const page = await b.newPage({viewport: {width: pw, height: ph}, deviceScaleFactor: 1});
      page.setDefaultTimeout(600000);
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
      await page.screenshot({path: out, omitBackground: true, clip: {x: 0, y: 0, width: pw, height: ph}});
      return;
    } catch (e) {
      if (attempt >= 4) throw e;
      console.warn('  retry', path.basename(out), e.message.split('\n')[0]);
    } finally {
      await b.close();
    }
  }
};
for (const t of targets) {
  const pw = Math.round(t.w * t.scale);
  const ph = Math.round(t.h * t.scale);
  const vb = `${t.x0} ${t.y0} ${t.w} ${t.h}`;
  await rasterise(fillsSVG(vb, pw, ph), pw, ph, path.join(LAYERS, `${t.id}-fills.png`));
  await rasterise(linesSVG(vb, pw, ph, t.scale > 1), pw, ph, path.join(LAYERS, `${t.id}-lines.png`));
  console.log('layers', t.id, pw, 'x', ph);
}
const browser = await chromium.launch();

// ---------------------------------------------------------------------------
// 8. Cloud + grain textures
// ---------------------------------------------------------------------------
const tex = await browser.newPage({viewport: {width: 2048, height: 1024}});
const cloudsData = await tex.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const x = c.getContext('2d');
  let s = 12345;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const cx = r() * 2048, cy = r() * 1024, rad = 30 + r() * 140;
    const a = 0.05 + r() * 0.16;
    const sx = 1.5 + r() * 2, rot = r() * 0.4;
    // Wrapped copies so the texture tiles seamlessly.
    for (const ox of [-2048, 0, 2048]) for (const oy of [-1024, 0, 1024]) {
      x.save();
      x.translate(cx + ox, cy + oy); x.rotate(rot); x.scale(sx, 1);
      const g2 = x.createRadialGradient(0, 0, 0, 0, 0, rad);
      g2.addColorStop(0, `rgba(215,222,220,${a})`);
      g2.addColorStop(0.5, `rgba(215,222,220,${a * 0.45})`);
      g2.addColorStop(1, 'rgba(215,222,220,0)');
      x.fillStyle = g2;
      x.beginPath(); x.arc(0, 0, rad, 0, Math.PI * 2); x.fill();
      x.restore();
    }
  }
  return c.toDataURL('image/png');
});
fs.writeFileSync(path.join(ROOT, 'src/assets/textures/clouds.png'), Buffer.from(cloudsData.split(',')[1], 'base64'));
const grainData = await tex.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  const img = x.createImageData(512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
});
fs.writeFileSync(path.join(ROOT, 'src/assets/textures/grain.png'), Buffer.from(grainData.split(',')[1], 'base64'));
await browser.close();
console.log('done');
