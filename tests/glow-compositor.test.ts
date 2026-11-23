import { describe, expect, it } from 'vitest';
import {
  circleOverlapArea,
  composeGlows,
  glowPriority,
  huePreservingExposure,
  overlapFraction,
  sortGlowSources,
  type GlowSource,
} from '../src/core/glow-compositor.ts';

function src(over: Partial<GlowSource> & { id: string }): GlowSource {
  return {
    x: 100,
    y: 100,
    radiusPx: 100,
    intensityCd: 100_000,
    luminance: 1,
    distanceM: 5000,
    envelope: 1,
    color: [255, 255, 255],
    focalHeightM: 20,
    visible: true,
    ...over,
  };
}

describe('glow composition', () => {
  it('orders dim far lamps before bright near lamps', () => {
    const dimFar = src({ id: 'dim-far', luminance: 0.3, distanceM: 18000 });
    const brightNear = src({ id: 'bright-near', luminance: 1.5, distanceM: 1200 });
    const ordered = sortGlowSources([brightNear, dimFar]);
    expect(ordered.map((s) => s.id)).toEqual(['dim-far', 'bright-near']);
    expect(glowPriority(brightNear)).toBeGreaterThan(glowPriority(dimFar));
  });

  it('breaks priority ties deterministically by distance then id', () => {
    const a = src({ id: 'a', distanceM: 5000, focalHeightM: 10 });
    const b = src({ id: 'b', distanceM: 5000, focalHeightM: 10 });
    const c = src({ id: 'c', distanceM: 4000, focalHeightM: 10 });
    const ordered = sortGlowSources([b, a, c]);
    expect(ordered.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('computes lens overlap area and fraction', () => {
    expect(circleOverlapArea(100, 100, 0)).toBeCloseTo(Math.PI * 10000, 4);
    expect(circleOverlapArea(100, 100, 200)).toBe(0);
    expect(circleOverlapArea(100, 100, 250)).toBe(0);
    const half = overlapFraction(100, 100, 100);
    expect(half).toBeGreaterThan(0.35);
    expect(half).toBeLessThan(0.45);
  });

  it('suppresses a dim lamp under a bright neighbour', () => {
    const dim = src({ id: 'dim', x: 100, y: 100, radiusPx: 90, luminance: 0.45 });
    const bright = src({
      id: 'bright',
      x: 130,
      y: 100,
      radiusPx: 110,
      luminance: 1.3,
      distanceM: 2000,
    });
    const comp = composeGlows([bright, dim]);
    expect(comp.items.map((i) => i.source.id)).toEqual(['dim', 'bright']);
    const dimItem = comp.items.find((i) => i.source.id === 'dim')!;
    const brightItem = comp.items.find((i) => i.source.id === 'bright')!;
    expect(dimItem.suppression).toBeGreaterThan(0.3);
    expect(dimItem.gain).toBeLessThan(brightItem.gain);
    expect(brightItem.gain).toBe(1);
    expect(comp.overlapPairs).toBeGreaterThan(0);
    expect(comp.crowded).toBe(true);
  });

  it('leaves isolated lamps untouched', () => {
    const a = src({ id: 'a', x: 0, y: 0, radiusPx: 40 });
    const b = src({ id: 'b', x: 1000, y: 1000, radiusPx: 40 });
    const comp = composeGlows([a, b]);
    expect(comp.overlapPairs).toBe(0);
    expect(comp.items.every((i) => i.gain === 1)).toBe(true);
    expect(comp.crowded).toBe(false);
  });

  it('keeps total exposure bounded in a tight cluster', () => {
    const cluster: GlowSource[] = Array.from({ length: 6 }, (_, i) =>
      src({
        id: `s${i}`,
        x: 200 + (i % 3) * 12,
        y: 200 + Math.floor(i / 3) * 12,
        radiusPx: 120,
        luminance: 0.6 + i * 0.1,
      }),
    );
    const comp = composeGlows(cluster);
    expect(comp.items).toHaveLength(6);
    expect(comp.totalPeak).toBeLessThan(6);
    const totalGain = comp.items.reduce((s, i) => s + i.gain, 0);
    expect(totalGain).toBeLessThan(6);
    expect(comp.maxSuppression).toBeGreaterThan(0);
  });

  it('honours the minimum gain floor', () => {
    const bright = src({ id: 'bright', x: 100, y: 100, radiusPx: 200, luminance: 1.5 });
    const dim = src({ id: 'dim', x: 100, y: 100, radiusPx: 200, luminance: 0.2, distanceM: 30000 });
    const comp = composeGlows([bright, dim], { minGain: 0.25 });
    const dimItem = comp.items.find((i) => i.source.id === 'dim')!;
    expect(dimItem.gain).toBeGreaterThanOrEqual(0.25);
  });

  it('culls invisible and zero-range sources', () => {
    const a = src({ id: 'a', visible: false });
    const b = src({ id: 'b', radiusPx: 0 });
    const c = src({ id: 'c', intensityCd: 0 });
    const comp = composeGlows([a, b, c]);
    expect(comp.items).toHaveLength(0);
  });

  it('preserves hue when exposure pushes channels bright', () => {
    const [r, g, b] = huePreservingExposure([255, 60, 40], 4);
    expect(r).toBeLessThanOrEqual(1.0001);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    // Naive per-channel clipping would give [1, 0.94, 0.63] (ratio ≈ 1.06);
    // the shoulder keeps the original 255:60 ratio instead of drifting white.
    expect(r / Math.max(1e-6, g)).toBeCloseTo(255 / 60, 6);
    expect(r / Math.max(1e-6, g)).toBeGreaterThan(2);
  });
});
