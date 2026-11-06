import type {LonLat} from './mapProjection';

/** Named points of interest [lon, lat]. Pacific points west of 180° use unwrapped longitudes. */
export const LOC = {
  // Europe
  berlin: [13.4, 52.5], paris: [2.35, 48.85], london: [-0.13, 51.5], rome: [12.5, 41.9],
  moscow: [37.6, 55.75], warsaw: [21.0, 52.2], vienna: [16.4, 48.2], rhineland: [7.0, 50.3],
  prague: [14.4, 50.1], cologne: [6.95, 50.94],
  // Iberia
  madrid: [-3.7, 40.4], burgos: [-3.7, 42.34], seville: [-5.98, 37.39], barcelona: [2.17, 41.39],
  badajoz: [-6.97, 38.88], toledo: [-4.02, 39.86], zaragoza: [-0.88, 41.65],
  // East Asia
  tokyo: [139.7, 35.7], keijo: [127.0, 37.55], hsinking: [125.3, 43.9], peiping: [116.4, 39.9],
  nanking: [118.8, 32.05], shanghai: [121.5, 31.2], harbin: [126.6, 45.75],
  vladivostok: [131.9, 43.1], fusan: [129.04, 35.1], mukden: [123.43, 41.8], tientsin: [117.2, 39.1],
  // Africa & Middle East
  gibraltar: [-5.35, 36.14], malta: [14.5, 35.9], suez: [32.55, 29.97], cairo: [31.24, 30.04],
  aden: [45.03, 12.8], addis: [38.75, 9.03], asmara: [38.93, 15.33], mogadishu: [45.34, 2.05],
  bombay: [72.88, 19.08], baghdad: [44.36, 33.31], dakar: [-17.45, 14.7], capetown: [18.42, -33.92],
  haifa: [34.99, 32.79], abadan: [48.3, 30.34],
  // Atlantic & Pacific
  newyork: [-74.0, 40.7], washington: [-77.04, 38.9], liverpool: [-2.98, 53.4],
  panama: [-79.5, 9.0], sanfrancisco: [-122.4, 37.8], honolulu: [-157.9, 21.3],
  midway: [-177.4, 28.2], guam: [144.8 - 360, 13.4], manila: [121.0 - 360, 14.6],
  tokyoW: [139.7 - 360, 35.7], saipan: [145.7 - 360, 15.2], singaporeW: [103.8 - 360, 1.3],
  shanghaiW: [121.5 - 360, 31.2],
} satisfies Record<string, LonLat>;

export type LocKey = keyof typeof LOC;
