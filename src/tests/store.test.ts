import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLabStore } from '../stores/lab';
import { DEFAULT_DIMS, DEFAULT_TRAVEL, PART_INFO } from '../core/rigSpec';
import { parseConfig } from '../core/config';

const rough = () => {
  const store = useLabStore();
  store.resetAll();
  return store;
};

describe('lab store — assembly', () => {
  let store: ReturnType<typeof rough>;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = rough();
  });

  it('starts fully assembled', () => {
    expect(store.assembly.order).toEqual(['lowerArm', 'upperArm', 'knuckle', 'tieRod']);
    expect(store.assemblyComplete).toBe(true);
    for (const part of store.assembly.order) {
      expect(store.assembly.connections[part]?.dropDeviation).toBe(0);
    }
  });

  it('only allows a part once its prerequisites exist', () => {
    store.clearAssembly();
    expect(store.canInstall('lowerArm')).toBe(true);
    expect(store.canInstall('upperArm')).toBe(false);
    expect(store.canInstall('knuckle')).toBe(false);
    expect(store.canInstall('tieRod')).toBe(false);

    store.attachPart('lowerArm', 0, false);
    expect(store.canInstall('upperArm')).toBe(true);
    expect(store.canInstall('knuckle')).toBe(false);

    store.attachPart('upperArm', 0, false);
    store.attachPart('knuckle', 0, false);
    expect(store.canInstall('tieRod')).toBe(true);
  });

  it('removes dependants when a parent is detached', () => {
    store.detachPart('upperArm');
    expect(store.assembly.order).toEqual(['lowerArm']);
    expect(store.assembly.connections.knuckle).toBeUndefined();
  });

  it('keeps the canonical order however parts are attached', () => {
    store.clearAssembly();
    store.attachPart('lowerArm', 0, false);
    store.attachPart('upperArm', 0, false);
    store.attachPart('knuckle', 0, false);
    store.attachPart('tieRod', 0, false);
    expect(store.assembly.order).toEqual(['lowerArm', 'upperArm', 'knuckle', 'tieRod']);
  });

  it('records deviation and flags it against the tolerance', () => {
    store.setTolerance(6);
    store.detachPart('tieRod');
    store.attachPart('tieRod', 12.5, true);
    const conn = store.assembly.connections.tieRod!;
    expect(conn.dropDeviation).toBe(12.5);
    expect(conn.forced).toBe(true);
    const issue = store.connectionIssues.find((i) => i.part === 'tieRod');
    expect(issue?.level).toBe('ok');
    expect(issue?.message).toMatch(/已强制固定/);

    store.detachPart('tieRod');
    store.attachPart('tieRod', 12.5, false);
    const issue2 = store.connectionIssues.find((i) => i.part === 'tieRod');
    expect(issue2?.level).toBe('warn');
  });

  it('exposes the next socket to fill', () => {
    store.clearAssembly();
    expect(store.nextSocket?.accepts).toBe('lowerArm');
    store.attachPart('lowerArm', 0, false);
    expect(store.nextSocket?.accepts).toBe('upperArm');
  });

  it('resets tolerances and connections', () => {
    store.setTolerance(22);
    store.detachPart('knuckle');
    store.resetAssembly();
    expect(store.assembly.order).toHaveLength(4);
    expect(store.assembly.toleranceMm).toBe(22);
    expect(store.assembly.connections.knuckle?.dropDeviation).toBe(0);
  });

  it('is resilient to repeated attach calls', () => {
    store.attachPart('knuckle', 1, false);
    store.attachPart('knuckle', 2, false);
    expect(store.assembly.order.filter((p) => p === 'knuckle')).toHaveLength(1);
    expect(store.assembly.connections.knuckle?.dropDeviation).toBe(2);
  });
});

describe('lab store — travel and linkage', () => {
  let store: ReturnType<typeof rough>;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = rough();
  });

  it('recomputes wheel position and inclination when travel changes', () => {
    store.setPreviewTravel(0);
    const neutral = store.recomputePose();
    store.setPreviewTravel(20);
    const bump = store.recomputePose();
    expect(bump.wheelCenter.y).toBeGreaterThan(neutral.wheelCenter.y + 8);
    expect(bump.camberDeg).toBeLessThan(neutral.camberDeg - 0.5);
    expect(bump.halfTrack).not.toBeCloseTo(neutral.halfTrack, 2);
  });

  it('recomputes the whole chain when any arm length changes', () => {
    const before = store.recomputePose();
    for (const key of ['lowerArmLength', 'upperArmLength', 'tieRodLength', 'kingpinLength'] as const) {
      const start = store.recomputePose();
      store.setDim(key, store.dims[key] + 6);
      const after = store.recomputePose();
      expect(after.wheelCenter.y).not.toBe(start.wheelCenter.y);
      expect(after.lowerAngleDeg).not.toBe(start.lowerAngleDeg);
      store.setDim(key, DEFAULT_DIMS[key]);
    }
    const restored = store.recomputePose();
    expect(restored.wheelCenter.y).toBeCloseTo(before.wheelCenter.y, 6);
  });

  it('applies preload as a static lift and trims available bump', () => {
    store.setDim('lowerArmLength', DEFAULT_DIMS.lowerArmLength);
    store.applyTravel({ up: 30, down: 30, preload: 0 });
    const noPreload = store.travelBounds.bump;
    store.applyTravel({ preload: 10 });
    expect(store.travelBounds.bump).toBeLessThan(noPreload - 3);
    expect(store.travelBounds.droop).toBeGreaterThan(30);
  });

  it('clamps preview travel to the usable range', () => {
    store.applyTravel({ up: 20, down: 20, preload: 2 });
    store.setPreviewTravel(999);
    expect(store.previewTravel).toBeLessThanOrEqual(store.travelBounds.bump + 0.01);
    store.setPreviewTravel(-999);
    expect(store.previewTravel).toBeGreaterThanOrEqual(-store.travelBounds.droop - 0.01);
  });

  it('pins the arm angle inside the travel window and converts back on release', () => {
    store.setArmAngle(12);
    const pinned = store.recomputePose();
    expect(pinned.lowerAngleDeg).toBeCloseTo(12, 4);
    expect(pinned.issues).not.toContain('clamped');
    store.releaseArm();
    expect(store.pinArm).toBe(false);
    expect(store.previewTravel).toBeCloseTo(pinned.travel, 1);
  });

  it('clamps a pinned angle outside the bump-stop window', () => {
    store.setArmAngle(-30);
    const pose = store.recomputePose();
    expect(pose.issues).toContain('clamped');
    expect(pose.lowerAngleDeg).toBeGreaterThan(-30);
    expect(store.travelBounds.bump + 15).toBeGreaterThan(10);
  });

  it('produces an updated travel curve on geometry change', () => {
    const first = store.curve;
    const firstCamber = first.samples[Math.floor(first.samples.length / 2)].camberDeg;
    store.setDim('lowerArmLength', 120);
    store.recomputePose();
    const second = store.curve;
    const secondCamber = second.samples[Math.floor(second.samples.length / 2)].camberDeg;
    expect(secondCamber).not.toBeCloseTo(firstCamber, 2);
    expect(second.samples.length).toBeGreaterThan(40);
  });

  it('steps travel with the keyboard action', () => {
    store.setPreviewTravel(0);
    store.stepTravel(3);
    expect(store.previewTravel).toBe(3);
    store.stepTravel(-5);
    expect(store.previewTravel).toBe(-2);
  });

  it('keeps the signature stable for identical geometry and updates on change', () => {
    const a = store.signature;
    store.setDim('lowerArmLength', DEFAULT_DIMS.lowerArmLength + 1);
    expect(store.signature).not.toBe(a);
    store.setDim('lowerArmLength', DEFAULT_DIMS.lowerArmLength);
    expect(store.signature).toBe(a);
  });
});

describe('lab store — render settings', () => {
  let store: ReturnType<typeof rough>;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = rough();
  });

  it('reorders layers and refuses unknown ids', () => {
    expect(store.render.layerOrder).toEqual(['chassis', 'shock', 'wheel']);
    store.moveLayer('wheel', -1);
    expect(store.render.layerOrder).toEqual(['chassis', 'wheel', 'shock']);
    store.moveLayer('wheel', -1);
    expect(store.render.layerOrder).toEqual(['wheel', 'chassis', 'shock']);
    store.moveLayer('wheel', -1); // already first: no-op
    expect(store.render.layerOrder).toEqual(['wheel', 'chassis', 'shock']);
    store.reorderLayers(['shock', 'bogus', 'shock', 'chassis', 'wheel'] as any);
    expect(store.render.layerOrder).toEqual(['shock', 'chassis', 'wheel']);
  });

  it('always contains every layer exactly once', () => {
    store.reorderLayers(['wheel']);
    expect([...store.render.layerOrder].sort()).toEqual(['chassis', 'shock', 'wheel']);
  });

  it('toggles part visibility without touching the model', () => {
    const before = store.signature;
    store.setVisible('wheel', false);
    expect(store.visible.wheel).toBe(false);
    expect(store.signature).toBe(before);
  });
});

describe('lab store — config io', () => {
  let store: ReturnType<typeof rough>;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = rough();
  });

  it('exports a complete config', () => {
    store.meta.title = '测试方案';
    const config = store.buildConfig();
    expect(config.dims.lowerArmLength).toBe(DEFAULT_DIMS.lowerArmLength);
    expect(config.travel).toEqual({ ...DEFAULT_TRAVEL });
    expect(config.assembly.order).toHaveLength(4);
    expect(config.meta.title).toBe('测试方案');
    expect(config.meta.signature).toBe(store.signature);
  });

  it('imports values and rebuilds the assembly', () => {
    const config = store.buildConfig();
    const text = JSON.stringify({
      ...config,
      dims: { ...config.dims, lowerArmLength: 118, wheelRadius: 70 },
      travel: { ...config.travel, up: 12, down: 14, preload: 2 },
      assembly: {
        order: ['lowerArm', 'upperArm'],
        toleranceMm: 4,
        connections: {
          lowerArm: { part: 'lowerArm', socket: 'lowerPivot', dropDeviation: 1.5, forced: false, pinnedAt: 0 },
          upperArm: { part: 'upperArm', socket: 'upperPivot', dropDeviation: 2.5, forced: false, pinnedAt: 0 },
        },
      },
    });
    const ok = store.importConfigText(text);
    expect(ok).toBe(true);
    expect(store.dims.lowerArmLength).toBe(118);
    expect(store.dims.wheelRadius).toBe(70);
    expect(store.travel.up).toBe(12);
    expect(store.assembly.order).toEqual(['lowerArm', 'upperArm']);
    expect(store.assembly.toleranceMm).toBe(4);
    expect(store.assembly.connections.knuckle).toBeUndefined();
    expect(store.assemblyComplete).toBe(false);
  });

  it('surfaces parse errors without clobbering state', () => {
    const before = store.buildConfig();
    const ok = store.importConfigText('not json at all');
    expect(ok).toBe(false);
    expect(store.buildConfig().dims).toEqual(before.dims);
    expect(store.messages.some((m) => m.level === 'error')).toBe(true);
  });

  it('warns on an incomplete assembly and on over-tolerance joints', () => {
    const config = store.buildConfig();
    const raw = JSON.parse(JSON.stringify(config));
    raw.assembly.order = ['lowerArm'];
    raw.assembly.connections = {
      lowerArm: { part: 'lowerArm', socket: 'lowerPivot', dropDeviation: 20, forced: false, pinnedAt: 0 },
    };
    const result = parseConfig(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    const codes = result.messages.map((m) => m.code);
    expect(codes).toContain('assembly');
    expect(codes).toContain('deviation');
  });

  it('resets everything', () => {
    store.setDim('lowerArmLength', 130);
    store.applyTravel({ up: 5 });
    store.moveLayer('wheel', -1);
    store.resetAll();
    expect(store.dims).toEqual({ ...DEFAULT_DIMS });
    expect(store.travel).toEqual({ ...DEFAULT_TRAVEL });
    expect(store.render.layerOrder).toEqual(['chassis', 'shock', 'wheel']);
    expect(store.assemblyComplete).toBe(true);
  });

  it('applies presets fully', () => {
    store.applyPreset('longtravel');
    expect(store.dims.lowerArmLength).toBeGreaterThan(DEFAULT_DIMS.lowerArmLength);
    expect(store.travel.up).toBeGreaterThan(DEFAULT_TRAVEL.up);
    expect(store.previewTravel).toBe(0);
  });

  it('keeps signed steering-arm offsets when a preset is applied', () => {
    // Regression: a single global clamp range used to rewrite -30 into 20, which
    // flipped the steering arm to the wrong side and produced ~80° of toe.
    store.applyPreset('stance');
    expect(store.dims.steerArmLongitudinal).toBe(-26);
    expect(Math.abs(store.recomputePose().toeDeg)).toBeLessThan(6);
  });

  it('clamps each dimension to its own declared range', () => {
    store.setDim('steerArmLongitudinal', -999);
    expect(store.dims.steerArmLongitudinal).toBe(-70);
    store.setDim('steerArmLateral', -999);
    expect(store.dims.steerArmLateral).toBe(-20);
    store.setDim('wheelRadius', 9999);
    expect(store.dims.wheelRadius).toBe(86);
    store.setDim('lowerArmLength', 9999);
    expect(store.dims.lowerArmLength).toBe(132);
  });

  it('reports a sane toe/camber envelope across every preset', () => {
    for (const preset of ['baseline', 'longtravel', 'stance']) {
      store.applyPreset(preset);
      const pose = store.recomputePose();
      expect(Math.abs(pose.toeDeg)).toBeLessThan(8);
      expect(Math.abs(pose.camberDeg)).toBeLessThan(12);
      expect(pose.issues).toEqual([]);
    }
  });
});
