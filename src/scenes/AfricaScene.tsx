import React from 'react';
import {MapStage} from '../components/MapStage';
import {ArrowPath, MapLabel, PolityHighlight, PulseMarker, RouteLine} from '../components/overlays';
import {HudFrame, RegionTitle} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

export const IMPERIAL_LIFELINE: [number, number][] = [
  LOC.gibraltar, [3, 37.6], LOC.malta, [25, 33.6], [31.8, 31.7], LOC.suez, [35.5, 23], [41.5, 14.5], LOC.aden, [58, 17], LOC.bombay,
];

/** 5. Southward move down the Red Sea, push into Ethiopia, pull back to the colonial map. */
export const AfricaScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.africa}
    clouds={0.5}
    screen={
      <>
        <HudFrame />
        <RegionTitle text={TEXT.regions.africa} start={20} end={325} align="right" />
      </>
    }
  >
    <RouteLine points={IMPERIAL_LIFELINE} start={15} duration={110} color={THEME.cold} convoys={3} />
    <PulseMarker at={LOC.gibraltar} start={25} color={THEME.cold} size={7} shape="square" />
    <PulseMarker at={LOC.malta} start={40} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={LOC.suez} start={60} color={THEME.accent} size={11} />
    <PulseMarker at={LOC.haifa} start={75} color={THEME.accent} size={6} shape="dot" />
    <PulseMarker at={LOC.abadan} start={85} color={THEME.accent} size={7} shape="dot" />
    <PulseMarker at={LOC.aden} start={105} color={THEME.cold} size={7} shape="square" />
    <MapLabel at={[17, 27]} text="LIBYA" start={20} size={15} />
    <MapLabel at={[29.5, 26.5]} text="EGYPT" start={35} size={15} />
    <MapLabel at={[44, 24]} text="SAUDI ARABIA" start={55} size={14} />
    <MapLabel at={[43.5, 33.5]} text="IRAQ" start={65} size={12} />
    <MapLabel at={[30, 15]} text="SUDAN" start={95} size={14} />

    {/* Ethiopia, annexed by Italy in May 1936 */}
    <PolityHighlight id="ETH" color={THEME.alert} start={150} drawFrames={45} fill={0.3} hatch />
    <ArrowPath from={LOC.asmara} to={[38.9, 9.6]} start={165} duration={45} bend={0.08} width={8} />
    <ArrowPath from={LOC.mogadishu} via={[[43.0, 6.5]]} to={[39.5, 8.6]} start={180} duration={45} width={7} />
    <PulseMarker at={LOC.addis} start={170} color={THEME.alert} size={10} />
    <MapLabel at={[39.5, 7.2]} text="ETHIOPIA" start={160} size={15} color={THEME.highlight} />

    {/* wide: colonial structure */}
    <PolityHighlight id="GBR" color="#d39b86" start={235} drawFrames={70} fill={0.12} width={1.6} pulse={false} />
    <PolityHighlight id="FRA" color={THEME.cold} start={245} drawFrames={70} fill={0.12} width={1.6} pulse={false} />
    <PolityHighlight id="ITA" color={THEME.accent} start={255} drawFrames={60} fill={0.12} width={1.6} pulse={false} />
    <MapLabel at={[2, 15]} text="FRENCH WEST AFRICA" start={250} size={14} />
    <MapLabel at={[23, -2.5]} text="BELGIAN CONGO" start={262} size={12} />
    <MapLabel at={[24, -29]} text="SOUTH AFRICA" start={272} size={12} />
    <MapLabel at={[17, -12]} text="ANGOLA" start={278} size={11} />
    <PulseMarker at={LOC.dakar} start={260} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={LOC.capetown} start={270} color={THEME.cold} size={6} shape="square" />
  </MapStage>
);
