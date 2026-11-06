import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MapStage} from '../components/MapStage';
import {PolityHighlight} from '../components/overlays';
import {LightSweep} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const t = Easing.out(Easing.cubic)(interpolate(frame, [30, 80], [0, 1], clamp));
  const y = Easing.out(Easing.cubic)(interpolate(frame, [55, 95], [0, 1], clamp));
  const rule = Easing.inOut(Easing.cubic)(interpolate(frame, [36, 90], [0, 1], clamp));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: THEME.fonts.display, fontWeight: 500, fontSize: 40, color: THEME.accent,
            letterSpacing: '0.9em', paddingLeft: '0.9em', opacity: y, transform: `translateY(${(1 - y) * -10}px)`,
          }}
        >
          {TEXT.year}
        </div>
        <div style={{height: 1, width: 900 * rule, margin: '22px auto', background: 'linear-gradient(to right, rgba(217,212,195,0), rgba(217,212,195,0.7), rgba(217,212,195,0))'}} />
        <div
          style={{
            fontFamily: THEME.fonts.display, fontWeight: 700, fontSize: 132, color: THEME.ink,
            letterSpacing: `${0.42 - t * 0.2}em`, paddingLeft: `${0.42 - t * 0.2}em`,
            opacity: t, filter: `blur(${(1 - t) * 10}px)`, textShadow: '0 8px 50px rgba(0,0,0,0.95)',
          }}
        >
          {TEXT.title}
        </div>
        <div style={{height: 1, width: 900 * rule, margin: '22px auto', background: 'linear-gradient(to right, rgba(217,212,195,0), rgba(217,212,195,0.7), rgba(217,212,195,0))'}} />
      </div>
    </AbsoluteFill>
  );
};

/** 9. Darkened map, title card, slow fade to black. */
export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const dim = interpolate(frame, [0, 40], [0.2, 0.7], {extrapolateRight: 'clamp'});
  const out = interpolate(frame, [205, 268], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  return (
    <AbsoluteFill>
      <MapStage camera={CAMERAS.ending} clouds={0.5} dim={dim} screen={<><TitleCard /><LightSweep start={60} duration={60} strength={0.12} /></>}>
        <PolityHighlight id="GER" color={THEME.alert} start={0} drawFrames={1} fill={0.25} width={1.2} />
        <PolityHighlight id="ITA" color={THEME.alert} start={0} drawFrames={1} fill={0.2} width={1.2} />
        <PolityHighlight id="JAP" color={THEME.alert} start={0} drawFrames={1} fill={0.25} width={1.2} />
      </MapStage>
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};
