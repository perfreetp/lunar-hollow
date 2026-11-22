import { describe, it, expect } from 'vitest';
import { FritPattern, type FritMask } from '../src/core/types';
import {
  maskField,
  maskFieldAA,
  maskRepeats,
  openFraction,
  fritSubApertures,
  type MaskRepeats,
} from '../src/core/fritMask';

const mask = (over: Partial<FritMask>): FritMask => ({
  pattern: FritPattern.Dot,
  coverage: 0.5,
  scale: 0.2,
  ...over,
});

// 2m × 2m 的分格，周期 0.2m → 两个方向各 10 个周期
const rep: MaskRepeats = maskRepeats(mask({}), 2, 2);

describe('frit mask', () => {
  it('世界尺度周期换算为格面内周期数', () => {
    expect(maskRepeats(mask({ scale: 0.5 }), 2, 1)).toEqual({ rx: 4, ry: 2 });
    // 周期大于格面时至少保留一个完整周期
    expect(maskRepeats(mask({ scale: 5 }), 2, 2)).toEqual({ rx: 1, ry: 1 });
  });

  it('透光面积占比 = 1 - 覆盖率，三种图案一致', () => {
    for (const pattern of [FritPattern.Dot, FritPattern.Stripe, FritPattern.Diamond]) {
      expect(openFraction(mask({ pattern, coverage: 0.3 }))).toBeCloseTo(0.7, 10);
      expect(openFraction(mask({ pattern, coverage: 0.8 }))).toBeCloseTo(0.2, 10);
    }
  });

  it('硬遮罩场只取 0/1', () => {
    const m = mask({});
    for (const [u, v] of [
      [0.1, 0.1],
      [0.5, 0.5],
      [0.83, 0.27],
      [0.33, 0.77],
    ]) {
      expect([0, 1]).toContain(maskField(m, u, v, rep));
    }
  });

  it('抗锯齿场始终在 [0,1] 且周期边界不越界', () => {
    for (const pattern of [FritPattern.Dot, FritPattern.Stripe, FritPattern.Diamond]) {
      const m = mask({ pattern });
      for (let i = 0; i <= 20; i++) {
        const v = maskFieldAA(m, i / 20, i / 20, rep);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('条纹图案在条带中部为不透明、间隙中部为透光', () => {
    const m = mask({ pattern: FritPattern.Stripe, coverage: 0.4, scale: 0.5 });
    const r = maskRepeats(m, 2, 2); // ry = 4
    // v=0.05 → fv=0.2，落在不透明条带 [0,0.4) 中部
    expect(maskField(m, 0.5, 0.05, r)).toBe(1);
    // v=0.7 → fv=0.8，落在透光间隙
    expect(maskField(m, 0.5, 0.7, r)).toBe(0);
  });

  it('子孔径全部位于归一化单位矩形内且为正面积', () => {
    const subs = fritSubApertures(mask({ coverage: 0.5 }), rep, 16);
    expect(subs.length).toBeGreaterThan(0);
    for (const s of subs) {
      expect(s.u0).toBeGreaterThanOrEqual(0);
      expect(s.v1).toBeLessThanOrEqual(1);
      expect(s.u1).toBeGreaterThan(s.u0);
      expect(s.v1).toBeGreaterThan(s.v0);
    }
  });

  it('覆盖率越高子孔径越少', () => {
    const few = fritSubApertures(mask({ coverage: 0.85 }), rep, 16).length;
    const many = fritSubApertures(mask({ coverage: 0.15 }), rep, 16).length;
    expect(many).toBeGreaterThan(few);
  });
});
