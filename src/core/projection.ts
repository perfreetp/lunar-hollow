import { HitSurface, type LightPatch } from './types';
import type { RoomConfig } from './types';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ApertureCorners {
  cellIndex: number;
  corners: Vec3[];
}

const EPS = 1e-9;

/** 射线 p + t·d 与平面 k = 常量 的交点参数 t；平行或反向返回 null */
function rayPlane(p: Vec3, d: Vec3, axis: 'x' | 'y' | 'z', k: number): number | null {
  const denom = d[axis];
  if (Math.abs(denom) < EPS) return null;
  const t = (k - p[axis]) / denom;
  return t > EPS ? t : null;
}

interface PlaneDef {
  surface: HitSurface;
  axis: 'x' | 'y' | 'z';
  k: number;
  /** 交点转平面 2D 坐标 */
  to2D: (p: Vec3) => [number, number];
  /** 平面 2D 坐标转回世界坐标（被裁剪后的点） */
  to3D: (u: number, v: number) => Vec3;
  /** 平面内有效矩形 */
  rect: { uMin: number; uMax: number; vMin: number; vMax: number };
  /** 该面要求的光线方向分量符号（>0 或 <0），不满足则不会命中 */
  sign: 1 | -1;
  signAxis: 'x' | 'y' | 'z';
}

function makePlanes(room: RoomConfig, height: number): PlaneDef[] {
  return [
    {
      surface: HitSurface.Floor,
      axis: 'y',
      k: 0,
      to2D: (p) => [p.x, p.z],
      to3D: (u, v) => ({ x: u, y: 0, z: v }),
      rect: { uMin: -room.halfWidth, uMax: room.halfWidth, vMin: 0, vMax: room.depth },
      sign: -1,
      signAxis: 'y',
    },
    {
      surface: HitSurface.BackWall,
      axis: 'z',
      k: room.depth,
      to2D: (p) => [p.x, p.y],
      to3D: (u, v) => ({ x: u, y: v, z: room.depth }),
      rect: { uMin: -room.halfWidth, uMax: room.halfWidth, vMin: 0, vMax: height },
      sign: 1,
      signAxis: 'z',
    },
    {
      surface: HitSurface.SideWall,
      axis: 'x',
      k: room.halfWidth,
      to2D: (p) => [p.z, p.y],
      to3D: (u, v) => ({ x: room.halfWidth, y: v, z: u }),
      rect: { uMin: 0, uMax: room.depth, vMin: 0, vMax: height },
      sign: 1,
      signAxis: 'x',
    },
    {
      surface: HitSurface.SideWall,
      axis: 'x',
      k: -room.halfWidth,
      to2D: (p) => [p.z, p.y],
      to3D: (u, v) => ({ x: -room.halfWidth, y: v, z: u }),
      rect: { uMin: 0, uMax: room.depth, vMin: 0, vMax: height },
      sign: -1,
      signAxis: 'x',
    },
  ];
}

type Poly2 = [number, number][];

/** Sutherland–Hodgman：把凸多边形裁剪到轴对齐矩形内 */
export function clipPolygonRect(poly: Poly2, rect: PlaneDef['rect']): Poly2 {
  let out = poly;
  const edges: ((p: [number, number]) => boolean)[] = [
    (p) => p[0] >= rect.uMin,
    (p) => p[0] <= rect.uMax,
    (p) => p[1] >= rect.vMin,
    (p) => p[1] <= rect.vMax,
  ];
  const intersect: ((a: [number, number], b: [number, number]) => [number, number])[] = [
    (a, b) => [rect.uMin, a[1] + ((b[1] - a[1]) * (rect.uMin - a[0])) / (b[0] - a[0])],
    (a, b) => [rect.uMax, a[1] + ((b[1] - a[1]) * (rect.uMax - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (rect.vMin - a[1])) / (b[1] - a[1]), rect.vMin],
    (a, b) => [a[0] + ((b[0] - a[0]) * (rect.vMax - a[1])) / (b[1] - a[1]), rect.vMax],
  ];

  for (let e = 0; e < 4; e++) {
    const inside = edges[e];
    const next: Poly2 = [];
    for (let i = 0; i < out.length; i++) {
      const cur = out[i];
      const prev = out[(i + out.length - 1) % out.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) next.push(intersect[e](prev, cur));
        next.push(cur);
      } else if (prevIn) {
        next.push(intersect[e](prev, cur));
      }
    }
    out = next;
    if (out.length === 0) return out;
  }
  return out;
}

/**
 * 把一个孔径（四角）沿光线方向投影到室内各面，返回被房间边界裁剪后的光斑。
 * 光线方向对四角相同（平行太阳光），因此与某面要么全平行要么全可交。
 */
export function projectAperture(
  ap: ApertureCorners,
  dir: Vec3,
  room: RoomConfig,
  height: number,
  effectiveTransmittance: number,
): LightPatch[] {
  const patches: LightPatch[] = [];

  for (const plane of makePlanes(room, height)) {
    if (plane.sign === 1 ? dir[plane.signAxis] <= EPS : dir[plane.signAxis] >= -EPS) {
      continue;
    }

    const poly2: Poly2 = [];
    let valid = true;
    for (const c of ap.corners) {
      const t = rayPlane(c, dir, plane.axis, plane.k);
      if (t === null) {
        valid = false;
        break;
      }
      const hit: Vec3 = { x: c.x + t * dir.x, y: c.y + t * dir.y, z: c.z + t * dir.z };
      poly2.push(plane.to2D(hit));
    }
    if (!valid) continue;

    const clipped = clipPolygonRect(poly2, plane.rect);
    if (clipped.length < 3) continue;

    patches.push({
      cellIndex: ap.cellIndex,
      surface: plane.surface,
      points: clipped.map(([u, v]) => plane.to3D(u, v)),
      effectiveTransmittance,
    });
  }
  return patches;
}

/** 凸多边形扇形三角化，返回索引数组（点序需同向，本模块产出的多边形均满足） */
export function fanTriangulate(count: number): number[] {
  const idx: number[] = [];
  for (let i = 1; i < count - 1; i++) {
    idx.push(0, i, i + 1);
  }
  return idx;
}
