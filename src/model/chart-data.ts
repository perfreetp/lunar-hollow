import type { LngLat } from '../core/geo.ts';
import type { Aid, ChartData, RoutePlan, Sounding } from './types.ts';

const D2R = Math.PI / 180;

/** Deterministic polygon blob: ellipse + harmonic wobble + rotation. */
function blob(
  center: LngLat,
  rx: number,
  ry: number,
  rotationDeg: number,
  seed: number,
  points = 40,
  wobble = 0.055,
): LngLat[] {
  const rot = rotationDeg * D2R;
  const out: LngLat[] = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const r =
      1 +
      wobble * Math.sin(3 * t + seed) +
      wobble * 0.55 * Math.sin(7 * t + seed * 2.3) +
      wobble * 0.3 * Math.sin(11 * t + seed * 0.7);
    const x = Math.cos(t) * rx * r;
    const y = Math.sin(t) * ry * r;
    const xr = x * Math.cos(rot) - y * Math.sin(rot);
    const yr = x * Math.sin(rot) + y * Math.cos(rot);
    out.push({ lng: center.lng + xr, lat: center.lat + yr });
  }
  return out;
}

/**
 * Mainland coastline control points. The charted shore is smoothed at load so
 * the dense point list is not needed here.
 */
const MAINLAND_CTRL: LngLat[] = [
  { lng: 122.052, lat: 29.992 },
  { lng: 122.099, lat: 29.997 },
  { lng: 122.107, lat: 30.011 },
  { lng: 122.095, lat: 30.024 },
  { lng: 122.113, lat: 30.039 },
  { lng: 122.102, lat: 30.053 },
  { lng: 122.118, lat: 30.066 },
  { lng: 122.108, lat: 30.081 },
  { lng: 122.124, lat: 30.096 },
  { lng: 122.110, lat: 30.111 },
  { lng: 122.127, lat: 30.126 },
  { lng: 122.105, lat: 30.140 },
  { lng: 122.113, lat: 30.162 },
  { lng: 122.052, lat: 30.162 },
];

const QINGLONG = blob({ lng: 122.175, lat: 30.128 }, 0.033, 0.021, -8, 1.7, 46, 0.05);
const DONGYU = blob({ lng: 122.238, lat: 30.07 }, 0.018, 0.03, 10, 3.1, 40, 0.06);
const QIXING = blob({ lng: 122.213, lat: 30.157 }, 0.009, 0.006, 20, 5.2, 26, 0.08);
const BAIJIAO = blob({ lng: 122.1585, lat: 30.0675 }, 0.0052, 0.0036, 6, 2.4, 26, 0.07);
const LAOREN = blob({ lng: 122.134, lat: 30.0715 }, 0.0026, 0.002, -14, 4.4, 20, 0.09);
const SISTER_W = blob({ lng: 122.176, lat: 30.0546 }, 0.002, 0.0016, 0, 6.1, 18, 0.1);
const SISTER_E = blob({ lng: 122.1806, lat: 30.0584 }, 0.0016, 0.0013, 0, 7.7, 18, 0.1);
const NANJIAO = blob({ lng: 122.149, lat: 30.017 }, 0.004, 0.003, 0, 8.9, 22, 0.08);
const SHAZHUI = blob({ lng: 122.205, lat: 30.041 }, 0.0035, 0.0075, -25, 9.6, 22, 0.1);

export const LAND_RINGS: LngLat[][] = [
  MAINLAND_CTRL,
  QINGLONG,
  DONGYU,
  QIXING,
  BAIJIAO,
  LAOREN,
  SISTER_W,
  SISTER_E,
  NANJIAO,
  SHAZHUI,
];

export const AIDS: Aid[] = [
  {
    id: 'L-BAIJIAO',
    name: '白礁灯塔',
    en: 'Baijiao Lighthouse',
    kind: 'lighthouse',
    position: { lng: 122.1583, lat: 30.0679 },
    characteristic: 'Fl(2) W 10s',
    nominalRangeNm: 21,
    intensityCd: 480_000,
    focalHeightM: 34,
    towerHeightM: 30,
    structure: '白色圆柱形石塔，红色灯笼',
    mark: '白色塔身，礁石基座',
    color: 'W',
    rank: 3,
    sector: { fromDeg: 108, toDeg: 326 },
  },
  {
    id: 'L-QINGLONG',
    name: '青龙角灯塔',
    en: 'Qinglong Jiao Lighthouse',
    kind: 'lighthouse',
    position: { lng: 122.1142, lat: 30.1088 },
    characteristic: 'Mo(A) W 15s',
    nominalRangeNm: 23,
    intensityCd: 620_000,
    focalHeightM: 52,
    towerHeightM: 46,
    structure: '方形混凝土塔，黑色横带',
    mark: '黑色横带，白色塔身',
    color: 'W',
    rank: 3,
    sector: { fromDeg: 40, toDeg: 208 },
  },
  {
    id: 'L-DONGYU',
    name: '东屿灯塔',
    en: 'Dongyu Lighthouse',
    kind: 'lighthouse',
    position: { lng: 122.2348, lat: 30.0752 },
    characteristic: 'Oc W 8s',
    nominalRangeNm: 18,
    intensityCd: 180_000,
    focalHeightM: 40,
    towerHeightM: 33,
    structure: '八角形石塔，白色',
    mark: '白色塔身，红色顶',
    color: 'W',
    rank: 3,
    sector: { fromDeg: 190, toDeg: 355 },
  },
  {
    id: 'B-LAOREN',
    name: '老人礁灯桩',
    en: 'Laoren Reef Beacon',
    kind: 'beacon',
    position: { lng: 122.1339, lat: 30.0718 },
    characteristic: 'Fl(3) G 12s',
    nominalRangeNm: 8,
    intensityCd: 26_000,
    focalHeightM: 16,
    towerHeightM: 12,
    structure: '绿色钢管灯桩',
    mark: '绿色桩身，绿色顶标',
    color: 'G',
    rank: 2,
  },
  {
    id: 'B-SISTER-W',
    name: '姊妹礁西灯桩',
    en: 'Sisters West Beacon',
    kind: 'beacon',
    position: { lng: 122.1762, lat: 30.0548 },
    characteristic: 'VQ(3) G 5s',
    nominalRangeNm: 5,
    intensityCd: 9_000,
    focalHeightM: 8,
    towerHeightM: 6,
    structure: '绿色柱形灯桩',
    mark: '绿色桩身',
    color: 'G',
    rank: 2,
  },
  {
    id: 'B-SISTER-E',
    name: '姊妹礁东灯桩',
    en: 'Sisters East Beacon',
    kind: 'beacon',
    position: { lng: 122.1805, lat: 30.0582 },
    characteristic: 'Fl R 4s',
    nominalRangeNm: 6,
    intensityCd: 14_000,
    focalHeightM: 9,
    towerHeightM: 7,
    structure: '红色柱形灯桩',
    mark: '红色桩身',
    color: 'R',
    rank: 2,
  },
  {
    id: 'F-SOUTH',
    name: '南口灯浮',
    en: 'South Entrance Buoy',
    kind: 'buoy',
    position: { lng: 122.1709, lat: 30.0262 },
    characteristic: 'Fl(3) R 12s',
    nominalRangeNm: 4,
    intensityCd: 5_200,
    focalHeightM: 4,
    towerHeightM: 3,
    structure: '红色罐形浮标',
    mark: '红色罐形，红色灯',
    color: 'R',
    topmark: '罐形',
    rank: 1,
  },
  {
    id: 'F-NORTH',
    name: '北口灯浮',
    en: 'North Exit Buoy',
    kind: 'buoy',
    position: { lng: 122.1482, lat: 30.1556 },
    characteristic: 'Fl(2) G 10s',
    nominalRangeNm: 4,
    intensityCd: 4_800,
    focalHeightM: 4,
    towerHeightM: 3,
    structure: '绿色锥形浮标',
    mark: '绿色锥形，绿色灯',
    color: 'G',
    topmark: '锥形',
    rank: 1,
  },
  {
    id: 'F-MID',
    name: '中沙灯浮',
    en: 'Mid Channel Buoy',
    kind: 'buoy',
    position: { lng: 122.1636, lat: 30.0906 },
    characteristic: 'Fl Y 4s',
    nominalRangeNm: 3,
    intensityCd: 3_000,
    focalHeightM: 3.5,
    towerHeightM: 3,
    structure: '黄色柱形浮标',
    mark: '黄色柱形，黄色灯',
    color: 'Y',
    topmark: '柱形',
    rank: 1,
  },
  {
    id: 'B-NANJIAO',
    name: '南礁灯桩',
    en: 'Nanjiao Reef Beacon',
    kind: 'beacon',
    position: { lng: 122.1489, lat: 30.0174 },
    characteristic: 'VQ(6) 10s',
    nominalRangeNm: 4,
    intensityCd: 4_200,
    focalHeightM: 7,
    towerHeightM: 5,
    structure: '黑色柱形灯桩',
    mark: '黑色桩身，黄色顶标',
    color: 'Y',
    rank: 1,
  },
  {
    id: 'B-QIXING',
    name: '七星屿灯桩',
    en: 'Qixing Islet Beacon',
    kind: 'beacon',
    position: { lng: 122.2131, lat: 30.1572 },
    characteristic: 'Fl(4) W 15s',
    nominalRangeNm: 7,
    intensityCd: 34_000,
    focalHeightM: 22,
    towerHeightM: 18,
    structure: '白色方形灯桩',
    mark: '白色桩身，红色顶标',
    color: 'W',
    rank: 2,
  },
  {
    id: 'B-SHAZHUI',
    name: '沙嘴灯桩',
    en: 'Shazhui Point Beacon',
    kind: 'beacon',
    position: { lng: 122.2051, lat: 30.0412 },
    characteristic: 'Fl(2) R 6s',
    nominalRangeNm: 5,
    intensityCd: 11_000,
    focalHeightM: 11,
    towerHeightM: 9,
    structure: '红色圆柱灯桩',
    mark: '红色桩身',
    color: 'R',
    rank: 2,
  },
];

export const ROUTE: RoutePlan = {
  id: 'RT-BAIJIAO-01',
  name: '白礁水道南—北航段',
  sogKn: 10.5,
  draftM: 7.2,
  turnRadiusNm: 0.18,
  waypoints: [
    { name: 'WP0 南口外', position: { lng: 122.169, lat: 30.006 } },
    { name: 'WP1 南口', position: { lng: 122.1708, lat: 30.03 } },
    { name: 'WP2 双礁南', position: { lng: 122.1695, lat: 30.056 } },
    { name: 'WP3 白礁西', position: { lng: 122.1665, lat: 30.079 } },
    { name: 'WP4 老人礁东', position: { lng: 122.158, lat: 30.096 } },
    { name: 'WP5 青龙口南', position: { lng: 122.14, lat: 30.113 } },
    { name: 'WP6 青龙口', position: { lng: 122.133, lat: 30.132 } },
    { name: 'WP7 北口', position: { lng: 122.142, lat: 30.154 } },
  ],
};

export const SHIP_START = { lng: 122.1672, lat: 30.0728 };

/** Seeded PRNG so soundings are identical on every load (and in tests). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SOUNDING_GRID = {
  lngStep: 0.0125,
  latStep: 0.0105,
  west: 122.062,
  south: 30.0,
  east: 122.256,
  north: 30.156,
};

export const SOUNDING_POINTS: LngLat[] = (() => {
  const rnd = mulberry32(20261123);
  const pts: LngLat[] = [];
  for (let lat = SOUNDING_GRID.south; lat <= SOUNDING_GRID.north; lat += SOUNDING_GRID.latStep) {
    for (let lng = SOUNDING_GRID.west; lng <= SOUNDING_GRID.east; lng += SOUNDING_GRID.lngStep) {
      pts.push({
        lng: lng + (rnd() - 0.5) * 0.0034,
        lat: lat + (rnd() - 0.5) * 0.0026,
      });
    }
  }
  return pts;
})();

export const CHART_BOUNDS = { west: 122.052, south: 29.992, east: 122.262, north: 30.162 };

/** Depth grid parameters shared by the field builder and the raster. */
export const DEPTH_GRID = {
  cols: 190,
  rows: 170,
  minDepthM: 0,
  maxDepthM: 26,
};

export const CHART: ChartData = {
  id: 'CN-18402',
  name: '白礁水道',
  nameEn: 'BAIJIAO PASSAGE',
  edition: '第 7 版 · 2026-03',
  scale: '1:25 000',
  datum: '理论最低潮面 / WGS-84',
  bounds: CHART_BOUNDS,
  land: LAND_RINGS,
  islands: [
    { name: '青龙岛', position: { lng: 122.175, lat: 30.133 } },
    { name: '东屿', position: { lng: 122.238, lat: 30.074 } },
    { name: '七星屿', position: { lng: 122.213, lat: 30.1585 } },
    { name: '白礁', position: { lng: 122.1585, lat: 30.0698 } },
    { name: '老人礁', position: { lng: 122.134, lat: 30.0742 } },
    { name: '姊妹礁', position: { lng: 122.178, lat: 30.0605 } },
    { name: '南礁', position: { lng: 122.149, lat: 30.0205 } },
    { name: '沙嘴', position: { lng: 122.205, lat: 30.0437 } },
  ],
  aids: AIDS,
  route: ROUTE,
  soundings: [] as Sounding[],
  notes: [
    '白礁灯塔与老人礁、姊妹礁灯桩光晕在此交叠，夜航须以灯质周期识别。',
    '青龙口水道最窄处宽约 1.1 km，西侧为岸线，东侧为青龙岛。',
    '主航道设计水深 12.5 m，两侧浅滩最小水深 1.2 m。',
    '所有方位为真方位，自船位起算。',
  ],
};
