import { describe, expect, it } from 'vitest';
import { rasteriseRings, chamferDistance, contourGrid, sampleGridBilinear, type Grid } from '../src/core/raster.ts';
import { chaikin, pointInRing, ringArea, ringCentroid, distanceToPolylineM } from '../src/core/polygon.ts';
import { buildDepthModel, depthBandKey } from '../src/model/depth-field.ts';
import { CHART_BOUNDS } from '../src/model/chart-data.ts';
import { formatSounding, depthColor, depthSafetyClass } from '../src/render/chart-raster.ts';
import type { LngLat } from '../src/core/geo.ts';

const square: LngLat[] = [
  { lng: 1, lat: 1 },
  { lng: 3, lat: 1 },
  { lng: 3, lat: 3 },
  { lng: 1, lat: 3 },
];

describe('polygon helpers', () => {
  it('point-in-ring works inside and outside', () => {
    expect(pointInRing({ lng: 2, lat: 2 }, square)).toBe(true);
    expect(pointInRing({ lng: 4, lat: 2 }, square)).toBe(false);
    expect(pointInRing({ lng: 0.5, lat: 0.5 }, square)).toBe(false);
  });

  it('computes area and centroid', () => {
    expect(ringArea(square)).toBeCloseTo(4, 6);
    const c = ringCentroid(square);
    expect(c.lng).toBeCloseTo(2, 6);
    expect(c.lat).toBeCloseTo(2, 6);
  });

  it('chaikin cuts corners: more vertices, slightly smaller area', () => {
    const smooth = chaikin(square, 2, true);
    // Each pass doubles the vertex count (4 → 8 → 16).
    expect(smooth.length).toBe(square.length * 4);
    // Corner cutting removes the right angle at each vertex, so a 4-vertex
    // square legitimately shrinks (≈3.5 after one pass, ≈3.375 after two).
    const area = ringArea(smooth);
    expect(area).toBeLessThan(4);
    expect(area).toBeGreaterThan(3.3);
    // Smoothing must stay inside the original bounds.
    for (const p of smooth) {
      expect(p.lng).toBeGreaterThanOrEqual(1);
      expect(p.lng).toBeLessThanOrEqual(3);
      expect(p.lat).toBeGreaterThanOrEqual(1);
      expect(p.lat).toBeLessThanOrEqual(3);
    }
  });

  it('measures distance to a polyline', () => {
    const line: LngLat[] = [
      { lng: 0, lat: 0 },
      { lng: 0, lat: 1 },
    ];
    const d = distanceToPolylineM({ lng: 0.01, lat: 0.5 }, line, 0);
    // 0.01° of longitude at the equator ≈ 1113 m.
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1250);
  });
});

describe('raster helpers', () => {
  const spec = { west: 0, south: 0, east: 10, north: 10, cols: 11, rows: 11 };

  it('rasterises a ring into an inside mask', () => {
    const mask = rasteriseRings(spec, [square]);
    const at = (col: number, row: number) => mask[row * 11 + col];
    // The square spans lng/lat 1..3, i.e. columns/rows 1..3.
    expect(at(2, 2)).toBe(1);
    expect(at(1, 1)).toBe(1);
    expect(at(5, 5)).toBe(0);
    expect(at(0, 0)).toBe(0);
  });

  it('distance transform is zero on seeds and grows outward', () => {
    const dist = chamferDistance(11, 11, (c, r) => c === 5 && r === 5);
    expect(dist[5 * 11 + 5]).toBe(0);
    expect(dist[5 * 11 + 6]).toBeCloseTo(1, 5);
    expect(dist[0]).toBeGreaterThan(5);
  });

  it('extracts isobaths from a linear field', () => {
    const values = new Float32Array(11 * 11);
    for (let r = 0; r < 11; r++) for (let c = 0; c < 11; c++) values[r * 11 + c] = c;
    const grid: Grid = { spec, values };
    const lines = contourGrid(grid, [5]);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.level).toBe(5);
      for (const p of line.coordinates) {
        expect(p.lng).toBeGreaterThan(4.5);
        expect(p.lng).toBeLessThan(5.5);
      }
    }
  });

  it('bilinear sampling matches cell values at nodes', () => {
    const values = new Float32Array(4);
    values[0] = 1;
    values[1] = 1;
    values[2] = 3;
    values[3] = 3;
    const grid: Grid = { spec: { west: 0, south: 0, east: 1, north: 1, cols: 2, rows: 2 }, values };
    expect(sampleGridBilinear(grid, { lng: 0, lat: 0 })).toBeCloseTo(1, 5);
    expect(sampleGridBilinear(grid, { lng: 1, lat: 1 })).toBeCloseTo(3, 5);
    expect(sampleGridBilinear(grid, { lng: 0.5, lat: 0.5 })).toBeCloseTo(2, 5);
  });
});

describe('depth model', () => {
  const model = buildDepthModel();

  it('is land inside the mainland and water offshore', () => {
    expect(model.isLand({ lng: 122.06, lat: 30.08 })).toBe(true);
    expect(model.isLand({ lng: 122.19, lat: 30.09 })).toBe(false);
  });

  it('deepens away from the shore', () => {
    const nearShore = model.sample({ lng: 122.108, lat: 30.076 });
    const fairway = model.sample({ lng: 122.17, lat: 30.08 });
    expect(fairway).toBeGreaterThan(nearShore);
    expect(fairway).toBeGreaterThan(5);
  });

  it('produces isobaths and a mask of the right size', () => {
    const { cols, rows } = model.grid.spec;
    expect(model.landMask.length).toBe(cols * rows);
    expect(model.contours.length).toBeGreaterThan(4);
    const levels = new Set(model.contours.map((c) => c.level));
    expect(levels.has(5)).toBe(true);
    expect(levels.has(10)).toBe(true);
  });

  it('maps depth to the legend bands', () => {
    expect(depthBandKey(1)).toBe('d0');
    expect(depthBandKey(3)).toBe('d2');
    expect(depthBandKey(7)).toBe('d5');
    expect(depthBandKey(30)).toBe('d20');
    expect(depthBandKey(-1)).toBe('land');
  });
});

describe('chart raster helpers', () => {
  it('formats soundings in chart style', () => {
    expect(formatSounding(8.4)).toBe('084');
    expect(formatSounding(12.4)).toBe('124');
    expect(formatSounding(0.9)).toBe('009');
  });

  it('classifies depth against draft', () => {
    expect(depthSafetyClass(12, 7)).toBe('safe');
    expect(depthSafetyClass(8, 7)).toBe('caution');
    expect(depthSafetyClass(5, 7)).toBe('grounding');
    expect(depthSafetyClass(-1, 7)).toBe('grounding');
  });

  it('darkens day palette sea versus night', () => {
    const night = depthColor(6, 'night');
    const day = depthColor(6, 'day');
    const lum = (c: [number, number, number]) => c[0] * 0.3 + c[1] * 0.6 + c[2] * 0.1;
    expect(lum(day)).toBeGreaterThan(lum(night) * 1.5);
  });

  it('covers the chart bounds', () => {
    expect(CHART_BOUNDS.east).toBeGreaterThan(CHART_BOUNDS.west);
    expect(CHART_BOUNDS.north).toBeGreaterThan(CHART_BOUNDS.south);
  });
});
