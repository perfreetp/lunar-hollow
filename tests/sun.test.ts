import { describe, it, expect } from 'vitest';
import { sunDirection, lightRayDirection, isSunGrazing } from '../src/core/sun';

describe('sun geometry', () => {
  it('正午阳光沿幕墙法线方向（-z 指向太阳）', () => {
    const d = sunDirection({ hourAngleDeg: 0, altitudeDeg: 45 });
    expect(d.x).toBeCloseTo(0, 10);
    expect(d.y).toBeCloseTo(Math.SQRT1_2, 10);
    expect(d.z).toBeCloseTo(-Math.SQRT1_2, 10);
  });

  it('光线方向与太阳方向相反且为单位向量', () => {
    const sun = { hourAngleDeg: 35, altitudeDeg: 28 };
    const d = sunDirection(sun);
    const r = lightRayDirection(sun);
    expect(d.dot(r)).toBeCloseTo(-1, 10);
    expect(r.length()).toBeCloseTo(1, 10);
  });

  it('下午时角为正时太阳偏向 +x', () => {
    const d = sunDirection({ hourAngleDeg: 45, altitudeDeg: 30 });
    expect(d.x).toBeGreaterThan(0);
  });

  it('高度角 90° 时太阳在天顶，光线竖直向下', () => {
    const r = lightRayDirection({ hourAngleDeg: 0, altitudeDeg: 90 });
    expect(r.x).toBeCloseTo(0, 10);
    expect(r.y).toBeCloseTo(-1, 10);
    expect(r.z).toBeCloseTo(0, 10);
  });

  it('低高度角判定为贴地', () => {
    expect(isSunGrazing({ hourAngleDeg: 0, altitudeDeg: 1 })).toBe(true);
    expect(isSunGrazing({ hourAngleDeg: 0, altitudeDeg: 10 })).toBe(false);
  });
});
