import React from 'react';
import {useCurrentFrame} from 'remotion';
import {project, type LonLat} from '../../config/mapProjection';
import {THEME} from '../../config/theme';
import {useCamera} from '../camera/CameraContext';
import {life, prog} from './anim';

type Props = {
  at: LonLat;
  start?: number;
  end?: number;
  color?: string;
  size?: number; // screen px
  shape?: 'dot' | 'diamond' | 'square';
  period?: number; // frames between rings
};

/** Blinking strategic marker with expanding rings. */
export const PulseMarker: React.FC<Props> = ({
  at, start = 0, end, color = THEME.accent, size = 9, shape = 'diamond', period = 40,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  if (frame < start) return null;
  const [x, y] = project(at);
  const k = 1 / zoom;
  const s = size * k;
  const pop = prog(frame, start, 12);
  const alpha = life(frame, start, end ?? Infinity, 6);
  const blink = 0.55 + 0.45 * (Math.sin(((frame - start) / period) * Math.PI * 2 * 1.5) > -0.3 ? 1 : 0.2);
  const rings = [0, 0.5].map((off) => (((frame - start) / period + off) % 1));
  return (
    <g opacity={alpha} transform={`translate(${x},${y})`}>
      {rings.map((r, i) => (
        <circle key={i} r={s * (1 + r * 4.5)} fill="none" stroke={color} strokeWidth={1.4 * k} opacity={(1 - r) * 0.8} />
      ))}
      <circle r={s * 2.2} fill={color} opacity={0.12 * blink} />
      <g transform={`scale(${pop})`} opacity={blink}>
        {shape === 'dot' && <circle r={s * 0.7} fill={color} />}
        {shape === 'square' && <rect x={-s * 0.6} y={-s * 0.6} width={s * 1.2} height={s * 1.2} fill="none" stroke={color} strokeWidth={1.6 * k} />}
        {shape === 'diamond' && (
          <>
            <rect x={-s * 0.55} y={-s * 0.55} width={s * 1.1} height={s * 1.1} transform="rotate(45)" fill={color} />
            <rect x={-s} y={-s} width={s * 2} height={s * 2} transform="rotate(45)" fill="none" stroke={color} strokeWidth={1.2 * k} />
          </>
        )}
      </g>
    </g>
  );
};
