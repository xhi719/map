import React from 'react';
import {useCurrentFrame} from 'remotion';
import {MAP} from '../../config/mapProjection';
import {useCamera} from '../camera/CameraContext';
import {life, prog} from './anim';

type Props = {
  id: string; // key in polities.json (GER, ITA, JAP, MAN, ETH, ...)
  start?: number;
  end?: number;
  color: string;
  drawFrames?: number;
  fill?: number; // peak fill opacity
  hatch?: boolean;
  width?: number; // screen px
  pulse?: boolean;
};

/** Animated border trace + fill pulse for a polity outline. */
export const PolityHighlight: React.FC<Props> = ({
  id, start = 0, end, color, drawFrames = 45, fill = 0.22, hatch = false, width = 2.4, pulse = true,
}) => {
  const frame = useCurrentFrame();
  const {zoom} = useCamera();
  const d = MAP.polities[id];
  if (!d) return null;
  const draw = prog(frame, start, drawFrames);
  const alpha = life(frame, start, end ?? Infinity, 10);
  const pulseK = pulse ? 0.65 + 0.35 * Math.sin(((frame - start) / 30) * Math.PI * 1.2) : 1;
  const fillK = prog(frame, start + drawFrames * 0.6, 30) * fill * pulseK;
  const sw = width / zoom;
  const patId = `hatch-${id}`;
  return (
    <g opacity={alpha}>
      {hatch && (
        <defs>
          <pattern id={patId} patternUnits="userSpaceOnUse" width={10 / zoom} height={10 / zoom} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={10 / zoom} stroke={color} strokeWidth={2.2 / zoom} />
          </pattern>
        </defs>
      )}
      <path d={d} fill={hatch ? `url(#${patId})` : color} fillOpacity={hatch ? fillK * 2.2 : fillK} stroke="none" />
      <path d={d} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={sw * 3.5} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={sw} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinejoin="round" />
    </g>
  );
};
