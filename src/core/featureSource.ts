/**
 * 要素源：局部米坐标要素 <-> GeoJSON（EPSG:4326 + 高程）转换、
 * 标线文件导出/重新载入、点击拾取用均匀网格空间索引。
 */
import { createFrame, lngLatToLocal, localToLngLat, type LocalFrame } from './geo';
import type {
  ExportFeature,
  LngLatAlt,
  MarkingExportFile,
  MarkingFeature,
  MarkingBuildOptions,
  RunwayConfig,
  Visibility
} from './types';

export interface GeoJSONProps {
  id: number;
  markingType: string;
  kind: 'line' | 'quad';
  width: number;
  lodMax: number;
  runwayId: string;
  [key: string]: string | number;
}

export type RunwayGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSONProps>;

/** 一条跑道的运行时数据 */
export class RunwayFeatureSet {
  readonly runway: RunwayConfig;
  readonly frame: LocalFrame;
  features: MarkingFeature[] = [];
  /** 拾取网格：cellSize 米 */
  private grid = new Map<string, MarkingFeature[]>();
  private readonly cell = 50;

  constructor(runway: RunwayConfig) {
    this.runway = runway;
    this.frame = createFrame(runway);
  }

  setFeatures(features: MarkingFeature[]): void {
    this.features = features;
    this.rebuildIndex();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private rebuildIndex(): void {
    this.grid.clear();
    for (const f of this.features) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of f.local) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const cx0 = Math.floor(minX / this.cell);
      const cx1 = Math.floor(maxX / this.cell);
      const cy0 = Math.floor(minY / this.cell);
      const cy1 = Math.floor(maxY / this.cell);
      for (let cx = cx0; cx <= cx1; cx++) {
        for (let cy = cy0; cy <= cy1; cy++) {
          const k = this.key(cx, cy);
          let bucket = this.grid.get(k);
          if (!bucket) {
            bucket = [];
            this.grid.set(k, bucket);
          }
          bucket.push(f);
        }
      }
    }
  }

  /** 返回点击位置邻近网格中的候选要素（限定类型与当前 LOD） */
  queryCandidates(x: number, y: number, currentLod: number): MarkingFeature[] {
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor(y / this.cell);
    const seen = new Set<number>();
    const out: MarkingFeature[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.grid.get(this.key(cx + dx, cy + dy));
        if (!bucket) continue;
        for (const f of bucket) {
          if (seen.has(f.id)) continue;
          if (f.lodMax < currentLod) continue;
          seen.add(f.id);
          out.push(f);
        }
      }
    }
    return out;
  }
}

/** 单条局部要素 -> GeoJSON Feature（经纬度 + 高程） */
export function featureToGeoJSON(
  frame: LocalFrame,
  f: MarkingFeature
): GeoJSON.Feature<GeoJSON.Geometry, GeoJSONProps> {
  const props: GeoJSONProps = {
    id: f.id,
    markingType: f.type,
    kind: f.kind,
    width: f.width,
    lodMax: f.lodMax,
    runwayId: f.runwayId,
    ...(f.meta ?? {})
  };
  if (f.kind === 'line') {
    const coords = f.local.map((p) => {
      const g = localToLngLat(frame, p);
      return [g.lng, g.lat, g.alt] as [number, number, number];
    });
    return { type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: coords } };
  }
  const ring = [
    ...f.local.map((p) => {
      const g = localToLngLat(frame, p);
      return [g.lng, g.lat, g.alt] as [number, number, number];
    })
  ];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return { type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [ring] } };
}

/** 合并多条跑道的要素为单个 GeoJSON 源 */
export function buildFeatureCollection(sets: RunwayFeatureSet[]): RunwayGeoJSON {
  const features: RunwayGeoJSON['features'] = [];
  for (const set of sets) {
    for (const f of set.features) {
      features.push(featureToGeoJSON(set.frame, f));
    }
  }
  return { type: 'FeatureCollection', features };
}

/** 导出标线文件（含每条线要素的三维坐标与类型） */
export function exportMarkingFile(
  sets: RunwayFeatureSet[],
  options: MarkingBuildOptions,
  visibility: Visibility
): MarkingExportFile {
  const exportFeatures: ExportFeature[] = [];
  for (const set of sets) {
    for (const f of set.features) {
      const gj = featureToGeoJSON(set.frame, f);
      exportFeatures.push({
        id: f.id,
        markingType: f.type,
        runwayId: f.runwayId,
        kind: f.kind,
        width: f.width,
        lodMask: f.lodMax,
        meta: f.meta,
        geometry: gj.geometry as ExportFeature['geometry']
      });
    }
  }
  return {
    format: 'runway-markings-v1',
    exportedAt: new Date().toISOString(),
    crs: 'EPSG:4326',
    runways: sets.map((s) => s.runway),
    options,
    visibility,
    features: exportFeatures
  };
}

export interface ImportResult {
  runways: RunwayConfig[];
  options: MarkingBuildOptions;
  visibility: Visibility;
  sets: RunwayFeatureSet[];
}

/**
 * 重新载入标线文件：优先按文件中的坐标还原要素（保持 id 与几何完全一致），
 * 跑道参数与构建选项一并恢复。
 */
export function importMarkingFile(data: MarkingExportFile): ImportResult {
  if (data.format !== 'runway-markings-v1') {
    throw new Error(`不支持的文件格式: ${String(data.format)}`);
  }
  const sets = new Map<string, RunwayFeatureSet>();
  for (const rw of data.runways) {
    sets.set(rw.id, new RunwayFeatureSet(rw));
  }
  const restored: MarkingFeature[] = [];
  for (const ef of data.features) {
    let set = sets.get(ef.runwayId);
    if (!set) {
      // 容错：文件中的跑道定义缺失时，用首个坐标点构造零长度占位跑道
      const fallback: RunwayConfig = {
        id: ef.runwayId,
        origin: { lng: 0, lat: 0 },
        length: 0,
        width: 0,
        bearing: 0,
        slopePct: 0
      };
      set = new RunwayFeatureSet(fallback);
      sets.set(ef.runwayId, set);
    }
    const geo = ef.geometry;
    const toLocal = (c: [number, number, number]): LngLatAlt => ({
      lng: c[0],
      lat: c[1],
      alt: c[2] ?? 0
    });
    let local: ReturnType<typeof lngLatToLocal>[];
    if (geo.type === 'LineString') {
      local = geo.coordinates.map((c) => lngLatToLocal(set.frame, toLocal(c)));
    } else {
      local = geo.coordinates[0].map((c) => lngLatToLocal(set.frame, toLocal(c)));
      // 去掉闭合环重复的末点，恢复 quad 四点
      if (local.length > 1) {
        const a = local[0];
        const b = local[local.length - 1];
        if (Math.abs(a.x - b.x) < 1e-7 && Math.abs(a.y - b.y) < 1e-7) local.pop();
      }
    }
    restored.push({
      id: ef.id,
      type: ef.markingType,
      runwayId: ef.runwayId,
      local,
      width: ef.width,
      kind: ef.kind,
      lodMax: ef.lodMask,
      meta: ef.meta
    });
  }
  const resultSets: RunwayFeatureSet[] = [];
  for (const [id, set] of sets) {
    const mine = restored.filter((f) => f.runwayId === id);
    set.setFeatures(mine);
    resultSets.push(set);
  }
  return {
    runways: data.runways,
    options: data.options,
    visibility: data.visibility,
    sets: resultSets
  };
}
