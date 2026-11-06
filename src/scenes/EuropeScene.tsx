import React from 'react';
import {MapStage} from '../components/MapStage';
import {ArrowPath, MapLabel, PolityHighlight, PulseMarker, SpreadHighlight} from '../components/overlays';
import {HudFrame, LightSweep, RegionTitle} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

/** 2. Zoom into Europe, borders and powers light up, camera pitches into an oblique view. */
export const EuropeScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.europe}
    clouds={0.6}
    screen={
      <>
        <HudFrame />
        <RegionTitle text={TEXT.regions.europe} start={40} end={295} />
        <LightSweep start={180} duration={50} />
      </>
    }
  >
    <PolityHighlight id="GER" color={THEME.alert} start={95} drawFrames={55} fill={0.2} />
    <PolityHighlight id="ITA" color={THEME.accent} start={125} drawFrames={50} fill={0.16} />
    <PolityHighlight id="SOV" color={THEME.cold} start={150} drawFrames={70} fill={0.08} width={1.6} pulse={false} />
    <PolityHighlight id="FRA" color={THEME.cold} start={160} drawFrames={50} fill={0.06} width={1.4} pulse={false} />

    <SpreadHighlight at={LOC.rhineland} radiusDeg={2.4} start={195} color={THEME.alert} />
    <ArrowPath from={[11.5, 51.6]} to={[7.2, 50.4]} start={205} duration={40} bend={-0.25} width={8} />

    <MapLabel at={[10.4, 51.3]} text="GERMANY" start={100} size={19} />
    <MapLabel at={[2.6, 46.6]} text="FRANCE" start={115} size={17} />
    <MapLabel at={[12.9, 43.1]} text="ITALY" start={130} size={16} angle={-52} />
    <MapLabel at={[19.4, 52.1]} text="POLAND" start={140} size={15} />
    <MapLabel at={[-2.2, 53.0]} text="BRITAIN" start={150} size={15} />
    <MapLabel at={[38, 55]} text="SOVIET UNION" start={160} size={20} />
    <MapLabel at={[-3.6, 40.0]} text="SPAIN" start={170} size={15} />
    <MapLabel at={[14.6, 47.55]} text="AUSTRIA" start={180} size={11} />
    <MapLabel at={[16.8, 49.4]} text="CZECHOSLOVAKIA" start={185} size={11} />

    <PulseMarker at={LOC.berlin} start={110} color={THEME.alert} size={10} />
    <PulseMarker at={LOC.paris} start={125} color={THEME.cold} size={8} shape="square" />
    <PulseMarker at={LOC.rome} start={140} color={THEME.accent} size={9} />
    <PulseMarker at={LOC.london} start={150} color={THEME.cold} size={8} shape="square" />
    <PulseMarker at={LOC.moscow} start={165} color={THEME.cold} size={9} shape="square" />
    <PulseMarker at={LOC.warsaw} start={180} color={THEME.accent} size={6} shape="dot" />
    <PulseMarker at={LOC.vienna} start={190} color={THEME.accent} size={6} shape="dot" />
    <PulseMarker at={LOC.prague} start={196} color={THEME.accent} size={6} shape="dot" />
  </MapStage>
);
