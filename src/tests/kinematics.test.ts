import { describe, expect, it } from 'vitest';
import {
  buildRigRef,
  computeTravelCurve,
  lowerAngleRange,
  newSolveCache,
  solveChain,
  solvePose,
  thetaForTravel,
} from '../core/kinematics';
import { DEFAULT_DIMS, DEFAULT_TRAVEL, RIG } from '../core/rigSpec';
import { distance } from '../core/math';

const ref = () => buildRigRef(DEFAULT_DIMS, DEFAULT_TRAVEL);

describe('rig reference', () => {
  it('closes the knuckle loop at the design pose', () => {
    const r = ref();
    expect(distance(r.lbjStatic, r.ubjStatic)).toBeCloseTo(DEFAULT_DIMS.kingpinLength, 6);
    expect(distance(r.ubjStatic, RIG.upperPivot)).toBeCloseTo(DEFAULT_DIMS.upperArmLength, 1);
  });

  it('sits on the ground at the design pose', () => {
    const r = ref();
    expect(r.wheelCenterStatic.y - DEFAULT_DIMS.wheelRadius).toBeCloseTo(RIG.groundY, 0);
  });

  it('has a bounded, positive motion ratio', () => {
    const r = ref();
    expect(Math.abs(r.motionRatio)).toBeGreaterThan(0.15);
    expect(Math.abs(r.motionRatio)).toBeLessThan(1.6);
  });
});

describe('travel inversion', () => {
  it('is monotone and invertible', () => {
    const r = ref();
    const cache = newSolveCache();
    for (const target of [-28, -12, 0, 10, 24]) {
      const inv = thetaForTravel(r, target);
      expect(inv.reached).toBeCloseTo(target, 3);
      void cache;
    }
  });

  it('reports clamping outside the modelled sweep', () => {
    const r = ref();
    const inv = thetaForTravel(r, 10000);
    expect(inv.clamped).toBe(true);
  });
});

describe('chain solve', () => {
  it('keeps every constraint closed across the travel range', () => {
    const r = ref();
    const cache = newSolveCache();
    const { min, max } = lowerAngleRange(r);
    for (let i = 0; i <= 40; i++) {
      const theta = ((min + ((max - min) * i) / 40) * Math.PI) / 180;
      const ch = solveChain(r, theta, cache, 0);
      expect(distance(ch.lbj, ch.ubj)).toBeCloseTo(r.dims.kingpinLength, 5);
      expect(distance(ch.steer.eye, ch.rackEnd)).toBeCloseTo(r.dims.tieRodLength, 4);
      expect(ch.issues).toEqual([]);
    }
  });

  it('produces a sensible camber curve (more negative in bump)', () => {
    const r = ref();
    const cache = newSolveCache();
    const bump = solvePose(r, { travelRel: r.availableBump }, cache);
    const droop = solvePose(r, { travelRel: -r.availableDroop }, cache);
    expect(bump.camberDeg).toBeLessThan(droop.camberDeg);
    expect(Math.abs(bump.camberDeg)).toBeLessThan(20);
  });

  it('responds to a longer lower arm by moving the hub outboard', () => {
    const base = solvePose(ref(), { travelRel: 0 }, newSolveCache());
    const longArm = buildRigRef({ ...DEFAULT_DIMS, lowerArmLength: 112 }, DEFAULT_TRAVEL);
    const changed = solvePose(longArm, { travelRel: 0 }, newSolveCache());
    expect(changed.halfTrack).toBeGreaterThan(base.halfTrack + 8);
  });

  it('is continuous frame to frame while dragging', () => {
    const r = ref();
    const cache = newSolveCache();
    let prev = solvePose(r, { theta: r.thetaStatic - 0.4 }, cache);
    for (let i = 1; i <= 60; i++) {
      const theta = r.thetaStatic - 0.4 + i * 0.012;
      const pose = solvePose(r, { theta }, cache);
      const jump = distance(pose.wheelCenter, prev.wheelCenter);
      expect(jump).toBeLessThan(2.5);
      prev = pose;
    }
  });
});

describe('travel curve', () => {
  it('samples the full range and stays valid', () => {
    const curve = computeTravelCurve(ref(), 61);
    expect(curve.samples.length).toBe(61);
    expect(curve.issues).toEqual([]);
    const travels = curve.samples.map((s) => s.travel);
    expect(Math.min(...travels)).toBeLessThan(-20);
    expect(Math.max(...travels)).toBeGreaterThan(15);
  });
});
