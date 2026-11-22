/** 灯具类型：吸顶灯 / 壁灯 / 夜灯 */
export type LampType = 'ceiling' | 'wall' | 'night';

/** 环境光预设 */
export type EnvMode = 'day' | 'night';

export type Vec3 = [number, number, number];

export interface Lamp {
  id: string;
  type: LampType;
  /** 世界坐标位置（米） */
  position: Vec3;
  /** 发光主方向（壁灯为墙面法线方向；吸顶灯固定向下；夜灯全向） */
  normal: Vec3;
  /** 色温档位 0..2 → 2700K / 4000K / 6500K */
  cctIndex: number;
  /** 功率档位 0..1 → 低 / 高 */
  powerIndex: number;
}

export interface Opening {
  /** 所在墙序号（轮廓边索引） */
  wall: number;
  /** 距该墙起点的距离（米） */
  offset: number;
  width: number;
}

export interface Door extends Opening {
  height?: number;
}

export interface WindowOpening extends Opening {
  /** 窗台高度（米） */
  sill: number;
  height: number;
}

export interface GlassPartition {
  from: [number, number];
  to: [number, number];
  height?: number;
}

/** 户型描述：轮廓（俯视 x,z 多边形，米）+ 门窗 + 玻璃隔断 */
export interface FloorPlan {
  name?: string;
  outline: [number, number][];
  /** 层高（米） */
  height: number;
  doors: Door[];
  windows: WindowOpening[];
  glassPartitions?: GlassPartition[];
}

/** 导出方案文件格式 */
export interface SchemeFile {
  app: 'senior-light-renderer';
  version: 1;
  savedAt: string;
  floorPlan: FloorPlan;
  mode: EnvMode;
  lamps: Lamp[];
}
