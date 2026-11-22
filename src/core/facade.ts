import {
  GlassType,
  type GlassCell,
  type LightPatch,
  type ProjectConfig,
} from './types';
import { cellAperture, cellRect, uvRectToCorners } from './grid';
import { fritSubApertures, maskRepeats } from './fritMask';
import { lightRayDirection, isSunGrazing } from './sun';
import { projectAperture, type ApertureCorners, type Vec3 } from './projection';
import { stackTransmittance, stackTint } from './optics';

/**
 * 某格沿光路需要穿过的玻璃层（从外到内）。
 * 双层幕墙演示中两层共用同一份分格参数。
 */
export function layersForCell(config: ProjectConfig, index: number): GlassCell[] {
  const cell = config.cells[index];
  return config.doubleLayer ? [cell, cell] : [cell];
}

export interface TintedPatch extends LightPatch {
  /** 光路中镀膜色偏累积后的线性 RGB（默认白光 [1,1,1]） */
  tint: [number, number, number];
}

/**
 * 整面幕墙的光斑重算入口：日照角度或分格变化时调用一次，
 * 对所有格、所有室内面重新投影，结果整体替换。
 */
export function buildLightPatches(config: ProjectConfig): TintedPatch[] {
  if (isSunGrazing(config.sun)) return [];

  const dir = lightRayDirection(config.sun);
  const dirVec: Vec3 = { x: dir.x, y: dir.y, z: dir.z };
  const patches: TintedPatch[] = [];
  const { grid, room } = config;

  for (let i = 0; i < config.cells.length; i++) {
    const cell = config.cells[i];
    const layers = layersForCell(config, i);
    const tau = stackTransmittance(layers);
    if (tau <= 0.001) continue;
    const tint = stackTint(layers);

    const apertures: ApertureCorners[] = [];
    if (cell.type === GlassType.Fritted) {
      // 彩釉格：遮罩离散成若干透光子孔径，光斑形状随之碎片化
      const rect = cellRect(grid, i);
      const rep = maskRepeats(cell.frit, rect.x1 - rect.x0, rect.y1 - rect.y0);
      const subs = fritSubApertures(cell.frit, rep);
      for (const sub of subs) {
        apertures.push({
          cellIndex: i,
          corners: uvRectToCorners(grid, i, sub, 0),
        });
      }
    } else {
      apertures.push({ cellIndex: i, corners: cellAperture(grid, i).corners });
    }

    for (const ap of apertures) {
      const got = projectAperture(ap, dirVec, room, grid.height, tau);
      for (const p of got) patches.push({ ...p, tint });
    }
  }
  return patches;
}
