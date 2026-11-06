import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/** Short exposure flash for hard cuts. */
export const Flash: React.FC<{at: number; length?: number; peak?: number}> = ({at, length = 8, peak = 0.5}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + length], [0, peak, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: '#efe6cf', opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};
