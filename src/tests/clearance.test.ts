import { describe, expect, it } from 'vitest';
import { CHASSIS_BOXES, DEFAULT_DIMS, DEFAULT_TRAVEL, PRESETS, shockCollider } from '../core/rigSpec';
import { buildRigRef, newSolveCache, solvePose } from '../core/kinematics';
import { evaluateClearance, wheelShapeOf } from '../core/collision';

describe('clearance sampling', () => {
  it('reports contact against the arch in bump at the stance preset', () => {
    const preset = PRESETS.find((p) => p.id === 'stance')!;
    const dims = { ...DEFAULT_DIMS, ...preset.dims };
    const travel = { ...DEFAULT_TRAVEL, ...preset.travel };
    const ref = buildRigRef(dims, travel);
    const cache = newSolveCache();
    const pose = solvePose(ref, { travelRel: ref.availableBump }, cache);
    const wheel = wheelShapeOf(pose, dims);
    const report = evaluateClearance({
      wheel,
      colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
    });
    console.log('bump clearance', report.chassis.toFixed(2), 'contacts', report.contacts.length);
    expect(report.contacts.some((c) => c.targetLayer === 'chassis')).toBe(true);
  });

  it('is clear at the design attitude with the baseline preset', () => {
    const ref = buildRigRef(DEFAULT_DIMS, DEFAULT_TRAVEL);
    const pose = solvePose(ref, { travelRel: 0 }, newSolveCache());
    const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
    const report = evaluateClearance({
      wheel,
      colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
    });
    console.log('static clearance', report.chassis.toFixed(2), report.shock.toFixed(2));
    expect(report.chassis).toBeGreaterThan(1);
  });

  it('stays continuous across the whole travel sweep', () => {
    const ref = buildRigRef(DEFAULT_DIMS, DEFAULT_TRAVEL);
    const cache = newSolveCache();
    let prev = Infinity;
    const clearance: number[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = -ref.limitDown + ((ref.limitUp + ref.limitDown) * i) / 40;
      const pose = solvePose(ref, { travelRel: t }, cache);
      const wheel = wheelShapeOf(pose, DEFAULT_DIMS);
      const report = evaluateClearance({
        wheel,
        colliders: [...CHASSIS_BOXES, shockCollider(pose.shock.top, pose.shock.lower)],
        touchEps: 0.6,
      });
      clearance.push(report.chassis);
      expect(Number.isFinite(report.chassis)).toBe(true);
      // No teleporting: neighbouring frames differ by a small amount only.
      if (Number.isFinite(prev)) expect(Math.abs(report.chassis - prev)).toBeLessThan(26);
      prev = report.chassis;
    }
    const min = Math.min(...clearance);
    const max = Math.max(...clearance);
    console.log('clearance span', min.toFixed(1), '->', max.toFixed(1));
    expect(max - min).toBeGreaterThan(3);
  });
});
