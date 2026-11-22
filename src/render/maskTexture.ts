import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Scene } from '@babylonjs/core/scene';
import { FritPattern, type FritMask } from '../core/types';
import { maskFieldAA, maskRepeats, type MaskRepeats } from '../core/fritMask';

/**
 * 彩釉不透明度贴图生成。
 *
 * 与光斑投影共用 core/fritMask 的同一份解析场函数，
 * 保证幕墙外观的遮罩与室内光斑的碎片化严格一致。
 * 贴图为灰度 alpha：白=不透光（彩釉），黑=透光玻璃。
 * 软边由 maskFieldAA 的 smoothstep 给出，配合 4x MSAA 抗锯齿。
 */
const TEX_SIZE = 256;

export function createFritTexture(
  scene: Scene,
  mask: FritMask,
  cellWidth: number,
  cellHeight: number,
): DynamicTexture {
  const tex = new DynamicTexture(
    `frit-${mask.pattern}-${mask.coverage}`,
    { width: TEX_SIZE, height: TEX_SIZE },
    scene,
    false,
  );
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const image = ctx.createImageData(TEX_SIZE, TEX_SIZE);
  const rep: MaskRepeats = maskRepeats(mask, cellWidth, cellHeight);

  for (let py = 0; py < TEX_SIZE; py++) {
    const v = (py + 0.5) / TEX_SIZE;
    for (let px = 0; px < TEX_SIZE; px++) {
      const u = (px + 0.5) / TEX_SIZE;
      const opaque = maskFieldAA(mask, u, v, rep);
      const idx = (py * TEX_SIZE + px) * 4;
      // 灰度写入 RGB（白=彩釉不透光，黑=玻璃透光），alpha 固定 255；
      // 材质侧开启 getAlphaFromRGB，用亮度作为不透明度
      const g = Math.round(opaque * 255);
      image.data[idx] = g;
      image.data[idx + 1] = g;
      image.data[idx + 2] = g;
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  tex.update(false);
  tex.wrapU = 1; // Texture.CLAMP_ADDRESSMODE
  tex.wrapV = 1;
  tex.updateSamplingMode(2); // Texture.BILINEAR_SAMPLINGMODE
  // 关键：让不透明度贴图从灰度亮度取 alpha，遮罩才真正控制透光区域
  tex.getAlphaFromRGB = true;
  return tex;
}

export const FRIT_PATTERN_LABEL: Record<FritPattern, string> = {
  [FritPattern.Dot]: '圆点阵列',
  [FritPattern.Stripe]: '水平条纹',
  [FritPattern.Diamond]: '菱形格',
};
