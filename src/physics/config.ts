import type { Vec3 } from './types';

/** 初始张力 5 档：水平张力分量 H (N) */
export const TENSION_GEARS: { label: string; H: number }[] = [
  { label: '1 档（松）', H: 60_000 },
  { label: '2 档', H: 90_000 },
  { label: '3 档（标准）', H: 120_000 },
  { label: '4 档', H: 150_000 },
  { label: '5 档（紧）', H: 180_000 },
];

export const ROPE_DEFAULTS = {
  /** 钢丝绳线密度 (kg/m) */
  linearDensity: 8.0,
  /** 钢丝绳真实半径 (m)，参与压陷量等物理计算 */
  radius: 0.03,
  /**
   * 视觉放大系数：真实绳径 6cm 在百米级线路上不足 1 像素，
   * 工程视图按系数放大管状网格便于观察；物理半径仍用 radius，不受影响。
   */
  visualRadiusScale: 4,
  /** 轮组视觉放大系数（轮半径物理值仍参与压陷量计算） */
  visualWheelScale: 2.5,
  /** 单厢自重 (kg) */
  cabinDeadWeight: 800,
  /** 默认单厢载荷 (kg) */
  defaultPayload: 1200,
  /** 压陷量报警阈值 (mm) */
  defaultIndentThresholdMm: 2.0,
  /** 轮半径默认值 (m) */
  wheelRadius: 0.22,
  /**
   * 自适应分段：单段最大转角 (rad)。
   * 弦弧误差上界 ≈ θ²/24：θ=0.03 时为 3.75e-5，远严于千分之一要求；
   * 常态绳曲率半径数百米，曲率步长 > 步长上限而不增环；
   * 大曲率（重载荷/低张力/短跨）处曲率步长 < 0.8m 即自动加密防折角。
   */
  maxTurnAngle: 0.03,
  /** 单段最大水平长度 (m)，常态工况的采样密度控制 */
  maxSegmentLength: 0.8,
  /** 单段最小水平长度 (m) */
  minSegmentLength: 0.02,
  /** 车厢平衡二分迭代收敛容差 (m)，0.1mm 已细于接触/视觉精度需求 */
  cabinYTolerance: 1e-4,
  /** 二分迭代上限 */
  maxBisection: 40,
};

export const G = 9.81;

export const vec3 = {
  add: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  scale: (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k }),
  dot: (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  len: (a: Vec3): number => Math.hypot(a.x, a.y, a.z),
  normalize(a: Vec3): Vec3 {
    const l = Math.hypot(a.x, a.y, a.z) || 1;
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  },
};
