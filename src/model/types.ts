import type { LngLat } from '../core/geo.ts';
import type { LightColor } from '../core/light-character.ts';

export type AidKind = 'lighthouse' | 'beacon' | 'buoy' | 'wreck-buoy';

export interface Aid {
  id: string;
  name: string;
  en: string;
  kind: AidKind;
  position: LngLat;
  /** IALA characteristic notation, e.g. `Fl(2) W 10s`. */
  characteristic: string;
  /** Nominal range published on the chart, nautical miles. */
  nominalRangeNm: number;
  /** Luminous intensity, candela. */
  intensityCd: number;
  /** Focal plane above mean high water, metres. */
  focalHeightM: number;
  /** Tower height, metres. */
  towerHeightM: number;
  /** Structure description, e.g. 白色圆柱形塔身. */
  structure: string;
  /** Mark description, e.g. 红色罐形. */
  mark: string;
  color: LightColor;
  /** Topmark abbreviation, if any. */
  topmark?: string;
  /** Chart symbol scale hint 1..3. */
  rank: 1 | 2 | 3;
  /** Optional yaw of the sector marker, degrees true. */
  sector?: { fromDeg: number; toDeg: number };
}

export interface RouteWaypoint {
  name: string;
  position: LngLat;
}

export interface RoutePlan {
  id: string;
  name: string;
  waypoints: RouteWaypoint[];
  /** Planned speed over ground, knots. */
  sogKn: number;
  draftM: number;
  /** Turn radius, nautical miles. */
  turnRadiusNm: number;
}

export interface Sounding {
  position: LngLat;
  depthM: number;
}

export interface ChartData {
  id: string;
  name: string;
  nameEn: string;
  edition: string;
  scale: string;
  datum: string;
  bounds: { west: number; south: number; east: number; north: number };
  /** Land polygons, outer rings only. */
  land: LngLat[][];
  /** Additional island polygons that need their own labels. */
  islands: Array<{ name: string; position: LngLat }>;
  aids: Aid[];
  route: RoutePlan;
  soundings: Sounding[];
  notes: string[];
}
