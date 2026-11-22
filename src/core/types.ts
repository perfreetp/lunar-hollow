/** 标志线类型 */
export type MarkingType =
  | 'centerline' // 中线
  | 'edge' // 边线
  | 'threshold' // 入口标志
  | 'touchdown' // 接地带标志
  | 'designation'; // 跑道号码

export const MARKING_TYPES: MarkingType[] = [
  'centerline',
  'edge',
  'threshold',
  'touchdown',
  'designation'
];

export const MARKING_LABELS: Record<MarkingType, string> = {
  centerline: '中线',
  edge: '边线',
  threshold: '入口标志',
  touchdown: '接地带标志',
  designation: '跑道号码'
};

/** 简化级别：full=完整真实几何，medium=近距简化，simplified=远处合并线 */
export type LODLevel = 0 | 1 | 2;
export const LOD_LABELS = ['完整', '中距简化', '远距合并线'] as const;

/** 经纬度 + 高程（米） */
export interface LngLatAlt {
  lng: number;
  lat: number;
  alt: number;
}

/** 局部坐标（米，沿跑道 x，横向 y，高程 z） */
export interface LocalPoint {
  x: number;
  y: number;
  z: number;
}

/** 几何图元：折线（贴地，GPU 按宽度扩成条带）或矩形（真实尺寸多边形） */
export interface MarkingFeature {
  id: number;
  type: MarkingType;
  /** 所属跑道 id */
  runwayId: string;
  /** 局部坐标折线（line / quad 共用，quad 为闭合环 5 点或 4 点） */
  local: LocalPoint[];
  /** 真实世界宽度（米）。line 图元按此扩边；quad 已由几何体现，存 0 */
  width: number;
  /** 图元种类 */
  kind: 'line' | 'quad';
  /**
   * 该要素仍可见的最粗 LOD 级别（0=完整，1=简化，2=合并线）。
   * 渲染条件：当前 LOD <= lodMax。例如 0 表示仅完整级可见，2 表示各级都可见。
   * 导出文件沿用历史字段名 lodMask，但语义为该数值（非位掩码）。
   */
  lodMax: number;
  /** 业务参数（导出保留） */
  meta?: Record<string, number | string>;
}

/** 跑道几何参数（局部坐标系：起点在跑道一端阈值，x 沿跑道纵轴） */
export interface RunwayConfig {
  id: string;
  /** 跑道起点（0 号端阈值）经纬度 */
  origin: { lng: number; lat: number };
  /** 跑道长度（米） */
  length: number;
  /** 跑道宽度（米） */
  width: number;
  /** 0 号端真方位角（度，0–360），1 号端 = (bearing+180)%360 */
  bearing: number;
  /** 纵向坡度（%，正=沿 x 升高）。高程 z = x * slope/100 */
  slopePct: number;
  /** 0 号端平行跑道后缀（无平行跑道留空） */
  suffix0?: '' | 'L' | 'R' | 'C' | 'W';
  /** 1 号端平行跑道后缀 */
  suffix1?: '' | 'L' | 'R' | 'C' | 'W';
}

/** 标线构建参数（真实尺寸，单位米；默认值参照 FAA AC 150/5340-1） */
export interface MarkingBuildOptions {
  // 中线（虚线）
  centerlineWidth: number;
  dashLength: number; // 虚线段长
  gapLength: number; // 虚线间隔
  dashInset: number; // 距阈值的起始留白
  // 边线（实线）
  edgeWidth: number;
  edgeInset: number; // 距跑道外缘内缩
  // 入口标志（纵向条带）
  thresholdStripes: number; // 条带数量（0=按跑道宽度自动）
  thresholdStripeWidth: number;
  thresholdStripeLength: number;
  thresholdGap: number; // 条带中心间距
  thresholdInset: number; // 条带近端距阈值距离
  // 接地带标志（成对纵向矩形）
  touchdownBarLength: number;
  touchdownBarWidth: number;
  touchdownPairGap: number; // 距中线净空
  touchdownPairSpacing: number; // 相邻对接地带中心间距
  touchdownInset: number; // 第一对接地带距阈值距离
  // 跑道号码
  designationHeight: number; // 字符高度
  designationGap: number; // 字符间距（按字高比例另算，此为两位数+后缀组间距）
  designationInset: number; // 号码近端距阈值距离
  // LOD 阈值（地图缩放级别）
  lodFullBelow: number; // zoom < 该值时离开完整级别
  lodSimplifyBelow: number; // zoom < 该值时合并为简化线
}

export const DEFAULT_BUILD_OPTIONS: MarkingBuildOptions = {
  centerlineWidth: 0.45,
  dashLength: 30,
  gapLength: 20,
  dashInset: 40,
  edgeWidth: 0.45,
  edgeInset: 0.9,
  thresholdStripes: 0,
  thresholdStripeWidth: 1.8,
  thresholdStripeLength: 30,
  thresholdGap: 3.6,
  thresholdInset: 6,
  touchdownBarLength: 22.5,
  touchdownBarWidth: 3,
  touchdownPairGap: 3.5,
  touchdownPairSpacing: 150,
  touchdownInset: 150,
  designationHeight: 18,
  designationGap: 4.5,
  designationInset: 54,
  lodFullBelow: 14,
  lodSimplifyBelow: 11.5
};

/** 各类标线显隐 */
export type Visibility = Record<MarkingType, boolean>;
export const ALL_VISIBLE: Visibility = {
  centerline: true,
  edge: true,
  threshold: true,
  touchdown: true,
  designation: true
};

/** 导出文件结构 */
export interface MarkingExportFile {
  format: 'runway-markings-v1';
  exportedAt: string;
  crs: 'EPSG:4326';
  runways: RunwayConfig[];
  options: MarkingBuildOptions;
  visibility: Visibility;
  features: ExportFeature[];
}

export type ExportGeometry =
  | { type: 'LineString'; coordinates: [number, number, number][] }
  | { type: 'Polygon'; coordinates: [number, number, number][][] };

export interface ExportFeature {
  id: number;
  markingType: MarkingType;
  runwayId: string;
  kind: 'line' | 'quad';
  width: number;
  /** 最粗可见 LOD 级别（0/1/2），见 MarkingFeature.lodMax */
  lodMask: number;
  meta?: Record<string, number | string>;
  geometry: ExportGeometry;
}
