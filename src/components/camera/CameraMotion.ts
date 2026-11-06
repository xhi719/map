import {Easing, interpolate} from 'remotion';
import {MAP, type LonLat} from '../../config/mapProjection';

export type EaseName = 'linear' | 'inOut' | 'in' | 'out' | 'snap' | 'glide';

/**
 * A camera keyframe. `at` is the scene-relative frame.
 * zoom: screen pixels per map pixel at the focus point (0.235 ≈ whole world wide).
 * tilt: degrees the map plane is pitched away from the viewer (0 = top-down).
 * rotate: degrees of yaw around the focus point.
 * ease: easing used to arrive at THIS keyframe from the previous one.
 */
export type CameraKey = {
  at: number;
  center: LonLat;
  zoom: number;
  tilt?: number;
  rotate?: number;
  ease?: EaseName;
};

export type CameraPath = {
  keys: CameraKey[];
  /** Subtle hand-held drift, in screen pixels. */
  drift?: number;
};

export type CameraState = {
  lon: number;
  lat: number;
  zoom: number;
  tilt: number;
  rotate: number;
};

const EASES: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  inOut: Easing.inOut(Easing.cubic),
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  snap: Easing.bezier(0.7, 0, 0.15, 1),
  glide: Easing.bezier(0.33, 0, 0.2, 1),
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Evaluate a camera path at a frame with per-segment easing. Zoom interpolates in log space. */
export const evaluateCamera = (path: CameraPath, frame: number): CameraState => {
  const keys = path.keys;
  let a = keys[0];
  let b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (frame >= keys[i].at) {
      a = keys[i];
      b = keys[Math.min(i + 1, keys.length - 1)];
    }
  }
  if (frame < keys[0].at) b = a;
  const span = b.at - a.at;
  const raw = span > 0 ? interpolate(frame, [a.at, b.at], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const t = EASES[b.ease ?? 'inOut'](raw);

  const state: CameraState = {
    lon: lerp(a.center[0], b.center[0], t),
    lat: lerp(a.center[1], b.center[1], t),
    zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)),
    tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t),
    rotate: lerp(a.rotate ?? 0, b.rotate ?? 0, t),
  };

  const drift = path.drift ?? 6;
  if (drift > 0) {
    // Layered sines: smooth, deterministic, never repeats noticeably within a scene.
    const f = frame / 30;
    const dx = Math.sin(f * 0.9) * 0.6 + Math.sin(f * 2.3 + 1.3) * 0.4;
    const dy = Math.sin(f * 0.7 + 2.1) * 0.6 + Math.sin(f * 1.9 + 0.4) * 0.4;
    const degPerScreenPx = 1 / (state.zoom * MAP.pxPerDeg);
    state.lon += dx * drift * degPerScreenPx;
    state.lat += dy * drift * degPerScreenPx;
    state.rotate += Math.sin(f * 0.5 + 0.8) * 0.15;
  }
  return state;
};
