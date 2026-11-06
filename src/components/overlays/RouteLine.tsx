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
  width?: number;
  /** Number of convoy blips travelling along the route. */
  convoys?: number;
  speed?: number;
};

/** Dashed, flowing sea/rail route that draws itself in, with moving convoy blips. */
export const RouteLine: React.FC<Props> = ({
  points, start = 0, end, duration = 60, color = THEME.cold, width = 2, convoys = 2, speed = 1,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  const pts = useMemo(() => sampleSmooth(projectAll(points)), [points]);
  const total = useMemo(() => polylineLength(pts), [pts]);
  if (frame < start) return null;
  const k = 1 / zoom;
  const p = prog(frame, start, duration);
  const alpha = life(frame, start, end ?? Infinity, 10);
  const maskId = `route-${Math.round(pts[0][0])}-${Math.round(pts[0][1])}-${points.length}`;
  const d = toD(pts);
  return (
    <g opacity={alpha}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-1e5} y={-1e5} width={2e5} height={2e5}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={width * 8 * k} pathLength={1} strokeDasharray={`${p} 1`} />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={width * 3 * k} />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width * k}
          strokeDasharray={`${10 * k} ${7 * k}`}
          strokeDashoffset={-(frame * 0.8 * speed) * k}
        />
      </g>
      {p > 0.98 &&
        Array.from({length: convoys}).map((_, i) => {
          const t = (((frame - start) * 0.004 * speed + i / convoys) % 1 + 1) % 1;
          const {p: c} = pointAt(pts, t * total);
          return (
            <g key={i} transform={`translate(${c[0]},${c[1]})`}>
              <circle r={7 * k} fill={color} opacity={0.18} />
              <circle r={2.8 * k} fill={THEME.highlight} />
            </g>
          );
        })}
    </g>
  );
};
