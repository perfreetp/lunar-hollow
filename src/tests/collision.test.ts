import { describe, expect, it } from 'vitest';
import {
  capsuleSdf,
  boxSdf,
  evaluateClearance,
  evaluateOcclusion,
  rayBox,
  rayCapsule,
  raySphere,
  renderingGroupsFor,
  tireSdf,
  wheelProbes,
  wheelShapeOf,
  zOffsetsFor,
} from '../core/collision';
import { DEFAULT_DIMS, DEFAULT_TRAVEL, CHASSIS_BOXES, shockCollider } from '../core/rigSpec';
import { buildRigRef, newSolveCache, solvePose } from '../core/kinematics';
import { v3 } from '../core/math';

const poseAt = (travelRel = 0) =>
  solvePose(buildRigRef(DEFAULT_DIMS, DEFAULT_TRAVEL), { travelRel }, newSolveCache());

describe('primitive distance fields', () => {
  it('box sdf is negative inside and exact outside', () => {
    const box = { id: 'b', label: 'b', kind: 'chassis' as const, center: v3(0, 0, 0), half: v3(10, 10, 10) };
    expect(boxSdf(box, v3(0, 0, 0))).toBeCloseTo(-10, 5);
    expect(boxSdf(box, v3(15, 0, 0))).toBeCloseTo(5, 5);
    expect(boxSdf(box, v3(13, 14, 0))).toBeCloseTo(5, 5);
  });

  it('respects a Z rotation', () => {
    const box = {
      id: 'r',
      label: 'r',
      kind: 'chassis' as const,
      center: v3(0, 0, 0),
      half: v3(20, 2, 5),
      rotZ: 90,
    };
    // Rotated 90°, the 20 mm half-extent now runs along Y and the 2 mm one along X.
    expect(boxSdf(box, v3(0, 15, 0))).toBeCloseTo(-2, 5);
    expect(boxSdf(box, v3(0, 25, 0))).toBeCloseTo(5, 5);
    expect(boxSdf(box, v3(15, 0, 0))).toBeCloseTo(13, 5);
  });

  it('capsule sdf follows the segment', () => {
    const cap = { id: 'c', label: 'c', kind: 'shock' as const, a: v3(0, 0, 0), b: v3(0, 30, 0), radius: 4 };
    expect(capsuleSdf(cap, v3(0, 15, 0))).toBeCloseTo(-4, 5);
    expect(capsuleSdf(cap, v3(0, 15, 10))).toBeCloseTo(6, 5);
    expect(capsuleSdf(cap, v3(0, 36, 0))).toBeCloseTo(2, 5);
  });

  it('tire sdf is zero on the tread surface', () => {
    const pose = poseAt(0);
    const w = wheelShapeOf(pose, DEFAULT_DIMS);
    const tread = { x: w.center.x, y: w.center.y + w.radius, z: w.center.z };
    expect(tireSdf(w, tread)).toBeCloseTo(0, 1);
    // The innermost point of a tyre is its axial centre, so the depth there is
    // the half-width, not the radius.
    expect(tireSdf(w, w.center)).toBeCloseTo(-(w.halfWidth - w.edge + w.edge), 3);
  });
});

describe('wheel probes', () => {
  it('samples cover both sidewalls and the tread', () => {
    const w = wheelShapeOf(poseAt(0), DEFAULT_DIMS);
    const pts = wheelProbes(w, 16);
    expect(pts.length).toBeGreaterThan(200);
    const radial = pts.map((p) => Math.hypot(p.x - w.center.x, p.y - w.center.y));
    expect(Math.max(...radial)).toBeGreaterThan(w.radius - 1);
    const axial = pts.map((p) => Math.abs(p.z - w.center.z));
    expect(Math.max(...axial)).toBeGreaterThan(w.halfWidth - 1);
  });
});

describe('clearance report', () => {
  it('flags an overlap with the arch when the wheel is forced up', () => {
    const pose = solvePose(
      buildRigRef(DEFAULT_DIMS, { ...DEFAULT_TRAVEL, up: 90, preload: 0 }),
      { travelRel: 70 },
      newSolveCache(),
    );
    const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
    const report = evaluateClearance({
      wheel,
      colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
    });
    expect(report.chassis).toBeLessThan(0);
    expect(report.contacts[0].targetLayer).toBe('chassis');
    expect(report.minDepth).toBeGreaterThan(1);
  });

  it('is clean at the design attitude', () => {
    const pose = poseAt(0);
    const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
    const report = evaluateClearance({
      wheel,
      colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
    });
    expect(report.chassis).toBeGreaterThan(0);
    expect(report.contacts).toHaveLength(0);
  });

  it('never reports non-finite values across a drag sweep', () => {
    const ref = buildRigRef(DEFAULT_DIMS, DEFAULT_TRAVEL);
    const cache = newSolveCache();
    for (let i = 0; i <= 24; i++) {
      const pose = solvePose(ref, { travelRel: -28 + i * 2.2 }, cache);
      const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
      const report = evaluateClearance({
        wheel,
        colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
      });
      expect(Number.isFinite(report.chassis)).toBe(true);
      expect(Number.isFinite(report.shock)).toBe(true);
      for (const c of report.contacts) expect(Number.isFinite(c.depth)).toBe(true);
    }
  });
});

describe('ray casts', () => {
  it('ray/sphere hits the near surface', () => {
    expect(raySphere(v3(-10, 0, 0), v3(1, 0, 0), v3(0, 0, 0), 2)).toBeCloseTo(8, 6);
    expect(raySphere(v3(-10, 5, 0), v3(1, 0, 0), v3(0, 0, 0), 2)).toBeNull();
  });

  it('ray/box enters at the near face', () => {
    const box = { id: 'b', label: 'b', kind: 'chassis' as const, center: v3(0, 0, 0), half: v3(5, 5, 5) };
    expect(rayBox(v3(-20, 0, 0), v3(1, 0, 0), box)).toBeCloseTo(15, 6);
    expect(rayBox(v3(-20, 20, 0), v3(1, 0, 0), box)).toBeNull();
  });

  it('ray/capsule matches sphere on the axis and cylinder on the flank', () => {
    const cap = { id: 'c', label: 'c', kind: 'shock' as const, a: v3(0, 0, 0), b: v3(0, 40, 0), radius: 5 };
    expect(rayCapsule(v3(-20, 20, 0), v3(1, 0, 0), cap)).toBeCloseTo(15, 6);
    expect(rayCapsule(v3(0, -20, 0), v3(0, 1, 0), cap)).toBeCloseTo(15, 6);
  });
});

describe('occlusion sampling', () => {
  it('finds hidden and visible points and stays bounded', () => {
    const pose = poseAt(0);
    const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
    const shock = shockCollider(pose.shock.top, pose.shock.lower);
    const report = evaluateOcclusion({
      camera: v3(600, 300, 400),
      wheel,
      shock,
      chassis: CHASSIS_BOXES,
      frame: 7,
    });
    expect(report.frame).toBe(7);
    expect(report.points.length).toBeGreaterThan(40);
    expect(report.ratio).toBeGreaterThanOrEqual(0);
    expect(report.ratio).toBeLessThanOrEqual(1);
    expect(report.byGroup.wheel.total).toBeGreaterThan(0);
    expect(report.byGroup.shock.total).toBeGreaterThan(0);
    // Seen from outboard the wheel is unobstructed; the inboard shock is not.
    expect(report.byGroup.wheel.hidden).toBe(0);

    const inside = evaluateOcclusion({
      camera: v3(-400, 260, -300),
      wheel,
      shock,
      chassis: CHASSIS_BOXES,
      frame: 8,
    });
    // From behind the tub the chassis must hide part of the wheel.
    expect(inside.byGroup.wheel.hidden).toBeGreaterThan(0);
  });

  it('changes when the camera moves', () => {
    const pose = poseAt(0);
    const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
    const shock = shockCollider(pose.shock.top, pose.shock.lower);
    const a = evaluateOcclusion({ camera: v3(600, 300, 400), wheel, shock, chassis: CHASSIS_BOXES, frame: 1 });
    const b = evaluateOcclusion({ camera: v3(-600, 300, -400), wheel, shock, chassis: CHASSIS_BOXES, frame: 1 });
    expect(a.byGroup.wheel.hidden).not.toBe(b.byGroup.wheel.hidden);
  });
});

describe('layer ordering', () => {
  it('assigns increasing render groups and decreasing z offsets', () => {
    const order = ['chassis', 'shock', 'wheel'] as const;
    const groups = renderingGroupsFor([...order]);
    expect(groups.chassis).toBeLessThan(groups.shock);
    expect(groups.shock).toBeLessThan(groups.wheel);
    const z = zOffsetsFor([...order]);
    expect(z.chassis).toBeGreaterThan(z.wheel);
  });

  it('handles a permuted order', () => {
    const groups = renderingGroupsFor(['wheel', 'chassis', 'shock']);
    expect(groups.wheel).toBe(1);
    expect(groups.chassis).toBe(2);
    expect(groups.shock).toBe(3);
  });
});
