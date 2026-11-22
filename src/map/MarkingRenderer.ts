/**
 * MapLibre 渲染器：
 * - 五类标线 × 线/面共 10 个数据驱动图层，类型可单独开关
 * - LOD 三级过滤（完整 / 简化 / 远距合并线），随 zoom 自动切换
 * - 线状标线宽度表达式：max(真实米宽, 屏幕最小像素宽)，放大显真实宽度
 * - 标线高程随坡面，fill 与 line 共享同一坐标，接缝处对齐不错位
 */
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { localToLngLat } from '../core/geo.js';
import { buildFeatureCollection, type RunwayFeatureSet } from '../core/featureSource.js';
import type { LODLevel, MarkingType, Visibility } from '../core/types.js';

const SOURCE_ID = 'runway-markings';
const SURFACE_SOURCE = 'runway-surfaces';
const TYPES: MarkingType[] = ['centerline', 'edge', 'threshold', 'touchdown', 'designation'];
const TYPE_COLOR: Record<MarkingType, string> = {
  centerline: '#ffffff',
  edge: '#ffffff',
  threshold: '#f5f5f5',
  touchdown: '#f0f0f0',
  designation: '#ffffff'
};

/** 测量辅助线图层 id */
const MEASURE_SOURCE = 'measure-source';
const HIGHLIGHT_SOURCE = 'highlight-source';

export interface RendererOptions {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  /** 可选地形配置（传入 DEM 栅格源时启用 3D 地形，标线随地形起伏） */
  terrain?: { source: string; exaggeration?: number };
}

export class MarkingRenderer {
  readonly map: maplibregl.Map;
  private sets: RunwayFeatureSet[] = [];
  private visibility: Visibility;
  private lod: LODLevel = 0;
  private lodFullBelow: number;
  private lodSimplifyBelow: number;
  private ready = false;
  private queued = false;
  private pendingSets: RunwayFeatureSet[] | null = null;

  constructor(opts: RendererOptions, visibility: Visibility, lodZoom: [number, number]) {
    this.visibility = { ...visibility };
    this.lodFullBelow = lodZoom[0];
    this.lodSimplifyBelow = lodZoom[1];
    this.map = new maplibregl.Map({
      container: opts.container,
      style: {
        version: 8,
        sources: {
          'osm-raster': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'basemap', type: 'raster', source: 'osm-raster' }]
      },
      center: opts.center,
      zoom: opts.zoom,
      bearing: opts.bearing,
      pitch: opts.pitch
    });
    this.map.on('load', () => {
      this.ready = true;
      this.installLayers();
      if (opts.terrain) {
        this.map.setTerrain({
          source: opts.terrain.source,
          exaggeration: opts.terrain.exaggeration ?? 1
        });
      }
      if (this.pendingSets) {
        this.sets = this.pendingSets;
        this.pendingSets = null;
      }
      this.refresh();
    });
    this.map.on('zoom', () => this.updateLOD());
  }

  /**
   * 线宽表达式（line-width 单位为屏幕像素）：
   * 真实米宽先按当前 zoom 换算成像素 px = width_m · 2^z / (78271.5·cosLat)，
   * 再与最小可见像素 minPx 取大：
   *   远处真实宽不足 1.6px → 保底 1.6px 保持可见；
   *   近处真实宽超过 1.6px → 显示真实宽度对应的像素数。
   * MapLibre 世界瓦片 512px，z0 每像素米数 = 78271.5·cosLat；
   * 含 zoom 的表达式须以顶层 interpolate 组织，逐档给出像素值。
   */
  private widthExpression(latRad: number): maplibregl.ExpressionSpecification {
    const cosLat = Math.max(0.05, Math.cos(latRad));
    const metersPerPixelAtZoom0 = 78271.487 * cosLat;
    const minPx = 1.6; // 最小可见宽度（像素）
    const stops: (number | maplibregl.ExpressionSpecification)[] = [];
    for (let z = 0; z <= 22; z++) {
      // 该 zoom 下 1 米对应的屏幕像素数
      const pixelsPerMeter = 2 ** z / metersPerPixelAtZoom0;
      stops.push(
        z,
        ['max', minPx, ['*', ['get', 'width'], pixelsPerMeter]] as unknown as maplibregl.ExpressionSpecification
      );
    }
    return ['interpolate', ['exponential', 1], ['zoom'], ...stops] as unknown as maplibregl.ExpressionSpecification;
  }

  /** LOD 过滤：仅显示 lodMax >= 当前级别的要素（数值语义，非位掩码） */
  private lodFilter(lod: LODLevel): maplibregl.ExpressionSpecification {
    return ['>=', ['get', 'lodMax'], lod] as unknown as maplibregl.ExpressionSpecification;
  }

  private installLayers(): void {
    // 跑道道面参考源 + 标线源
    this.map.addSource(SURFACE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    this.map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      // 数万要素：关闭不必要的工作，保留按属性过滤能力
      promoteId: 'id',
      tolerance: 0
    } as maplibregl.GeoJSONSourceSpecification);

    // 测量/高亮辅助源
    this.map.addSource(MEASURE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
    this.map.addSource(HIGHLIGHT_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    const latRad = (this.map.getCenter().lat * Math.PI) / 180;
    const width = this.widthExpression(latRad);

    // 道面层（深灰沥青色，位于所有标线之下）
    const surfaceLayer: maplibregl.FillLayerSpecification = {
      id: 'runway-surface-fill',
      type: 'fill',
      source: SURFACE_SOURCE,
      paint: { 'fill-color': '#22262b', 'fill-opacity': 0.94 }
    };
    this.map.addLayer(surfaceLayer);
    const surfaceOutline: maplibregl.LineLayerSpecification = {
      id: 'runway-surface-line',
      type: 'line',
      source: SURFACE_SOURCE,
      paint: { 'line-color': '#0d0f12', 'line-width': 2 }
    };
    this.map.addLayer(surfaceOutline);

    for (const type of TYPES) {
      const fillId = this.fillLayer(type);
      const lineId = this.lineLayer(type);
      const fillLayer: maplibregl.FillLayerSpecification = {
        id: fillId,
        type: 'fill',
        source: SOURCE_ID,
        filter: ['all', ['==', ['get', 'markingType'], type], ['==', ['get', 'kind'], 'quad']],
        paint: {
          'fill-color': TYPE_COLOR[type],
          'fill-opacity': 0.97,
          'fill-antialias': true,
          'fill-outline-color': 'rgba(20,24,28,0.55)'
        }
      };
      const lineLayer: maplibregl.LineLayerSpecification = {
        id: lineId,
        type: 'line',
        source: SOURCE_ID,
        filter: ['all', ['==', ['get', 'markingType'], type], ['==', ['get', 'kind'], 'line']],
        paint: {
          'line-color': TYPE_COLOR[type],
          'line-width': width
        },
        layout: { 'line-cap': 'butt', 'line-join': 'round' }
      };
      const haloLayer: maplibregl.LineLayerSpecification = {
        id: `halo-${type}`,
        type: 'line',
        source: SOURCE_ID,
        filter: ['all', ['==', ['get', 'markingType'], type], ['==', ['get', 'kind'], 'line']],
        paint: {
          'line-color': 'rgba(16,19,23,0.55)',
          // 衬底为独立的像素宽度，随 zoom 略微收窄，避免嵌套 zoom 表达式
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 2.6, 18, 2.2, 22, 2]
        },
        layout: { 'line-cap': 'butt', 'line-join': 'round' }
      };
      this.map.addLayer(fillLayer);
      this.map.addLayer(haloLayer);
      this.map.addLayer(lineLayer);
      // 高亮层（黄色描边，宽度仅随 zoom 保持屏幕像素稳定，不依赖要素宽度）
      const hlWidth: maplibregl.ExpressionSpecification = [
        'interpolate',
        ['exponential', 0.5],
        ['zoom'],
        0, 8,
        10, 5,
        14, 3.5,
        18, 2.5,
        22, 2
      ] as unknown as maplibregl.ExpressionSpecification;
      const hlLayer: maplibregl.LineLayerSpecification = {
        id: `hl-${type}`,
        type: 'line',
        source: HIGHLIGHT_SOURCE,
        filter: ['==', ['get', 'markingType'], type],
        paint: {
          'line-color': '#ffd21f',
          'line-width': hlWidth,
          'line-opacity': 0.95
        }
      };
      this.map.addLayer(hlLayer);
    }

    // 测量连线与端点
    this.map.addLayer({
      id: 'measure-line',
      type: 'line',
      source: MEASURE_SOURCE,
      filter: ['==', ['get', 'kind'], 'link'],
      paint: { 'line-color': '#ff5d5d', 'line-width': 2, 'line-dasharray': [1.5, 1] }
    });
    this.map.addLayer({
      id: 'measure-points',
      type: 'circle',
      source: MEASURE_SOURCE,
      filter: ['==', ['get', 'kind'], 'point'],
      paint: { 'circle-radius': 5, 'circle-color': '#ff5d5d', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff' }
    });
  }

  private fillLayer(t: MarkingType): string {
    return `marking-fill-${t}`;
  }
  private lineLayer(t: MarkingType): string {
    return `marking-line-${t}`;
  }

  /** 重建 GeoJSON 并刷新（合并重建，避免逐 setData 抖动） */
  setData(sets: RunwayFeatureSet[]): void {
    this.sets = sets;
    if (!this.ready) {
      // 图层尚未安装时缓存，load 完成后自动补刷，消除初始化时序竞争
      this.pendingSets = sets;
      return;
    }
    this.refresh();
  }

  private refresh(): void {
    if (!this.ready) return;
    const fc = buildFeatureCollection(this.sets);
    const src = this.map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    src?.setData(fc as unknown as GeoJSON.FeatureCollection);
    const surfaceSrc = this.map.getSource(SURFACE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    surfaceSrc?.setData(this.buildSurfaces() as unknown as GeoJSON.FeatureCollection);
    this.updateLOD();
    this.applyVisibility();
  }

  /** 跑道道面轮廓（随坡面四角带高程） */
  private buildSurfaces(): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];
    for (const set of this.sets) {
      const rw = set.runway;
      const corners = [
        { x: 0, y: -rw.width / 2 },
        { x: rw.length, y: -rw.width / 2 },
        { x: rw.length, y: rw.width / 2 },
        { x: 0, y: rw.width / 2 }
      ].map((c) => {
        const g = localToLngLat(set.frame, { x: c.x, y: c.y, z: c.x * set.frame.slope });
        return [g.lng, g.lat, g.alt] as [number, number, number];
      });
      corners.push([...corners[0]]);
      features.push({
        type: 'Feature',
        properties: { runwayId: rw.id },
        geometry: { type: 'Polygon', coordinates: [corners] }
      });
    }
    return { type: 'FeatureCollection', features };
  }

  /** 排队合并的刷新（参数连续调整时避免重复构建） */
  queueRefresh(): void {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.refresh();
    });
  }

  private updateLOD(): void {
    if (!this.ready) return;
    const z = this.map.getZoom();
    const next: LODLevel = z < this.lodSimplifyBelow ? 2 : z < this.lodFullBelow ? 1 : 0;
    if (next === this.lod) return;
    this.lod = next;
    const f = this.lodFilter(next);
    for (const type of TYPES) {
      const baseFill = ['all', ['==', ['get', 'markingType'], type], ['==', ['get', 'kind'], 'quad'], f];
      const baseLine = ['all', ['==', ['get', 'markingType'], type], ['==', ['get', 'kind'], 'line'], f];
      this.map.setFilter(this.fillLayer(type), baseFill as maplibregl.ExpressionSpecification);
      this.map.setFilter(this.lineLayer(type), baseLine as maplibregl.ExpressionSpecification);
      this.map.setFilter(`halo-${type}`, baseLine as maplibregl.ExpressionSpecification);
    }
    this.map.fire('lodchange' as never, { lod: next } as never);
  }

  get currentLOD(): LODLevel {
    return this.lod;
  }

  setLODZoomThresholds(fullBelow: number, simplifyBelow: number): void {
    this.lodFullBelow = fullBelow;
    this.lodSimplifyBelow = simplifyBelow;
    this.updateLOD();
  }

  setVisibility(v: Visibility): void {
    this.visibility = { ...v };
    this.applyVisibility();
  }

  private applyVisibility(): void {
    if (!this.ready) return;
    for (const type of TYPES) {
      const show = this.visibility[type] ? 'visible' : 'none';
      this.map.setLayoutProperty(this.fillLayer(type), 'visibility', show);
      this.map.setLayoutProperty(this.lineLayer(type), 'visibility', show);
      this.map.setLayoutProperty(`halo-${type}`, 'visibility', show);
      this.map.setLayoutProperty(`hl-${type}`, 'visibility', show);
    }
  }

  /** 高亮指定 id 的要素 */
  highlight(features: GeoJSON.Feature[]): void {
    const src = this.map.getSource(HIGHLIGHT_SOURCE) as maplibregl.GeoJSONSource;
    src.setData({ type: 'FeatureCollection', features } as GeoJSON.FeatureCollection);
  }

  clearHighlight(): void {
    const src = this.map.getSource(HIGHLIGHT_SOURCE) as maplibregl.GeoJSONSource;
    src.setData({ type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection);
  }

  /** 绘制测量连线（两端局部坐标转经纬度由调用方完成） */
  showMeasurement(geojson: GeoJSON.FeatureCollection): void {
    const src = this.map.getSource(MEASURE_SOURCE) as maplibregl.GeoJSONSource;
    src.setData(geojson as unknown as GeoJSON.FeatureCollection);
  }

  clearMeasurement(): void {
    const src = this.map.getSource(MEASURE_SOURCE) as maplibregl.GeoJSONSource;
    src.setData({ type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection);
  }

  get isReady(): boolean {
    return this.ready;
  }

  remove(): void {
    this.map.remove();
  }
}
