import React from 'react';
import {MapStage} from '../components/MapStage';
import {ArrowPath, FrontLine, MapLabel, PolityHighlight, PulseMarker} from '../components/overlays';
import {Flash, HudFrame, RegionTitle} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

/** Approximate front of the Spanish Civil War, autumn 1936. */
export const IBERIA_FRONT: [number, number][] = [
  [-7.1, 39.6], [-5.6, 39.9], [-4.3, 40.1], [-3.9, 40.55], [-3.3, 41.0], [-2.3, 41.25], [-1.3, 41.6], [-0.4, 41.95], [0.2, 42.7],
];
export const IBERIA_SOUTH: [number, number][] = [[-7.3, 38.0], [-5.9, 38.15], [-4.6, 37.95], [-3.6, 37.3], [-3.9, 36.75]];

/** 3. Hard cut: low oblique tracking shot over Iberia — civil war front. */
export const IberiaScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.iberia}
    clouds={0.45}
    screen={
      <>
        <HudFrame scan={false} />
        <RegionTitle text={TEXT.regions.iberia} start={24} end={205} align="right" />
        <Flash at={0} length={7} peak={0.35} />
      </>
    }
  >
    <PolityHighlight id="ESP" color={THEME.accent} start={0} drawFrames={40} fill={0.06} width={1.6} pulse={false} />
    <FrontLine points={IBERIA_FRONT} start={20} duration={70} side={-1} />
    <FrontLine points={IBERIA_SOUTH} start={45} duration={45} side={1} />
    <ArrowPath from={LOC.seville} via={[LOC.badajoz, [-4.9, 39.6]]} to={[-4.05, 40.2]} start={60} duration={60} width={9} />
    <ArrowPath from={LOC.burgos} to={[-3.75, 40.85]} start={95} duration={45} bend={0.1} width={8} />
    <ArrowPath from={LOC.barcelona} to={[0.0, 41.65]} start={120} duration={40} bend={-0.15} width={7} color={THEME.cold} />
    <PulseMarker at={LOC.madrid} start={40} color={THEME.alert} size={11} />
    <PulseMarker at={LOC.burgos} start={55} color={THEME.accent} size={8} shape="square" />
    <PulseMarker at={LOC.seville} start={65} color={THEME.accent} size={8} shape="square" />
    <PulseMarker at={LOC.barcelona} start={80} color={THEME.cold} size={8} />
    <MapLabel at={[-3.7, 40.62]} text="MADRID" start={40} size={15} spacing={0.25} />
    <MapLabel at={[-8.0, 39.6]} text="PORTUGAL" start={30} size={13} angle={-80} />
    <MapLabel at={[2.2, 44.6]} text="FRANCE" start={60} size={15} />
  </MapStage>
);
