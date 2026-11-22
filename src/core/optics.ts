import { CoatingTint, GlassType, type GlassCell } from './types';
import { openFraction } from './fritMask';

/**
 * 玻璃光学模型（简化的 Beer–Lambert 风格能量模型）：
 *
 * - 透明玻璃：有效透射 = 设定透射率 τ；
 * - 镀膜玻璃：τ 再乘镀膜中性衰减，反射光带色偏（颜色只影响反射外观与光斑色调）；
 * - 彩釉玻璃：τ 乘遮罩透光面积占比，未上釉区域按玻璃本身透射；
 * - 多层叠加：沿同一视线/光路的 N 层玻璃，能量按乘积累积 ∏τᵢ。
 */

/** 镀膜相对中性玻璃的额外能量损失（反射增强的部分） */
const COATING_LOSS = 0.85;

export interface TintRGB {
  /** 线性空间 RGB，用于光斑染色与材质 */
  rgb: [number, number, number];
  /** CSS 展示色（sRGB） */
  css: string;
  label: string;
}

export const COATING_TINTS: Record<CoatingTint, TintRGB> = {
  [CoatingTint.Neutral]: { rgb: [1, 1, 1], css: '#e8ecef', label: '中性银' },
  [CoatingTint.Blue]: { rgb: [0.55, 0.72, 1.0], css: '#7fa8e6', label: '宝石蓝' },
  [CoatingTint.Bronze]: { rgb: [0.85, 0.62, 0.38], css: '#c8945e', label: '青铜色' },
  [CoatingTint.Green]: { rgb: [0.5, 0.85, 0.6], css: '#7fd199', label: '翡翠绿' },
};

/** 彩釉之外的玻璃本体有效透射（镀膜带衰减） */
export function bodyTransmittance(cell: GlassCell): number {
  const tau = clamp01(cell.transmittance);
  return cell.type === GlassType.Coated ? tau * COATING_LOSS : tau;
}

/** 单格综合有效可见光比例（含彩釉遮罩），取值 [0,1] */
export function effectiveCellTransmittance(cell: GlassCell): number {
  const body = bodyTransmittance(cell);
  if (cell.type === GlassType.Fritted) {
    return body * openFraction(cell.frit);
  }
  return body;
}

/**
 * 同一光路上多层玻璃的叠加可见光比例（能量乘积模型）。
 * @param layers 沿光路从外到内的各层分格
 */
export function stackTransmittance(layers: GlassCell[]): number {
  return layers.reduce((acc, c) => acc * effectiveCellTransmittance(c), 1);
}

/** 光斑的染色：取光路中镀膜层色偏的乘积，无镀膜则为白光 */
export function stackTint(layers: GlassCell[]): [number, number, number] {
  const rgb: [number, number, number] = [1, 1, 1];
  for (const cell of layers) {
    if (cell.type === GlassType.Coated) {
      const t = COATING_TINTS[cell.tint].rgb;
      rgb[0] *= t[0];
      rgb[1] *= t[1];
      rgb[2] *= t[2];
    }
  }
  return rgb;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
