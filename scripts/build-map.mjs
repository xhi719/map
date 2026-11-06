/**
 * Builds the 1936 world map assets from historical GeoJSON.
 *
 *   data/source/world_1938.geojson  (base borders, aourednik/historical-basemaps, GPL-3.0)
 *   data/source/world_1930.geojson  (used to restore pre-Anschluss Austria for 1936)
 *
 * Outputs (all replaceable):
 *   src/assets/map/world1936.svg        vector master
 *   src/assets/map/world1936.jpg        8192px raster used by the trailer
 *   src/assets/data/polities.json       outline paths of key powers for animated highlights
 *   src/assets/textures/clouds.png      parallax cloud layer
 *   src/assets/textures/grain.png       film grain tile
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {geoEquirectangular, geoPath, geoGraticule10, geoArea} from 'd3-geo';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/map.json'), 'utf8'));
const W = cfg.width;
const PX_PER_DEG = W / (cfg.lonRight - cfg.lonLeft);
const H = Math.round((cfg.latTop - cfg.latBottom) * PX_PER_DEG);

const projection = geoEquirectangular()
  .scale(W / (2 * Math.PI))
  .translate([W / 2, cfg.latTop * PX_PER_DEG])
  .precision(0.1);
const pathGen = geoPath(projection);
pathGen.digits?.(1);

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/source', f), 'utf8'));
const g38 = read('world_1938.geojson');
const g30 = read('world_1930.geojson');

// ---------------------------------------------------------------------------
// 1936 political assignment. Key -> palette entry. Colonies take the colour of
// their colonial power so that the imperial structure reads at a glance.
// ---------------------------------------------------------------------------
const POLITY_BY_NAME = {
  'Cambodia': 'FRA', 'Cochin China': 'FRA', 'Laos': 'FRA', 'French Indo-China': 'FRA',
  'Israel': 'GBR', 'Jordan': 'GBR', 'Mandatory Palestine (GB)': 'GBR',
  'Libya': 'ITA', 'Ethiopia (Italy)': 'ITA', 'Eritrea (Italy)': 'ITA', 'Italian Somaliland': 'ITA',
  'Dodecanese Islands': 'ITA',
  'Hejaz': 'SAU', 'Hail': 'SAU', "Emirate of Bin Shal'an": 'SAU', 'Saudi Arabia': 'SAU',
  'Mesopotamia (GB)': 'IRQ',
  'Yemen (UK)': 'GBR', 'Yemen': 'YEM',
  'Egypt': 'EGY',
  'Philippines': 'USA', 'Puerto Rico': 'USA', 'Guam': 'USA', 'American Samoa': 'USA',
  'United States Virgin Islands': 'USA',
  'Chinese warlords': 'CHN', 'Tibet': 'TIB', 'Xinjiang': 'XIN',
  'Empire of Japan': 'JAP', 'Saipan': 'JAP',
  'Canada': 'DOM', 'Australia': 'DOM', 'New Zealand': 'DOM', 'Union of South Africa': 'DOM',
  'Dominion of Newfoundland': 'DOM', 'India': 'GBR', 'British Raj': 'GBR', 'Ireland': 'IRL',
  'United Kingdom': 'GBR', 'United Kingdom of Great Britain and Ireland': 'GBR',
  'Hong Kong': 'GBR', 'Ceylon': 'GBR', 'Malaysia': 'GBR', 'Brunei': 'GBR', 'Kuwait': 'GBR',
  'Qatar': 'GBR', 'Trucial Oman': 'GBR', 'Muscat and Oman': 'GBR', 'Oman (British Raj)': 'GBR',
  'Bahamas': 'GBR', 'Jamaica': 'GBR', 'Trinidad': 'GBR', 'Belize': 'GBR', 'Guyana': 'GBR',
  'Gambia, The': 'GBR', 'Fiji': 'GBR', 'Malawi': 'GBR', 'Walbis Bay': 'DOM',
  'Gold Coast': 'GBR', 'Togo': 'FRA', 'French Somaliland': 'FRA', 'French Guiana': 'FRA',
  'Guinea-Bissau': 'PRT', 'Burundi': 'BEL', 'Suriname': 'NLD', 'Netherlands Antilles': 'NLD',
  'Martinique': 'FRA', 'Guadeloupe': 'FRA', 'Equatorial Guinea': 'ESP',
  'USSR': 'SOV', 'Armenia': 'SOV', 'Mongolia': 'MNG',
};
const POLITY_BY_SUBJECT = {
  'United Kingdom': 'GBR', 'United Kingdom of Great Britain and Ireland': 'GBR',
  'France': 'FRA', 'Italy': 'ITA', 'Belgium': 'BEL', 'Portugal': 'PRT', 'Spain': 'ESP',
  'Netherlands': 'NLD', 'United States': 'USA', 'USSR': 'SOV',
};
const NAMED = {
  Germany: 'GER', Poland: 'POL', Czechoslovakia: 'CZE', Hungary: 'HUN', Romania: 'ROM',
  Yugoslavia: 'YUG', Bulgaria: 'BUL', Greece: 'GRE', Turkey: 'TUR', Iran: 'PER',
  Afghanistan: 'AFG', Sweden: 'SWE', Norway: 'NOR', Finland: 'FIN', Denmark: 'DEN',
  Estonia: 'BAL', Latvia: 'BAL', Lithuania: 'BAL', Switzerland: 'SWI', Austria: 'AUS',
  Brazil: 'BRA', Argentina: 'ARG', Mexico: 'MEX', Siam: 'SIA', Spain: 'ESP', Portugal: 'PRT',
  Italy: 'ITA', France: 'FRA', Netherlands: 'NLD', Belgium: 'BEL',
};

// Low-saturation strategic palette; accents are handled by overlays, not the base map.
const PALETTE = {
  GER: '#5b6064', ITA: '#6e7650', JAP: '#a8925c', GBR: '#93605a', DOM: '#a37a6f',
  FRA: '#47607f', SOV: '#62302f', USA: '#6d8299', CHN: '#8b7a66', TIB: '#7d7366',
  XIN: '#7a7566', MNG: '#7a6a72', ESP: '#94753f', PRT: '#4f7458', NLD: '#a8794c',
  BEL: '#8a8455', POL: '#8d6f7c', CZE: '#5f7380', HUN: '#7d6d55', ROM: '#8a8358',
  YUG: '#6a5f78', BUL: '#5f7262', GRE: '#6f8597', TUR: '#7a8269', PER: '#7e7a5b',
  AFG: '#6f6a58', SWE: '#7f8a9a', NOR: '#7a6a62', FIN: '#8e8f86', DEN: '#87716a',
  BAL: '#7e7b88', SWI: '#8f6b6b', AUS: '#8b8577', BRA: '#5f7a5f', ARG: '#7f97a3',
  MEX: '#6f7f5f', SIA: '#6c7c8a', SAU: '#8a7f5e', IRQ: '#7b6f58', EGY: '#9a8a68',
  YEM: '#6f6655', IRL: '#5f7d62',
};
const NEUTRALS = ['#6b6a5c', '#5f6862', '#6f6563', '#626672', '#706c60', '#5d6658', '#6a6270', '#67705f'];

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const polityOf = (p) => {
  const name = p.NAME;
  if (!name) return null;
  if (POLITY_BY_NAME[name]) return POLITY_BY_NAME[name];
  if (NAMED[name]) return NAMED[name];
  if (p.SUBJECTO && POLITY_BY_SUBJECT[p.SUBJECTO]) return POLITY_BY_SUBJECT[p.SUBJECTO];
  return 'N:' + name;
};
const colorOf = (key) => PALETTE[key] ?? NEUTRALS[hash(key) % NEUTRALS.length];

// The source data mixes ring orientations; d3-geo is winding-aware on the sphere,
// so a reversed ring would fill the whole globe. Normalise every polygon.
const rewindPolygon = (rings) => {
  const poly = {type: 'Polygon', coordinates: rings};
  return geoArea(poly) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings;
};
const rewind = (f) => {
  const g = f.geometry;
  if (!g) return f;
  if (g.type === 'Polygon') g.coordinates = rewindPolygon(g.coordinates);
  if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(rewindPolygon);
  return f;
};
g38.features.forEach(rewind);
g30.features.forEach(rewind);

const features = [];
for (const f of g38.features) {
  const key = polityOf(f.properties) ?? 'N:island';
  features.push({key, f});
}
// Restore Austria (independent until March 1938) on top of Germany.
const austria = g30.features.find((f) => f.properties.NAME === 'Austria');
if (austria) features.push({key: 'AUS', f: austria});

// ---------------------------------------------------------------------------
// SVG master
// ---------------------------------------------------------------------------
const land = features.map(({key, f}) => ({key, d: pathGen(f)})).filter((x) => x.d);
const grat = pathGen(geoGraticule10());

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="ocean" cx="50%" cy="45%" r="75%">
    <stop offset="0" stop-color="#1b2b33"/><stop offset="0.6" stop-color="#132028"/><stop offset="1" stop-color="#0a1217"/>
  </radialGradient>
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.07 0"/>
    <feComposite in2="SourceGraphic" operator="in"/>
  </filter>
  <filter id="mottle" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="4" seed="3"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 -0.05"/>
  </filter>
  <filter id="coastGlow"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#ocean)"/>
<path d="${grat}" fill="none" stroke="#5f7b86" stroke-opacity="0.18" stroke-width="1.6"/>
<g filter="url(#coastGlow)" opacity="0.55">${land.map((l) => `<path d="${l.d}" fill="none" stroke="#6f8f96" stroke-width="10"/>`).join('')}</g>
<g stroke="#9db0ac" stroke-opacity="0.55" stroke-width="3.2" stroke-linejoin="round" fill="none">${land.map((l) => `<path d="${l.d}"/>`).join('')}</g>
<g stroke-linejoin="round">${land.map((l) => `<path d="${l.d}" fill="${colorOf(l.key)}"/>`).join('')}</g>
<clipPath id="landClip">${land.map((l) => `<path d="${l.d}"/>`).join('')}</clipPath>
<rect width="${W}" height="${H}" filter="url(#mottle)" clip-path="url(#landClip)"/>
<g stroke="#15191b" stroke-opacity="0.85" stroke-width="2.2" stroke-linejoin="round" fill="none">${land.map((l) => `<path d="${l.d}"/>`).join('')}</g>
<rect width="${W}" height="${H}" fill="#fff" filter="url(#paper)"/>
</svg>`;
fs.writeFileSync(path.join(ROOT, 'src/assets/map/world1936.svg'), svg);

// ---------------------------------------------------------------------------
// Highlight outlines for key powers (in map pixel coordinates)
// ---------------------------------------------------------------------------
const KEYS = ['GER', 'ITA', 'JAP', 'GBR', 'FRA', 'SOV', 'USA', 'CHN', 'ESP', 'AUS', 'POL', 'CZE'];
const polities = {};
for (const k of KEYS) {
  polities[k] = land.filter((l) => l.key === k).map((l) => l.d).join(' ');
}
// Ethiopia (conquered by Italy in May 1936) separately, for the Africa scene.
const eth = g38.features.find((f) => f.properties.NAME === 'Ethiopia (Italy)');
if (eth) polities.ETH = pathGen(eth);
const manchuria = g30.features.find((f) => f.properties.NAME === 'Manchuria');
if (manchuria) polities.MAN = pathGen(manchuria);
fs.writeFileSync(
  path.join(ROOT, 'src/assets/data/polities.json'),
  JSON.stringify({width: W, height: H, palette: PALETTE, paths: polities}),
);

// ---------------------------------------------------------------------------
// Rasterise with the pre-installed Chromium (Playwright)
// ---------------------------------------------------------------------------
const {chromium} = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
await page.setContent(`<html><body style="margin:0;background:#000">${svg}</body></html>`);
await page.screenshot({path: path.join(ROOT, 'src/assets/map/world1936.jpg'), type: 'jpeg', quality: 92, clip: {x: 0, y: 0, width: W, height: H}});
console.log('map', W, 'x', H);

// High-resolution detail patches (same SVG, cropped viewBox, rendered at N× density).
for (const patch of cfg.detailPatches ?? []) {
  const x0 = (patch.lon[0] + 180) * PX_PER_DEG;
  const y0 = (cfg.latTop - patch.lat[1]) * PX_PER_DEG;
  const w = (patch.lon[1] - patch.lon[0]) * PX_PER_DEG;
  const h = (patch.lat[1] - patch.lat[0]) * PX_PER_DEG;
  const pw = Math.round(w * patch.scale);
  const ph = Math.round(h * patch.scale);
  const hi = svg
    .replace(`width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`, `width="${pw}" height="${ph}" viewBox="${x0} ${y0} ${w} ${h}"`)
    ;
  const pg = await browser.newPage({viewport: {width: pw, height: ph}, deviceScaleFactor: 1});
  await pg.setContent(`<html><body style="margin:0;background:#000">${hi}</body></html>`);
  await pg.screenshot({path: path.join(ROOT, `src/assets/map/detail-${patch.id}.jpg`), type: 'jpeg', quality: 88, clip: {x: 0, y: 0, width: pw, height: ph}});
  await pg.close();
  console.log('patch', patch.id, pw, 'x', ph);
}

// Cloud + grain textures, drawn procedurally on a canvas.
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
    // Draw wrapped copies so the texture tiles seamlessly.
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
