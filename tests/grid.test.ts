import { describe, it, expect } from 'vitest';
import { cellRect, cellAperture, cellUV, uvRectToCorners, defaultCells } from '../src/core/grid';
import { GlassType } from '../src/core/types';

const grid = { cols: 4, rows: 3, width: 8, height: 6, barWidth: 0.2 };

describe('grid geometry', () => {
  it('格坐标与行列互相对应', () => {
    const r = cellRect(grid, 0);
    expect(r.col).toBe(0);
    expect(r.row).toBe(0);
    expect(r.x0).toBe(-4);
    expect(r.x1).toBe(-2);
    expect(r.y0).toBe(0);
    expect(r.y1).toBe(2);

    const last = cellRect(grid, 11);
    expect(last.col).toBe(3);
    expect(last.row).toBe(2);
    expect(last.x1).toBe(4);
    expect(last.y1).toBe(6);
  });

  it('孔径相对整格内缩半个框条宽度', () => {
    const ap = cellAperture(grid, 0);
    const r = cellRect(grid, 0);
    expect(ap.corners[0].x).toBe(r.x0 + 0.1);
    expect(ap.corners[0].y).toBe(r.y0 + 0.1);
    expect(ap.corners[2].x).toBe(r.x1 - 0.1);
    expect(ap.corners[2].y).toBe(r.y1 - 0.1);
    expect(ap.apertureArea).toBeCloseTo((2 - 0.2) * (2 - 0.2), 10);
  });

  it('UV 与世界坐标互相映射', () => {
    const r = cellRect(grid, 5);
    const uv = cellUV(grid, 5, r.x0, r.y0);
    expect(uv).toEqual({ u: 0, v: 0 });
    const corners = uvRectToCorners(grid, 5, { u0: 0, v0: 0, u1: 1, v1: 1 }, 0);
    expect(corners[2]).toEqual({ x: r.x1, y: r.y1, z: 0 });
  });

  it('默认分格数量与类型正确', () => {
    const cells = defaultCells(grid);
    expect(cells).toHaveLength(12);
    expect(cells.every((c) => c.type === GlassType.Clear && c.transmittance === 0.5)).toBe(true);
  });
});
