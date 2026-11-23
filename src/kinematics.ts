// 运动链求解:开度 θ → 门叶转角 → 连杆铰点 C → 活塞行程 s → 杆头点 B
import {
  CYLINDER,
  LINK_Y,
  ROD_ATTACH_R,
  ROD_LENGTH,
  SIDES,
  type SideConfig,
} from './config';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SideKinematics {
  side: SideConfig;
  /** 开度 θ(度) */
  thetaDeg: number;
  /** 门叶方向角(弧度,xz 平面) */
  leafAngle: number;
  /** 门叶绕支铰的转角(度,相对关闭位置) */
  hingeRotationDeg: number;
  /** 连杆-门叶铰点 C */
  C: Vec3;
  /** 活塞杆头 / 连杆-活塞铰点 B */
  B: Vec3;
  /** 活塞杆头到支座的距离 s(沿缸轴) */
  rodExtension: number;
  /** 活塞行程(相对 θ=0) */
  stroke: number;
  /** 连杆实测长度(应等于 ROD_LENGTH) */
  rodLength: number;
  /** 机构是否可达(判别式 >= 0) */
  reachable: boolean;
}

export interface KinematicsResult {
  thetaDeg: number;
  sides: SideKinematics[];
}

/** 门叶方向角(弧度):关闭角 + 开启符号 * θ */
export function leafAngleAt(side: SideConfig, thetaDeg: number): number {
  return side.closedAngle + side.openSign * thetaDeg * (Math.PI / 180);
}

/** 门叶上距支铰 r 处的点(世界坐标,y 由调用者给定) */
export function leafPointAt(side: SideConfig, thetaDeg: number, r: number, y: number): Vec3 {
  const a = leafAngleAt(side, thetaDeg);
  return {
    x: side.hinge[0] + r * Math.cos(a),
    y,
    z: side.hinge[2] + r * Math.sin(a),
  };
}

/** 解某一侧在给定开度下的全部运动学量 */
export function solveSide(side: SideConfig, thetaDeg: number, strokeBase?: number): SideKinematics {
  const a = leafAngleAt(side, thetaDeg);
  const C = leafPointAt(side, thetaDeg, ROD_ATTACH_R, LINK_Y);
  const A = { x: side.cylAnchor[0], y: side.cylAnchor[1], z: side.cylAnchor[2] };
  const d = { x: side.cylDir[0], y: side.cylDir[1], z: side.cylDir[2] };

  // B = A + s·d,约束 |B - C| = ROD_LENGTH → 关于 s 的二次方程
  const acx = C.x - A.x;
  const acy = C.y - A.y;
  const acz = C.z - A.z;
  const p = acx * d.x + acy * d.y + acz * d.z; // (C-A)·d
  const q = acx * acx + acy * acy + acz * acz - ROD_LENGTH * ROD_LENGTH; // |C-A|² - L²
  const disc = p * p - q;
  const reachable = disc >= 0;
  const root = reachable ? Math.sqrt(disc) : 0;
  // 取较小根:B 位于 A 与垂足之间一侧,机构连续
  const s = p - root;
  const B: Vec3 = { x: A.x + s * d.x, y: A.y + s * d.y, z: A.z + s * d.z };
  const rodLength = Math.hypot(B.x - C.x, B.y - C.y, B.z - C.z);

  return {
    side,
    thetaDeg,
    leafAngle: a,
    hingeRotationDeg: thetaDeg,
    C,
    B,
    rodExtension: s,
    stroke: strokeBase !== undefined ? s - strokeBase : 0,
    rodLength,
    reachable,
  };
}

let strokeBaseCache: Map<string, number> | null = null;

/** 以 θ=0 时的伸出量为行程零点 */
function strokeBase(): Map<string, number> {
  if (!strokeBaseCache) {
    strokeBaseCache = new Map();
    for (const side of SIDES) {
      strokeBaseCache.set(side.id, solveSide(side, 0).rodExtension);
    }
  }
  return strokeBaseCache;
}

export function solveKinematics(thetaDeg: number): KinematicsResult {
  const base = strokeBase();
  return {
    thetaDeg,
    sides: SIDES.map((side) => solveSide(side, thetaDeg, base.get(side.id)!)),
  };
}

/** 缸筒起止点(世界坐标) */
export function cylinderBarrelEnds(side: SideConfig): { p0: Vec3; p1: Vec3 } {
  const A = side.cylAnchor;
  const d = side.cylDir;
  const s0 = -CYLINDER.tailLen;
  const s1 = CYLINDER.barrelLen - CYLINDER.tailLen;
  return {
    p0: { x: A[0] + s0 * d[0], y: A[1] + s0 * d[1], z: A[2] + s0 * d[2] },
    p1: { x: A[0] + s1 * d[0], y: A[1] + s1 * d[1], z: A[2] + s1 * d[2] },
  };
}
