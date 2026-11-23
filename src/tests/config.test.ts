import { describe, expect, it } from 'vitest';
import {
  configFileName,
  makeConfig,
  normalizeAssembly,
  normalizeDims,
  normalizeTravel,
  parseConfig,
  serializeConfig,
  signConfig,
} from '../core/config';
import { DEFAULT_DIMS, DEFAULT_TRAVEL, initialAssembly } from '../core/rigSpec';

const base = () =>
  makeConfig({
    dims: { ...DEFAULT_DIMS },
    travel: { ...DEFAULT_TRAVEL },
    assembly: initialAssembly(9),
    layerOrder: ['chassis', 'shock', 'wheel'],
    now: new Date('2026-01-02T03:04:05Z'),
  });

describe('config export', () => {
  it('serialises all four required payload groups', () => {
    const json = JSON.parse(serializeConfig(base()));
    expect(json.format).toBe('rc-suspension-lab');
    expect(json.version).toBe(1);
    expect(json.units).toBe('mm');
    expect(Object.keys(json.dims)).toHaveLength(11);
    expect(Object.keys(json.travel)).toEqual(
      expect.arrayContaining(['up', 'down', 'preload', 'rackTravel']),
    );
    expect(json.assembly.order).toEqual(['lowerArm', 'upperArm', 'knuckle', 'tieRod']);
    expect(json.assembly.connections.knuckle.socket).toBe('knuckleSeat');
    expect(json.meta.signature).toMatch(/^rcs-[0-9a-z]{7}$/);
  });

  it('signature is stable and changes with geometry', () => {
    const a = base();
    const b = base();
    expect(a.meta.signature).toBe(b.meta.signature);
    const changed = makeConfig({
      dims: { ...DEFAULT_DIMS, lowerArmLength: 100 },
      travel: { ...DEFAULT_TRAVEL },
      assembly: initialAssembly(9),
      layerOrder: ['chassis', 'shock', 'wheel'],
    });
    expect(changed.meta.signature).not.toBe(a.meta.signature);
  });

  it('round-trips through parse', () => {
    const original = base();
    const result = parseConfig(serializeConfig(original));
    expect(result.ok).toBe(true);
    expect(result.config!.dims).toEqual(original.dims);
    expect(result.config!.travel).toEqual(original.travel);
    expect(result.config!.assembly.order).toEqual(original.assembly.order);
    expect(result.config!.meta.signature).toBe(original.meta.signature);
    expect(result.messages.filter((m) => m.level === 'error')).toHaveLength(0);
  });

  it('reports signature tampering but still loads', () => {
    const original = base();
    const raw = JSON.parse(serializeConfig(original));
    raw.dims.lowerArmLength = 140;
    const result = parseConfig(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    expect(result.config!.dims.lowerArmLength).toBe(140);
    expect(result.messages.some((m) => m.code === 'signature')).toBe(true);
  });

  it('rejects malformed json with a readable message', () => {
    const result = parseConfig('{oops');
    expect(result.ok).toBe(false);
    expect(result.messages[0].level).toBe('error');
  });

  it('clamps out-of-range and unknown values', () => {
    const dims = normalizeDims({ lowerArmLength: 9999, upperArmLength: -40, wheelRadius: NaN } as any);
    expect(dims.lowerArmLength).toBe(160);
    expect(dims.upperArmLength).toBe(30);
    expect(dims.wheelRadius).toBe(DEFAULT_DIMS.wheelRadius);

    const travel = normalizeTravel({ up: -5, down: 400 } as any);
    expect(travel.up).toBe(0);
    expect(travel.down).toBe(90);
  });

  it('drops connections whose socket does not accept the part', () => {
    const asm = normalizeAssembly({
      order: ['lowerArm', 'knuckle'],
      toleranceMm: 9,
      connections: {
        lowerArm: { part: 'lowerArm', socket: 'lowerPivot', dropDeviation: 1, forced: false, pinnedAt: 0 },
        knuckle: { part: 'knuckle', socket: 'rackEnd', dropDeviation: 2, forced: false, pinnedAt: 0 },
      },
    });
    expect(asm.order).toEqual(['lowerArm']);
  });

  it('builds a filesystem-safe filename', () => {
    const cfg = base();
    const name = configFileName(cfg);
    expect(name).toMatch(/\.rcs\.json$/);
    expect(name).not.toMatch(/[\/:*?"<>|]/);
  });
});
