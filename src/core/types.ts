/**
 * 幕墙方案的领域模型 —— 全部为可序列化的纯数据，
 * 渲染层与计算层都围绕这些类型工作，导出/导入文件即整个 ProjectConfig。
 */

/** 玻璃类型：透明 / 镀膜 / 彩釉 */
export enum GlassType {
  Clear = 'clear',
  Coated = 'coated',
  Fritted = 'fritted',
}

/** 彩釉遮罩图案类型 */
export enum FritPattern {
  /** 圆点阵列 */
  Dot = 'dot',
  /** 水平条纹 */
  Stripe = 'stripe',
  /** 菱形格 */
  Diamond = 'diamond',
}

/** 镀膜反射色偏（预设色，带线性 RGB 与展示名） */
export enum CoatingTint {
  Neutral = 'neutral',
  Blue = 'blue',
  Bronze = 'bronze',
  Green = 'green',
}

export interface FritMask {
  pattern: FritPattern;
  /** 0.1 ~ 0.9，彩釉覆盖率（不透光部分占比），越大透光区域越小 */
  coverage: number;
  /** 图案重复周期，单位米（幕墙平面内） */
  scale: number;
}

export interface GlassCell {
  type: GlassType;
  /** 透射率 0.1 ~ 0.9（玻璃本身，未乘彩釉遮罩） */
  transmittance: number;
  /** 镀膜色偏，仅 type === Coated 时有效 */
  tint: CoatingTint;
  /** 彩釉遮罩，仅 type === Fritted 时有效 */
  frit: FritMask;
}

export interface WallGrid {
  /** 水平分格数（列） */
  cols: number;
  /** 竖直分格数（行） */
  rows: number;
  /** 幕墙总宽（米） */
  width: number;
  /** 幕墙总高（米） */
  height: number;
  /** 分格框条宽度（米），遮挡条会缩小每格透光孔径 */
  barWidth: number;
}

export interface SunConfig {
  /** 时角，度。0=正午，负=上午，正=下午，典型范围 [-90, 90] */
  hourAngleDeg: number;
  /** 高度角，度。太阳相对地平线的仰角，(0, 90] */
  altitudeDeg: number;
}

export interface RoomConfig {
  /** 室内进深（幕墙到后墙的距离，米） */
  depth: number;
  /** 室内半宽（米），幕墙居中 */
  halfWidth: number;
}

export interface ProjectConfig {
  /** 方案文件版本号，供导入迁移 */
  version: 1;
  name: string;
  grid: WallGrid;
  sun: SunConfig;
  room: RoomConfig;
  /** 是否启用第二层玻璃（同一视线上双层叠加） */
  doubleLayer: boolean;
  /** 第二层玻璃相对第一层沿法线的间距（米） */
  layerGap: number;
  /** 按 row-major 存储的分格数据，长度必须 = cols*rows */
  cells: GlassCell[];
}

/** 光斑命中的室内面 */
export enum HitSurface {
  Floor = 'floor',
  BackWall = 'backWall',
  SideWall = 'sideWall',
}

/** 一束经过某格孔径的阳光在室内某面上形成的光斑多边形 */
export interface LightPatch {
  cellIndex: number;
  surface: HitSurface;
  /** 多边形顶点（世界坐标，共面且为凸多边形） */
  points: { x: number; y: number; z: number }[];
  /** 该束光到达此面时的有效可见光比例（已含彩釉遮罩与多层累积） */
  effectiveTransmittance: number;
}

/** 鼠标悬停某格时的读数 */
export interface CellReadout {
  cellIndex: number;
  row: number;
  col: number;
  type: GlassType;
  transmittance: number;
  /** 彩釉透光面积占比（非彩釉为 1） */
  openFraction: number;
  /** 叠加多层玻璃之后沿视线的可见光比例（双层开启时为两层乘积） */
  stackedVisibleRatio: number;
}

/** 整体眩光读数 */
export interface GlareReadout {
  /** 进入室内的总可见光通量（相对单位，W 归一化） */
  totalFlux: number;
  /** 各玻璃类型贡献的通量明细 */
  byType: Record<GlassType, number>;
  /** 参与透光的分格数 */
  litCells: number;
  /** 整面幕墙按面积加权的平均有效透射比 */
  averageTransmittance: number;
}
