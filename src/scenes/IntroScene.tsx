import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MapStage} from '../components/MapStage';
import {MapLabel, PulseMarker} from '../components/overlays';
import {HudFrame} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

const CAPITALS = [LOC.berlin, LOC.rome, LOC.tokyo, LOC.moscow, LOC.london, LOC.paris, LOC.washington, LOC.nanking];

const YearTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const inP = Easing.out(Easing.cubic)(interpolate(frame, [70, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const out = interpolate(frame, [215, 250], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rule = Easing.inOut(Easing.cubic)(interpolate(frame, [62, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: 470, width: 640 * rule, height: 1, background: 'rgba(217,212,195,0.5)'}} />
      <div
        style={{
          fontFamily: THEME.fonts.display, fontWeight: 600, fontSize: 168, color: THEME.ink,
          letterSpacing: `${0.55 - inP * 0.25}em`, paddingLeft: `${0.55 - inP * 0.25}em`,
          opacity: inP, filter: `blur(${(1 - inP) * 8}px)`, textShadow: '0 6px 40px rgba(0,0,0,0.9)',
          transform: `scale(${1.06 - inP * 0.06})`,
        }}
      >
        {TEXT.year}
      </div>
      <div style={{position: 'absolute', top: 640, width: 640 * rule, height: 1, background: 'rgba(217,212,195,0.5)'}} />
    </AbsoluteFill>
  );
};

/** 1. Black → world map fades up (top-down, slow zoom-out). "1936". */
export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = interpolate(frame, [0, 100], [1, 0.25], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const dim2 = interpolate(frame, [200, 260], [0, 0.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <MapStage
      camera={CAMERAS.intro}
      clouds={0.6}
      dim={Math.max(0, dim - dim2)}
      screen={
        <>
          <HudFrame start={150} intensity={0.8} />
          <YearTitle />
        </>
      }
    >
      <MapLabel at={[-40, 32]} text="ATLANTIC OCEAN" start={140} size={15} color={THEME.cold} spacing={0.6} weight={400} />
      <MapLabel at={[-150, 8]} text="PACIFIC OCEAN" start={150} size={15} color={THEME.cold} spacing={0.6} weight={400} />
      <MapLabel at={[78, -18]} text="INDIAN OCEAN" start={160} size={15} color={THEME.cold} spacing={0.6} weight={400} />
      {CAPITALS.map((c, i) => (
        <PulseMarker key={i} at={c} start={160 + i * 8} size={5} shape="dot" color={i < 3 ? THEME.alert : THEME.accent} period={50} />
      ))}
    </MapStage>
  );
};
