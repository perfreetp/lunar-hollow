import { describe, expect, it } from 'vitest';
import {
  buildExport,
  exportFileName,
  exportLight,
  serializeExport,
  toBriefingText,
  toGeoJSON,
} from '../src/core/voyage-export.ts';
import { CHART } from '../src/model/chart-data.ts';
import { atmosphereFor } from '../src/core/atmosphere.ts';

const ctx = {
  chart: CHART,
  atmosphere: atmosphereFor('night', 'good'),
  route: CHART.route,
  ship: { position: { lng: 122.167, lat: 30.073 }, headingDeg: 351, alongM: 2400 },
  visibilityGrade: 'good',
  mode: 'night' as const,
  generatedAt: '2026-11-23T04:05:06.789Z',
  appVersion: '1.0.0',
};

describe('voyage export', () => {
  it('emits the documented schema with every section', () => {
    const file = buildExport(ctx);
    expect(file.schema).toBe('chisha.voyage.config/1');
    expect(file.generatedAt).toBe(ctx.generatedAt);
    expect(file.chart.id).toBe(CHART.id);
    expect(file.atmosphere.visibilityNm).toBe(6);
    expect(file.ship.headingDeg).toBe(351);
    expect(file.ship.alongRouteNm).toBeCloseTo(2400 / 1852, 4);
    expect(file.route.waypoints).toHaveLength(CHART.route.waypoints.length);
    expect(file.lights).toHaveLength(CHART.aids.length);
    expect(file.notes.length).toBeGreaterThan(0);
  });

  it('includes both decimal and DMS positions', () => {
    const file = buildExport(ctx);
    expect(file.ship.positionDms.lat).toMatch(/^\d{2}°\d{2}′\d{2}\.\d″N$/);
    expect(file.ship.positionDms.lng).toMatch(/^\d{3}°\d{2}′\d{2}\.\d″E$/);
    for (const wp of file.route.waypoints) {
      expect(wp.latDms).toMatch(/[NS]$/);
      expect(wp.lngDms).toMatch(/[EW]$/);
    }
  });

  it('computes per-light ranges consistently with the atmosphere', () => {
    const file = buildExport(ctx);
    const baijiao = file.lights.find((l) => l.id === 'L-BAIJIAO')!;
    expect(baijiao.visibleRangeNm).toBeLessThanOrEqual(baijiao.geographicRangeNm + 0.01);
    expect(baijiao.haloRadiusM).toBeGreaterThan(0);
    expect(baijiao.energy).toBeGreaterThan(0);
    // Fog must shorten every light's visible range.
    const fog = exportLight(CHART.aids[0], atmosphereFor('night', 'fog'));
    const clear = exportLight(CHART.aids[0], atmosphereFor('night', 'clear'));
    expect(fog.visibleRangeNm).toBeLessThan(clear.visibleRangeNm);
  });

  it('round-trips through JSON', () => {
    const file = buildExport(ctx);
    const { text, mime } = serializeExport(file, 'json');
    expect(mime).toContain('json');
    const parsed = JSON.parse(text);
    expect(parsed.schema).toBe(file.schema);
    expect(parsed.lights).toHaveLength(file.lights.length);
  });

  it('produces a valid GeoJSON feature collection', () => {
    const file = buildExport(ctx);
    const geo = toGeoJSON(file) as { type: string; features: Array<{ geometry: { type: string; coordinates: number[] } }> };
    expect(geo.type).toBe('FeatureCollection');
    expect(geo.features.length).toBe(1 + file.route.waypoints.length + file.lights.length);
    const route = geo.features[0];
    expect(route.geometry.type).toBe('LineString');
    const point = geo.features[1];
    expect(point.geometry.type).toBe('Point');
    expect(point.geometry.coordinates).toHaveLength(2);
  });

  it('renders a readable briefing', () => {
    const file = buildExport(ctx);
    const text = toBriefingText(file);
    expect(text).toContain('航段配置');
    expect(text).toContain(CHART.route.name);
    expect(text).toContain('灯标:');
    expect(text).toContain('灯质');
    expect(text.split('\n').length).toBeGreaterThan(20);
  });

  it('builds stable, timestamped filenames', () => {
    const file = buildExport(ctx);
    expect(exportFileName(file, 'json')).toBe('CN-18402-RT-BAIJIAO-01-20261123-040506.json');
    expect(exportFileName(file, 'geojson')).toMatch(/\.geojson$/);
    expect(exportFileName(file, 'briefing')).toMatch(/\.txt$/);
  });

  it('is deterministic for a fixed timestamp', () => {
    const a = JSON.stringify(buildExport(ctx));
    const b = JSON.stringify(buildExport(ctx));
    expect(a).toBe(b);
  });
});
