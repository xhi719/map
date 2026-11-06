import React from 'react';
import {Sequence} from 'remotion';
import {MapStage} from '../components/MapStage';
import {ArrowPath, MapLabel, PolityHighlight, PulseMarker, SpreadHighlight} from '../components/overlays';
import {Flash, HudFrame} from '../components/ui';
import {CAMERAS, MONTAGE_SHOT} from '../config/scenes';
import {LOC} from '../config/locations';
import {THEME} from '../config/theme';

/** Each shot: a different angle, with its own small overlay set. */
const SHOTS: React.ReactNode[] = [
  <>
    <PolityHighlight id="GER" color={THEME.alert} start={0} drawFrames={30} fill={0.18} />
    <PulseMarker at={LOC.berlin} start={2} color={THEME.alert} size={12} />
    <MapLabel at={[11.6, 51.9]} text="GERMANY" start={4} size={20} />
  </>,
  <>
    <PolityHighlight id="JAPAN_SPHERE" color={THEME.alert} start={0} drawFrames={30} fill={0.2} hatch />
    <PulseMarker at={LOC.tokyo} start={2} color={THEME.alert} size={12} />
    <MapLabel at={[138.4, 37.6]} text="JAPAN" start={4} size={20} angle={-40} />
  </>,
  <>
    <SpreadHighlight at={LOC.moscow} radiusDeg={1.2} start={0} color={THEME.cold} period={30} />
    <PulseMarker at={LOC.moscow} start={0} color={THEME.cold} size={12} shape="square" />
    <MapLabel at={[37.6, 56.6]} text="SOVIET UNION" start={4} size={20} />
  </>,
  <>
    <PulseMarker at={LOC.suez} start={0} color={THEME.accent} size={12} />
    <ArrowPath from={[31.8, 31.5]} to={[32.6, 28.6]} start={0} duration={30} color={THEME.cold} width={8} bend={0.05} />
    <MapLabel at={[31.0, 28.3]} text="SUEZ" start={4} size={20} />
  </>,
  <>
    <PolityHighlight id="ITA" color={THEME.accent} start={0} drawFrames={30} fill={0.18} />
    <PulseMarker at={LOC.rome} start={2} color={THEME.accent} size={12} />
    <MapLabel at={[13.5, 42.6]} text="ITALY" start={4} size={20} />
  </>,
  <>
    <PolityHighlight id="USA" color={THEME.cold} start={0} drawFrames={30} fill={0.14} />
    <PulseMarker at={LOC.washington} start={2} color={THEME.cold} size={12} />
    <PulseMarker at={LOC.newyork} start={6} color={THEME.cold} size={8} shape="square" />
    <MapLabel at={[-78.5, 40.4]} text="UNITED STATES" start={4} size={20} />
  </>,
];

/** 7. Fast cross-cut montage: six shots, six different camera set-ups, hard cuts with flashes. */
export const MontageScene: React.FC = () => (
  <>
    {CAMERAS.montage.map((cam, i) => (
      <Sequence key={i} from={i * MONTAGE_SHOT} durationInFrames={i === 5 ? MONTAGE_SHOT + 6 : MONTAGE_SHOT}>
        <MapStage camera={cam} clouds={0.4} screen={<><HudFrame scan={false} /><Flash at={0} length={6} peak={0.45} /></>}>
          {SHOTS[i]}
        </MapStage>
      </Sequence>
    ))}
  </>
);
