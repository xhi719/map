import type {CameraPath} from '../components/camera/CameraMotion';
import {LOC} from './locations';

/**
 * Master timeline. Each scene has a duration (frames @30fps) and the transition
 * that leads OUT of it into the next scene. Transitions overlap the two scenes,
 * so total length = sum(durations) - sum(transition lengths).
 *
 * Camera paths are scene-relative and listed next to each scene so shots can be
 * re-timed or re-framed without touching scene components.
 */
export type TransitionKind = 'cut' | 'fade' | 'dip' | 'lightSweep' | 'mapOverlay' | 'uiInterface' | 'slide';

export type SceneId =
  | 'intro' | 'europe' | 'iberia' | 'eastAsia' | 'africa' | 'americas' | 'montage' | 'climax' | 'ending';

export type SceneConfig = {
  id: SceneId;
  duration: number;
  out?: {kind: TransitionKind; frames: number};
};

export const SCENES: SceneConfig[] = [
  {id: 'intro', duration: 270, out: {kind: 'lightSweep', frames: 26}},
  {id: 'europe', duration: 300, out: {kind: 'cut', frames: 0}},
  {id: 'iberia', duration: 210, out: {kind: 'mapOverlay', frames: 28}},
  {id: 'eastAsia', duration: 390, out: {kind: 'uiInterface', frames: 24}},
  {id: 'africa', duration: 330, out: {kind: 'dip', frames: 30}},
  {id: 'americas', duration: 360, out: {kind: 'slide', frames: 22}},
  {id: 'montage', duration: 246, out: {kind: 'lightSweep', frames: 22}},
  {id: 'climax', duration: 360, out: {kind: 'fade', frames: 40}},
  {id: 'ending', duration: 270},
];

export const totalFrames = () =>
  SCENES.reduce((acc, s) => acc + s.duration - (s.out?.frames ?? 0), 0);

/** Absolute start frame of each scene in the final timeline (for audio cues etc). */
export const sceneStart = (id: SceneId) => {
  let t = 0;
  for (const s of SCENES) {
    if (s.id === id) return t;
    t += s.duration - (s.out?.frames ?? 0);
  }
  throw new Error(`unknown scene ${id}`);
};

const WORLD = 0.24; // zoom at which the whole map width fits the frame

export const CAMERAS: Record<Exclude<SceneId, 'montage'>, CameraPath> & {montage: CameraPath[]} = {
  // 1. Top-down world, slow zoom OUT.
  intro: {
    keys: [
      {at: 0, center: [20, 28], zoom: 0.34, tilt: 0},
      {at: 270, center: [12, 22], zoom: WORLD, tilt: 6, ease: 'out'},
    ],
    drift: 3,
  },
  // 2. Slow zoom IN onto Europe, then pitch into an oblique view with a slight yaw.
  europe: {
    keys: [
      {at: 0, center: [8, 40], zoom: 0.42, tilt: 0},
      {at: 140, center: [12, 49], zoom: 1.05, tilt: 8, ease: 'inOut'},
      {at: 300, center: [12, 50.5], zoom: 1.45, tilt: 52, rotate: -9, ease: 'inOut'},
    ],
  },
  // 3. Hard cut to a low tracking shot gliding diagonally across Iberia.
  iberia: {
    keys: [
      {at: 0, center: [-5.4, 38.8], zoom: 4.0, tilt: 58, rotate: 22},
      {at: 210, center: [-2.6, 40.9], zoom: 4.6, tilt: 54, rotate: 30, ease: 'linear'},
    ],
    drift: 4,
  },
  // 4. Lateral pan (W→E) across Asia, then close-up on Manchuria/Korea with a slow yaw.
  eastAsia: {
    keys: [
      {at: 0, center: [86, 36], zoom: 0.95, tilt: 36, rotate: 0},
      {at: 150, center: [110, 33], zoom: 1.05, tilt: 38, rotate: 0, ease: 'inOut'},
      {at: 225, center: [113, 35.5], zoom: 1.2, tilt: 42, rotate: 4, ease: 'glide'},
      {at: 360, center: [126, 40.5], zoom: 2.0, tilt: 46, rotate: 12, ease: 'inOut'},
      {at: 390, center: [127, 40.8], zoom: 2.12, tilt: 47, rotate: 14, ease: 'linear'},
    ],
  },
  // 5. Vertical move N→S down the Red Sea, push into Ethiopia, then pull back to continental view.
  africa: {
    keys: [
      {at: 0, center: [24, 38], zoom: 1.0, tilt: 22},
      {at: 120, center: [36, 18], zoom: 1.25, tilt: 22, ease: 'inOut'},
      {at: 210, center: [40, 9.5], zoom: 2.4, tilt: 40, rotate: -6, ease: 'inOut'},
      {at: 330, center: [22, 6], zoom: 0.5, tilt: 26, rotate: 0, ease: 'inOut'},
    ],
  },
  // 6. Oblique tracking shot west over the Atlantic, into North America, then a wide Pacific reveal.
  americas: {
    keys: [
      {at: 0, center: [-12, 46], zoom: 1.1, tilt: 58, rotate: -18},
      {at: 150, center: [-55, 41], zoom: 1.0, tilt: 55, rotate: -14, ease: 'linear'},
      {at: 220, center: [-86, 37], zoom: 0.85, tilt: 40, rotate: -6, ease: 'out'},
      {at: 360, center: [-172, 24], zoom: 0.36, tilt: 22, rotate: 0, ease: 'inOut'},
    ],
  },
  // 7. Montage: each shot a different angle/height. Each is 41 frames.
  montage: [
    {keys: [{at: 0, center: LOC.berlin, zoom: 3.2, tilt: 62, rotate: 32}, {at: 41, center: [13.0, 52.9], zoom: 3.9, tilt: 60, rotate: 26, ease: 'linear'}]},
    {keys: [{at: 0, center: LOC.tokyo, zoom: 2.6, tilt: 40, rotate: -28}, {at: 41, center: [141.5, 36.4], zoom: 2.4, tilt: 44, rotate: -20, ease: 'linear'}]},
    {keys: [{at: 0, center: LOC.moscow, zoom: 4.0, tilt: 0, rotate: 0}, {at: 41, center: LOC.moscow, zoom: 2.4, tilt: 0, rotate: 8, ease: 'out'}]},
    {keys: [{at: 0, center: LOC.suez, zoom: 3.0, tilt: 50, rotate: 60}, {at: 41, center: [33.4, 29.0], zoom: 3.3, tilt: 54, rotate: 50, ease: 'linear'}]},
    {keys: [{at: 0, center: [12, 43], zoom: 1.8, tilt: 20, rotate: -12}, {at: 41, center: LOC.rome, zoom: 3.0, tilt: 35, rotate: -18, ease: 'in'}]},
    {keys: [{at: 0, center: LOC.washington, zoom: 2.2, tilt: 64, rotate: -40}, {at: 41, center: [-74.5, 40.2], zoom: 2.5, tilt: 58, rotate: -30, ease: 'linear'}]},
  ],
  // 8. Climax: whip between theatres, then settle on the centred world view.
  climax: {
    keys: [
      {at: 0, center: [20, 30], zoom: 0.36, tilt: 30},
      {at: 60, center: [12, 50], zoom: 1.35, tilt: 48, rotate: -8, ease: 'snap'},
      {at: 110, center: [14, 49], zoom: 1.45, tilt: 50, rotate: -5, ease: 'linear'},
      {at: 160, center: [122, 37], zoom: 1.25, tilt: 48, rotate: 10, ease: 'snap'},
      {at: 205, center: [124, 38], zoom: 1.32, tilt: 50, rotate: 12, ease: 'linear'},
      {at: 250, center: [38, 12], zoom: 1.1, tilt: 42, rotate: -4, ease: 'snap'},
      {at: 320, center: [15, 22], zoom: WORLD * 1.05, tilt: 14, rotate: 0, ease: 'out'},
      {at: 360, center: [15, 22], zoom: WORLD * 1.03, tilt: 14, rotate: 0, ease: 'linear'},
    ],
    drift: 2,
  },
  // 9. Ending: darkened map, imperceptible push-in.
  ending: {
    keys: [
      {at: 0, center: [15, 22], zoom: WORLD * 1.03, tilt: 14},
      {at: 270, center: [15, 26], zoom: WORLD * 1.18, tilt: 20, ease: 'linear'},
    ],
    drift: 2,
  },
};

export const MONTAGE_SHOT = 41;
