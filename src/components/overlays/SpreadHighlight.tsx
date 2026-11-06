import React from 'react';
import {useCurrentFrame} from 'remotion';
import {project, MAP, type LonLat} from '../../config/mapProjection';
import {THEME} from '../../config/theme';
import {life} from './anim';

type Props = {
  at: LonLat;
  radiusDeg?: number;
  start?: number;
  end?: number;
  color?: string;
  period?: number;
};

/** Diffusing radial highlight that expands outward from a region in repeating waves. */
export const SpreadHighlight: React.FC<Props> = ({
  at, radiusDeg = 4, start = 0, end, color = THEME.accent, period = 70,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const [x, y] = project(at);
  const R = radiusDeg * MAP.pxPerDeg;
  const alpha = life(frame, start, end ?? Infinity, 15);
  const id = `spread-${Math.round(x)}-${Math.round(y)}`;
  const waves = [0, 0.33, 0.66].map((o) => (((frame - start) / period + o) % 1));
  return (
    <g opacity={alpha}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={color} stopOpacity={0.15} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={R * (0.9 + 0.1 * Math.sin(frame / 12))} fill={`url(#${id})`} />
      {waves.map((w, i) => (
        <circle key={i} cx={x} cy={y} r={R * (0.2 + w * 1.3)} fill="none" stroke={color} strokeWidth={R * 0.03} opacity={(1 - w) * 0.7} />
      ))}
    </g>
  );
};
