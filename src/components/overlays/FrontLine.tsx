import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import type {LonLat} from '../../config/mapProjection';
import {THEME} from '../../config/theme';
import {useCamera} from '../camera/CameraContext';
import {life, prog} from './anim';
import {pointAt, polylineLength, projectAll, sampleSmooth, toD} from './geometry';

type Props = {
  points: LonLat[];
  start?: number;
  end?: number;
  duration?: number;
  color?: string;
  /** Which side the teeth point to: 1 = left of travel direction, -1 = right. */
  side?: 1 | -1;
  width?: number;
};

/** Military front line with "teeth", drawn progressively. */
export const FrontLine: React.FC<Props> = ({
  points, start = 0, end, duration = 50, color = THEME.alert, side = 1, width = 3,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  const pts = useMemo(() => sampleSmooth(projectAll(points), 16, 0.4), [points]);
  const total = useMemo(() => polylineLength(pts), [pts]);
  if (frame < start) return null;
  const k = 1 / zoom;
  const p = prog(frame, start, duration);
  const alpha = life(frame, start, end ?? Infinity, 10);
  const len = total * p;
  const spacing = 16 * k;
  const teeth: React.ReactNode[] = [];
  for (let d = spacing / 2, i = 0; d < len; d += spacing, i++) {
    const {p: c, angle} = pointAt(pts, d);
    const deg = (angle * 180) / Math.PI;
    const s = 5.5 * k;
    teeth.push(
      <path key={i} transform={`translate(${c[0]},${c[1]}) rotate(${deg})`} d={`M${-s * 0.7},0 L0,${-side * s * 1.3} L${s * 0.7},0 Z`} fill={color} />,
    );
  }
  const d = toD(pts);
  const flicker = 0.85 + 0.15 * Math.sin(frame * 0.4);
  return (
    <g opacity={alpha}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.25 * flicker} strokeWidth={width * 5 * k} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width * k} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      {teeth}
    </g>
  );
};
