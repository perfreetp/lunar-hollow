/**
 * 标线间距测量：计算两条标线要素之间的最近距离（真实米制，含纵向坡度）。
 */
import { geoDistance3D, localToLngLat, pointToSegment, type LocalFrame } from './geo';
import type { LngLatAlt, MarkingFeature } from './types';

export interface MeasurementResult {
  distance: number;
  /** 要素 A 上的最近点（局部坐标） */
  pointA: { x: number; y: number; z: number };
  /** 要素 B 上的最近点 */
  pointB: { x: number; y: number; z: number };
}

/** 提取要素的所有轮廓线段（quad 取四边；line 取折线各段） */
function extractSegments(f: MarkingFeature): Array<[number, number, number, number]> {
  const pts = f.local;
  const segs: Array<[number, number, number, number]> = [];
  const n = pts.length;
  if (f.kind === 'quad') {
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      segs.push([a.x, a.y, b.x, b.y]);
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      segs.push([pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y]);
    }
  }
  return segs;
}

/** 两线段最近距离（二维平面 + 坡面 z 修正），返回最近点对 */
function segmentNearest(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
  slope: number
): { dist: number; pa: { x: number; y: number; z: number }; pb: { x: number; y: number; z: number } } {
  const ux = bx - ax, uy = by - ay;
  const vx = dx - cx, vy = dy - cy;
  const wx = ax - cx, wy = ay - cy;
  const a = ux * ux + uy * uy;
  const b = ux * vx + uy * vy;
  const c = vx * vx + vy * vy;
  const d = ux * wx + uy * wy;
  const e = vx * wx + vy * wy;
  const denom = a * c - b * b;
  let s: number, t: number;
  const sN = b * e - c * d;
  const sD = denom;
  if (sD !== 0) {
    s = sN / sD;
    s = s < 0 ? 0 : s > 1 ? 1 : s;
  } else {
    s = 0;
  }
  t = (b * s + e) / (c || 1e-12);
  if (t < 0) {
    t = 0;
    s = (-d / (a || 1e-12));
    s = s < 0 ? 0 : s > 1 ? 1 : s;
  } else if (t > 1) {
    t = 1;
    s = ((b - d) / (a || 1e-12));
    s = s < 0 ? 0 : s > 1 ? 1 : s;
  }
  const pax = ax + s * ux, pay = ay + s * uy;
  const pbx = cx + t * vx, pby = cy + t * vy;
  const pa = { x: pax, y: pay, z: pax * slope };
  const pb = { x: pbx, y: pby, z: pbx * slope };
  const dist = Math.hypot(pbx - pax, pby - pay, pb.z - pa.z);
  return { dist, pa, pb };
}

/**
 * 测量两条标线的最近间距。
 * 对线状要素额外按其真实宽度做半径修正（中心线间距 - 两线半宽），
 * 使读数反映标线边缘之间的净距；矩形要素自身已含宽度。
 */
export function measureMarkingDistance(
  frame: LocalFrame,
  f1: MarkingFeature,
  f2: MarkingFeature
): MeasurementResult {
  const segs1 = extractSegments(f1);
  const segs2 = extractSegments(f2);
  let best: MeasurementResult | null = null;

  for (const s1 of segs1) {
    for (const s2 of segs2) {
      const r = segmentNearest(s1[0], s1[1], s1[2], s1[3], s2[0], s2[1], s2[2], s2[3], frame.slope);
      if (!best || r.dist < best.distance) {
        best = { distance: r.dist, pointA: r.pa, pointB: r.pb };
      }
    }
  }

  if (!best) {
    return {
      distance: NaN,
      pointA: { x: 0, y: 0, z: 0 },
      pointB: { x: 0, y: 0, z: 0 }
    };
  }

  // 线状要素按中心线测量，扣除各自半宽得到边缘净距（不小于 0）
  if (f1.kind === 'line' || f2.kind === 'line') {
    const w1 = f1.kind === 'line' ? f1.width / 2 : 0;
    const w2 = f2.kind === 'line' ? f2.width / 2 : 0;
    best.distance = Math.max(0, best.distance - w1 - w2);
  }
  return best;
}

/** 点（点击处局部坐标）到一条标线的最近距离，用于要素拾取 */
export function distanceToFeature(
  frame: LocalFrame,
  px: number,
  py: number,
  f: MarkingFeature
): number {
  let best = Infinity;
  for (const [ax, ay, bx, by] of extractSegments(f)) {
    const r = pointToSegment(px, py, ax, ay, bx, by);
    const zA = ax * frame.slope;
    const zP = r.nearest.x * frame.slope;
    const d3 = Math.hypot(r.dist, zP - zA);
    if (d3 < best) best = d3;
  }
  // 点击落在矩形内部时距离为 0
  if (f.kind === 'quad' && pointInPolygon(px, py, f.local)) best = 0;
  return best;
}

function pointInPolygon(px: number, py: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export interface CrossFrameResult {
  distance: number;
  geoA: LngLatAlt;
  geoB: LngLatAlt;
}

/**
 * 跨跑道（不同局部坐标系）测量：把两要素各顶点转到经纬度，
 * 枚举线段对求三维最近距离。规模小（标线轮廓均为少量顶点），开销可接受。
 */
export function measureAcrossFrames(
  frameA: LocalFrame,
  fA: MarkingFeature,
  frameB: LocalFrame,
  fB: MarkingFeature
): CrossFrameResult {
  const geoA = fA.local.map((p) => localToLngLat(frameA, p));
  const geoB = fB.local.map((p) => localToLngLat(frameB, p));
  const segsA = pairRings(geoA, fA.kind === 'quad');
  const segsB = pairRings(geoB, fB.kind === 'quad');
  let best = Infinity;
  let bestA: LngLatAlt = geoA[0];
  let bestB: LngLatAlt = geoB[0];
  for (const [a0, a1] of segsA) {
    for (const [b0, b1] of segsB) {
      // 线段采样求近似最近点（每段 24 步，亚米级精度，足够标线间距读数）
      const STEPS = 24;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const pa = interpGeo(a0, a1, t);
        for (let j = 0; j <= STEPS; j++) {
          const u = j / STEPS;
          const pb = interpGeo(b0, b1, u);
          const d = geoDistance3D(pa, pb);
          if (d < best) {
            best = d;
            bestA = pa;
            bestB = pb;
          }
        }
      }
    }
  }
  const wA = fA.kind === 'line' ? fA.width / 2 : 0;
  const wB = fB.kind === 'line' ? fB.width / 2 : 0;
  return { distance: Math.max(0, best - wA - wB), geoA: bestA, geoB: bestB };
}

function pairRings(pts: LngLatAlt[], closed: boolean): Array<[LngLatAlt, LngLatAlt]> {
  const out: Array<[LngLatAlt, LngLatAlt]> = [];
  const n = pts.length;
  const limit = closed ? n : n - 1;
  for (let i = 0; i < limit; i++) {
    out.push([pts[i], pts[(i + 1) % n]]);
  }
  return out;
}

function interpGeo(a: LngLatAlt, b: LngLatAlt, t: number): LngLatAlt {
  return {
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
    alt: a.alt + (b.alt - a.alt) * t
  };
}
