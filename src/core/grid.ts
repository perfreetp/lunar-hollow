import { CoatingTint, FritPattern, GlassType, type GlassCell, type WallGrid } from './types';

/** 格面矩形（世界坐标，幕墙位于 z=0 平面） */
export interface CellRect {
  index: number;
  row: number;
  col: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** 扣除遮挡框条后的透光孔径（同样在 z=0 平面） */
export interface Aperture {
  cellIndex: number;
  /** 孔径四角，逆时针（自室外看向幕墙） */
  corners: { x: number; y: number; z: number }[];
  /** 单格总面积（含框条），米² */
  cellArea: number;
  /** 孔径面积，米² */
  apertureArea: number;
}

export function cellAt(grid: WallGrid, index: number): { row: number; col: number } {
  return { row: Math.floor(index / grid.cols), col: index % grid.cols };
}

/** 整格外轮廓（含框条中线） */
export function cellRect(grid: WallGrid, index: number): CellRect {
  const { row, col } = cellAt(grid, index);
  const cw = grid.width / grid.cols;
  const ch = grid.height / grid.rows;
  return {
    index,
    row,
    col,
    x0: -grid.width / 2 + col * cw,
    x1: -grid.width / 2 + (col + 1) * cw,
    y0: row * ch,
    y1: (row + 1) * ch,
  };
}

/**
 * 某格扣除框条后的透光孔径。
 * 框条沿分格线布置、宽度 barWidth，因此孔径每侧内缩半个条宽；
 * 边界格外侧为幕墙边框，同样内缩半条宽。
 */
export function cellAperture(grid: WallGrid, index: number): Aperture {
  const r = cellRect(grid, index);
  const half = grid.barWidth / 2;
  const x0 = r.x0 + half;
  const x1 = r.x1 - half;
  const y0 = r.y0 + half;
  const y1 = r.y1 - half;
  const cellArea = (r.x1 - r.x0) * (r.y1 - r.y0);
  const apertureArea = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  return {
    cellIndex: index,
    cellArea,
    apertureArea,
    corners: [
      { x: x0, y: y0, z: 0 },
      { x: x1, y: y0, z: 0 },
      { x: x1, y: y1, z: 0 },
      { x: x0, y: y1, z: 0 },
    ],
  };
}

/** 格面内世界坐标 → 归一化 UV（u 水平、v 竖直，均 [0,1]），供遮罩采样 */
export function cellUV(grid: WallGrid, index: number, x: number, y: number): { u: number; v: number } {
  const r = cellRect(grid, index);
  return {
    u: (x - r.x0) / (r.x1 - r.x0),
    v: (y - r.y0) / (r.y1 - r.y0),
  };
}

/** 把归一化 UV 矩形换回 z=0 平面上的世界坐标矩形四角 */
export function uvRectToCorners(
  grid: WallGrid,
  index: number,
  uv: { u0: number; v0: number; u1: number; v1: number },
  z: number,
): { x: number; y: number; z: number }[] {
  const r = cellRect(grid, index);
  const x0 = r.x0 + uv.u0 * (r.x1 - r.x0);
  const x1 = r.x0 + uv.u1 * (r.x1 - r.x0);
  const y0 = r.y0 + uv.v0 * (r.y1 - r.y0);
  const y1 = r.y0 + uv.v1 * (r.y1 - r.y0);
  return [
    { x: x0, y: y0, z },
    { x: x1, y: y0, z },
    { x: x1, y: y1, z },
    { x: x0, y: y1, z },
  ];
}

/** 生成默认分格（全部透明玻璃、50% 透射） */
export function defaultCells(grid: WallGrid): GlassCell[] {
  return Array.from({ length: grid.cols * grid.rows }, () => ({
    type: GlassType.Clear,
    transmittance: 0.5,
    tint: CoatingTint.Neutral,
    frit: { pattern: FritPattern.Dot, coverage: 0.5, scale: 0.15 },
  }));
}
