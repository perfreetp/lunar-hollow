/** 共享类型定义（全部 SI 单位：m, kg, N, Pa） */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 端部支架（锚碇/塔） */
export interface Support {
  id: string;
  name: string;
  position: Vec3;
}

/** 轮组（线路上的支撑点/托索轮） */
export interface WheelGroup {
  id: string;
  name: string;
  /** 轮心位置 */
  position: Vec3;
  /** 轮半径 (m) */
  radius: number;
  enabled: boolean;
}

/** 车厢 */
export interface Cabin {
  /** 沿线路水平投影方向的位置参数 0..1（相对两支架水平投影） */
  t: number;
  /** 载荷（kg，单厢载重，不含自重） */
  payloadKg: number;
  /** 车厢自重 (kg) */
  deadWeightKg: number;
}

export type SolveDirtyKind = 'all' | 'cabin' | 'support' | 'wheel' | 'none';

/** 轮组接触点计算结果 */
export interface WheelContact {
  wheelId: string;
  /** 绳中线上的接触点（世界坐标） */
  point: Vec3;
  /** 接触点处绳单位切向 */
  tangent: Vec3;
  /** 射线（轮心 → 接触点方向，单位向量） */
  rayDir: Vec3;
  /** 轮心到绳面的最近距离 (m) */
  distance: number;
  /** 压陷量 δ = R轮 + R绳 − distance (m)，负值表示存在间隙 */
  indentation: number;
  /** 所在跨索引 */
  spanIndex: number;
  /** 是否超过阈值高亮 */
  overThreshold: boolean;
  /** 该轮组是否真正与绳相交（有接触） */
  contacting: boolean;
}

export interface SolverStats {
  /** 求解的跨数 */
  spanCount: number;
  /** 车厢平衡迭代次数 */
  iterations: number;
  /** 最大弦长/弧长误差（自适应分段后，理论上界由转角容差决定） */
  maxChordArcError: number;
  /** 全部跨总弧长 (m) */
  totalLength: number;
  /** 中线环段总数 */
  ringCount: number;
  /** 本轮求解耗时 (ms) */
  solveMs: number;
  /** 几何重建耗时 (ms) */
  geometryMs: number;
}
