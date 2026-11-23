import { describe, expect, it } from 'vitest';
import {
  bearingDeltaDeg,
  bearingToCompass,
  formatBearing,
  haversineM,
  initialBearingDeg,
  metersPerPixel,
  projectOnSegment,
  NM_TO_M,
} from '../src/core/geo.ts';

describe('geo', () => {
  it('computes haversine distance for one minute of latitude', () => {
    const d = haversineM({ lng: 122, lat: 30 }, { lng: 122, lat: 30 + 1 / 60 });
    expect(d).toBeGreaterThan(1845);
    expect(d).toBeLessThan(1860);
  });

  it('projects a point onto a segment and clamps at the ends', () => {
    const a = { lng: 122.0, lat: 30.0 };
    const b = { lng: 122.1, lat: 30.0 };
    const mid = projectOnSegment({ lng: 122.05, lat: 30.002 }, a, b);
    expect(mid.t).toBeCloseTo(0.5, 3);
    expect(mid.distanceM).toBeGreaterThan(200);
    expect(mid.distanceM).toBeLessThan(230);
    const before = projectOnSegment({ lng: 121.9, lat: 30.0 }, a, b);
    expect(before.t).toBe(0);
  });

  it('wraps bearing differences', () => {
    expect(bearingDeltaDeg(10, 350)).toBeCloseTo(20, 5);
    expect(bearingDeltaDeg(350, 10)).toBeCloseTo(-20, 5);
  });

  it('reports bearings and compass points', () => {
    const b = initialBearingDeg({ lng: 122, lat: 30 }, { lng: 122, lat: 30.1 });
    expect(b).toBeCloseTo(0, 1);
    expect(bearingToCompass(44)).toBe('NE');
    expect(formatBearing(44.2)).toBe('044° NE');
  });

  it('matches the Web Mercator scale at zoom 10', () => {
    const mpp = metersPerPixel(30, 10);
    const expected = 156543.03392 * Math.cos((30 * Math.PI) / 180) / 1024;
    expect(mpp).toBeCloseTo(expected, 6);
    expect(mpp * NM_TO_M).toBeGreaterThan(0);
  });
});
