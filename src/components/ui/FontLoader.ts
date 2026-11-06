import {continueRender, delayRender} from 'remotion';
import b400 from '../../assets/fonts/barlow-condensed-latin-400-normal.woff2';
import b600 from '../../assets/fonts/barlow-condensed-latin-600-normal.woff2';
import b700 from '../../assets/fonts/barlow-condensed-latin-700-normal.woff2';
import m400 from '../../assets/fonts/ibm-plex-mono-latin-400-normal.woff2';

const FONTS: [string, string, string][] = [
  ['Barlow Condensed', b400, '400'],
  ['Barlow Condensed', b600, '600'],
  ['Barlow Condensed', b700, '700'],
  ['IBM Plex Mono', m400, '400'],
];

let started = false;
/** Loads bundled fonts once and blocks rendering until they are ready. */
export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('fonts');
  Promise.all(
    FONTS.map(([family, url, weight]) => {
      const face = new FontFace(family, `url(${url}) format('woff2')`, {weight});
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};
