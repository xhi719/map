import React from 'react';
import {MapStage} from '../components/MapStage';
import {MapLabel, PolityHighlight, PulseMarker, RouteLine} from '../components/overlays';
import {HudFrame, RegionTitle} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

export const ATLANTIC_ROUTE: [number, number][] = [LOC.liverpool, [-10, 52], [-30, 49], [-50, 44], LOC.newyork];
export const PANAMA_ROUTE: [number, number][] = [[-6, 36], [-25, 30], [-55, 22], [-72, 15], LOC.panama];
export const PACIFIC_ROUTE: [number, number][] = [LOC.sanfrancisco, [-140, 28], LOC.honolulu, LOC.midway, [-190, 20], LOC.guam, LOC.manila];
export const JAPAN_MANDATE: [number, number][] = [LOC.tokyoW, [-218, 25], LOC.saipan];

/** 6. Tracking shot across the Atlantic into America, then the wide Pacific. */
export const AmericasScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.americas}
    clouds={0.75}
    screen={
      <>
        <HudFrame />
        <RegionTitle text={TEXT.regions.americas} start={30} end={355} />
      </>
    }
  >
    <RouteLine points={ATLANTIC_ROUTE} start={0} duration={110} convoys={3} />
    <RouteLine points={PANAMA_ROUTE} start={40} duration={110} convoys={2} color={THEME.accent} />
    <MapLabel at={[-38, 38]} text="ATLANTIC OCEAN" start={15} size={16} color={THEME.cold} spacing={0.6} weight={400} />
    <PolityHighlight id="USA" color={THEME.cold} start={150} drawFrames={60} fill={0.12} width={1.8} />
    <MapLabel at={[-99, 39.5]} text="UNITED STATES" start={160} size={20} />
    <MapLabel at={[-100, 57]} text="CANADA" start={170} size={17} />
    <MapLabel at={[-102, 23.5]} text="MEXICO" start={185} size={13} />
    <PulseMarker at={LOC.newyork} start={120} color={THEME.cold} size={8} shape="square" />
    <PulseMarker at={LOC.washington} start={140} color={THEME.cold} size={10} />
    <PulseMarker at={LOC.panama} start={180} color={THEME.accent} size={8} />
    <PulseMarker at={LOC.sanfrancisco} start={215} color={THEME.cold} size={7} shape="square" />

    {/* Pacific */}
    <RouteLine points={PACIFIC_ROUTE} start={225} duration={100} color={THEME.cold} convoys={3} speed={1.4} />
    <RouteLine points={JAPAN_MANDATE} start={270} duration={50} color={THEME.alert} convoys={1} />
    <MapLabel at={[-160, 8]} text="PACIFIC OCEAN" start={240} size={17} color={THEME.cold} spacing={0.6} weight={400} />
    <MapLabel at={[-221, 37]} text="JAPAN" start={280} size={14} angle={-40} />
    <MapLabel at={[-237, 17]} text="PHILIPPINES" start={295} size={11} />
    <PulseMarker at={LOC.honolulu} start={250} color={THEME.accent} size={10} />
    <PulseMarker at={LOC.midway} start={265} color={THEME.cold} size={6} shape="dot" />
    <PulseMarker at={LOC.guam} start={280} color={THEME.cold} size={6} shape="dot" />
    <PulseMarker at={LOC.saipan} start={288} color={THEME.alert} size={6} shape="dot" />
    <PulseMarker at={LOC.manila} start={295} color={THEME.cold} size={7} shape="square" />
    <PulseMarker at={LOC.tokyoW} start={285} color={THEME.alert} size={9} />
  </MapStage>
);
