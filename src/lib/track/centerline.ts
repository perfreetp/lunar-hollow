import { Vector3, Quaternion, Matrix } from '@babylonjs/core/Maths/math.vector.js';

/** 中心线一个采样点的局部标架(平行移动标架) */
export interface TrackFrame {
  /** 沿中心线的累计弧长(米,从 0 到 totalLength) */
  s: number;
  position: Vector3;
  /** 切线(单位向量,前进方向) */
  tangent: Vector3;
  /** 法线(单位向量,指向路面上方) */
  normal: Vector3;
  /** 副法线(单位向量,指向赛道右侧) */
  binormal: Vector3;
  /** 当前点所处的赛道路段编号(0..SEGMENT_COUNT-1) */
  segment: number;
}

export const SEGMENT_COUNT = 8;

/** 环形索引工具:把任意整数折叠到 [0, n) */
export function ringIndex(i: number, n: number): number {
  return ((i % n) + n) % n;
}

/** 弧长 -> 路段编号,对边界浮点误差做钳制 */
function segmentIndexAt(s: number, totalLength: number): number {
  const raw = (s / totalLength) * SEGMENT_COUNT;
  // 边界 epsilon:抵消环形取模/累计弧长带来的 ~1e-12 级误差
  const clamped = Math.min(SEGMENT_COUNT - 1, Math.max(0, Math.round(raw * 1e9) / 1e9));
  return Math.min(SEGMENT_COUNT - 1, Math.floor(clamped));
}

/** 环形最短有符号距离(米),from -> to,结果落在 (-L/2, L/2] */
export function ringDelta(from: number, to: number, length: number): number {
  let d = (to - from) % length;
  if (d > length / 2) d -= length;
  else if (d <= -length / 2) d += length;
  return d;
}

/** 环形绝对距离 */
export function ringDistance(a: number, b: number, length: number): number {
  return Math.abs(ringDelta(a, b, length));
}

/** 闭合 Catmull-Rom 样条的控制点(米,XZ 平面 + 起伏 Y) */
const CONTROL_POINTS: Array<[number, number, number]> = [
  [0, 0, 0],
  [180, 6, 60],
  [340, 12, -30],
  [470, 4, 120],
  [520, 0, 300],
  [380, -4, 380],
  [200, 2, 360],
  [60, 10, 470],
  [-140, 16, 440],
  [-300, 8, 300],
  [-360, 0, 130],
  [-240, -6, 30],
  [-120, 0, 90]
];

function catmullRom(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number): Vector3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const r = new Vector3(0, 0, 0);
  for (const axis of ['x', 'y', 'z'] as const) {
    const v0 = p0[axis];
    const v1 = p1[axis];
    const v2 = p2[axis];
    const v3 = p3[axis];
    r[axis] =
      0.5 *
      (2 * v1 +
        (-v0 + v2) * t +
        (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
        (-v0 + 3 * v1 - 3 * v2 + v3) * t3);
  }
  return r;
}

export interface Centerline {
  /** 等弧长采样的标架 */
  frames: TrackFrame[];
  totalLength: number;
  /** 采样间距(米) */
  sampleSpacing: number;
}

/**
 * 生成闭合赛道中心线:先对控制点做 Catmull-Rom 细分,
 * 再按弧长重采样为等间距点,并用平行移动法建立稳定标架。
 */
export function buildCenterline(samplesPerSpan = 48, sampleSpacing = 2): Centerline {
  const cps = CONTROL_POINTS.map(([x, y, z]) => new Vector3(x, y, z));
  const n = cps.length;

  // 1. 闭合 Catmull-Rom 细分
  const dense: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = cps[ringIndex(i - 1, n)];
    const p1 = cps[i];
    const p2 = cps[ringIndex(i + 1, n)];
    const p3 = cps[ringIndex(i + 2, n)];
    for (let j = 0; j < samplesPerSpan; j++) {
      dense.push(catmullRom(p0, p1, p2, p3, j / samplesPerSpan));
    }
  }

  // 2. 累计弧长(环形折线,虚拟节点 denseCount 即节点 0 + totalLength)
  const denseCount = dense.length;
  const segLengths = new Float64Array(denseCount);
  const cumArc = new Float64Array(denseCount + 1);
  for (let i = 0; i < denseCount; i++) {
    segLengths[i] = Vector3.Distance(dense[i], dense[ringIndex(i + 1, denseCount)]);
    cumArc[i + 1] = cumArc[i] + segLengths[i];
  }
  const totalLength = cumArc[denseCount];

  // 3. 等弧长重采样(在闭合 dense 折线上线性插值)
  const sampleCount = Math.round(totalLength / sampleSpacing);
  const frames: TrackFrame[] = [];
  let denseIdx = 0;
  for (let k = 0; k < sampleCount; k++) {
    const target = (k / sampleCount) * totalLength;
    while (denseIdx < denseCount - 1 && cumArc[denseIdx + 1] <= target) denseIdx++;
    const segLen = segLengths[denseIdx] || 1;
    const f = Math.min(1, Math.max(0, (target - cumArc[denseIdx]) / segLen));
    const pos = Vector3.Lerp(
      dense[denseIdx],
      dense[ringIndex(denseIdx + 1, denseCount)],
      f
    );
    frames.push({
      s: target,
      position: pos,
      tangent: Vector3.Zero(),
      normal: Vector3.Zero(),
      binormal: Vector3.Zero(),
      segment: segmentIndexAt(target, totalLength)
    });
  }

  // 4. 切线(中心差分,环形)
  const m = frames.length;
  for (let i = 0; i < m; i++) {
    const prev = frames[ringIndex(i - 1, m)].position;
    const next = frames[ringIndex(i + 1, m)].position;
    frames[i].tangent = next.subtract(prev).normalize();
  }

  // 5. 平行移动标架(rotation-minimizing frame,避免 Frenet 在直道上翻转)
  const up0 = new Vector3(0, 1, 0);
  let normal = up0.subtract(frames[0].tangent.scale(Vector3.Dot(up0, frames[0].tangent)));
  if (normal.lengthSquared() < 1e-6) normal = new Vector3(1, 0, 0);
  normal.normalize();
  frames[0].normal = normal.clone();
  frames[0].binormal = Vector3.Cross(frames[0].normal, frames[0].tangent).normalize();

  for (let i = 1; i < m; i++) {
    const t0 = frames[i - 1].tangent;
    const t1 = frames[i].tangent;
    const axis = Vector3.Cross(t0, t1);
    if (axis.lengthSquared() > 1e-10) {
      const angle = Math.acos(Math.min(1, Math.max(-1, Vector3.Dot(t0, t1))));
      const q = Quaternion.RotationAxis(axis.normalize(), angle);
      const m = new Matrix();
      q.toRotationMatrix(m);
      normal = Vector3.TransformCoordinates(normal, m);
    }
    frames[i].normal = normal.clone();
    frames[i].binormal = Vector3.Cross(normal, t1).normalize();
  }

  return { frames, totalLength, sampleSpacing };
}

/** 在等弧长标架之间按 s(米,支持环形越界)线性插值出一个标架 */
export function sampleAt(center: Centerline, s: number): TrackFrame {
  const L = center.totalLength;
  const wrapped = ((s % L) + L) % L;
  const m = center.frames.length;
  const f = (wrapped / L) * m;
  const i0 = Math.floor(f) % m;
  const i1 = (i0 + 1) % m;
  const t = f - Math.floor(f);
  const a = center.frames[i0];
  const b = center.frames[i1];
  return {
    s: wrapped,
    position: Vector3.Lerp(a.position, b.position, t),
    tangent: Vector3.Lerp(a.tangent, b.tangent, t).normalize(),
    normal: Vector3.Lerp(a.normal, b.normal, t).normalize(),
    binormal: Vector3.Lerp(a.binormal, b.binormal, t).normalize(),
    segment: segmentIndexAt(wrapped, L)
  };
}

/** 根据 s 计算路段编号 */
export function segmentAt(center: Centerline, s: number): number {
  const L = center.totalLength;
  const wrapped = ((s % L) + L) % L;
  return segmentIndexAt(wrapped, L);
}

/** 路段 k 的起始弧长 */
export function segmentStart(center: Centerline, k: number): number {
  return (k / SEGMENT_COUNT) * center.totalLength;
}
