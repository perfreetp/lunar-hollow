import {
  catArcAtX,
  catCurvature,
  solveCatenary,
  type CatenarySpan,
} from './catenary';
import { G, ROPE_DEFAULTS } from './config';
import type { Cabin, SolveDirtyKind, Support, Vec3, WheelGroup } from './types';
import { vec3 } from './config';

/** 线路上的节点（支架 / 轮组 / 车厢） */
export interface SpanNode {
  id: string;
  kind: 'support' | 'wheel' | 'cabin';
  pos: Vec3;
  /** 节点向下集中载荷 (N)，仅车厢非零 */
  loadN: number;
  /** 沿支架 A→B 水平投影线的里程 (m)，用于排序 */
  horizontalS: number;
}

/** 自适应布环得到的单个中线环采样点 */
export interface TessRing {
  /** 世界坐标 */
  pos: Vec3;
  /** 单位切向 */
  tangent: Vec3;
  /** 距本跨左端的弧长 (m) */
  arc: number;
}

export interface SolvedSpan {
  index: number;
  nodeA: SpanNode;
  nodeB: SpanNode;
  /** 水平投影长度 (m) */
  dx: number;
  /** 高差 dy = yB - yA (m) */
  dy: number;
  /** 水平方向单位向量 A→B */
  dirH: Vec3;
  cat: CatenarySpan;
  /** 缓存签名：端点 + H + w 不变则本跨无需重算 */
  signature: string;
  /** 本跨是否在最近一次求解中命中缓存 */
  cacheHit: boolean;
  rings: TessRing[];
  /** 本跨实测最大弦长/弧长误差 */
  chordArcError: number;
}

export interface RopeModelInput {
  supportA: Support;
  supportB: Support;
  wheels: WheelGroup[];
  cabin: Cabin;
  /** 水平张力 H (N) */
  horizontalTension: number;
  /** 绳线密度 (kg/m) */
  linearDensity: number;
  ropeRadius: number;
}

const UP: Vec3 = { x: 0, y: 1, z: 0 };
const EPS = 1e-7;

function roundSig(v: number): number {
  return Math.round(v / EPS) * EPS;
}

/**
 * 多跨分段悬链线绳模型。
 *
 * 力学约定：水平张力 H 全绳恒定；每个节点间为一跨独立悬链线；
 * 车厢为唯一集中载荷点，其垂向位置由节点垂向力平衡
 * V_right = V_left + P 经二分迭代求出（H 由张力档位给定）。
 */
export class RopeModel {
  spans: SolvedSpan[] = [];
  nodes: SpanNode[] = [];
  cabinPos: Vec3 = { x: 0, y: 0, z: 0 };
  /** 最近一次求解的迭代次数 / 缓存命中跨数 */
  iterations = 0;
  cacheHits = 0;
  maxChordArcError = 0;
  totalLength = 0;
  ringCount = 0;
  lastDirty: SolveDirtyKind = 'all';

  private spanCache = new Map<string, SolvedSpan>();

  /** 节点里程：把任意点投影到支架 A→B 的水平投影线上 */
  private horizontalMilestone(input: RopeModelInput, p: Vec3): number {
    const a = input.supportA.position;
    const b = input.supportB.position;
    const ab = vec3.normalize({ x: b.x - a.x, y: 0, z: b.z - a.z });
    const ap = { x: p.x - a.x, y: 0, z: p.z - a.z };
    return vec3.dot(ap, ab);
  }

  /** 车厢目标水平位置（世界坐标，y 待定） */
  private cabinHorizontalPos(input: RopeModelInput): Vec3 {
    const a = input.supportA.position;
    const b = input.supportB.position;
    const t = Math.min(0.999, Math.max(0.001, input.cabin.t));
    return {
      x: a.x + (b.x - a.x) * t,
      y: 0,
      z: a.z + (b.z - a.z) * t,
    };
  }

  /**
   * 车厢垂向平衡方程残差 f(yc) = V_right − V_left − P。
   * V_left 为左跨右端竖向张力分量，V_right 为右跨左端竖向张力分量。
   * f 关于 yc 单调递减，二分求根。
   */
  private cabinResidual(
    left: SpanNode,
    right: SpanNode,
    cabinH: Vec3,
    yc: number,
    H: number,
    w: number,
    P: number,
  ): number {
    const cabinPoint: Vec3 = { x: cabinH.x, y: yc, z: cabinH.z };
    const hL = this.hDist(left.pos, cabinPoint);
    const hR = this.hDist(cabinPoint, right.pos);
    const catL = solveCatenary(hL, yc - left.pos.y, H, w);
    const catR = solveCatenary(hR, right.pos.y - yc, H, w);
    return catR.V0 - catL.V1 - P;
  }

  private hDist(a: Vec3, b: Vec3): number {
    return Math.hypot(b.x - a.x, b.z - a.z);
  }

  /** 二分迭代求车厢垂向平衡位置 */
  private solveCabinY(
    left: SpanNode,
    right: SpanNode,
    cabinH: Vec3,
    H: number,
    w: number,
    P: number,
  ): { y: number; iterations: number } {
    const hL = this.hDist(left.pos, cabinH);
    const hR = this.hDist(cabinH, right.pos);
    // 初始括号：由悬链线弧垂解析估计绳在车厢处的自然高度，再叠加集中载荷挠度量级
    const c = H / w;
    const naturalL = left.pos.y - c * (Math.cosh(hL / c) - 1);
    const naturalR = right.pos.y - c * (Math.cosh(hR / c) - 1);
    const natural = (naturalL + naturalR) * 0.5;
    // 集中载荷产生的附加垂度量级 ≈ P·hL·hR / (H·(hL+hR))
    const sag = (P * hL * hR) / (H * (hL + hR || 1));
    let yLow = natural - sag - 2;
    let yHigh = natural + sag + 2;
    let iter = 0;
    const tol = ROPE_DEFAULTS.cabinYTolerance;
    // 确认括号方向：f 递减，f(yLow) 应为正
    let fLow = this.cabinResidual(left, right, cabinH, yLow, H, w, P);
    let guard = 0;
    while (fLow <= 0 && guard < 20) {
      yLow -= Math.max(5, sag);
      fLow = this.cabinResidual(left, right, cabinH, yLow, H, w, P);
      guard++;
    }
    while (yHigh - yLow > tol && iter < ROPE_DEFAULTS.maxBisection) {
      const yMid = (yLow + yHigh) * 0.5;
      const fMid = this.cabinResidual(left, right, cabinH, yMid, H, w, P);
      if (fMid > 0) yLow = yMid;
      else yHigh = yMid;
      iter++;
    }
    return { y: (yLow + yHigh) * 0.5, iterations: iter };
  }

  /** 单跨签名 */
  private makeSignature(a: SpanNode, b: SpanNode, H: number, w: number): string {
    return [
      a.id, b.id,
      roundSig(a.pos.x), roundSig(a.pos.y), roundSig(a.pos.z),
      roundSig(b.pos.x), roundSig(b.pos.y), roundSig(b.pos.z),
      roundSig(H), roundSig(w),
    ].join('|');
  }

  /**
   * 自适应布环：以曲率控制步长，保证单段转角 ≤ maxTurnAngle，
   * 转角 θ 的弦弧误差上界 ≈ θ²/24（θ=0.1 时为 4.2e-4，满足千分之一）。
   */
  private tessellate(span: SolvedSpan): void {
    const { cat, dirH, nodeA, dx } = span;
    const rings: TessRing[] = [];
    const cfg = ROPE_DEFAULTS;
    let x = 0;
    let maxErr = 0;
    let prevArc = 0;
    let prevPos: Vec3 | null = null;

    const sample = (lx: number): TessRing => {
      // 局部悬链线坐标
      const u = cat.uL + lx / cat.c;
      const ly = cat.c * (Math.cosh(u) - Math.cosh(cat.uL));
      const sh = Math.sinh(u);
      const inv = 1 / Math.sqrt(1 + sh * sh);
      const tangent: Vec3 = {
        x: dirH.x * inv,
        y: sh * inv,
        z: dirH.z * inv,
      };
      const pos: Vec3 = {
        x: nodeA.pos.x + dirH.x * lx,
        y: nodeA.pos.y + ly,
        z: nodeA.pos.z + dirH.z * lx,
      };
      return { pos, tangent, arc: catArcAtX(cat, lx) };
    };

    rings.push(sample(0));
    while (x < dx - EPS) {
      const kappa = catCurvature(cat, x);
      let step = cfg.maxTurnAngle / Math.max(kappa, 1e-9);
      step = Math.min(step, cfg.maxSegmentLength);
      step = Math.max(step, cfg.minSegmentLength);
      if (x + step > dx) step = dx - x;
      x += step;
      const ring = sample(x);
      if (prevPos) {
        const chord = vec3.len(vec3.sub(ring.pos, prevPos));
        const dArc = ring.arc - prevArc;
        if (dArc > 1e-12) maxErr = Math.max(maxErr, (dArc - chord) / dArc);
      }
      prevPos = ring.pos;
      prevArc = ring.arc;
      rings.push(ring);
    }
    // 强制末环精确落在右端节点
    const last = sample(dx);
    rings[rings.length - 1] = last;

    span.rings = rings;
    span.chordArcError = maxErr;
  }

  /** 组装/复用一跨 */
  private buildSpan(
    index: number,
    a: SpanNode,
    b: SpanNode,
    H: number,
    w: number,
  ): SolvedSpan {
    const signature = this.makeSignature(a, b, H, w);
    const cached = this.spanCache.get(signature);
    if (cached) {
      cached.index = index;
      cached.cacheHit = true;
      return cached;
    }

    const dx = this.hDist(a.pos, b.pos);
    const dy = b.pos.y - a.pos.y;
    const dirH =
      dx > EPS
        ? vec3.normalize({ x: b.pos.x - a.pos.x, y: 0, z: b.pos.z - a.pos.z })
        : { x: 1, y: 0, z: 0 };
    const cat = solveCatenary(Math.max(dx, EPS), dy, H, w);

    const span: SolvedSpan = {
      index,
      nodeA: a,
      nodeB: b,
      dx,
      dy,
      dirH,
      cat,
      signature,
      cacheHit: false,
      rings: [],
      chordArcError: 0,
    };
    this.tessellate(span);
    this.spanCache.set(signature, span);
    return span;
  }

  /**
   * 全绳求解。
   * @param reason 变更来源，用于缓存失效粒度统计
   */
  solve(input: RopeModelInput, reason: SolveDirtyKind = 'all'): void {
    const t0 = performance.now();
    this.lastDirty = reason;
    const H = input.horizontalTension;
    const w = input.linearDensity * G;
    const P = (input.cabin.payloadKg + input.cabin.deadWeightKg) * G;

    // 1. 组装节点。
    // 建模约定：轮组是单向接触的托索轮，不作为绳的中间支撑节点，
    // 绳中线在轮位处自由悬垂；轮绳关系完全由 contacts 求解器（射线求交+压陷量）刻画。
    // 节点只包含两端支架与集中载荷点（车厢）。
    const cabinH = this.cabinHorizontalPos(input);
    const cabinNode: SpanNode = {
      id: 'cabin',
      kind: 'cabin',
      pos: { ...cabinH },
      loadN: P,
      horizontalS: this.horizontalMilestone(input, cabinH),
    };
    const supportBNode: SpanNode = {
      id: input.supportB.id,
      kind: 'support',
      pos: { ...input.supportB.position },
      loadN: 0,
      horizontalS: this.horizontalMilestone(input, input.supportB.position),
    };
    const nodes: SpanNode[] = [
      {
        id: input.supportA.id,
        kind: 'support',
        pos: { ...input.supportA.position },
        loadN: 0,
        horizontalS: 0,
      },
      supportBNode,
    ];

    // 2. 车厢插入两支架之间（按水平里程排序后必有且仅有两支架夹住它）
    const insertAt = cabinNode.horizontalS <= supportBNode.horizontalS ? 1 : 2;
    const leftNode = nodes[insertAt - 1];
    const rightNode = nodes[Math.min(nodes.length - 1, insertAt)];
    nodes.splice(insertAt, 0, cabinNode);

    // 3. 二分迭代求车厢垂向平衡位置
    const { y, iterations } = this.solveCabinY(leftNode, rightNode, cabinH, H, w, P);
    cabinNode.pos.y = y;
    this.cabinPos = { ...cabinNode.pos };
    this.iterations = iterations;
    this.nodes = nodes;

    // 4. 逐跨求解（签名缓存：车厢移动只失效相邻两跨）
    const spans: SolvedSpan[] = [];
    let cacheHits = 0;
    let maxErr = 0;
    let totalLength = 0;
    let ringCount = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      const span = this.buildSpan(i, nodes[i], nodes[i + 1], H, w);
      spans.push(span);
      if (span.cacheHit) cacheHits++;
      maxErr = Math.max(maxErr, span.chordArcError);
      totalLength += span.cat.length;
      ringCount += span.rings.length;
    }
    this.spans = spans;
    this.cacheHits = cacheHits;
    this.maxChordArcError = maxErr;
    this.totalLength = totalLength;
    this.ringCount = ringCount;
    this.lastSolveMs = performance.now() - t0;
  }

  lastSolveMs = 0;

  /** 清空跨缓存（场景重置时使用） */
  clearCache(): void {
    this.spanCache.clear();
  }

  /** 世界坐标点处求绳中线最近点（供轮组射线求交的兜底/校验） */
  closestPoint(p: Vec3): { point: Vec3; tangent: Vec3; distance: number; spanIndex: number } {
    let best: { point: Vec3; tangent: Vec3; distance: number; spanIndex: number } | null = null;
    for (const span of this.spans) {
      for (let i = 0; i < span.rings.length - 1; i++) {
        const a = span.rings[i];
        const b = span.rings[i + 1];
        const ab = vec3.sub(b.pos, a.pos);
        const len2 = vec3.dot(ab, ab);
        const t = len2 > 0 ? Math.min(1, Math.max(0, vec3.dot(vec3.sub(p, a.pos), ab) / len2)) : 0;
        const q = vec3.add(a.pos, vec3.scale(ab, t));
        const d = vec3.len(vec3.sub(p, q));
        if (!best || d < best.distance) {
          best = {
            point: q,
            tangent: vec3.normalize(vec3.add(a.tangent, vec3.scale(b.tangent, 1 - t))),
            distance: d,
            spanIndex: span.index,
          };
        }
      }
    }
    return best!;
  }
}
