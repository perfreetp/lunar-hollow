import type {
  BoxCollider,
  CapsuleCollider,
  ClearanceReport,
  Contact,
  LayerId,
  OcclusionReport,
  Pose,
  ProbeGroup,
  StaticCollider,
  SuspensionDims,
} from './model';
import {
  add,
  addScaled,
  clamp,
  closestPointsSegments,
  cross,
  distance,
  dot,
  length,
  normalize,
  scale,
  sub,
  v3,
  type Vec3,
} from './math';

/* ------------------------------------------------------------------ *
 * Analytic collision + occlusion.
 *
 * Every check is pure geometry over a handful of convex primitives, so the
 * outcome is deterministic per frame and unit-testable without a GPU. The wheel
 * is sampled on its actual rounded-cylinder surface; those samples are then
 * scored against the box / capsule distance fields.
 * ------------------------------------------------------------------ */

export interface WheelShape {
  center: Vec3;
  axis: Vec3;
  forward: Vec3;
  up: Vec3;
  radius: number;
  halfWidth: number;
  /** rounded shoulder radius of the tyre */
  edge: number;
}

export function wheelShapeOf(pose: Pose, dims: SuspensionDims): WheelShape {
  const halfWidth = dims.wheelWidth * 0.5;
  return {
    center: pose.wheelCenter,
    axis: pose.wheelAxis,
    forward: pose.wheelForward,
    up: pose.wheelUp,
    radius: dims.wheelRadius,
    halfWidth,
    edge: Math.min(halfWidth, Math.max(2.5, dims.wheelWidth * 0.22)),
  };
}

const toLocal = (w: WheelShape, p: Vec3): Vec3 => {
  const d = sub(p, w.center);
  return v3(dot(d, w.up), dot(d, w.forward), dot(d, w.axis));
};

/** Signed distance to the tyre solid (negative inside) — rounded cylinder SDF. */
export function tireSdf(w: WheelShape, p: Vec3): number {
  const l = toLocal(w, p);
  const radial = Math.hypot(l.x, l.y);
  const qr = radial - (w.radius - w.edge);
  const qz = Math.abs(l.z) - (w.halfWidth - w.edge);
  const outside = Math.hypot(Math.max(qr, 0), Math.max(qz, 0));
  const inside = Math.min(Math.max(qr, qz), 0);
  return outside + inside - w.edge;
}

/**
 * Probe points on the true tyre surface in world space. Tread bands plus both
 * shoulders plus sidewall faces, so a flat chassis face can never slip between
 * samples and fake a clear gap.
 */
export function wheelProbes(w: WheelShape, segments = 24): Vec3[] {
  const out: Vec3[] = [];
  const radial = w.radius - w.edge;
  const axialIn = Math.max(0, w.halfWidth - w.edge);
  const treadAxial = [-0.88, -0.55, -0.22, 0.22, 0.55, 0.88].map((f) => f * axialIn);

  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const u = add(scale(w.up, Math.cos(a)), scale(w.forward, Math.sin(a)));
    for (const ax of treadAxial) {
      out.push(add(add(w.center, scale(u, radial)), scale(w.axis, ax)));
    }
    for (const sgn of [-1, 1]) {
      for (let k = 1; k <= 3; k++) {
        const t = (k / 3) * (Math.PI / 2);
        const rr = radial + Math.sin(t) * w.edge;
        const ax = sgn * (axialIn + Math.cos(t) * w.edge);
        out.push(add(add(w.center, scale(u, rr)), scale(w.axis, ax)));
      }
      // Sidewall face rings.
      for (const f of [0.6, 0.86]) {
        out.push(
          add(add(w.center, scale(u, radial * f)), scale(w.axis, sgn * w.halfWidth)),
        );
      }
    }
  }
  return out;
}

/** A coarse but complete cloud for the occlusion rays (cheaper than full probes). */
export function wheelSamplePoints(w: WheelShape, segments = 18, rings = 4): Vec3[] {
  const out: Vec3[] = [];
  const radialOut = w.radius - w.edge * 0.35;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const u = add(scale(w.up, Math.cos(a)), scale(w.forward, Math.sin(a)));
    for (let r = 0; r <= rings; r++) {
      const f = 0.35 + (0.65 * r) / rings;
      for (const sgn of [-1, 1]) {
        out.push(add(add(w.center, scale(u, radialOut * f)), scale(w.axis, sgn * w.halfWidth * 0.8)));
      }
    }
  }
  return out;
}

/* ---------------- static collider distance fields ---------------- */

/** World point -> box-local coordinates (Z rotation only). */
export function toBoxLocal(box: BoxCollider, p: Vec3): Vec3 {
  const dx = p.x - box.center.x;
  const dy = p.y - box.center.y;
  const dz = p.z - box.center.z;
  if (!box.rotZ) return { x: dx, y: dy, z: dz };
  const a = (-box.rotZ * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: dx * c - dy * s, y: dx * s + dy * c, z: dz };
}

export function boxSdf(box: BoxCollider, p: Vec3): number {
  const l = toBoxLocal(box, p);
  const dx = Math.abs(l.x) - box.half.x;
  const dy = Math.abs(l.y) - box.half.y;
  const dz = Math.abs(l.z) - box.half.z;
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0));
  const inside = Math.min(Math.max(dx, Math.max(dy, dz)), 0);
  return outside + inside;
}

export function capsuleSdf(caps: CapsuleCollider, p: Vec3): number {
  const ab = sub(caps.b, caps.a);
  const len2 = dot(ab, ab);
  const t = len2 < 1e-9 ? 0 : clamp(dot(sub(p, caps.a), ab) / len2, 0, 1);
  return distance(p, addScaled(caps.a, ab, t)) - caps.radius;
}

export function colliderSdf(c: StaticCollider, p: Vec3): number {
  return c.kind === 'chassis' ? boxSdf(c, p) : capsuleSdf(c, p);
}

/* ---------------- contact evaluation ---------------- */

export interface CollisionInput {
  wheel: WheelShape;
  colliders: StaticCollider[];
  /** probes for other moving parts (knuckle, arms) bundled into groups */
  extraProbes?: { group: ProbeGroup; points: Vec3[] }[];
  /** a pair below this clearance is "touching" */
  touchEps?: number;
  /** a pair below this clearance (negative = overlap) is reported as contact */
  reportEps?: number;
}

interface PairBest {
  sdf: number;
  point: Vec3;
}

export function evaluateClearance(input: CollisionInput): ClearanceReport {
  const touchEps = input.touchEps ?? 1.2;
  const reportEps = input.reportEps ?? 0.4;
  const groups: { group: ProbeGroup; points: Vec3[] }[] = [
    { group: 'wheel', points: wheelProbes(input.wheel) },
    ...(input.extraProbes ?? []),
  ];

  const best = new Map<string, PairBest>();
  const touching: string[] = [];

  for (const g of groups) {
    for (const c of input.colliders) {
      const key = `${g.group}|${c.id}`;
      let pair = best.get(key);
      if (!pair) {
        pair = { sdf: Infinity, point: g.points[0] ?? v3() };
        best.set(key, pair);
      }
      let min = pair.sdf;
      let minPt = pair.point;
      for (const p of g.points) {
        const sdf = colliderSdf(c, p);
        if (sdf < min) {
          min = sdf;
          minPt = p;
        }
        if (sdf < touchEps) {
          const tag = `${g.group}|${c.id}`;
          if (touching.indexOf(tag) < 0) touching.push(tag);
        }
      }
      pair.sdf = min;
      pair.point = minPt;
    }
  }

  const contacts: Contact[] = [];
  let chassis = Infinity;
  let shock = Infinity;
  let minDepth = 0;
  const byId = new Map(input.colliders.map((c) => [c.id, c] as const));

  for (const [key, pair] of best) {
    const [group, id] = key.split('|');
    const collider = byId.get(id);
    if (!collider) continue;
    const layer: LayerId = collider.kind === 'chassis' ? 'chassis' : 'shock';
    if (layer === 'chassis') chassis = Math.min(chassis, pair.sdf);
    else shock = Math.min(shock, pair.sdf);
    if (pair.sdf < -reportEps) {
      contacts.push({
        probe: group as ProbeGroup,
        target: id,
        targetLabel: collider.label,
        targetLayer: layer,
        depth: -pair.sdf,
        point: pair.point,
      });
      minDepth = Math.max(minDepth, -pair.sdf);
    }
  }
  contacts.sort((a, b) => b.depth - a.depth);
  return {
    chassis: Number.isFinite(chassis) ? chassis : 999,
    shock: Number.isFinite(shock) ? shock : 999,
    contacts,
    minDepth,
    touching,
  };
}

/* ---------------- ray casts ---------------- */

export function raySphere(o: Vec3, d: Vec3, center: Vec3, r: number): number | null {
  const oc = sub(o, center);
  const b = dot(oc, d);
  const c = dot(oc, oc) - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t0 = -b - sq;
  if (t0 >= 0) return t0;
  const t1 = -b + sq;
  return t1 >= 0 ? t1 : null;
}

export function rayBox(origin: Vec3, dir: Vec3, box: BoxCollider, maxT = Infinity): number | null {
  let tmin = 0;
  let tmax = maxT;
  const local = toBoxLocal(box, origin);
  const o = [local.x, local.y, local.z];
  let dd: Vec3 = dir;
  if (box.rotZ) {
    const a = (-box.rotZ * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    dd = { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c, z: dir.z };
  }
  const d = [dd.x, dd.y, dd.z];
  const c0 = [0, 0, 0];
  const c = c0;
  const h = [box.half.x, box.half.y, box.half.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (Math.abs(o[i] - c[i]) > h[i]) return null;
      continue;
    }
    const inv = 1 / d[i];
    let t1 = (c[i] - h[i] - o[i]) * inv;
    let t2 = (c[i] + h[i] - o[i]) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

export function rayCapsule(origin: Vec3, dir: Vec3, caps: CapsuleCollider, maxT = Infinity): number | null {
  const ba = sub(caps.b, caps.a);
  const oa = sub(origin, caps.a);
  const baba = dot(ba, ba);
  const bard = dot(ba, dir);
  const baoa = dot(ba, oa);
  const rdoa = dot(dir, oa);
  const oaoa = dot(oa, oa);
  const a = baba - bard * bard;
  const b = baba * rdoa - baoa * bard;
  const c = baba * oaoa - baoa * baoa - caps.radius * caps.radius * baba;
  let best: number | null = null;
  const consider = (t: number) => {
    if (t >= 0 && t <= maxT && (best === null || t < best)) best = t;
  };
  if (a > 1e-9) {
    const h = b * b - a * c;
    if (h >= 0) {
      const t = (-b - Math.sqrt(h)) / a;
      const y = baoa + t * bard;
      if (y > 0 && y < baba) consider(t);
    }
  }
  // Caps (always evaluated — they also cover the parallel case).
  for (const centre of [caps.a, caps.b]) {
    const t = raySphere(origin, dir, centre, caps.radius);
    if (t !== null) consider(t);
  }
  return best;
}

export interface RayHit {
  t: number;
  id: string;
  layer: LayerId;
}

export function rayColliders(
  origin: Vec3,
  dir: Vec3,
  colliders: StaticCollider[],
  maxT: number,
  exclude?: ReadonlySet<string>,
): RayHit | null {
  let best: RayHit | null = null;
  for (const c of colliders) {
    if (exclude?.has(c.id)) continue;
    const t = c.kind === 'chassis' ? rayBox(origin, dir, c, maxT) : rayCapsule(origin, dir, c, maxT);
    if (t !== null && t > 0.05 && (best === null || t < best.t)) {
      best = { t, id: c.id, layer: c.kind === 'chassis' ? 'chassis' : 'shock' };
    }
  }
  return best;
}

/** True when the segment a→b is blocked by any collider. */
export function segmentBlocked(
  a: Vec3,
  b: Vec3,
  colliders: StaticCollider[],
  exclude?: ReadonlySet<string>,
): RayHit | null {
  const d = sub(b, a);
  const dist = length(d);
  if (dist < 1e-6) return null;
  return rayColliders(a, scale(d, 1 / dist), colliders, dist - 0.4, exclude);
}

/* ---------------- occlusion sampling ---------------- */

export interface OcclusionInput {
  camera: Vec3;
  wheel: WheelShape;
  shock: CapsuleCollider;
  chassis: BoxCollider[];
  frame: number;
  /** probe resolution multiplier (1 = default) */
  quality?: number;
}

export function evaluateOcclusion(input: OcclusionInput): OcclusionReport {
  const colliders: StaticCollider[] = [...input.chassis, input.shock];
  const quality = input.quality ?? 1;
  const wheelPts = wheelSamplePoints(input.wheel, Math.round(20 * quality), 4);

  const shockPts: Vec3[] = [];
  const axisDir = normalize(sub(input.shock.b, input.shock.a));
  const perp = normalize(Math.abs(axisDir.y) < 0.9 ? cross(axisDir, v3(0, 1, 0)) : cross(axisDir, v3(1, 0, 0)));
  const perp2 = cross(axisDir, perp);
  const segments = Math.round(12 * quality);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const centre = addScaled(input.shock.a, sub(input.shock.b, input.shock.a), t);
    for (const p of [perp, perp2, scale(perp, -1), scale(perp2, -1)]) {
      shockPts.push(add(centre, scale(p, input.shock.radius)));
    }
  }

  const points: OcclusionReport['points'] = [];
  const byGroup: Record<LayerId, { total: number; hidden: number }> = {
    chassis: { total: 0, hidden: 0 },
    shock: { total: 0, hidden: 0 },
    wheel: { total: 0, hidden: 0 },
  };

  const test = (layer: LayerId, p: Vec3) => {
    byGroup[layer].total++;
    const raw = sub(input.camera, p);
    const dist = length(raw);
    if (dist < 1e-6) {
      points.push({ layer, position: p, hidden: false });
      return;
    }
    const dir = scale(raw, 1 / dist);
    const hit = rayColliders(p, dir, colliders, dist - 0.4);
    const hidden = hit !== null;
    if (hidden) byGroup[layer].hidden++;
    points.push({ layer, position: p, hidden });
  };

  for (const p of wheelPts) test('wheel', p);
  for (const p of shockPts) test('shock', p);

  let total = 0;
  let hidden = 0;
  for (const g of Object.values(byGroup)) {
    total += g.total;
    hidden += g.hidden;
  }
  return {
    byGroup,
    points,
    camera: input.camera,
    ratio: total === 0 ? 0 : hidden / total,
    frame: input.frame,
  };
}

/* ---------------- layer ordering helpers ---------------- */

export function layerRank(order: readonly LayerId[], layer: LayerId): number {
  const i = order.indexOf(layer);
  return i < 0 ? order.length : i;
}

/** Draw group per layer: front-most layer gets the highest group. */
export function renderingGroupsFor(order: readonly LayerId[]): Record<LayerId, number> {
  const map: Record<LayerId, number> = { chassis: 0, shock: 0, wheel: 0 };
  order.forEach((layer, index) => {
    map[layer] = index + 1;
  });
  return map;
}

/**
 * Polygon offsets per layer. Front layers pull towards the camera so that
 * coincident surfaces resolve in the intended order — no z-fighting flicker.
 */
export function zOffsetsFor(order: readonly LayerId[]): Record<LayerId, number> {
  const map: Record<LayerId, number> = { chassis: 0, shock: 0, wheel: 0 };
  const n = order.length;
  order.forEach((layer, index) => {
    map[layer] = (n - 1 - index) * 1.0;
  });
  return map;
}

export function contactSummary(report: ClearanceReport): string {
  if (report.contacts.length === 0) {
    return `最小间隙 ${Math.min(report.chassis, report.shock).toFixed(1)} mm`;
  }
  const top = report.contacts[0];
  return `${top.targetLabel} 穿插 ${top.depth.toFixed(1)} mm`;
}

export function distanceToAxis(p: Vec3, a: Vec3, dirUnit: Vec3): number {
  const rel = sub(p, a);
  const along = dot(rel, dirUnit);
  return length(sub(rel, scale(dirUnit, along)));
}

export { closestPointsSegments };
