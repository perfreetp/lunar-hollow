import type {
  Pose,
  PoseIssue,
  ShockState,
  SuspensionDims,
  TravelCurve,
  TravelCurveSample,
  TravelSettings,
} from './model';
import {
  add,
  clamp,
  cross,
  deg,
  distance,
  dot,
  EPS,
  isFiniteVec,
  length,
  normalize,
  quatFromAxisAngle,
  quatIdentity,
  quatMul,
  quatRotate,
  rad,
  scale,
  sub,
  v3,
  type Quat,
  type Vec3,
} from './math';
import { DESIGN_KPI_DEG, RIG, designKingpinDirection } from './rigSpec';

/* ------------------------------------------------------------------ *
 * Closed-form suspension chain solver.
 *
 * Every frame the chain is solved in this order:
 *   1. lower-arm angle            -> lower ball joint (LBJ)
 *   2. upper-arm circle ∩ kingpin sphere -> upper ball joint (UBJ)
 *   3. knuckle orientation (minimal rotation of the design kingpin onto the
 *      current kingpin)
 *   4. tie-rod circle ∩ sphere    -> knuckle steer angle
 *   5. wheel centre / axle / camber / toe / shock length
 *
 * Branch choices are made against the previous frame's state, so the preview
 * cannot snap to the mirrored solution mid-drag (that is the usual source of
 * flicker in this kind of tool).
 * ------------------------------------------------------------------ */

export interface KnuckleLocal {
  /** Steering-arm eye relative to the LBJ, design orientation. */
  steerEye: Vec3;
  /** Wheel centre relative to the LBJ, design orientation. */
  wheelCenter: Vec3;
}

export interface RigRef {
  dims: SuspensionDims;
  travel: TravelSettings;
  lowerPivot: Vec3;
  upperPivot: Vec3;
  rackEndBase: Vec3;
  shockTop: Vec3;
  thetaStatic: number;
  kingpinUnit: Vec3;
  knuckleLocal: KnuckleLocal;
  lbjStatic: Vec3;
  ubjStatic: Vec3;
  wheelCenterStatic: Vec3;
  groundY: number;
  /** d(shock length) / d(wheel travel); negative in bump. */
  motionRatio: number;
  /** d(wheel travel) / d(shock length). */
  wheelPerSpring: number;
  /** Static ride-height lift caused by preload, mm of wheel travel. */
  preloadLift: number;
  /** Bump travel available from the preloaded attitude. */
  availableBump: number;
  /** Droop travel available from the preloaded attitude. */
  availableDroop: number;
  /** Absolute limits, relative to the design (un-preloaded) pose. */
  limitUp: number;
  limitDown: number;
  shockLengthStatic: number;
  springFreeLength: number;
  springRate: number;
}

export const DESIGN_KINGPIN: Vec3 = designKingpinDirection(DESIGN_KPI_DEG);

export interface SolveCache {
  theta: number;
  prevUbj: Vec3;
  phi: number;
  valid: boolean;
}

export const newSolveCache = (): SolveCache => ({
  theta: NaN,
  prevUbj: v3(),
  phi: 0,
  valid: false,
});

/** Lower-arm direction for a sweep angle (θ>0 swings down/outboard). */
export function armDir(theta: number): Vec3 {
  return v3(Math.cos(theta), -Math.sin(theta), 0);
}

export function lowerPointAt(theta: number, dims: SuspensionDims): Vec3 {
  return add(RIG.lowerPivot, scale(armDir(theta), dims.lowerArmLength));
}

/** Shock lower eye, rigidly attached to the lower arm. */
export function shockLowerPoint(theta: number, dims: SuspensionDims): Vec3 {
  const lx = dims.lowerArmLength * RIG.shockArmFraction + RIG.shockLowerOffset.x;
  const ly = RIG.shockLowerOffset.y;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return add(RIG.lowerPivot, v3(lx * c + ly * s, -lx * s + ly * c, RIG.shockLowerOffset.z));
}

/* ------------------------------------------------------------------ *
 * Upper ball joint
 * ------------------------------------------------------------------ */

export interface UpperJointResult {
  ubj: Vec3;
  ok: boolean;
  residual: number;
}

export function solveUpperJoint(
  lbj: Vec3,
  dims: SuspensionDims,
  near: Vec3,
  designKp: Vec3 = DESIGN_KINGPIN,
): UpperJointResult {
  const C = RIG.upperPivot;
  const axis = RIG.armAxis;
  const Lu = Math.max(8, dims.upperArmLength);
  const K = Math.max(8, dims.kingpinLength);

  const d = sub(lbj, C);
  const h = dot(d, axis);
  const v = sub(d, scale(axis, h));
  const vLen = length(v);
  if (vLen < EPS) {
    return { ubj: add(C, scale(axis, h)), ok: false, residual: K };
  }
  const a = (vLen * vLen + Lu * Lu - K * K) / (2 * vLen);
  const heightSq = Lu * Lu - a * a;
  const ok = heightSq >= -1e-6;
  const height = Math.sqrt(Math.max(0, heightSq));
  const vHat = scale(v, 1 / vLen);
  const perp = cross(axis, vHat);
  const along = add(C, scale(axis, h));
  const b1 = add(along, add(scale(vHat, a), scale(perp, height)));
  const b2 = add(along, add(scale(vHat, a), scale(perp, -height)));

  // Branch choice is geometric, not nearest-neighbour: the kingpin must keep
  // leaning inboard like the design pose. Picking by proximity to the previous
  // frame can latch onto the mirrored solution and produce a nonsense camber
  // (the joint flips inside out), which then reads as a jump in the preview.
  const kp1 = normalize(sub(b1, lbj));
  const kp2 = normalize(sub(b2, lbj));
  const align1 = dot(kp1, designKp);
  const align2 = dot(kp2, designKp);
  const pick = align1 >= align2 ? b1 : b2;
  void near;
  return { ubj: pick, ok, residual: Math.abs(distance(pick, lbj) - K) };
}

/** Minimal rotation taking unit vector a onto unit vector b. */
export function alignQuat(a: Vec3, b: Vec3): Quat {
  const c = clamp(dot(a, b), -1, 1);
  const ax = cross(a, b);
  const s = length(ax);
  if (s < 1e-8) {
    if (c > 0) return quatIdentity();
    const perp = normalize(Math.abs(a.y) < 0.9 ? cross(a, v3(0, 1, 0)) : cross(a, v3(1, 0, 0)));
    return quatFromAxisAngle(perp, Math.PI);
  }
  return quatFromAxisAngle(scale(ax, 1 / s), Math.atan2(s, c));
}

/* ------------------------------------------------------------------ *
 * Steering angle
 * ------------------------------------------------------------------ */

export interface SteerResult {
  phi: number;
  eye: Vec3;
  ok: boolean;
  residual: number;
}

export function solveSteer(
  lbj: Vec3,
  kingpin: Vec3,
  localEye: Vec3,
  tieRodLength: number,
  rackEnd: Vec3,
  previousPhi: number,
): SteerResult {
  const h = dot(localEye, kingpin);
  const perpRaw = sub(localEye, scale(kingpin, h));
  const r = length(perpRaw);
  const origin = add(lbj, scale(kingpin, h));
  if (r < 1e-6) {
    return {
      phi: previousPhi,
      eye: add(lbj, localEye),
      ok: false,
      residual: Math.abs(distance(origin, rackEnd) - tieRodLength),
    };
  }
  const e1 = scale(perpRaw, 1 / r);
  const e2 = cross(kingpin, e1);
  const w = sub(origin, rackEnd);
  const A = 2 * r * dot(w, e1);
  const B = 2 * r * dot(w, e2);
  const C = dot(w, w) + r * r - tieRodLength * tieRodLength;
  const amp = Math.hypot(A, B);
  const phi0 = Math.atan2(B, A);
  let ok = true;
  let phi: number;
  if (amp < EPS) {
    ok = false;
    phi = previousPhi;
  } else {
    let cosVal = -C / amp;
    if (cosVal > 1 || cosVal < -1) {
      ok = false;
      cosVal = clamp(cosVal, -1, 1);
    }
    const delta = Math.acos(cosVal);
    const c1 = phi0 + delta;
    const c2 = phi0 - delta;
    // Two mirror solutions exist. Pick the one that keeps the steering arm near
    // the design attitude: the mirrored branch is roughly a half-turn away and
    // would show up as a ~180° toe reading (the classic "knuckle inside out"
    // artefact). Continuity with the previous frame breaks ties on the rare
    // poses where both branches are equally plausible.
    const near0 = Math.abs(c1) <= Math.abs(c2) ? c1 : c2;
    const other = near0 === c1 ? c2 : c1;
    phi =
      Math.abs(near0) <= Math.PI / 2
        ? near0
        : angleDistance(other, previousPhi) < angleDistance(near0, previousPhi)
          ? other
          : near0;
  }
  const eye = add(origin, add(scale(e1, r * Math.cos(phi)), scale(e2, r * Math.sin(phi))));
  return { phi, eye, ok, residual: Math.abs(distance(eye, rackEnd) - tieRodLength) };
}

export function angleDistance(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/* ------------------------------------------------------------------ *
 * Reference build
 * ------------------------------------------------------------------ */

function numericMotionRatio(dims: SuspensionDims, theta: number): number {
  const dTheta = 0.01;
  const l0 = distance(RIG.shockTop, shockLowerPoint(theta - dTheta, dims));
  const l1 = distance(RIG.shockTop, shockLowerPoint(theta + dTheta, dims));
  const t0 = lowerPointAt(theta - dTheta, dims).y;
  const t1 = lowerPointAt(theta + dTheta, dims).y;
  const dTravel = t1 - t0;
  if (Math.abs(dTravel) < 1e-9) return 0.6;
  return (l1 - l0) / dTravel;
}

export function buildRigRef(dims: SuspensionDims, travel: TravelSettings): RigRef {
  const thetaStatic = rad(dims.lowerStaticAngleDeg);
  const kingpinUnit = designKingpinDirection(DESIGN_KPI_DEG);
  const lbjStatic = lowerPointAt(thetaStatic, dims);
  const ubjStatic = add(lbjStatic, scale(kingpinUnit, dims.kingpinLength));
  const knuckleLocal: KnuckleLocal = {
    steerEye: add(
      scale(kingpinUnit, dims.kingpinLength * RIG.steerArmFraction),
      v3(dims.steerArmLateral, 0, dims.steerArmLongitudinal),
    ),
    wheelCenter: v3(dims.hubOffset, dims.hubHeight, 0),
  };
  const wheelCenterStatic = add(lbjStatic, knuckleLocal.wheelCenter);
  const shockLengthStatic = distance(RIG.shockTop, shockLowerPoint(thetaStatic, dims));
  const motionRatio = numericMotionRatio(dims, thetaStatic);
  const wheelPerSpring = 1 / Math.max(0.12, Math.abs(motionRatio));

  const limitUp = Math.max(0, travel.up);
  const limitDown = Math.max(0, travel.down);
  // Preload raises the static attitude; never let it eat the whole bump travel.
  const preloadLift = clamp(travel.preload * wheelPerSpring, 0, limitUp * 0.85);
  const availableBump = Math.max(0, limitUp - preloadLift);
  const availableDroop = limitDown + preloadLift;

  return {
    dims: { ...dims },
    travel: { ...travel },
    lowerPivot: RIG.lowerPivot,
    upperPivot: RIG.upperPivot,
    rackEndBase: RIG.rackEnd,
    shockTop: RIG.shockTop,
    thetaStatic,
    kingpinUnit,
    knuckleLocal,
    lbjStatic,
    ubjStatic,
    wheelCenterStatic,
    groundY: RIG.groundY,
    motionRatio,
    wheelPerSpring,
    preloadLift,
    availableBump,
    availableDroop,
    limitUp,
    limitDown,
    shockLengthStatic,
    springFreeLength: shockLengthStatic * 1.32,
    springRate: 6.2,
  };
}

/* ------------------------------------------------------------------ *
 * Chain solve
 * ------------------------------------------------------------------ */

export interface RawChain {
  theta: number;
  lbj: Vec3;
  ubj: Vec3;
  kingpin: Vec3;
  steer: SteerResult;
  quat: Quat;
  rackEnd: Vec3;
  wheelCenter: Vec3;
  wheelAxis: Vec3;
  wheelForward: Vec3;
  wheelUp: Vec3;
  shockLower: Vec3;
  shockLength: number;
  issues: PoseIssue[];
  residualKingpin: number;
  residualTie: number;
}

export function solveChain(
  ref: RigRef,
  theta: number,
  cache: SolveCache,
  rackTravel: number,
): RawChain {
  const issues: PoseIssue[] = [];
  const lbj = lowerPointAt(theta, ref.dims);
  const near = cache.valid && isFiniteVec(cache.prevUbj) ? cache.prevUbj : ref.ubjStatic;
  const upper = solveUpperJoint(lbj, ref.dims, near);
  const ubj = upper.ubj;
  if (!upper.ok) issues.push('upper-unreachable');

  const kpVec = sub(ubj, lbj);
  const kpLen = length(kpVec);
  const kingpin = kpLen < 1e-5 ? ref.kingpinUnit : scale(kpVec, 1 / kpLen);
  const align = alignQuat(ref.kingpinUnit, kingpin);
  const rotatedEye = quatRotate(align, ref.knuckleLocal.steerEye);
  const rackEnd = add(ref.rackEndBase, v3(rackTravel, 0, 0));
  const steer = solveSteer(lbj, kingpin, rotatedEye, ref.dims.tieRodLength, rackEnd, cache.phi);
  if (!steer.ok) issues.push('tie-unreachable');

  const quat = quatMul(quatFromAxisAngle(kingpin, steer.phi), align);
  const wheelCenter = add(lbj, quatRotate(quat, ref.knuckleLocal.wheelCenter));
  const wheelAxis = quatRotate(quat, v3(1, 0, 0));
  const wheelForward = quatRotate(quat, v3(0, 0, 1));
  const wheelUp = quatRotate(quat, v3(0, 1, 0));
  const shockLower = shockLowerPoint(theta, ref.dims);
  const shockLength = distance(RIG.shockTop, shockLower);
  if (!isFiniteVec(wheelCenter) || !Number.isFinite(shockLength)) issues.push('non-finite');

  cache.prevUbj = ubj;
  cache.phi = steer.phi;
  cache.theta = theta;
  cache.valid = issues.indexOf('non-finite') < 0;

  return {
    theta,
    lbj,
    ubj,
    kingpin,
    steer,
    quat,
    rackEnd,
    wheelCenter,
    wheelAxis,
    wheelForward,
    wheelUp,
    shockLower,
    shockLength,
    issues,
    residualKingpin: upper.residual,
    residualTie: steer.residual,
  };
}

/** Wheel-centre travel (mm) produced by an arm angle, relative to the design pose. */
export function wheelTravelAtTheta(ref: RigRef, theta: number, rackTravel = ref.travel.rackTravel): number {
  const scratch = newSolveCache();
  scratch.prevUbj = ref.ubjStatic;
  return solveChain(ref, theta, scratch, rackTravel).wheelCenter.y - ref.wheelCenterStatic.y;
}

/* ------------------------------------------------------------------ *
 * Travel inversion
 * ------------------------------------------------------------------ */

export const MIN_SWEEP_DEG = -40;
export const MAX_SWEEP_DEG = 40;

function clampSweep(theta: number): number {
  return clamp(theta, rad(MIN_SWEEP_DEG), rad(MAX_SWEEP_DEG));
}

/** Arithmetically exact arm-angle -> LBJ height (monotone in θ). */
function lbjTravelAt(theta: number, dims: SuspensionDims): number {
  return lowerPointAt(theta, dims).y - lowerPointAt(rad(dims.lowerStaticAngleDeg), dims).y;
}

/**
 * Bisect the monotone LBJ-height curve. This is ~20 cheap arithmetic steps and
 * gives us the bracket for the exact wheel-travel correction below.
 */
function bisectArmAngle(dims: SuspensionDims, targetLbj: number, bracket?: [number, number]): number {
  let lo = bracket ? bracket[0] : rad(MIN_SWEEP_DEG);
  let hi = bracket ? bracket[1] : rad(MAX_SWEEP_DEG);
  const tLo = lbjTravelAt(lo, dims);
  const tHi = lbjTravelAt(hi, dims);
  const decreasing = tLo > tHi;
  const loT = Math.min(tLo, tHi);
  const hiT = Math.max(tLo, tHi);
  const t = clamp(targetLbj, loT, hiT);
  if (!bracket) {
    // Pre-narrow the bracket around the answer with a coarse scan: 8 steps.
    const n = 16;
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i <= n; i++) {
      const th = rad(MIN_SWEEP_DEG) + (rad(MAX_SWEEP_DEG) - rad(MIN_SWEEP_DEG)) * (i / n);
      const d = Math.abs(lbjTravelAt(th, dims) - t);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    const step = (rad(MAX_SWEEP_DEG) - rad(MIN_SWEEP_DEG)) / n;
    lo = Math.max(rad(MIN_SWEEP_DEG), rad(MIN_SWEEP_DEG) + step * (bestI - 1));
    hi = Math.min(rad(MAX_SWEEP_DEG), rad(MIN_SWEEP_DEG) + step * (bestI + 1));
  }
  let theta = (lo + hi) * 0.5;
  for (let i = 0; i < 26; i++) {
    theta = (lo + hi) * 0.5;
    const tv = lbjTravelAt(theta, dims);
    if ((tv > t) === decreasing) lo = theta;
    else hi = theta;
  }
  return (lo + hi) * 0.5;
}

export interface TravelInverse {
  theta: number;
  /** wheel-centre travel actually reached (mm, relative to design pose) */
  reached: number;
  /** LBJ travel that corresponds to the requested wheel travel */
  lbjTravel: number;
  clamped: boolean;
}

/**
 * Invert wheel-centre travel -> arm angle.
 *
 * The arm angle is bisected on the exact analytic LBJ-height curve first, then
 * one correction step removes the (small) difference between LBJ height and
 * wheel-centre height caused by knuckle camber / steer. Two chain solves total,
 * so this is safe to call every frame.
 */
export function thetaForTravel(
  ref: RigRef,
  targetAbs: number,
  hint?: number,
  rackTravel = ref.travel.rackTravel,
): TravelInverse {
  const lbjMin = lbjTravelAt(rad(MIN_SWEEP_DEG), ref.dims);
  const lbjMax = lbjTravelAt(rad(MAX_SWEEP_DEG), ref.dims);
  const loT = Math.min(lbjMin, lbjMax);
  const hiT = Math.max(lbjMin, lbjMax);
  let target = targetAbs;
  let clamped = false;
  if (!Number.isFinite(target)) {
    target = 0;
    clamped = true;
  }
  if (target < loT) {
    target = loT;
    clamped = true;
  } else if (target > hiT) {
    target = hiT;
    clamped = true;
  }

  const scratch = newSolveCache();
  scratch.prevUbj = ref.ubjStatic;
  const wheelY = (theta: number) => {
    const ch = solveChain(ref, theta, scratch, rackTravel);
    return ch.wheelCenter.y - ref.wheelCenterStatic.y;
  };
  const bracketOf = (theta: number): [number, number] | undefined => {
    if (hint === undefined || !Number.isFinite(hint)) return undefined;
    const span = rad(8);
    const h = clampSweep(hint);
    return [clampSweep(h - span), clampSweep(h + span)];
  };

  // Wheel travel diverges from LBJ travel by the camber term; fold that back
  // into the LBJ target with one measured correction and re-bisect.
  let lbjTarget = target;
  let theta = bisectArmAngle(ref.dims, lbjTarget);
  let reachedWheel = wheelY(theta);
  for (let pass = 0; pass < 2; pass++) {
    const err = target - reachedWheel;
    if (Math.abs(err) < 1e-4) break;
    lbjTarget += err;
    theta = bisectArmAngle(ref.dims, clamp(lbjTarget, loT, hiT), bracketOf(theta));
    reachedWheel = wheelY(theta);
  }
  return { theta, reached: reachedWheel, lbjTravel: lbjTarget, clamped };
}

/* ------------------------------------------------------------------ *
 * Pose
 * ------------------------------------------------------------------ */

export interface SolveOptions {
  /** wheel travel relative to the preloaded static attitude (mm, +=bump) */
  travelRel?: number;
  /** direct arm angle override (rad), used by the drag interaction */
  theta?: number;
  rackTravel?: number;
}

function camberOf(axis: Vec3): number {
  return deg(Math.asin(clamp(-axis.y, -1, 1)));
}

function toeOf(forward: Vec3): number {
  return deg(Math.atan2(-forward.x, forward.z));
}

function dedupe<T>(list: T[]): T[] {
  return [...new Set(list)];
}

function clampAbsolute(ref: RigRef, tAbs: number): { t: number; clamped: boolean } {
  if (tAbs > ref.limitUp) return { t: ref.limitUp, clamped: true };
  if (tAbs < -ref.limitDown) return { t: -ref.limitDown, clamped: true };
  return { t: tAbs, clamped: false };
}

function makePose(
  ref: RigRef,
  chain: RawChain,
  requestedTravel: number,
  clamped: boolean,
): Pose {
  const issues: PoseIssue[] = [...chain.issues];
  if (clamped) issues.unshift('clamped');
  if (ref.availableBump < 1.5) issues.push('preload-exceeds-droop');

  const camber = camberOf(chain.wheelAxis);
  const toe = toeOf(chain.wheelForward);
  const kp = chain.kingpin;
  let kingpinGroundX = chain.lbj.x;
  if (Math.abs(kp.y) > 1e-4) {
    const t = (ref.groundY - chain.lbj.y) / kp.y;
    kingpinGroundX = chain.lbj.x + kp.x * t;
  }
  const compression = ref.springFreeLength - chain.shockLength;
  const shock: ShockState = {
    top: ref.shockTop,
    lower: chain.shockLower,
    length: chain.shockLength,
    motionRatio: ref.motionRatio,
    compression,
    freeLength: ref.springFreeLength,
    wheelRate: Math.abs(ref.motionRatio),
  };
  const tAbs = chain.wheelCenter.y - ref.wheelCenterStatic.y;
  return {
    requestedTravel,
    travel: tAbs - ref.preloadLift,
    lowerAngleDeg: deg(chain.theta),
    upperAngleDeg: deg(
      Math.atan2(-(chain.ubj.y - ref.upperPivot.y), chain.ubj.x - ref.upperPivot.x),
    ),
    steerDeg: deg(chain.steer.phi),
    lbj: chain.lbj,
    ubj: chain.ubj,
    kingpin: chain.kingpin,
    tieOuter: chain.steer.eye,
    rackEnd: chain.rackEnd,
    wheelCenter: chain.wheelCenter,
    wheelAxis: chain.wheelAxis,
    wheelForward: chain.wheelForward,
    wheelUp: chain.wheelUp,
    wheelQuat: chain.quat,
    camberDeg: camber,
    toeDeg: toe,
    halfTrack: chain.wheelCenter.x,
    scrubRadius: chain.wheelCenter.x - kingpinGroundX,
    rideHeight: chain.wheelCenter.y,
    shock,
    issues: dedupe(issues),
    residualKingpin: chain.residualKingpin,
    residualTieRod: chain.residualTie,
    residualStatic: 0,
  };
}

/**
 * Full pose solve — called on every animation frame while dragging. Returns a
 * complete immutable pose; the renderer never re-derives geometry itself.
 */
export function solvePose(ref: RigRef, options: SolveOptions, cache: SolveCache): Pose {
  const rackTravel = options.rackTravel ?? ref.travel.rackTravel;
  const requested = options.travelRel ?? 0;
  let theta: number;
  let clamped = false;

  if (typeof options.theta === 'number' && Number.isFinite(options.theta)) {
    theta = clampSweep(options.theta);
    const tAbs = (() => {
      const scratch = newSolveCache();
      scratch.prevUbj = cache.valid ? cache.prevUbj : ref.ubjStatic;
      scratch.phi = cache.phi;
      return solveChain(ref, theta, scratch, rackTravel).wheelCenter.y - ref.wheelCenterStatic.y;
    })();
    const c = clampAbsolute(ref, tAbs);
    if (c.clamped) {
      const inv = thetaForTravel(ref, c.t, theta, rackTravel);
      theta = inv.theta;
      clamped = true;
    }
  } else {
    const c = clampAbsolute(ref, ref.preloadLift + requested);
    clamped = c.clamped;
    const inv = thetaForTravel(ref, c.t, Number.isFinite(cache.theta) ? cache.theta : undefined, rackTravel);
    theta = inv.theta;
  }

  const chain = solveChain(ref, theta, cache, rackTravel);
  return makePose(ref, chain, requested, clamped);
}

/** Solve directly from an arm angle, without clamping to travel limits. */
export function solvePoseAtTheta(ref: RigRef, theta: number, rackTravel: number, cache: SolveCache): Pose {
  return makePose(ref, solveChain(ref, theta, cache, rackTravel), 0, false);
}

/* ------------------------------------------------------------------ *
 * Travel curve
 * ------------------------------------------------------------------ */

export function computeTravelCurve(ref: RigRef, samples = 97): TravelCurve {
  const cache = newSolveCache();
  cache.prevUbj = ref.ubjStatic;
  const list: TravelCurveSample[] = [];
  const tMin = -ref.limitDown;
  const tMax = ref.limitUp;
  let minTravel = Infinity;
  let maxTravel = -Infinity;
  const issues: PoseIssue[] = [];
  // Walk arm angle from bump to droop so the branch cache stays continuous.
  const thetaBump = thetaForTravel(ref, tMax).theta;
  const thetaDroop = thetaForTravel(ref, tMin).theta;
  for (let i = 0; i < samples; i++) {
    const f = i / (samples - 1);
    const theta = thetaBump + (thetaDroop - thetaBump) * f;
    const chain = solveChain(ref, theta, cache, ref.travel.rackTravel);
    const valid = chain.issues.length === 0;
    if (!valid) issues.push(...chain.issues);
    const travel = chain.wheelCenter.y - ref.wheelCenterStatic.y - ref.preloadLift;
    minTravel = Math.min(minTravel, travel);
    maxTravel = Math.max(maxTravel, travel);
    list.push({
      lowerAngleDeg: deg(theta),
      travel,
      camberDeg: camberOf(chain.wheelAxis),
      toeDeg: toeOf(chain.wheelForward),
      halfTrack: chain.wheelCenter.x,
      shockLength: chain.shockLength,
      valid,
    });
  }
  return {
    samples: list,
    minTravel,
    maxTravel,
    staticTravel: 0,
    effective: {
      up: ref.availableBump,
      down: ref.availableDroop,
      preloadShift: ref.preloadLift,
    },
    issues: dedupe(issues),
  };
}

/** Arm-angle range in degrees that the current travel limits allow. */
export function lowerAngleRange(ref: RigRef): { min: number; max: number } {
  return {
    min: deg(thetaForTravel(ref, -ref.limitDown).theta),
    max: deg(thetaForTravel(ref, ref.limitUp).theta),
  };
}

/** Arm angle (deg) at the preloaded static attitude. */
export function staticAngleDeg(ref: RigRef): number {
  return deg(thetaForTravel(ref, ref.preloadLift).theta);
}

export { quatRotate };
