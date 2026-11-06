import mapCfg from './map.json';
import polities from '../assets/data/polities.json';
// Map raster. Swap this file (same projection, see map.json) to restyle the whole trailer.
import mapImage from '../assets/map/world1936.jpg';
import detailEurope from '../assets/map/detail-europe.jpg';
import detailEastAsia from '../assets/map/detail-eastasia.jpg';
import detailAfrica from '../assets/map/detail-africa.jpg';
import detailUsEast from '../assets/map/detail-useast.jpg';

const DETAIL_IMAGES: Record<string, string> = {
  europe: detailEurope,
  eastasia: detailEastAsia,
  africa: detailAfrica,
  useast: detailUsEast,
};

export const MAP = {
  image: mapImage as string,
  width: mapCfg.width,
  height: Math.round((mapCfg.latTop - mapCfg.latBottom) * (mapCfg.width / 360)),
  pxPerDeg: mapCfg.width / (mapCfg.lonRight - mapCfg.lonLeft),
  latTop: mapCfg.latTop,
  polities: polities.paths as Record<string, string>,
};

const PX = mapCfg.width / (mapCfg.lonRight - mapCfg.lonLeft);
/** High-resolution patches in map pixel space (see detailPatches in map.json). */
export const DETAIL_PATCHES = mapCfg.detailPatches
  .filter((p) => DETAIL_IMAGES[p.id])
  .map((p) => ({
    id: p.id,
    src: DETAIL_IMAGES[p.id],
    x: (p.lon[0] + 180) * PX,
    y: (mapCfg.latTop - p.lat[1]) * PX,
    w: (p.lon[1] - p.lon[0]) * PX,
    h: (p.lat[1] - p.lat[0]) * PX,
  }));

export type LonLat = readonly [number, number];

/** Equirectangular projection into map pixel space. Longitudes may exceed ±180 (the map wraps). */
export const project = ([lon, lat]: LonLat): [number, number] => [
  (lon + 180) * MAP.pxPerDeg,
  (MAP.latTop - lat) * MAP.pxPerDeg,
];
