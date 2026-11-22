import { describe, it, expect } from 'vitest';
import { clipPolygonRect, projectAperture } from '../src/core/projection';
import { HitSurface } from '../src/core/types';

const room = { depth: 10, halfWidth: 5 };
const height = 6;

describe('polygon clipping', () => {
  it('矩形完全在裁剪框内时保持不变', () => {
    const poly: [number, number][] = [
      [1, 1],
      [2, 1],
      [2, 2],
      [1, 2],
    ];
    const out = clipPolygonRect(poly, { uMin: 0, uMax: 5, vMin: 0, vMax: 5 });
    expect(out).toHaveLength(4);
  });

  it('超出右边界的矩形被裁成贴边多边形', () => {
    const poly: [number, number][] = [
      [4, 1],
      [8, 1],
      [8, 2],
      [4, 2],
    ];
    const out = clipPolygonRect(poly, { uMin: 0, uMax: 5, vMin: 0, vMax: 5 });
    expect(out.every((p) => p[0] <= 5 + 1e-9)).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(4);
  });

  it('完全在外的多边形被裁空', () => {
    const poly: [number, number][] = [
      [9, 9],
      [10, 9],
      [10, 10],
      [9, 10],
    ];
    expect(clipPolygonRect(poly, { uMin: 0, uMax: 5, vMin: 0, vMax: 5 })).toHaveLength(0);
  });
});

describe('aperture projection', () => {
  const aperture = {
    cellIndex: 0,
    corners: [
      { x: -1, y: 4, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 1, y: 6, z: 0 },
      { x: -1, y: 6, z: 0 },
    ],
  };

  it('正午高角度阳光在地面形成光斑', () => {
    // altitude 45°, hour 0 → 光线方向 (0, -sin45, +cos45)
    const dir = { x: 0, y: -Math.SQRT1_2, z: Math.SQRT1_2 };
    const patches = projectAperture(aperture, dir, room, height, 0.5);
    const floor = patches.filter((p) => p.surface === HitSurface.Floor);
    expect(floor).toHaveLength(1);
    // 45° 斜射：地面落点 z = y（从 z=0 起），y=4 的边落到 z=4
    const zs = floor[0].points.map((p) => p.z);
    expect(Math.min(...zs)).toBeCloseTo(4, 9);
    expect(Math.max(...zs)).toBeCloseTo(6, 9);
    expect(floor[0].effectiveTransmittance).toBe(0.5);
  });

  it('低角度阳光先打后墙而不是地面（光束从高处出发）', () => {
    // altitude 10°：光线几乎水平，y=6 的角到达 z=10 时仅下降 10·tan10≈1.76
    const a = (10 * Math.PI) / 180;
    const dir = { x: 0, y: -Math.sin(a), z: Math.cos(a) };
    const patches = projectAperture(aperture, dir, room, height, 0.3);
    expect(patches.some((p) => p.surface === HitSurface.BackWall)).toBe(true);
  });

  it('带水平时角的光斑命中侧墙之一', () => {
    const a = (30 * Math.PI) / 180;
    const h = (60 * Math.PI) / 180;
    const dir = {
      x: Math.cos(a) * Math.sin(h),
      y: -Math.sin(a),
      z: Math.cos(a) * Math.cos(h),
    };
    const patches = projectAperture(aperture, dir, room, height, 0.4);
    expect(patches.some((p) => p.surface === HitSurface.SideWall)).toBe(true);
  });

  it('向上的光线不产生任何光斑', () => {
    const dir = { x: 0, y: 0.5, z: 0.866 };
    expect(projectAperture(aperture, dir, room, height, 0.5)).toHaveLength(0);
  });
});
