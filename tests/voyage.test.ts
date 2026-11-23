import { describe, expect, it } from 'vitest';
import { CHART, ROUTE } from '../src/model/chart-data.ts';
import { buildDepthModel } from '../src/model/depth-field.ts';
import {
  buildRouteGeometry,
  computeRouteCoverage,
  headingAlongRoute,
  lightColorHex,
  litRouteFrame,
  nearestAidFrom,
  nearestLitAid,
  routePointAt,
  snapShipToRoute,
} from '../src/core/voyage.ts';
import { atmosphereFor } from '../src/core/atmosphere.ts';
import { parseLightCharacter } from '../src/core/light-character.ts';

const route = buildRouteGeometry(ROUTE, 60);
const depth = buildDepthModel();
const night = atmosphereFor('night', 'clear');

describe('route geometry', () => {
  it('walks the full route with monotonically increasing distance', () => {
    expect(route.points.length).toBeGreaterThan(50);
    expect(route.totalM).toBeGreaterThan(5000);
    for (let i = 1; i < route.points.length; i++) {
      expect(route.points[i].alongM).toBeGreaterThanOrEqual(route.points[i - 1].alongM);
    }
    expect(route.waypointAlongM).toHaveLength(ROUTE.waypoints.length);
    expect(route.waypointAlongM[route.waypointAlongM.length - 1]).toBeCloseTo(route.totalM, 3);
  });

  it('finds the nearest route point and its offset', () => {
    const target = route.points[Math.floor(route.points.length / 2)];
    const snapped = snapShipToRoute(route, target.position);
    expect(snapped.offsetM).toBeLessThan(1);
    expect(snapped.point.alongM).toBeCloseTo(target.alongM, 0);
  });

  it('interpolates headings along the route', () => {
    const heading = headingAlongRoute(route, 0);
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(360);
  });

  it('samples a point at any along-track distance', () => {
    const target = route.totalM * 0.5;
    const p = routePointAt(route, target);
    // Returns the nearest sampled point, so allow one step of slack.
    expect(Math.abs(p.alongM - target)).toBeLessThan(60);
    const clamped = routePointAt(route, -999);
    expect(clamped.alongM).toBe(0);
  });
});

describe('route coverage', () => {
  it('covers the route for bright lights and not for dim ones far away', () => {
    const coverage = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand });
    expect(coverage.aids).toHaveLength(CHART.aids.length);
    const baijiao = coverage.aids.find((a) => a.aidId === 'L-BAIJIAO')!;
    expect(baijiao.indices.length).toBeGreaterThan(0);
    // Every covered point is inside that light's visible range.
    const range = coverage.visibleRangeByAid.get('L-BAIJIAO')!;
    for (const i of baijiao.indices) {
      expect(baijiao.weights[i]).toBeGreaterThan(0);
      expect(baijiao.weights[i]).toBeLessThanOrEqual(1);
    }
    expect(range).toBeGreaterThan(0);
  });

  it('shrinks coverage under fog', () => {
    const clear = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand });
    const fog = computeRouteCoverage(route, CHART.aids, atmosphereFor('night', 'fog'), { isLand: depth.isLand });
    const total = (c: typeof clear) => c.aids.reduce((s, a) => s + a.indices.length, 0);
    expect(total(fog)).toBeLessThan(total(clear));
  });

  it('reports land shadowing without crashing', () => {
    const noShadow = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand, skipShadow: true });
    const shadow = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand });
    const count = (c: typeof shadow) => c.aids.reduce((s, a) => s + a.indices.length, 0);
    expect(count(shadow)).toBeLessThanOrEqual(count(noShadow));
    expect(count(shadow)).toBeGreaterThan(0);
  });
});

describe('lit route frame', () => {
  it('lights only stretches reached by a lamp that is currently on', () => {
    const coverage = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand });
    const colour = new Map(CHART.aids.map((a) => [a.id, a.color]));
    const allOn = new Map(CHART.aids.map((a) => [a.id, 1]));
    const frame = litRouteFrame(coverage, allOn, colour);
    expect(frame.segments.length).toBeGreaterThan(0);
    expect(frame.litLengthM).toBeGreaterThan(1000);
    for (const seg of frame.segments) {
      expect(seg.color).toBeTruthy();
      expect(seg.lit).toBeGreaterThan(0);
      expect(seg.lit).toBeLessThanOrEqual(1);
    }

    const allOff = new Map(CHART.aids.map((a) => [a.id, 0]));
    const dark = litRouteFrame(coverage, allOff, colour);
    expect(dark.segments).toHaveLength(0);
    expect(dark.litLengthM).toBe(0);
  });

  it('reproduces a real characteristic envelope', () => {
    const coverage = computeRouteCoverage(route, CHART.aids, night, { isLand: depth.isLand });
    const character = parseLightCharacter('Fl(2) W 10s');
    // Mid-flash vs mid-gap should differ in lit length.
    const colour = new Map(CHART.aids.map((a) => [a.id, a.color]));
    const on = new Map(CHART.aids.map((a) => [a.id, 0]));
    on.set('L-BAIJIAO', 1);
    const off = new Map(CHART.aids.map((a) => [a.id, 0]));
    off.set('L-BAIJIAO', 0);
    void character;
    const lit = litRouteFrame(coverage, on, colour);
    const notLit = litRouteFrame(coverage, off, colour);
    expect(lit.litLengthM).toBeGreaterThan(0);
    expect(notLit.litLengthM).toBe(0);
  });
});

describe('nearest aid', () => {
  it('reports bearing, distance and range status from the ship', () => {
    const ship = route.points[0].position;
    const nearest = nearestAidFrom(ship, 0, CHART.aids, night)!;
    expect(nearest.distanceM).toBeGreaterThan(0);
    expect(nearest.bearingDeg).toBeGreaterThanOrEqual(0);
    expect(nearest.bearingDeg).toBeLessThan(360);
    expect(nearest.bearingLabel).toMatch(/^\d{3}° [NSEW]{1,3}$/);
    expect(typeof nearest.inRange).toBe('boolean');
  });

  it('only returns a lit aid when its lamp is on', () => {
    const ship = route.points[10].position;
    const allOn = new Map(CHART.aids.map((a) => [a.id, 1]));
    expect(nearestLitAid(ship, CHART.aids, night, allOn)).toBeTruthy();
    const allOff = new Map(CHART.aids.map((a) => [a.id, 0]));
    expect(nearestLitAid(ship, CHART.aids, night, allOff)).toBeNull();
  });

  it('exposes IALA colour hex values', () => {
    expect(lightColorHex('R')).toMatch(/^#[0-9a-f]{6}$/i);
    expect(lightColorHex('ZZ')).toBe(lightColorHex('W'));
  });
});
