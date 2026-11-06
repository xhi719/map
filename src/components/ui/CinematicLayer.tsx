import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import grainTex from '../../assets/textures/grain.png';

/** Vignette + film grain + very light flicker, applied over the whole trailer. */
export const CinematicLayer: React.FC<{grain?: number}> = ({grain = 0.07}) => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx${frame}`) * 512);
  const oy = Math.floor(random(`gy${frame}`) * 512);
  const flicker = 0.02 * random(`fl${frame}`);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${grainTex})`, backgroundPosition: `${ox}px ${oy}px`,
          opacity: grain, mixBlendMode: 'overlay',
        }}
      />
      <AbsoluteFill style={{background: `rgba(0,0,0,${flicker})`}} />
    </AbsoluteFill>
  );
};
