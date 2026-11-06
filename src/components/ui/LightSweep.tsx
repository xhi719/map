import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';

type Props = {start: number; duration?: number; angle?: number; strength?: number};

/** A soft beam of light sweeping across the frame (used inside scenes as an accent). */
export const LightSweep: React.FC<Props> = ({start, duration = 40, angle = 18, strength = 0.22}) => {
  const frame = useCurrentFrame();
  const t = Easing.inOut(Easing.quad)(interpolate(frame, [start, start + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  if (frame < start || frame > start + duration) return null;
  const x = -40 + t * 180;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        background: `linear-gradient(${90 + angle}deg, rgba(255,240,200,0) ${x - 14}%, rgba(255,236,190,${strength}) ${x}%, rgba(255,240,200,0) ${x + 14}%)`,
      }}
    />
  );
};
