import {
  bearingDeltaDeg,
  formatBearing,
  haversineM,
  initialBearingDeg,
  clamp,
  type LngLat,
} from './geo.ts';
import type { Aid, RoutePlan } from '../model/types.ts';
import type { Atmosphere, LightReach } from './atmosphere.ts';
import { computeReach } from './atmosphere.ts';

export interface RoutePoint {
  position: LngLat;
  /** Cumulative distance from the first waypoint, metres. */
  alongM: number;
  /** Index of the waypoint segment this point falls on. */
  legIndex: number;
  t: number;
}

export interface RouteGeometry {
  points: RoutePoint[];
  totalM: number;
  waypointAlongM: number[];
}

export function buildRouteGeometry(route: RoutePlan, stepM = 50): RouteGeometry {
  const points: RoutePoint[] = [];
  const waypointAlongM: number[] = [0];
  let along = 0;
  const wps = route.waypoints;
  for (let i = 0; i < wps.length - 1; i++) {
    const a = wps[i].position;
    const b = wps[i + 1].position;
    const legLen = haversineM(a, b);
    const steps = Math.max(1, Math.ceil(legLen / stepM));
    const startIdx = points.length;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      points.push({
        position: { lng: a.lng + (b.lng - a.lng) * t, lat: a.lat + (b.lat - a.lat) * t },
        alongM: along + legLen * t,
        legIndex: i,
        t,
      });
    }
    along += legLen;
    waypointAlongM.push(along);
    // Ensure the next leg starts exactly on the waypoint.
    const next = points[startIdx];
    if (next) next.t = 0;
  }
  const last = wps[wps.length - 1].position;
  points.push({ position: last, alongM: along, legIndex: wps.length - 2, t: 1 });
  return { points, totalM: along, waypointAlongM };
}

export interface AidCoverage {
  aidId: string;
  /** 0..1 fraction of the light's nominal reach at each route point. */
  weights: Float32Array;
  /** Point indices that are inside the visible range and not shadowed. */
  indices: Int32Array;
}

export interface RouteCoverage {
  route: RouteGeometry;
  aids: AidCoverage[];
  byPoint: Array<Array<{ aidId: string; weight: number }>>;
  visibleRangeByAid: Map<string, number>;
}

/**
 * Precompute which route points each light can reach. This is the expensive
 * geometric part; it only runs when the ship moves or the atmosphere changes,
 * never per animation frame.
 */
export function computeRouteCoverage(
  route: RouteGeometry,
  aids: readonly Aid[],
  atmosphere: Atmosphere,
  options: {
    skipShadow?: boolean;
    maxRangeM?: number;
    isLand?: (p: LngLat) => boolean;
  } = {},
): RouteCoverage {
  const coverage: AidCoverage[] = [];
  const byPoint: Array<Array<{ aidId: string; weight: number }>> = route.points.map(() => []);
  const visibleRangeByAid = new Map<string, number>();
  const isLand = options.isLand;

  for (const aid of aids) {
    const reach = computeReach(aid.intensityCd, aid.focalHeightM, atmosphere);
    const range = Math.min(reach.visibleRangeM, options.maxRangeM ?? Infinity);
    visibleRangeByAid.set(aid.id, range);
    if (range <= 1) {
      coverage.push({ aidId: aid.id, weights: new Float32Array(route.points.length), indices: new Int32Array(0) });
      continue;
    }
    const weights = new Float32Array(route.points.length);
    const idx: number[] = [];
    for (let i = 0; i < route.points.length; i++) {
      const p = route.points[i].position;
      const d = haversineM(aid.position, p);
      if (d > range) continue;
      const x = d / range;
      const falloff = Math.pow(1 - x * x, 1.6);
      if (falloff <= 0.02) continue;
      if (!options.skipShadow && isLand) {
        const mid = {
          lng: (aid.position.lng + p.lng) / 2,
          lat: (aid.position.lat + p.lat) / 2,
        };
        const q1 = {
          lng: aid.position.lng * 0.75 + p.lng * 0.25,
          lat: aid.position.lat * 0.75 + p.lat * 0.25,
        };
        const q3 = {
          lng: aid.position.lng * 0.25 + p.lng * 0.75,
          lat: aid.position.lat * 0.25 + p.lat * 0.75,
        };
        const own = isLand(aid.position);
        let blocked = false;
        for (const q of [q1, mid, q3]) {
          if (isLand(q) && !(own && haversineM(aid.position, q) < 140)) {
            blocked = true;
            break;
          }
        }
        if (blocked) continue;
      }
      weights[i] = falloff;
      idx.push(i);
    }
    coverage.push({ aidId: aid.id, weights, indices: Int32Array.from(idx) });
    for (const i of idx) byPoint[i].push({ aidId: aid.id, weight: weights[i] });
  }
  return { route, aids: coverage, byPoint, visibleRangeByAid };
}

export interface LitSample {
  index: number;
  lit: number;
  aidId: string | null;
  color: string | null;
}

export interface LitRouteFrame {
  samples: LitSample[];
  /** Contiguous runs of lit samples, collapsed per (aid, alpha bucket). */
  segments: Array<{
    from: number;
    to: number;
    lit: number;
    color: string | null;
    aidId: string | null;
  }>;
  /**
   * Contiguous runs grouped by the illuminating aid only, with the peak
   * intensity of the run. The renderer strokes these as single paths: stroking
   * many short alpha-bucketed sub-segments stacked round caps into a chain of
   * bright beads along the route.
   */
  runs: Array<{
    from: number;
    to: number;
    lit: number;
    color: string;
    aidId: string;
  }>;
  litLengthM: number;
}

const COLOR_HEX: Record<string, string> = {
  W: '#fff4d6',
  R: '#ff5a4d',
  G: '#6dffa0',
  Y: '#ffd166',
  Bu: '#7fb8ff',
};

export function lightColorHex(color: string): string {
  return COLOR_HEX[color] ?? COLOR_HEX.W;
}

/**
 * Apply the live light envelopes to the precomputed coverage, producing the
 * currently illuminated stretches of the route.
 */
export function litRouteFrame(
  coverage: RouteCoverage,
  envelopes: Map<string, number>,
  colors: Map<string, string>,
  minLit = 0.06,
): LitRouteFrame {
  const n = coverage.route.points.length;
  const samples: LitSample[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    let bestAid: string | null = null;
    for (const c of coverage.byPoint[i]) {
      const env = envelopes.get(c.aidId);
      if (!env || env <= 0) continue;
      const v = c.weight * env;
      if (v > best) {
        best = v;
        bestAid = c.aidId;
      }
    }
    samples[i] = {
      index: i,
      lit: best < minLit ? 0 : best,
      aidId: best >= minLit ? bestAid : null,
      color: bestAid ? colors.get(bestAid) ?? 'W' : null,
    };
  }

  const segments: LitRouteFrame['segments'] = [];
  let runStart = -1;
  let runLit = 0;
  let runAid: string | null = null;
  let runColor: string | null = null;
  let litLengthM = 0;

  const flush = (end: number): void => {
    if (runStart < 0) return;
    const from = coverage.route.points[runStart].alongM;
    const to = coverage.route.points[end].alongM;
    litLengthM += Math.max(0, to - from);
    segments.push({ from: runStart, to: end, lit: runLit, color: runColor, aidId: runAid });
    runStart = -1;
    runLit = 0;
    runAid = null;
    runColor = null;
  };

  for (let i = 0; i < n; i++) {
    const s = samples[i];
    if (s.lit <= 0) {
      flush(Math.max(0, i - 1));
      continue;
    }
    if (runStart < 0) {
      runStart = i;
      runLit = s.lit;
      runAid = s.aidId;
      runColor = s.color;
      continue;
    }
    const bucketChange = Math.abs(s.lit - runLit) > 0.12;
    if (s.aidId !== runAid || bucketChange) {
      flush(i);
      runStart = i;
      runLit = s.lit;
      runAid = s.aidId;
      runColor = s.color;
    } else {
      runLit = Math.max(runLit, s.lit);
    }
  }
  flush(n - 1);

  // Merge the bucketed segments into one run per contiguous stretch of a
  // single aid, keeping that stretch's peak intensity.
  const runs: LitRouteFrame['runs'] = [];
  for (const seg of segments) {
    if (!seg.aidId || !seg.color || seg.to <= seg.from) continue;
    const last = runs[runs.length - 1];
    if (last && last.aidId === seg.aidId && last.to >= seg.from - 1) {
      last.to = Math.max(last.to, seg.to);
      last.lit = Math.max(last.lit, seg.lit);
    } else {
      runs.push({ from: seg.from, to: seg.to, lit: seg.lit, color: seg.color, aidId: seg.aidId });
    }
  }

  return { samples, segments, runs, litLengthM };
}

export interface NearestAid {
  aid: Aid;
  distanceM: number;
  bearingDeg: number;
  bearingLabel: string;
  /** True when the light is inside its visible range of the ship. */
  inRange: boolean;
  relativeBearingDeg: number;
  reach: LightReach;
}

export function nearestAidFrom(
  ship: LngLat,
  headingDeg: number,
  aids: readonly Aid[],
  atmosphere: Atmosphere,
): NearestAid | null {
  let best: NearestAid | null = null;
  for (const aid of aids) {
    const distanceM = haversineM(ship, aid.position);
    const bearing = initialBearingDeg(ship, aid.position);
    const reach = computeReach(aid.intensityCd, aid.focalHeightM, atmosphere);
    if (!best || distanceM < best.distanceM) {
      best = {
        aid,
        distanceM,
        bearingDeg: bearing,
        bearingLabel: formatBearing(bearing),
        inRange: distanceM <= reach.visibleRangeM,
        relativeBearingDeg: bearingDeltaDeg(bearing, headingDeg),
        reach,
      };
    }
  }
  return best;
}

/** Nearest aid whose light actually reaches the ship at this instant. */
export function nearestLitAid(
  ship: LngLat,
  aids: readonly Aid[],
  atmosphere: Atmosphere,
  envelopes: Map<string, number>,
): Aid | null {
  let best: { aid: Aid; score: number } | null = null;
  for (const aid of aids) {
    const distanceM = haversineM(ship, aid.position);
    const reach = computeReach(aid.intensityCd, aid.focalHeightM, atmosphere);
    if (distanceM > reach.visibleRangeM) continue;
    const env = envelopes.get(aid.id) ?? 0;
    if (env < 0.05) continue;
    const score = reach.energy * env * (1 - distanceM / (reach.visibleRangeM + 1));
    if (!best || score > best.score) best = { aid, score };
  }
  return best?.aid ?? null;
}

export interface ShipState {
  position: LngLat;
  headingDeg: number;
}

export function headingAlongRoute(route: RouteGeometry, alongM: number): number {
  const pts = route.points;
  let idx = 0;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].alongM >= alongM) {
      idx = i;
      break;
    }
    idx = i;
  }
  const a = pts[Math.max(0, idx - 1)];
  const b = pts[Math.min(pts.length - 1, idx + 1)];
  return initialBearingDeg(a.position, b.position);
}

/** Clamp a dragged ship back onto the water and report if it moved off-route. */
export function snapShipToRoute(route: RouteGeometry, p: LngLat): { point: RoutePoint; offsetM: number } {
  let best = route.points[0];
  let bestD = Infinity;
  for (const pt of route.points) {
    const d = haversineM(pt.position, p);
    if (d < bestD) {
      bestD = d;
      best = pt;
    }
  }
  return { point: best, offsetM: bestD };
}

export function routePointAt(route: RouteGeometry, alongM: number): RoutePoint {
  const pts = route.points;
  const clamped = clamp(alongM, 0, route.totalM);
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].alongM < clamped) lo = mid + 1;
    else hi = mid;
  }
  return pts[lo];
}
