import { GlassType, type GlareReadout, type GlassCell, type WallGrid } from './types';
import { cellAperture } from './grid';
import { effectiveCellTransmittance, stackTransmittance } from './optics';

/**
 * 室内侧眩光强度读数。
 *
 * 物理含义：单位太阳法向辐照下，整面幕墙送入室内的可见光功率（相对单位）。
 * 每格贡献 = 孔径面积 × 有效透射（含彩釉、含多层乘积）。
 * 框条遮挡通过孔径面积体现；入射角余弦在同一面墙上对各格相同，
 * 作为整体系数省略，读数用于方案间横向比较与随日照的整体重算。
 */
export function computeGlare(
  cells: GlassCell[],
  grid: WallGrid,
  layersFor: (index: number) => GlassCell[],
): GlareReadout {
  const byType: Record<GlassType, number> = {
    [GlassType.Clear]: 0,
    [GlassType.Coated]: 0,
    [GlassType.Fritted]: 0,
  };
  let totalFlux = 0;
  let litCells = 0;
  let areaSum = 0;
  let weightedTau = 0;

  for (let i = 0; i < cells.length; i++) {
    const ap = cellAperture(grid, i);
    if (ap.apertureArea <= 0) continue;
    const tau = stackTransmittance(layersFor(i));
    const flux = ap.apertureArea * tau;
    byType[cells[i].type] += flux;
    totalFlux += flux;
    if (tau > 0.001) litCells++;
    areaSum += ap.apertureArea;
    weightedTau += ap.apertureArea * tau;
  }

  return {
    totalFlux,
    byType,
    litCells,
    averageTransmittance: areaSum > 0 ? weightedTau / areaSum : 0,
  };
}

/** 单格悬停读数所需的可见光比例（单层场景下即本体有效透射） */
export function cellVisibleRatio(cell: GlassCell, layers: GlassCell[]): number {
  return layers.length > 1 ? stackTransmittance(layers) : effectiveCellTransmittance(cell);
}
