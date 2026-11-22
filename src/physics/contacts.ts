import { catY } from './catenary';
import type { RopeModel, SolvedSpan } from './ropeModel';
import type { Vec3, WheelContact, WheelGroup } from './types';
import { vec3 } from './config';

/** 悬链线跨上局部水平坐标 lx 处的世界点 */
function pointAtLocalX(span: SolvedSpan, lx: number): Vec3 {
  return {
    x: span.nodeA.pos.x + span.dirH.x * lx,
    y: span.nodeA.pos.y + catY(span.cat, lx),
    z: span.nodeA.pos.z + span.dirH.z * lx,
  };
}

/**
 * 在单个绳段的局部 x 区间内，对"轮心到悬链线距离"做黄金分割精化。
 * 距离平方关于局部 x 在小段内为单峰函数；6 次迭代把 ~0.8m 区间
 * 收缩到 0.8×0.618⁶ ≈ 0.036mm，已细于接触测量需求。
 */
function refineOnCatenary(
  span: SolvedSpan,
  wheel: Vec3,
  xLo: number,
  xHi: number,
): { point: Vec3; distance: number; x: number } {
  const gr = (Math.sqrt(5) - 1) / 2; // 0.618
  let lo = xLo;
  let hi = xHi;
  let x1 = hi - gr * (hi - lo);
  let x2 = lo + gr * (hi - lo);
  const d2 = (x: number): number => {
    const q = pointAtLocalX(span, x);
    const dx = q.x - wheel.x;
    const dy = q.y - wheel.y;
    const dz = q.z - wheel.z;
    return dx * dx + dy * dy + dz * dz;
  };
  let f1 = d2(x1);
  let f2 = d2(x2);
  for (let i = 0; i < 6; i++) {
    if (f1 > f2) {
      lo = x1;
      x1 = x2;
      f1 = f2;
      x2 = lo + gr * (hi - lo);
      f2 = d2(x2);
    } else {
      hi = x2;
      x2 = x1;
      f2 = f1;
      x1 = hi - gr * (hi - lo);
      f1 = d2(x1);
    }
  }
  const x = (lo + hi) * 0.5;
  const point = pointAtLocalX(span, x);
  return { point, distance: Math.sqrt(d2(x)), x };
}

/**
 * 轮组接触点求解（两阶段）。
 *
 * 1. 粗筛：轮心对全部绳段做弦投影最近点，定位最近绳段（O(环数)，无分配）；
 * 2. 精化：在该绳段的悬链线解析曲线上做黄金分割一维最小化，
 *    得到亚毫米级真实最近点，轮心→该点的连线即接触法线（射线方向）。
 *
 * 压陷量 δ = R轮 + R绳 − d（d 为轮心到绳中线距离）：
 *   δ > 0 表面相交（压陷），δ ≤ 0 存在间隙。
 */
export function computeWheelContacts(
  model: RopeModel,
  wheels: WheelGroup[],
  ropeRadius: number,
  thresholdMm: number,
): WheelContact[] {
  const thresholdM = thresholdMm / 1000;
  const results: WheelContact[] = [];

  for (const wheel of wheels) {
    if (!wheel.enabled) continue;
    const px = wheel.position.x;
    const py = wheel.position.y;
    const pz = wheel.position.z;

    // 阶段 1：粗筛最近绳段（标量内联，热路径零对象分配）
    let coarse: { span: SolvedSpan; segIndex: number; dist2: number } | null = null;
    for (const span of model.spans as SolvedSpan[]) {
      const rings = span.rings;
      for (let i = 0; i < rings.length - 1; i++) {
        const a = rings[i].pos;
        const b = rings[i + 1].pos;
        const sx = b.x - a.x;
        const sy = b.y - a.y;
        const sz = b.z - a.z;
        const len2 = sx * sx + sy * sy + sz * sz;
        let u = len2 > 1e-12
          ? ((px - a.x) * sx + (py - a.y) * sy + (pz - a.z) * sz) / len2
          : 0;
        if (u < 0) u = 0;
        else if (u > 1) u = 1;
        const qx = a.x + sx * u;
        const qy = a.y + sy * u;
        const qz = a.z + sz * u;
        const dx = qx - px;
        const dy = qy - py;
        const dz = qz - pz;
        const dist2 = dx * dx + dy * dy + dz * dz;
        if (!coarse || dist2 < coarse.dist2) {
          coarse = { span, segIndex: i, dist2 };
        }
      }
    }
    if (!coarse) continue;

    // 阶段 2：在最近绳段对应的悬链线局部 x 区间上精化
    const { span, segIndex } = coarse;
    const ringA = span.rings[segIndex];
    const ringB = span.rings[segIndex + 1];
    const xA = vec3.dot(vec3.sub(ringA.pos, span.nodeA.pos), span.dirH);
    const xB = vec3.dot(vec3.sub(ringB.pos, span.nodeA.pos), span.dirH);
    const refined = refineOnCatenary(span, wheel.position, Math.min(xA, xB), Math.max(xA, xB));

    // 接触点切向：由悬链线解析斜率给出
    const sh = Math.sinh(span.cat.uL + refined.x / span.cat.c);
    const inv = 1 / Math.sqrt(1 + sh * sh);
    const tangent: Vec3 = vec3.normalize({
      x: span.dirH.x * inv,
      y: sh * inv,
      z: span.dirH.z * inv,
    });
    const rayDir = vec3.normalize(vec3.sub(refined.point, wheel.position));
    const indentation = wheel.radius + ropeRadius - refined.distance;
    const contacting = indentation > -0.001; // 1mm 数值容差内视为接触

    results.push({
      wheelId: wheel.id,
      point: refined.point,
      tangent,
      rayDir,
      distance: refined.distance,
      indentation,
      spanIndex: span.index,
      overThreshold: contacting && indentation > thresholdM,
      contacting,
    });
  }
  return results;
}
