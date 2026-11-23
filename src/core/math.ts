/**
 * Small, dependency-free vector / quaternion kit used by the kinematics and
 * collision solvers. Everything is plain data so results are easy to snapshot
 * in tests and to serialise.
 *
 * Units: millimetres for positions, radians for angles.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export const EPS = 1e-9;

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const UP: Readonly<Vec3> = Object.freeze(v3(0, 1, 0));

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const clamp01 = (v: number): number => clamp(v, 0, 1);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const deg = (rad: number): number => (rad * 180) / Math.PI;

export const rad = (d: number): number => (d * Math.PI) / 180;

export const add = (a: Vec3, b: Vec3): Vec3 => v3(a.x + b.x, a.y + b.y, a.z + b.z);

export const sub = (a: Vec3, b: Vec3): Vec3 => v3(a.x - b.x, a.y - b.y, a.z - b.z);

export const scale = (a: Vec3, s: number): Vec3 => v3(a.x * s, a.y * s, a.z * s);

/** a + b * s — fused multiply add, the workhorse of the solvers. */
export const addScaled = (a: Vec3, b: Vec3, s: number): Vec3 =>
  v3(a.x + b.x * s, a.y + b.y * s, a.z + b.z * s);

export const neg = (a: Vec3): Vec3 => v3(-a.x, -a.y, -a.z);

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 =>
  v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

export const lengthSq = (a: Vec3): number => dot(a, a);

export const length = (a: Vec3): number => Math.sqrt(dot(a, a));

export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b));

export const distanceSq = (a: Vec3, b: Vec3): number => lengthSq(sub(a, b));

export function normalize(a: Vec3): Vec3 {
  const l = length(a);
  return l < EPS ? v3(0, 0, 0) : v3(a.x / l, a.y / l, a.z / l);
}

export const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 =>
  v3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));

export const mirrorX = (a: Vec3): Vec3 => v3(-a.x, a.y, a.z);

export function almostEqual(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

export function isFiniteVec(a: Vec3): boolean {
  return Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z);
}

/* ------------------------------------------------------------------ *
 * Quaternions (x, y, z, w) — rotate local vectors into world space.
 * ------------------------------------------------------------------ */

export const quatIdentity = (): Quat => ({ x: 0, y: 0, z: 0, w: 1 });

export function quatNormalize(q: Quat): Quat {
  const l = Math.hypot(q.x, q.y, q.z, q.w);
  if (l < EPS) return quatIdentity();
  return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
}

/** Hamilton product: a * b applies b first, then a. */
export function quatMul(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

export function quatFromAxisAngle(axis: Vec3, angle: number): Quat {
  const n = normalize(axis);
  const h = angle * 0.5;
  const s = Math.sin(h);
  return quatNormalize({ x: n.x * s, y: n.y * s, z: n.z * s, w: Math.cos(h) });
}

/**
 * Rotation vector (axis * angle) -> quaternion. For small angles this is
 * accurate to machine precision without a special case.
 */
export function quatFromRotationVector(w: Vec3): Quat {
  const theta = length(w);
  if (theta < 1e-12) return quatIdentity();
  return quatFromAxisAngle(w, theta);
}

export function quatRotate(q: Quat, v: Vec3): Vec3 {
  // v' = v + 2 * q_v x (q_v x v + q_w * v)
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;
  const tx = 2 * (qy * v.z - qz * v.y);
  const ty = 2 * (qz * v.x - qx * v.z);
  const tz = 2 * (qx * v.y - qy * v.x);
  return v3(
    v.x + qw * tx + (qy * tz - qz * ty),
    v.y + qw * ty + (qz * tx - qx * tz),
    v.z + qw * tz + (qx * ty - qy * tx),
  );
}

export function quatConjugate(q: Quat): Quat {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

/** Extract the rotation vector of a unit quaternion (shortest arc). */
export function quatToRotationVector(q: Quat): Vec3 {
  const qq = q.w < 0 ? { x: -q.x, y: -q.y, z: -q.z, w: -q.w } : q;
  const s = Math.hypot(qq.x, qq.y, qq.z);
  if (s < 1e-12) return v3(0, 0, 0);
  const angle = 2 * Math.atan2(s, qq.w);
  return v3((qq.x / s) * angle, (qq.y / s) * angle, (qq.z / s) * angle);
}

export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;
  if (cos < 0) {
    cos = -cos;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (cos > 0.9995) {
    return quatNormalize({
      x: lerp(a.x, bx, t),
      y: lerp(a.y, by, t),
      z: lerp(a.z, bz, t),
      w: lerp(a.w, bw, t),
    });
  }
  const theta = Math.acos(clamp(cos, -1, 1));
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  return quatNormalize({
    x: a.x * wa + bx * wb,
    y: a.y * wa + by * wb,
    z: a.z * wa + bz * wb,
    w: a.w * wa + bw * wb,
  });
}

/** Row-major 3x3 matrix stored as 9 numbers. */
export type Mat3 = readonly number[];

export function quatToMat3(q: Quat): Mat3 {
  const { x, y, z, w } = q;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const xy = x * y;
  const xz = x * z;
  const yz = y * z;
  const wx = w * x;
  const wy = w * y;
  const wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy),
    2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx),
    2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy),
  ];
}

export function mat3Rotate(m: Mat3, v: Vec3): Vec3 {
  return v3(
    m[0] * v.x + m[1] * v.y + m[2] * v.z,
    m[3] * v.x + m[4] * v.y + m[5] * v.z,
    m[6] * v.x + m[7] * v.y + m[8] * v.z,
  );
}

/** Quaternion from a 3x3 rotation matrix (Shepperd's method). */
export function quatFromMat3(m: Mat3): Quat {
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m10 = m[3];
  const m11 = m[4];
  const m12 = m[5];
  const m20 = m[6];
  const m21 = m[7];
  const m22 = m[8];
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return quatNormalize({
      w: 0.25 * s,
      x: (m21 - m12) / s,
      y: (m02 - m20) / s,
      z: (m10 - m01) / s,
    });
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return quatNormalize({
      w: (m21 - m12) / s,
      x: 0.25 * s,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    });
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return quatNormalize({
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: 0.25 * s,
      z: (m12 + m21) / s,
    });
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return quatNormalize({
    w: (m10 - m01) / s,
    x: (m02 + m20) / s,
    y: (m12 + m21) / s,
    z: 0.25 * s,
  });
}

/* ------------------------------------------------------------------ *
 * Geometric primitives shared by kinematics + collision.
 * ------------------------------------------------------------------ */

export interface Line3 {
  origin: Vec3;
  dir: Vec3; // unit
}

/** Closest point on an infinite line. */
export function closestPointOnLine(p: Vec3, line: Line3): Vec3 {
  return addScaled(line.origin, line.dir, dot(sub(p, line.origin), line.dir));
}

export function distanceToLine(p: Vec3, line: Line3): number {
  return distance(p, closestPointOnLine(p, line));
}

/** Rotate a point around an axis (line) by `angle` radians. */
export function rotateAboutAxis(p: Vec3, line: Line3, angle: number): Vec3 {
  const rel = sub(p, line.origin);
  const d = dot(rel, line.dir);
  const parallel = scale(line.dir, d);
  const perp = sub(rel, parallel);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const rotated = add(
    add(scale(perp, c), scale(cross(line.dir, perp), s)),
    parallel,
  );
  return add(line.origin, rotated);
}

/** Ray / sphere test — returns the near hit distance or null. */
export function raySphere(origin: Vec3, dir: Vec3, center: Vec3, radius: number): number | null {
  const oc = sub(origin, center);
  const b = dot(oc, dir);
  const c = dot(oc, oc) - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t0 = -b - sq;
  const t1 = -b + sq;
  if (t0 >= 0) return t0;
  return t1 >= 0 ? t1 : null;
}

/** Closest points between two segments (Ericson, Real-Time Collision Detection). */
export function closestPointsSegments(
  p1: Vec3,
  q1: Vec3,
  p2: Vec3,
  q2: Vec3,
): { c1: Vec3; c2: Vec3; s: number; t: number; distance: number } {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  let s = 0;
  let t = 0;
  if (a <= EPS && e <= EPS) {
    s = 0;
    t = 0;
  } else if (a <= EPS) {
    s = 0;
    t = clamp01(f / e);
  } else {
    const c = dot(d1, r);
    if (e <= EPS) {
      t = 0;
      s = clamp01(-c / a);
    } else {
      const b = dot(d1, d2);
      const denom = a * e - b * b;
      s = denom !== 0 ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / a);
      }
    }
  }
  const c1 = addScaled(p1, d1, s);
  const c2 = addScaled(p2, d2, t);
  return { c1, c2, s, t, distance: distance(c1, c2) };
}

export function distancePointSegment(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  if (len2 < EPS) return distance(p, a);
  const t = clamp01(dot(sub(p, a), ab) / len2);
  return distance(p, addScaled(a, ab, t));
}

/** Round for serialisation without exponent noise. */
export function roundTo(v: number, digits = 4): number {
  if (!Number.isFinite(v)) return 0;
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}
