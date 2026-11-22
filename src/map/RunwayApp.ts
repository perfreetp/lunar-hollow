/**
 * 应用控制器：跑道与标线数据管理、参数变更重建、点击拾取与两标线间距测量、
 * 导出/重新载入。渲染器只负责画图，业务状态集中在这里。
 */
import * as maplibregl from 'maplibre-gl';
import { lngLatToLocal, localToLngLat } from '../core/geo.js';
import { MarkingRenderer } from './MarkingRenderer.js';
import { buildRunwayMarkings } from '../core/markingBuilder.js';
import { measureMarkingDistance, measureAcrossFrames, distanceToFeature, type MeasurementResult } from '../core/measure.js';
import {
  exportMarkingFile,
  importMarkingFile,
  RunwayFeatureSet,
  type ImportResult
} from '../core/featureSource.js';
import {
  ALL_VISIBLE,
  DEFAULT_BUILD_OPTIONS,
  MARKING_TYPES,
  type MarkingBuildOptions,
  type MarkingExportFile,
  type MarkingFeature,
  type RunwayConfig,
  type Visibility
} from '../core/types.js';

export interface PickResult {
  feature: MarkingFeature;
  runwayId: string;
  distance: number;
}

export interface MeasureState {
  first: MarkingFeature | null;
  second: MarkingFeature | null;
  result: MeasurementResult | null;
  /** 跨跑道测量时的地理最近点（局部结果为 null 时使用） */
  crossGeo: { a: { lng: number; lat: number }; b: { lng: number; lat: number } } | null;
}

type Listener = (event: string) => void;

export class RunwayApp {
  readonly renderer: MarkingRenderer;
  sets: RunwayFeatureSet[] = [];
  options: MarkingBuildOptions = { ...DEFAULT_BUILD_OPTIONS };
  visibility: Visibility = { ...ALL_VISIBLE };
  measure: MeasureState = { first: null, second: null, result: null, crossGeo: null };
  measureMode = false;
  private listeners = new Set<Listener>();
  /** 跑道方位 -> 号码文本缓存（面板展示） */
  designationInfo = new Map<string, { d0: string; d1: string }>();

  constructor(renderer: MarkingRenderer) {
    this.renderer = renderer;
    if (renderer.isReady) this.bindInteraction();
    else renderer.map.on('load', () => this.bindInteraction());
  }

  private interactionBound = false;

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: string): void {
    for (const fn of this.listeners) fn(event);
  }

  /** 新增跑道并构建标线 */
  addRunway(runway: RunwayConfig): void {
    const set = new RunwayFeatureSet(runway);
    const { features, designation0, designation1 } = buildRunwayMarkings(runway, this.options);
    set.setFeatures(features);
    this.sets.push(set);
    this.designationInfo.set(runway.id, { d0: designation0, d1: designation1 });
    this.renderer.setData(this.sets);
    this.emit('runways');
  }

  /** 更新跑道几何（方位/坡度/尺寸变化即整体重建，号码随方位重排） */
  updateRunway(id: string, patch: Partial<RunwayConfig>): void {
    const set = this.sets.find((s) => s.runway.id === id);
    if (!set) return;
    const merged: RunwayConfig = { ...set.runway, ...patch };
    const rebuilt = new RunwayFeatureSet(merged);
    const { features, designation0, designation1 } = buildRunwayMarkings(merged, this.options);
    rebuilt.setFeatures(features);
    const idx = this.sets.indexOf(set);
    this.sets[idx] = rebuilt;
    this.designationInfo.set(id, { d0: designation0, d1: designation1 });
    this.resetMeasure();
    this.renderer.setData(this.sets);
    this.emit('runways');
  }

  removeRunway(id: string): void {
    this.sets = this.sets.filter((s) => s.runway.id !== id);
    this.designationInfo.delete(id);
    this.resetMeasure();
    this.renderer.setData(this.sets);
    this.emit('runways');
  }

  /** 构建参数（虚线长/间隔、真实尺寸、LOD 阈值等）变化 -> 全量重建 */
  updateOptions(patch: Partial<MarkingBuildOptions>): void {
    this.options = { ...this.options, ...patch };
    this.rebuildAll();
    if (patch.lodFullBelow !== undefined || patch.lodSimplifyBelow !== undefined) {
      this.renderer.setLODZoomThresholds(this.options.lodFullBelow, this.options.lodSimplifyBelow);
    }
    this.emit('options');
  }

  private rebuildAll(): void {
    const next: RunwayFeatureSet[] = [];
    for (const set of this.sets) {
      const rebuilt = new RunwayFeatureSet(set.runway);
      const { features } = buildRunwayMarkings(set.runway, this.options);
      rebuilt.setFeatures(features);
      next.push(rebuilt);
    }
    this.sets = next;
    this.resetMeasure();
    this.renderer.setData(this.sets);
  }

  setVisibility(patch: Partial<Visibility>): void {
    this.visibility = { ...this.visibility, ...patch };
    this.renderer.setVisibility(this.visibility);
    this.emit('visibility');
  }

  // ---------- 拾取与测量 ----------

  private bindInteraction(): void {
    if (this.interactionBound) return;
    this.interactionBound = true;
    const map = this.renderer.map;
    map.on('click', (e: maplibregl.MapMouseEvent & { lngLat: maplibregl.LngLat }) => this.handleClick(e.lngLat.lng, e.lngLat.lat));
    map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      const hit = this.measureMode ? this.pick(e.lngLat.lng, e.lngLat.lat) : null;
      map.getCanvas().style.cursor = hit ? 'crosshair' : this.measureMode ? 'crosshair' : '';
    });
  }

  /** 屏幕经纬度 -> 最近的可见标线 */
  pick(lng: number, lat: number): PickResult | null {
    let best: PickResult | null = null;
    for (const set of this.sets) {
      const local = lngLatToLocal(set.frame, { lng, lat, alt: 0 });
      const candidates = set.queryCandidates(local.x, local.y, this.renderer.currentLOD);
      for (const f of candidates) {
        if (!this.visibility[f.type]) continue;
        const d = distanceToFeature(set.frame, local.x, local.y, f);
        if (!best || d < best.distance) {
          best = { feature: f, runwayId: set.runway.id, distance: d };
        }
      }
    }
    // 容差随缩放变化（约 12 像素对应的米数）
    if (best) {
      const z = this.renderer.map.getZoom();
      const center = this.renderer.map.getCenter();
      // MapLibre 512px 世界瓦片：z0 每像素 78271.5·cos(lat) 米
      const metersPerPx =
        (78271.487 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, z);
      if (best.distance > metersPerPx * 12) return null;
    }
    return best;
  }

  private handleClick(lng: number, lat: number): void {
    if (!this.measureMode) return;
    const hit = this.pick(lng, lat);
    if (!hit) return;
    if (!this.measure.first) {
      this.measure.first = hit.feature;
      this.renderHighlight([hit.feature]);
      this.emit('measure');
      return;
    }
    if (this.measure.first.id === hit.feature.id && this.measure.first.runwayId === hit.runwayId) {
      // 再次点击同一要素：取消选择
      this.resetMeasure();
      this.emit('measure');
      return;
    }
    this.measure.second = hit.feature;
    const setB = this.sets.find((s) => s.runway.id === hit.runwayId)!;
    const setA = this.sets.find((s) => s.runway.id === this.measure.first!.runwayId)!;
    if (setA === setB) {
      const result = measureMarkingDistance(setA.frame, this.measure.first, this.measure.second);
      this.measure.result = result;
      this.measure.crossGeo = null;
      this.renderMeasurement(result);
    } else {
      const cross = measureAcrossFrames(
        setA.frame,
        this.measure.first,
        setB.frame,
        this.measure.second
      );
      this.measure.result = {
        distance: cross.distance,
        pointA: { x: 0, y: 0, z: cross.geoA.alt },
        pointB: { x: 0, y: 0, z: cross.geoB.alt }
      };
      this.measure.crossGeo = { a: cross.geoA, b: cross.geoB };
      this.renderer.showMeasurement(this.buildGeoMeasurement(cross.geoA, cross.geoB));
    }
    this.renderHighlight([this.measure.first, this.measure.second]);
    this.emit('measure');
  }

  private renderHighlight(features: MarkingFeature[]): void {
    const gj: GeoJSON.Feature[] = [];
    for (const f of features) {
      const set = this.sets.find((s) => s.runway.id === f.runwayId);
      if (!set) continue;
      const coords = f.local.map((p) => {
        const g = localToLngLat(set.frame, p);
        return [g.lng, g.lat] as [number, number];
      });
      gj.push({
        type: 'Feature',
        properties: { markingType: f.type },
        geometry:
          f.kind === 'line'
            ? { type: 'LineString', coordinates: coords }
            : { type: 'LineString', coordinates: [...coords, coords[0]] }
      });
    }
    this.renderer.highlight(gj);
  }

  private renderMeasurement(r: MeasurementResult): void {
    const first = this.measure.first!;
    const set = this.sets.find((s) => s.runway.id === first.runwayId)!;
    const a = localToLngLat(set.frame, r.pointA);
    const b = localToLngLat(set.frame, r.pointB);
    this.renderer.showMeasurement(this.buildGeoMeasurement(a, b));
  }

  private buildGeoMeasurement(
    a: { lng: number; lat: number },
    b: { lng: number; lat: number }
  ): GeoJSON.FeatureCollection {
    const point = (g: { lng: number; lat: number }): GeoJSON.Feature => ({
      type: 'Feature',
      properties: { kind: 'point' },
      geometry: { type: 'Point', coordinates: [g.lng, g.lat] }
    });
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { kind: 'link' },
          geometry: {
            type: 'LineString',
            coordinates: [
              [a.lng, a.lat],
              [b.lng, b.lat]
            ]
          }
        },
        point(a),
        point(b)
      ]
    };
  }

  setMeasureMode(on: boolean): void {
    this.measureMode = on;
    if (!on) this.resetMeasure();
    this.emit('measure-mode');
  }

  resetMeasure(): void {
    this.measure = { first: null, second: null, result: null, crossGeo: null };
    this.renderer.clearHighlight();
    this.renderer.clearMeasurement();
  }

  // ---------- 导入导出 ----------

  exportFile(): MarkingExportFile {
    return exportMarkingFile(this.sets, this.options, this.visibility);
  }

  loadFile(data: MarkingExportFile): ImportResult {
    const result = importMarkingFile(data);
    this.sets = result.sets;
    this.options = { ...result.options };
    this.visibility = { ...result.visibility };
    this.designationInfo.clear();
    for (const rw of result.runways) {
      const { designation0, designation1 } = buildRunwayMarkings(rw, this.options);
      this.designationInfo.set(rw.id, { d0: designation0, d1: designation1 });
    }
    this.resetMeasure();
    this.renderer.setLODZoomThresholds(this.options.lodFullBelow, this.options.lodSimplifyBelow);
    this.renderer.setVisibility(this.visibility);
    this.renderer.setData(this.sets);
    this.emit('loaded');
    return result;
  }

  get totalFeatureCount(): number {
    return this.sets.reduce((n, s) => n + s.features.length, 0);
  }

  get runwayCount(): number {
    return this.sets.length;
  }

  featureCountsByType(): Record<string, number> {
    const counts: Record<string, number> = Object.fromEntries(MARKING_TYPES.map((t) => [t, 0]));
    for (const set of this.sets) {
      for (const f of set.features) counts[f.type]++;
    }
    return counts;
  }
}
