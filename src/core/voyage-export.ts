/**
 * Voyage configuration export.
 *
 * The file is the artefact an operator hands to the next watch: the route, the
 * ship state, the atmosphere the halo model was evaluated under, and the
 * per-light photometry used to compute visible ranges. Pure functions here so
 * the format can be snapshot-tested.
 */
import type { Atmosphere } from './atmosphere.ts';
import { haloGroundRadiusM } from './atmosphere.ts';
import { computeReach } from './atmosphere.ts';
import { formatLatDms, formatLngDms, NM_TO_M, type LngLat } from './geo.ts';
import type { Aid, ChartData, RoutePlan } from '../model/types.ts';

export type ExportFormat = 'json' | 'geojson' | 'briefing';

export interface ExportContext {
  chart: ChartData;
  atmosphere: Atmosphere;
  route: RoutePlan;
  ship: { position: LngLat; headingDeg: number; alongM: number };
  visibilityGrade: string;
  mode: 'night' | 'day';
  /** ISO timestamp; injected so output is deterministic in tests. */
  generatedAt: string;
  appVersion: string;
}

export interface ExportedLight {
  id: string;
  name: string;
  kind: string;
  position: { lng: number; lat: number };
  characteristic: string;
  intensityCd: number;
  focalHeightM: number;
  nominalRangeNm: number;
  luminousRangeNm: number;
  geographicRangeNm: number;
  visibleRangeNm: number;
  haloRadiusM: number;
  energy: number;
}

export interface ExportedFile {
  schema: 'chisha.voyage.config/1';
  app: string;
  generatedAt: string;
  chart: {
    id: string;
    name: string;
    edition: string;
    scale: string;
    datum: string;
    bounds: ChartData['bounds'];
  };
  atmosphere: {
    mode: 'night' | 'day';
    visibilityGrade: string;
    visibilityNm: number;
    eyeHeightM: number;
    extinctionPerNm: number;
  };
  ship: {
    position: { lng: number; lat: number };
    positionDms: { lat: string; lng: string };
    headingDeg: number;
    alongRouteNm: number;
  };
  route: {
    id: string;
    name: string;
    sogKn: number;
    draftM: number;
    turnRadiusNm: number;
    waypoints: Array<{
      index: number;
      name: string;
      position: { lng: number; lat: number };
      latDms: string;
      lngDms: string;
    }>;
  };
  lights: ExportedLight[];
  notes: string[];
}

export function buildExport(ctx: ExportContext): ExportedFile {
  const { atmosphere, chart } = ctx;
  const lights: ExportedLight[] = chart.aids.map((aid) => exportLight(aid, atmosphere));
  return {
    schema: 'chisha.voyage.config/1',
    app: ctx.appVersion,
    generatedAt: ctx.generatedAt,
    chart: {
      id: chart.id,
      name: chart.name,
      edition: chart.edition,
      scale: chart.scale,
      datum: chart.datum,
      bounds: chart.bounds,
    },
    atmosphere: {
      mode: ctx.mode,
      visibilityGrade: ctx.visibilityGrade,
      visibilityNm: atmosphere.visNm,
      eyeHeightM: atmosphere.eyeHeightM,
      extinctionPerNm: atmosphere.extinction * NM_TO_M,
    },
    ship: {
      position: { lng: ctx.ship.position.lng, lat: ctx.ship.position.lat },
      positionDms: {
        lat: formatLatDms(ctx.ship.position.lat),
        lng: formatLngDms(ctx.ship.position.lng),
      },
      headingDeg: ctx.ship.headingDeg,
      alongRouteNm: ctx.ship.alongM / NM_TO_M,
    },
    route: {
      id: ctx.route.id,
      name: ctx.route.name,
      sogKn: ctx.route.sogKn,
      draftM: ctx.route.draftM,
      turnRadiusNm: ctx.route.turnRadiusNm,
      waypoints: ctx.route.waypoints.map((wp, i) => ({
        index: i,
        name: wp.name,
        position: { lng: wp.position.lng, lat: wp.position.lat },
        latDms: formatLatDms(wp.position.lat),
        lngDms: formatLngDms(wp.position.lng),
      })),
    },
    lights,
    notes: chart.notes,
  };
}

export function exportLight(aid: Aid, atmosphere: Atmosphere): ExportedLight {
  const reach = computeReach(aid.intensityCd, aid.focalHeightM, atmosphere);
  return {
    id: aid.id,
    name: aid.name,
    kind: aid.kind,
    position: { lng: aid.position.lng, lat: aid.position.lat },
    characteristic: aid.characteristic,
    intensityCd: aid.intensityCd,
    focalHeightM: aid.focalHeightM,
    nominalRangeNm: aid.nominalRangeNm,
    luminousRangeNm: round2(reach.luminousRangeM / NM_TO_M),
    geographicRangeNm: round2(reach.geographicRangeM / NM_TO_M),
    visibleRangeNm: round2(reach.visibleRangeM / NM_TO_M),
    haloRadiusM: Math.round(haloGroundRadiusM(aid.intensityCd, aid.focalHeightM, atmosphere)),
    energy: round3(reach.energy),
  };
}

export function toGeoJSON(file: ExportedFile, routeLine?: LngLat[]): Record<string, unknown> {
  const coords = routeLine && routeLine.length >= 2
    ? routeLine.map((p) => [p.lng, p.lat])
    : file.route.waypoints.map((wp) => [wp.position.lng, wp.position.lat]);
  return {
    type: 'FeatureCollection',
    name: `${file.chart.id} ${file.route.name}`,
    features: [
      {
        type: 'Feature',
        properties: {
          kind: 'route',
          id: file.route.id,
          name: file.route.name,
          sogKn: file.route.sogKn,
          draftM: file.route.draftM,
          shipHeadingDeg: file.ship.headingDeg,
        },
        geometry: { type: 'LineString', coordinates: coords },
      },
      ...file.route.waypoints.map((wp) => ({
        type: 'Feature' as const,
        properties: { kind: 'waypoint', index: wp.index, name: wp.name, latDms: wp.latDms, lngDms: wp.lngDms },
        geometry: { type: 'Point' as const, coordinates: [wp.position.lng, wp.position.lat] },
      })),
      ...file.lights.map((l) => ({
        type: 'Feature' as const,
        properties: {
          kind: l.kind,
          id: l.id,
          name: l.name,
          characteristic: l.characteristic,
          intensityCd: l.intensityCd,
          focalHeightM: l.focalHeightM,
          visibleRangeNm: l.visibleRangeNm,
        },
        geometry: { type: 'Point' as const, coordinates: [l.position.lng, l.position.lat] },
      })),
    ],
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function toBriefingText(file: ExportedFile): string {
  const lines: string[] = [];
  lines.push(`航段配置 · ${file.chart.name} (${file.chart.id})`);
  lines.push(`生成时间 ${file.generatedAt} · 海图 ${file.chart.edition} · ${file.chart.scale}`);
  lines.push('');
  lines.push(`航段: ${file.route.name}`);
  lines.push(`计划航速 ${file.route.sogKn.toFixed(1)} kn · 吃水 ${file.route.draftM.toFixed(1)} m · 回转半径 ${file.route.turnRadiusNm.toFixed(2)} nm`);
  lines.push('');
  lines.push('航路点:');
  file.route.waypoints.forEach((wp) => {
    const lng = wp.position.lng.toFixed(5);
    const lat = wp.position.lat.toFixed(5);
    lines.push(`  ${String(wp.index).padStart(2, '0')} ${wp.name.padEnd(12, ' ')} ${lat}N ${lng}E  (${wp.latDms} ${wp.lngDms})`);
  });
  lines.push('');
  lines.push('船位:');
  lines.push(`  ${file.ship.positionDms.lat} ${file.ship.positionDms.lng} · 航向 ${Math.round(file.ship.headingDeg)}° · 沿航线 ${file.ship.alongRouteNm.toFixed(2)} nm`);
  lines.push('');
  lines.push(`环境: ${file.atmosphere.mode === 'night' ? '夜间' : '昼间'} · 能见度 ${file.atmosphere.visibilityNm} nm · 眼高 ${file.atmosphere.eyeHeightM} m`);
  lines.push('');
  lines.push('灯标:');
  file.lights.forEach((l) => {
    lines.push(
      `  ${l.id.padEnd(12, ' ')} ${l.characteristic.padEnd(14, ' ')} H=${String(l.focalHeightM).padStart(3, ' ')}m I=${l.intensityCd}cd 可见 ${l.visibleRangeNm} nm 光晕 ${l.haloRadiusM} m`,
    );
  });
  lines.push('');
  lines.push('注意:');
  file.notes.forEach((n) => lines.push(`  - ${n}`));
  lines.push('');
  return lines.join('\n');
}

export function serializeExport(file: ExportedFile, format: ExportFormat): { text: string; mime: string; extension: string } {
  if (format === 'geojson') {
    return {
      text: JSON.stringify(toGeoJSON(file), null, 2),
      mime: 'application/geo+json',
      extension: 'geojson',
    };
  }
  if (format === 'briefing') {
    return { text: toBriefingText(file), mime: 'text/plain;charset=utf-8', extension: 'txt' };
  }
  return { text: JSON.stringify(file, null, 2), mime: 'application/json', extension: 'json' };
}

export function exportFileName(file: ExportedFile, format: ExportFormat): string {
  const stamp = file.generatedAt.replace(/[-:]/g, '').replace(/\..*$/, '').replace('T', '-');
  const ext = format === 'geojson' ? 'geojson' : format === 'briefing' ? 'txt' : 'json';
  return `${file.chart.id}-${file.route.id}-${stamp}.${ext}`;
}
