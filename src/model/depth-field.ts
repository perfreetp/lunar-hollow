import { CHART_BOUNDS, DEPTH_GRID, LAND_RINGS } from './chart-data.ts';
import { chaikin, distanceToPolylineM, pointInRing, ringBBox } from '../core/polygon.ts';
import {
  chamferDistance,
  contourGrid,
  rasteriseRings,
  type ContourLine,
  type Grid,
  type GridSpec,
} from '../core/raster.ts';
import type { LngLat } from '../core/geo.ts';

export interface DepthModel {
  grid: Grid;
  landMask: Uint8Array;
  /** Consecutive shore rings smoothed at load. */
  shore: LngLat[][];
  contours: ContourLine[];
  sample: (p: LngLat) => number;
  isLand: (p: LngLat) => boolean;
}

function smoothShore(): LngLat[][] {
  return LAND_RINGS.map((ring) => (ring.length > 14 ? chaikin(ring, 1, true) : ring));
}

/**
 * Build the depth field. Depth is driven by distance to the nearest shore,
 * so the 2 m, 5 m, 10 m and 20 m isobaths follow the real coastline of this
 * chart rather than an arbitrary pattern.
 */
/** Separable box blur, radius in cells. Land cells (-1) are excluded from the
 * average so the coastline stays crisp. */
function boxBlur(values: Float32Array, cols: number, rows: number, radius: number): Float32Array {
  const tmp = new Float32Array(values.length);
  const out = new Float32Array(values.length);
  const pass = (
    src: Float32Array,
    dst: Float32Array,
    horizontal: boolean,
  ): void => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (src[i] < 0) {
          dst[i] = src[i];
          continue;
        }
        let sum = 0;
        let n = 0;
        for (let k = -radius; k <= radius; k++) {
          const cc = horizontal ? c + k : c;
          const rr = horizontal ? r : r + k;
          if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) continue;
          const v = src[rr * cols + cc];
          if (v < 0) continue;
          sum += v;
          n++;
        }
        dst[i] = n ? sum / n : src[i];
      }
    }
  };
  pass(values, tmp, true);
  pass(tmp, out, false);
  return out;
}

export function buildDepthModel(): DepthModel {
  const shore = smoothShore();
  const spec: GridSpec = {
    west: CHART_BOUNDS.west,
    south: CHART_BOUNDS.south,
    east: CHART_BOUNDS.east,
    north: CHART_BOUNDS.north,
    cols: DEPTH_GRID.cols,
    rows: DEPTH_GRID.rows,
  };

  const landMask = rasteriseRings(spec, shore);
  const dist = chamferDistance(spec.cols, spec.rows, (c, r) => {
    return landMask[r * spec.cols + c] === 1;
  });

  const cellLngM =
    ((spec.east - spec.west) / (spec.cols - 1)) * 111320 * Math.cos((30.08 * Math.PI) / 180);
  const cellLatM = ((spec.north - spec.south) / (spec.rows - 1)) * 110540;
  const cellM = (cellLngM + cellLatM) / 2;

  const values = new Float32Array(spec.cols * spec.rows);
  for (let r = 0; r < spec.rows; r++) {
    for (let c = 0; c < spec.cols; c++) {
      const i = r * spec.cols + c;
      if (landMask[i] === 1) {
        values[i] = -1;
        continue;
      }
      const dM = dist[i] * cellM;
      // Channel axis runs north-south through the fairway: deepen away from
      // shore and slightly toward the centreline of the passage.
      const lngAt = spec.west + (c / (spec.cols - 1)) * (spec.east - spec.west);
      const latAt = spec.south + (r / (spec.rows - 1)) * (spec.north - spec.south);
      const axisLng = 122.166 + (latAt - 30.08) * 0.16;
      const axisM = Math.abs(lngAt - axisLng) * 111320 * Math.cos((latAt * Math.PI) / 180);
      const axisBoost = Math.exp(-Math.pow(axisM / 1700, 2)) * 7.5;
      const depth = 0.9 + 2.35 * Math.sqrt(dM / 100) + axisBoost;
      values[i] = Math.min(26, depth);
    }
  }

  // The chamfer transform leaves faint 8-directional facets in the distance
  // field. A short separable box blur removes them without moving the isobaths
  // enough to matter at chart scale.
  const smoothed = boxBlur(values, spec.cols, spec.rows, 2);
  const grid: Grid = { spec, values: smoothed };
  const contours = contourGrid(grid, [2, 5, 10, 15, 20], 1.2);

  const bboxes = shore.map((ring) => ({ ring, box: ringBBox(ring) }));

  const isLand = (p: LngLat): boolean => {
    for (const { ring, box } of bboxes) {
      if (p.lng < box.west || p.lng > box.east || p.lat < box.south || p.lat > box.north) {
        continue;
      }
      if (pointInRing(p, ring)) return true;
    }
    return false;
  };

  const sample = (p: LngLat): number => {
    if (isLand(p)) return -1;
    let best = Infinity;
    for (const { ring, box } of bboxes) {
      const pad = 0.02;
      if (
        p.lng < box.west - pad ||
        p.lng > box.east + pad ||
        p.lat < box.south - pad ||
        p.lat > box.north + pad
      ) {
        continue;
      }
      const d = distanceToPolylineM(p, ring, p.lat);
      if (d < best) best = d;
    }
    if (!Number.isFinite(best)) best = 12000;
    const axisLng = 122.166 + (p.lat - 30.08) * 0.16;
    const axisM = Math.abs(p.lng - axisLng) * 111320 * Math.cos((p.lat * Math.PI) / 180);
    const axisBoost = Math.exp(-Math.pow(axisM / 1700, 2)) * 7.5;
    return Math.min(26, 0.9 + 2.35 * Math.sqrt(best / 100) + axisBoost);
  };

  return { grid, landMask, shore, contours, sample, isLand };
}

export const DEPTH_BANDS: Array<{ max: number; label: string; key: string }> = [
  { max: 2, label: '0–2', key: 'd0' },
  { max: 5, label: '2–5', key: 'd2' },
  { max: 10, label: '5–10', key: 'd5' },
  { max: 15, label: '10–15', key: 'd10' },
  { max: 20, label: '15–20', key: 'd15' },
  { max: 27, label: '20+', key: 'd20' },
];

export function depthBandKey(depth: number): string {
  if (depth < 0) return 'land';
  for (const band of DEPTH_BANDS) {
    if (depth <= band.max) return band.key;
  }
  return 'd20';
}
