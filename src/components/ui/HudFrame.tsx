import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {THEME} from '../../config/theme';

type Props = {intensity?: number; start?: number; scan?: boolean};

/** Restrained briefing-screen frame: corner brackets, edge ticks, a slow scan line. No text. */
export const HudFrame: React.FC<Props> = ({intensity = 1, start = 0, scan = true}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [start, start + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * intensity;
  if (a <= 0) return null;
  const m = 44;
  const L = 46;
  const c = THEME.line;
  const ticks = Array.from({length: 33}, (_, i) => i);
  const scanY = ((frame * 2.2) % 1300) - 110;
  return (
    <AbsoluteFill style={{opacity: a, pointerEvents: 'none'}}>
      <svg width={1920} height={1080}>
        {[
          [m, m, 1, 1], [1920 - m, m, -1, 1], [m, 1080 - m, 1, -1], [1920 - m, 1080 - m, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path key={i} d={`M${x},${y + sy * L} L${x},${y} L${x + sx * L},${y}`} fill="none" stroke={THEME.ink} strokeOpacity={0.55} strokeWidth={2} />
        ))}
        {ticks.map((i) => {
          const x = 300 + i * 41;
          const big = i % 4 === 0;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={m} y2={m + (big ? 12 : 6)} stroke={c} strokeWidth={1} />
              <line x1={x} x2={x} y1={1080 - m} y2={1080 - m - (big ? 12 : 6)} stroke={c} strokeWidth={1} />
            </g>
          );
        })}
        {Array.from({length: 15}, (_, i) => 270 + i * 37).map((y, i) => (
          <g key={i}>
            <line x1={m} x2={m + (i % 4 === 0 ? 12 : 6)} y1={y} y2={y} stroke={c} />
            <line x1={1920 - m} x2={1920 - m - (i % 4 === 0 ? 12 : 6)} y1={y} y2={y} stroke={c} />
          </g>
        ))}
        {/* center reticle */}
        <g opacity={0.35} stroke={THEME.ink} strokeWidth={1}>
          <line x1={940} x2={952} y1={540} y2={540} />
          <line x1={968} x2={980} y1={540} y2={540} />
          <line x1={960} x2={960} y1={520} y2={532} />
          <line x1={960} x2={960} y1={548} y2={560} />
        </g>
      </svg>
      {scan && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: scanY, height: 110,
            background: 'linear-gradient(to bottom, rgba(143,179,196,0) 0%, rgba(143,179,196,0.05) 85%, rgba(143,179,196,0.12) 100%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
