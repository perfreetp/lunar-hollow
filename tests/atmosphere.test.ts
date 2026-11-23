import { describe, expect, it } from 'vitest';
import {
  allardRangeM,
  atmosphereFor,
  computeReach,
  extinctionPerM,
  geographicRangeM,
  glowGain,
  haloGeometry,
  haloGroundRadiusM,
  haloRangePx,
  visibilityGrade,
} from '../src/core/atmosphere.ts';
import { NM_TO_M } from '../src/core/geo.ts';

describe('atmosphere and photometry', () => {
  it('extinction falls as visibility improves', () => {
    expect(extinctionPerM(12)).toBeLessThan(extinctionPerM(1.5));
    expect(extinctionPerM(0.5)).toBeGreaterThan(extinctionPerM(3));
  });

  it('allard range grows with intensity and visibility', () => {
    const a = allardRangeM(100_000, 10, 'night');
    const b = allardRangeM(1_000_000, 10, 'night');
    expect(b).toBeGreaterThan(a);
    const clear = allardRangeM(200_000, 12, 'night');
    const fog = allardRangeM(200_000, 1, 'night');
    expect(clear).toBeGreaterThan(fog);
    expect(allardRangeM(0, 10, 'night')).toBe(0);
  });

  it('geographic range follows dip-of-horizon', () => {
    const r = geographicRangeM(34, 9.5);
    expect(r / NM_TO_M).toBeCloseTo(2.08 * (Math.sqrt(34) + Math.sqrt(9.5)), 3);
  });

  it('visible range is capped by geography and visibility', () => {
    const atm = atmosphereFor('night', 'clear');
    const reach = computeReach(480_000, 34, atm);
    expect(reach.visibleRangeM).toBeLessThanOrEqual(reach.geographicRangeM + 1e-6);
    expect(reach.visibleRangeM).toBeLessThanOrEqual(reach.luminousRangeM + 1e-6);
    const fog = computeReach(480_000, 34, atmosphereFor('night', 'fog'));
    expect(fog.visibleRangeM).toBeLessThan(reach.visibleRangeM);
    expect(fog.energy).toBeLessThan(reach.energy);
  });

  it('halo ground radius responds to intensity, height, visibility and mode', () => {
    const night = atmosphereFor('night', 'clear');
    const fog = atmosphereFor('night', 'fog');
    const day = atmosphereFor('day', 'clear');
    const base = haloGroundRadiusM(100_000, 20, night);
    expect(haloGroundRadiusM(900_000, 20, night)).toBeGreaterThan(base);
    expect(haloGroundRadiusM(100_000, 45, night)).toBeGreaterThan(base);
    expect(haloGroundRadiusM(100_000, 20, fog)).toBeLessThan(base);
    expect(haloGroundRadiusM(100_000, 20, day)).toBeLessThan(base);
  });

  it('halo pixel radius is scale-stable across zooms', () => {
    const atm = atmosphereFor('night', 'clear');
    const g14 = haloGeometry(480_000, 34, 30.07, 13, atm);
    const g15 = haloGeometry(480_000, 34, 30.07, 14, atm);
    // One zoom level halves the ground metres per pixel, so the same ground
    // footprint covers twice the pixels; clamp state stays the same.
    expect(g15.radiusRawPx).toBeCloseTo(g14.radiusRawPx * 2, 5);
    expect(g14.clamped).toBe(false);
    expect(g15.clamped).toBe(false);
    // Pixel radius must track the raw radius when unclamped.
    expect(g15.radiusPx).toBeCloseTo(g15.radiusRawPx, 5);
  });

  it('reports clamping at extreme zoom levels', () => {
    const low = haloRangePx(4000, 30, 2, 30, 500);
    expect(low.clamped).toBe(true);
    expect(low.radiusPx).toBe(30);
    const high = haloRangePx(40_000, 30, 19, 30, 500);
    expect(high.clamped).toBe(true);
    expect(high.radiusPx).toBe(500);
  });

  it('glow gain is far higher at night than in daylight', () => {
    const night = glowGain(atmosphereFor('night', 'clear'));
    const day = glowGain(atmosphereFor('day', 'clear'));
    expect(night).toBeGreaterThan(day * 3);
    expect(night).toBeLessThanOrEqual(1.2);
  });

  it('exposes visibility grade lookup with fallback', () => {
    expect(visibilityGrade('fog').visNm).toBeCloseTo(0.5, 6);
    // @ts-expect-error deliberately invalid id
    expect(visibilityGrade('nope').id).toBe('clear');
  });
});
