import React from 'react';
import {useCurrentFrame} from 'remotion';
import {project, type LonLat} from '../../config/mapProjection';
import {THEME} from '../../config/theme';
import {useCamera} from '../camera/CameraContext';
import {life, prog} from './anim';

type Props = {
  at: LonLat;
  text: string;
  start?: number;
  end?: number;
  size?: number; // screen px, stays roughly constant through zooms
  color?: string;
  spacing?: number; // em
  weight?: number;
  angle?: number;
};

/** Global multiplier for on-map label sizes. */
export const LABEL_SCALE = 1.7;

/** Country / region name printed on the map plane (tilts with the map, counter-scaled to stay legible). */
export const MapLabel: React.FC<Props> = ({
  at, text, start = 0, end, size = 18, color = THEME.ink, spacing = 0.35, weight = 600, angle = 0,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  if (frame < start) return null;
  const [x, y] = project(at);
  const fs = (size * LABEL_SCALE) / zoom;
  const a = life(frame, start, end ?? Infinity, 14);
  const track = spacing + (1 - prog(frame, start, 30)) * 0.4;
  return (
    <text
      x={x}
      y={y}
      transform={angle ? `rotate(${angle} ${x} ${y})` : undefined}
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily={THEME.fonts.display}
      fontWeight={weight}
      fontSize={fs}
      letterSpacing={`${track}em`}
      fill={color}
      opacity={a * 0.9}
      stroke="rgba(8,12,14,0.65)"
      strokeWidth={fs * 0.12}
      paintOrder="stroke"
    >
      {text}
    </text>
  );
};
