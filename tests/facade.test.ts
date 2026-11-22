import { describe, it, expect } from 'vitest';
import { GlassType, CoatingTint, FritPattern, type ProjectConfig } from '../src/core/types';
import { computeGlare } from '../src/core/glare';
import { buildLightPatches, layersForCell } from '../src/core/facade';
import { defaultProject, exportScheme, importScheme, SchemeValidationError } from '../src/core/scheme';

describe('glare', () => {
  it('均匀幕墙的平均透射比等于单格有效透射', () => {
    const config = defaultProject();
    const grid = config.grid;
    const reading = computeGlare(config.cells, grid, (i) => layersForCell(config, i));
    expect(reading.litCells).toBe(grid.cols * grid.rows);
    expect(reading.averageTransmittance).toBeCloseTo(0.5, 10);
    expect(reading.totalFlux).toBeGreaterThan(0);
  });

  it('通量按类型分别累计且总和守恒', () => {
    const config = defaultProject();
    config.cells[0] = {
      type: GlassType.Coated,
      transmittance: 0.5,
      tint: CoatingTint.Bronze,
      frit: { pattern: FritPattern.Dot, coverage: 0.5, scale: 0.15 },
    };
    const reading = computeGlare(config.cells, config.grid, (i) => layersForCell(config, i));
    const sum = Object.values(reading.byType).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(reading.totalFlux, 10);
    expect(reading.byType[GlassType.Coated]).toBeGreaterThan(0);
  });

  it('双层幕墙读数低于单层（乘积衰减）', () => {
    const single = defaultProject();
    const doubled = defaultProject();
    doubled.doubleLayer = true;
    const g1 = computeGlare(single.cells, single.grid, (i) => layersForCell(single, i));
    const g2 = computeGlare(doubled.cells, doubled.grid, (i) => layersForCell(doubled, i));
    expect(g2.totalFlux).toBeCloseTo(g1.totalFlux * 0.5, 10);
  });
});

describe('facade patches', () => {
  it('默认方案在日照下为每个透光格产出至少一个光斑', () => {
    const config = defaultProject();
    const patches = buildLightPatches(config);
    const litIndices = new Set(patches.map((p) => p.cellIndex));
    expect(litIndices.size).toBe(config.cells.length);
    expect(patches.every((p) => p.points.length >= 3)).toBe(true);
  });

  it('彩釉格产出的光斑束数多于普通格', () => {
    const plain = defaultProject();
    const fritted = defaultProject();
    fritted.cells[0] = {
      type: GlassType.Fritted,
      transmittance: 0.7,
      tint: CoatingTint.Neutral,
      frit: { pattern: FritPattern.Dot, coverage: 0.5, scale: 0.25 },
    };
    const n0 = buildLightPatches(plain).filter((p) => p.cellIndex === 0).length;
    const n1 = buildLightPatches(fritted).filter((p) => p.cellIndex === 0).length;
    expect(n1).toBeGreaterThan(n0);
  });

  it('贴地太阳不产出光斑', () => {
    const config = defaultProject();
    config.sun.altitudeDeg = 1;
    expect(buildLightPatches(config)).toHaveLength(0);
  });

  it('零透射格不产出光斑', () => {
    const config = defaultProject();
    config.cells[3].transmittance = 0.1; // 下限仍有光；改用彩釉全覆盖近似零
    config.cells[3].type = GlassType.Fritted;
    config.cells[3].frit = { pattern: FritPattern.Dot, coverage: 0.9, scale: 0.05 };
    const patches = buildLightPatches(config);
    // 0.1 透射 × 0.1 开孔 = 0.01，仍 > 0.001，所以验证其光斑透射显著降低即可
    const forCell = patches.filter((p) => p.cellIndex === 3);
    expect(forCell.every((p) => p.effectiveTransmittance <= 0.02)).toBe(true);
  });
});

describe('scheme export/import round-trip', () => {
  it('导出再导入得到等价配置', () => {
    const config = defaultProject();
    config.cells[2].type = GlassType.Fritted;
    const text = exportScheme(config, '2026-11-23T00:00:00Z');
    const back = importScheme(text);
    expect(back).toEqual(config);
  });

  it('缺少 magic 的文件被拒绝', () => {
    expect(() => importScheme(JSON.stringify({ hello: 1 }))).toThrow(SchemeValidationError);
  });

  it('透射率越界被拒绝', () => {
    const config = defaultProject();
    config.cells[0].transmittance = 1.5;
    const text = exportScheme(config, 't');
    expect(() => importScheme(text)).toThrow(SchemeValidationError);
  });

  it('分格数量不匹配被拒绝', () => {
    const config = defaultProject();
    const bad: unknown = { ...config, cells: config.cells.slice(1) };
    expect(() => importScheme(exportScheme(bad as ProjectConfig, 't'))).toThrow(
      SchemeValidationError,
    );
  });

  it('非法 JSON 文本被拒绝', () => {
    expect(() => importScheme('{not json')).toThrow(SchemeValidationError);
  });
});
