import { describe, it, expect } from 'vitest';
import { CoatingTint, FritPattern, GlassType, type GlassCell } from '../src/core/types';
import {
  bodyTransmittance,
  effectiveCellTransmittance,
  stackTransmittance,
  stackTint,
  COATING_TINTS,
} from '../src/core/optics';

const cell = (over: Partial<GlassCell>): GlassCell => ({
  type: GlassType.Clear,
  transmittance: 0.5,
  tint: CoatingTint.Neutral,
  frit: { pattern: FritPattern.Dot, coverage: 0.5, scale: 0.15 },
  ...over,
});

describe('optics', () => {
  it('透明玻璃有效透射等于设定值', () => {
    expect(effectiveCellTransmittance(cell({ transmittance: 0.72 }))).toBeCloseTo(0.72, 10);
  });

  it('镀膜玻璃带固定中性衰减', () => {
    const tau = bodyTransmittance(cell({ type: GlassType.Coated, transmittance: 0.6 }));
    expect(tau).toBeCloseTo(0.6 * 0.85, 10);
  });

  it('彩釉玻璃再乘遮罩开孔率', () => {
    const c = cell({
      type: GlassType.Fritted,
      transmittance: 0.8,
      frit: { pattern: FritPattern.Stripe, coverage: 0.25, scale: 0.2 },
    });
    expect(effectiveCellTransmittance(c)).toBeCloseTo(0.8 * 0.75, 10);
  });

  it('多层叠加按能量乘积累积', () => {
    const a = cell({ transmittance: 0.5 });
    const b = cell({ transmittance: 0.4 });
    expect(stackTransmittance([a, b])).toBeCloseTo(0.2, 10);
    expect(stackTransmittance([a, b, a])).toBeCloseTo(0.1, 10);
  });

  it('空层列表的透射为 1（无光路损失）', () => {
    expect(stackTransmittance([])).toBe(1);
  });

  it('镀膜色偏沿光路相乘，无镀膜为白光', () => {
    expect(stackTint([cell({})])).toEqual([1, 1, 1]);
    const blue = cell({ type: GlassType.Coated, tint: CoatingTint.Blue });
    const t = stackTint([blue, blue]);
    const ref = COATING_TINTS[CoatingTint.Blue].rgb;
    expect(t).toEqual([ref[0] ** 2, ref[1] ** 2, ref[2] ** 2]);
  });
});
