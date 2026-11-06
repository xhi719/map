/** Render preview stills: node scripts/stills.mjs <outDir> <frame> [frame...] */
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: 'Trailer', browserExecutable, chromiumOptions: {gl: 'angle'}});
for (const f of frames) {
  const t = Date.now();
  await renderStill({composition, serveUrl, frame: Number(f), output: path.join(outDir, `f${f}.jpg`), imageFormat: 'jpeg', scale: Number(process.env.SCALE ?? 0.5), browserExecutable, chromiumOptions: {gl: 'angle'}});
  console.log('frame', f, Date.now() - t, 'ms');
}
