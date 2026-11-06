import React from 'react';
import {MapStage} from '../components/MapStage';
import {ArrowPath, FrontLine, MapLabel, PolityHighlight, PulseMarker, RouteLine, SpreadHighlight} from '../components/overlays';
import {HudFrame, RegionTitle} from '../components/ui';
import {CAMERAS} from '../config/scenes';
import {LOC} from '../config/locations';
import {TEXT} from '../config/text';
import {THEME} from '../config/theme';

/** Manchukuo / North China line (Great Wall – Jehol), 1936. */
export const MANCHU_FRONT: [number, number][] = [
  [111.5, 41.6], [114.2, 41.0], [116.3, 40.7], [118.0, 40.3], [119.6, 40.05],
];
export const KOREA_RAIL: [number, number][] = [LOC.fusan, LOC.keijo, [125.5, 39.5], LOC.mukden, LOC.hsinking, LOC.harbin];
export const JAPAN_SEA_LANE: [number, number][] = [LOC.tokyo, [135.2, 33.6], [130.5, 32.6], [125.5, 31.7], LOC.shanghai];

/**
 * China, mid-1936: a fractured republic. Each warlord domain is traced in turn as
 * the camera pans west → east; id = key in polities.json, at = label position.
 */
const WARLORDS: {id: string; name: string; at: [number, number]; t: number; size?: number; angle?: number}[] = [
  {id: 'XIN', name: 'XINJIANG', at: [85, 41.8], t: 8},
  {id: 'TIB', name: 'TIBET', at: [88, 31.5], t: 22},
  {id: 'XSM', name: 'MA CLIQUE', at: [97.5, 36.2], t: 40, size: 12},
  {id: 'SIC', name: 'SICHUAN', at: [103.2, 30.0], t: 56, size: 12},
  {id: 'YUN', name: 'YUNNAN', at: [101.6, 24.6], t: 68, size: 12},
  {id: 'CCP', name: 'SHAAN-GAN-NING', at: [108.6, 37.25], t: 84, size: 9},
  {id: 'SHX', name: 'SHANXI', at: [112.2, 37.4], t: 96, size: 11},
  {id: 'GXC', name: 'GUANGXI', at: [108.4, 23.7], t: 104, size: 12},
  {id: 'GDC', name: 'GUANGDONG', at: [113.6, 23.6], t: 112, size: 12},
  {id: 'CHI', name: 'NATIONALIST CHINA', at: [114.5, 29.6], t: 122, size: 15},
  {id: 'HCC', name: 'HEBEI-CHAHAR', at: [115.4, 38.5], t: 136, size: 10},
  {id: 'SHD', name: 'SHANDONG', at: [118.3, 36.3], t: 142, size: 11},
  {id: 'MGG', name: 'INNER MONGOLIA', at: [114.0, 43.9], t: 150, size: 11},
  {id: 'EHA', name: 'EAST HEBEI', at: [118.7, 39.95], t: 160, size: 8},
];

/** 4. Lateral pan across the Chinese warlord map, then close-up on Manchukuo and Korea. */
export const EastAsiaScene: React.FC = () => (
  <MapStage
    camera={CAMERAS.eastAsia}
    clouds={0.45}
    screen={
      <>
        <HudFrame />
        <RegionTitle text={TEXT.regions.eastAsia} start={30} end={385} />
      </>
    }
  >
    <MapLabel at={[95, 56]} text="SOVIET UNION" start={6} size={18} />
    <MapLabel at={[103, 46.6]} text="MONGOLIA" start={30} size={15} />

    {/* Warlord domains: border trace + brief fill pulse, then settle to a faint outline. */}
    {WARLORDS.map((w) => (
      <React.Fragment key={w.id}>
        <PolityHighlight
          id={w.id}
          color={w.id === 'CCP' ? THEME.alert : w.id === 'EHA' || w.id === 'MGG' ? THEME.alert : THEME.accent}
          start={w.t}
          end={250}
          drawFrames={34}
          fill={w.id === 'CHI' ? 0.06 : 0.14}
          width={w.id === 'CHI' ? 1.4 : 1.8}
          pulse={false}
        />
        <MapLabel at={w.at} text={w.name} start={w.t + 6} end={300} size={w.size ?? 13} angle={w.angle} />
      </React.Fragment>
    ))}
    <PulseMarker at={LOC.nanking} start={128} color={THEME.accent} size={10} />
    <PulseMarker at={[108.9, 37.0]} start={92} color={THEME.alert} size={7} shape="dot" />
    <PulseMarker at={[112.55, 37.87]} start={100} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={[113.26, 23.13]} start={116} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={[110.29, 25.27]} start={108} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={[104.07, 30.67]} start={60} color={THEME.cold} size={6} shape="square" />
    <PulseMarker at={[102.71, 25.04]} start={72} color={THEME.cold} size={6} shape="square" />
    <SpreadHighlight at={LOC.peiping} radiusDeg={2.4} start={165} color={THEME.alert} />

    {/* Close-up: the Japanese sphere */}
    <PolityHighlight id="JAPAN_SPHERE" color={THEME.alert} start={225} drawFrames={60} fill={0.26} hatch />
    <MapLabel at={[126.5, 45.0]} text="MANCHUKUO" start={240} size={15} color={THEME.highlight} />
    <MapLabel at={[127.6, 39.7]} text="KOREA" start={255} size={12} angle={-70} />
    <MapLabel at={[138.6, 37.3]} text="JAPAN" start={232} size={15} angle={-40} />
    <RouteLine points={KOREA_RAIL} start={250} duration={60} color={THEME.accent} width={2.2} convoys={2} />
    <RouteLine points={JAPAN_SEA_LANE} start={265} duration={55} color={THEME.cold} />
    <FrontLine points={MANCHU_FRONT} start={270} duration={50} side={1} />
    <ArrowPath from={[121.5, 42.2]} to={[116.9, 39.6]} start={290} duration={45} bend={0.2} width={8} />
    <ArrowPath from={[118.5, 43.5]} to={[113.0, 41.9]} start={305} duration={40} bend={-0.15} width={6} />

    <PulseMarker at={LOC.tokyo} start={235} color={THEME.alert} size={10} />
    <PulseMarker at={LOC.keijo} start={255} color={THEME.alert} size={6} shape="dot" />
    <PulseMarker at={LOC.hsinking} start={262} color={THEME.alert} size={8} shape="square" />
    <PulseMarker at={LOC.peiping} start={285} color={THEME.accent} size={8} />
    <PulseMarker at={LOC.shanghai} start={275} color={THEME.accent} size={7} shape="dot" />
    <PulseMarker at={LOC.vladivostok} start={300} color={THEME.cold} size={7} shape="square" />
  </MapStage>
);
