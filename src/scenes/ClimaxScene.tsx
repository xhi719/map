import React from 'react';
import {interpolate, useCurrentFrame, AbsoluteFill} from 'remotion';
import {MapStage} from '../components/MapStage';
import {ArrowPath, FrontLine, PolityHighlight, PulseMarker, RouteLine, SpreadHighlight} from '../components/overlays';
import {HudFrame, LightSweep} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {THEME} from '../config/theme';
import {IBERIA_FRONT} from './IberiaScene';
import {KOREA_RAIL, MANCHU_FRONT} from './EastAsiaScene';
import {IMPERIAL_LIFELINE} from './AfricaScene';
import {ATLANTIC_ROUTE} from './AmericasScene';

const RedPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const o = 0.12 * Math.max(0, Math.sin(frame / 9)) * interpolate(frame, [200, 300], [0.4, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{boxShadow: `inset 0 0 240px rgba(200,69,59,${o * 4})`, pointerEvents: 'none'}} />;
};

/** 8. All theatres at once: fronts, arrows and markers stack up while the camera whips between them. */
export const ClimaxScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.climax}
    clouds={0.45}
    screen={
      <>
        <HudFrame intensity={1} />
        <RedPulse />
        <LightSweep start={300} duration={45} strength={0.18} />
      </>
    }
  >
    {/* Powers */}
    <PolityHighlight id="GER" color={THEME.alert} start={0} drawFrames={40} fill={0.22} />
    <PolityHighlight id="ITA" color={THEME.alert} start={20} drawFrames={40} fill={0.2} />
    <PolityHighlight id="JAP" color={THEME.alert} start={110} drawFrames={40} fill={0.22} hatch />
    <PolityHighlight id="SOV" color={THEME.cold} start={60} drawFrames={80} fill={0.06} width={1.4} pulse={false} />
    <PolityHighlight id="GBR" color={THEME.cold} start={200} drawFrames={80} fill={0.05} width={1.2} pulse={false} />
    <PolityHighlight id="FRA" color={THEME.cold} start={210} drawFrames={80} fill={0.05} width={1.2} pulse={false} />
    <PolityHighlight id="USA" color={THEME.cold} start={240} drawFrames={60} fill={0.05} width={1.2} pulse={false} />

    {/* Europe */}
    <FrontLine points={IBERIA_FRONT} start={30} duration={40} side={-1} />
    <ArrowPath from={[11.5, 51.6]} to={[7.2, 50.4]} start={40} duration={30} bend={-0.25} width={8} />
    <ArrowPath from={LOC.berlin} to={LOC.vienna} start={70} duration={35} bend={0.2} width={7} />
    <ArrowPath from={[14.5, 51.5]} to={[15.5, 50.2]} start={85} duration={25} bend={0.1} width={6} />
    <SpreadHighlight at={LOC.berlin} radiusDeg={3} start={50} color={THEME.alert} period={45} />
    {/* East Asia */}
    <FrontLine points={MANCHU_FRONT} start={140} duration={35} side={1} />
    <RouteLine points={KOREA_RAIL} start={130} duration={40} color={THEME.accent} />
    <ArrowPath from={[121.5, 42.2]} to={[116.9, 39.6]} start={150} duration={30} bend={0.2} width={8} />
    <ArrowPath from={[119.5, 38.8]} to={[118.6, 32.6]} start={175} duration={40} bend={0.15} width={8} />
    <SpreadHighlight at={LOC.tokyo} radiusDeg={2.5} start={140} color={THEME.alert} period={45} />
    {/* Africa / Mediterranean */}
    <ArrowPath from={LOC.rome} via={[[20, 34], [33, 22]]} to={LOC.addis} start={210} duration={50} width={8} />
    <RouteLine points={IMPERIAL_LIFELINE} start={220} duration={60} color={THEME.cold} convoys={3} />
    <SpreadHighlight at={LOC.addis} radiusDeg={3} start={230} color={THEME.alert} period={45} />
    {/* Atlantic */}
    <RouteLine points={ATLANTIC_ROUTE} start={250} duration={50} color={THEME.cold} convoys={3} />

    {[LOC.berlin, LOC.rome, LOC.tokyo].map((p, i) => (
      <PulseMarker key={`a${i}`} at={p} start={10 + i * 50} color={THEME.alert} size={10} />
    ))}
    {[LOC.london, LOC.paris, LOC.moscow, LOC.washington, LOC.nanking, LOC.madrid, LOC.suez, LOC.honolulu, LOC.peiping, LOC.warsaw].map((p, i) => (
      <PulseMarker key={`b${i}`} at={p} start={20 + i * 22} color={i % 3 === 0 ? THEME.accent : THEME.cold} size={7} shape={i % 2 ? 'square' : 'diamond'} />
    ))}
  </MapStage>
);
