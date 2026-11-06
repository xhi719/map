/**
 * Procedural placeholder audio. Generates a dark, pre-war orchestral-style score
 * (drones, string ostinato, timpani, brass swells) plus separate SFX one-shots.
 * Replace any file in src/assets/audio with a real recording of the same name.
 *
 * Section timings (seconds) follow src/config/scenes.ts.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SR = 44100;
const OUT = (p) => path.join(ROOT, 'src/assets/audio', p);

// ---------------------------------------------------------------- helpers
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

function writeWav(file, L, R = L) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let peak = 1e-9;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = Math.min(1, 0.92 / peak);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(clamp(Math.tanh(L[i] * g * 1.1) * 32767, -32768, 32767)), 44 + i * 4);
    buf.writeInt16LE(Math.round(clamp(Math.tanh(R[i] * g * 1.1) * 32767, -32768, 32767)), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, buf);
  console.log('wrote', path.relative(ROOT, file), (n / SR).toFixed(1) + 's');
}

class LP { // one-pole low-pass
  constructor(fc) { this.y = 0; this.set(fc); }
  set(fc) { this.a = 1 - Math.exp((-2 * Math.PI * fc) / SR); }
  run(x) { return (this.y += this.a * (x - this.y)); }
}
class BP { // state-variable band-pass
  constructor() { this.lo = 0; this.bp = 0; }
  run(x, fc, q = 2) {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    const hi = x - this.lo - this.bp / q;
    this.bp += f * hi; this.lo += f * this.bp;
    return this.bp;
  }
}

/** Schroeder reverb, returns [L, R]. */
function reverb(x, mix = 0.3, size = 1) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round(d * size));
  const out = [new Float32Array(x.length), new Float32Array(x.length)];
  for (let ch = 0; ch < 2; ch++) {
    const wet = new Float32Array(x.length);
    combs.forEach((d0, ci) => {
      const d = d0 + ch * 23 + ci;
      const line = new Float32Array(d);
      let idx = 0, lp = 0;
      for (let i = 0; i < x.length; i++) {
        const y = line[idx];
        lp = y * 0.6 + lp * 0.4;
        line[idx] = x[i] + lp * 0.84;
        idx = (idx + 1) % d;
        wet[i] += y / combs.length;
      }
    });
    for (const d of [225 + ch * 7, 556 + ch * 11]) {
      const line = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < x.length; i++) {
        const b = line[idx];
        const y = -wet[i] + b;
        line[idx] = wet[i] + b * 0.5;
        idx = (idx + 1) % d;
        wet[i] = y;
      }
    }
    for (let i = 0; i < x.length; i++) out[ch][i] = x[i] * (1 - mix) + wet[i] * mix * 2.2;
  }
  return out;
}

// --------------------------------------------------------------- the score
const S = {europe: 8.13, iberia: 18.13, eastAsia: 24.2, africa: 36.4, americas: 46.4, montage: 57.67, climax: 65.13, ending: 75.8, title: 76.8, end: 84.8};
const DUR = S.end + 0.2;
const N = Math.round(DUR * SR);
const mix = new Float32Array(N);

// 1) Low string drone (D minor), detuned saws through a slowly opening filter.
{
  const voices = [38, 45, 50, 53, 57].map((n, i) => ({f: midi(n), ph: [0, 0, 0], lp: new LP(300), g: [0.5, 0.35, 0.25, 0.2, 0.16][i]}));
  // Chord changes (root shifts) for harmonic motion.
  const prog = [[0, 0], [S.eastAsia, -2], [S.africa, -4], [S.americas, -2], [S.montage, 0], [S.climax, -4], [S.climax + 2.5, -2], [S.climax + 5, -5], [S.climax + 7.5, -1], [S.ending, 0]];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let shift = 0;
    for (const [at, s] of prog) if (t >= at) shift = s;
    const env = 0.25 + 0.55 * smooth(ramp(t, 0, 10)) + 0.4 * smooth(ramp(t, S.montage, S.climax + 6)) - 0.5 * smooth(ramp(t, S.climax + 9.5, S.ending));
    const endEnv = t > S.title ? 1.1 * Math.exp(-(t - S.title) / 4.5) : 1;
    const cut = 220 + 900 * smooth(ramp(t, S.europe, S.montage)) + 1200 * smooth(ramp(t, S.montage, S.climax + 5));
    let s = 0;
    voices.forEach((v, vi) => {
      const f = v.f * Math.pow(2, (vi < 2 ? shift : shift * (vi === 3 ? 1 : 1)) / 12);
      for (let k = 0; k < 3; k++) {
        v.ph[k] += (f * (1 + (k - 1) * 0.004)) / SR;
        v.ph[k] -= Math.floor(v.ph[k]);
        s += (v.ph[k] * 2 - 1) * v.g / 3;
      }
      v.lp.set(cut);
    });
    let y = 0;
    for (const v of voices) y = v.lp.run(s); // shared signal, cascaded filters
    const trem = 1 + 0.08 * Math.sin(2 * Math.PI * 5.2 * t);
    mix[i] += y * env * Math.max(endEnv, 0) * trem * 0.5;
  }
}

// 2) Sub rumble, intro.
{
  const lp = new LP(60);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const e = smooth(ramp(t, 0, 3)) * (1 - smooth(ramp(t, 8, 12))) + 0.6 * smooth(ramp(t, S.climax - 3, S.climax)) * (1 - ramp(t, S.ending - 1, S.ending));
    mix[i] += lp.run(rnd()) * e * 2.2;
  }
}

// 3) String ostinato: eighth notes at 96 BPM from Europe to the end of the climax.
{
  const eighth = 60 / 96 / 2;
  const pattern = [0, 0, 0, 3, 0, 0, -2, 0, 0, 0, 0, 5, 3, 0, -2, -4];
  const lp = new LP(1200);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    if (t < S.europe || t > S.ending - 0.3) continue;
    const step = Math.floor((t - S.europe) / eighth);
    const local = (t - S.europe) - step * eighth;
    let root = 50; // D3
    if (t >= S.eastAsia && t < S.africa) root = 48;
    if (t >= S.africa && t < S.americas) root = 46;
    if (t >= S.americas && t < S.montage) root = 48;
    const f = midi(root + pattern[step % pattern.length]);
    ph += f / SR; ph -= Math.floor(ph);
    ph2 += (f * 1.005) / SR; ph2 -= Math.floor(ph2);
    const env = Math.exp(-local * 9) * (1 - Math.exp(-local * 300));
    const intensity = 0.25 + 0.35 * ramp(t, S.europe, S.americas) + 0.5 * ramp(t, S.montage, S.climax + 4);
    lp.set(700 + 2000 * intensity);
    mix[i] += lp.run((ph * 2 - 1) + (ph2 * 2 - 1)) * env * intensity * 0.32;
  }
}

// 4) Timpani hits.
const timpaniAt = [];
for (const at of [2.33, S.europe, S.iberia, S.eastAsia, S.africa, S.americas]) timpaniAt.push([at, 0.8]);
for (let k = 0; k < 6; k++) timpaniAt.push([S.montage + k * 1.367, 0.8 + k * 0.05]);
for (let b = 0; b < 16; b++) timpaniAt.push([S.climax + b * 0.625, b % 4 === 0 ? 1 : 0.55]);
timpaniAt.push([S.title, 1.4]);
for (const [at, amp] of timpaniAt) {
  const i0 = Math.round(at * SR);
  const lp = new LP(500);
  let ph = 0;
  for (let j = 0; j < SR * 2.5 && i0 + j < N; j++) {
    const t = j / SR;
    const f = 52 + 40 * Math.exp(-t * 18);
    ph += f / SR;
    const body = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 2.2);
    const skin = lp.run(rnd()) * Math.exp(-t * 25) * 1.5;
    mix[i0 + j] += (body + skin) * amp * 0.75;
  }
}

// 5) Brass swells in the climax and the title chord.
{
  const chords = [
    [S.climax, [50, 53, 57, 62]], [S.climax + 2.5, [48, 53, 57, 60]], [S.climax + 5, [45, 50, 53, 57]],
    [S.climax + 7.5, [49, 52, 57, 61]], [S.title, [38, 50, 53, 57, 62, 65]],
  ];
  chords.forEach(([at, notes], ci) => {
    const len = ci === chords.length - 1 ? DUR - at : 2.6;
    const i0 = Math.round(at * SR);
    const lp = new LP(400);
    const phs = notes.map(() => 0);
    for (let j = 0; j < len * SR && i0 + j < N; j++) {
      const t = j / SR;
      const att = ci === chords.length - 1 ? 1 - Math.exp(-t * 30) : smooth(ramp(t, 0, 0.9));
      const rel = ci === chords.length - 1 ? Math.exp(-t / 3.2) : 1 - smooth(ramp(t, len - 0.6, len));
      let s = 0;
      notes.forEach((n, k) => {
        phs[k] += midi(n) * (1 + 0.003 * Math.sin(t * 5 + k)) / SR;
        phs[k] -= Math.floor(phs[k]);
        s += phs[k] * 2 - 1;
      });
      lp.set(300 + 1600 * att * rel);
      mix[i0 + j] += lp.run(s / notes.length) * att * rel * 0.9;
    }
  });
}

const [ML, MR] = reverb(mix, 0.32, 1.2);
// Master fade.
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = smooth(ramp(t, 0, 1.5)) * (1 - smooth(ramp(t, DUR - 3, DUR)));
  ML[i] *= g; MR[i] *= g;
}
writeWav(OUT('music/score.wav'), ML, MR);

// ------------------------------------------------------------------- SFX
const sfx = (dur, fn, rev = 0.2) => {
  const x = new Float32Array(Math.round(dur * SR));
  fn(x);
  return reverb(x, rev, 0.8);
};

const [wL, wR] = sfx(1.6, (x) => {
  const bp = new BP();
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const p = t / 1.6;
    const fc = 300 + 2600 * Math.sin(Math.PI * Math.min(1, p * 1.1));
    x[i] = bp.run(rnd(), fc, 1.4) * Math.sin(Math.PI * p) ** 1.6 * 0.9;
  }
});
writeWav(OUT('sfx/whoosh.wav'), wL, wR);

const [iL, iR] = sfx(3.5, (x) => {
  const lp = new LP(900);
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    ph += (38 + 70 * Math.exp(-t * 10)) / SR;
    x[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 1.3) * 1.1 + lp.run(rnd()) * Math.exp(-t * 7) * 1.2;
  }
}, 0.35);
writeWav(OUT('sfx/impact.wav'), iL, iR);

const [bL, bR] = sfx(0.35, (x) => {
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const f = t < 0.07 ? 1180 : 1580;
    x[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-((t % 0.07) * 30)) * (t < 0.16 ? 0.5 : 0);
  }
}, 0.25);
writeWav(OUT('sfx/blip.wav'), bL, bR);

const [tL, tR] = sfx(0.2, (x) => {
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = (Math.sin(2 * Math.PI * 2400 * t) * 0.5 + Math.sin(2 * Math.PI * 620 * t) * 0.5) * Math.exp(-t * 60) * 0.7;
  }
}, 0.15);
writeWav(OUT('sfx/tick.wav'), tL, tR);

const [sL, sR] = sfx(1.8, (x) => {
  const bp = new BP();
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const p = t / 1.8;
    ph += (1800 + 4200 * p) / SR;
    x[i] = (bp.run(rnd(), 3000 + 5000 * p, 3) * 0.6 + Math.sin(2 * Math.PI * ph) * 0.08) * Math.sin(Math.PI * p) ** 2;
  }
}, 0.4);
writeWav(OUT('sfx/sweep.wav'), sL, sR);

const [rL, rR] = sfx(3.2, (x) => {
  const bp = new BP();
  let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    const p = t / 3.2;
    ph += (80 * Math.pow(2, p * 3)) / SR; ph -= Math.floor(ph);
    x[i] = (bp.run(rnd(), 400 + 4000 * p * p, 1.5) * 0.7 + (ph * 2 - 1) * 0.15) * p * p * (p < 0.97 ? 1 : (1 - p) / 0.03);
  }
}, 0.3);
writeWav(OUT('sfx/riser.wav'), rL, rR);
