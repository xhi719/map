import {Easing, interpolate} from 'remotion';

/** 0→1 progress over [start, start+dur] with ease-out. */
export const prog = (frame: number, start: number, dur: number, ease = Easing.out(Easing.cubic)) =>
  ease(interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

/** Fade in at start, optionally fade out at `end`. */
export const life = (frame: number, start: number, end = Infinity, fade = 12) => {
  const a = interpolate(frame, [start, start + fade], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const b = end === Infinity ? 1 : interpolate(frame, [end - fade, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.min(a, b);
};
