import { FritPattern, type FritMask } from './types';

/**
 * 彩釉遮罩解析模型。
 *
 * 同一份解析函数同时服务于三个用途，保证“所见即所算”：
 * 1. 生成 Babylon 不透明度贴图（render/maskTexture.ts）；
 * 2. 计算透光面积占比 openFraction（本文件）；
 * 3. 把遮罩离散成子孔径，用于光斑几何投影（fritSubApertures）。
 *
 * 约定：f(u,v) ∈ [0,1]，1 表示该点完全不透光（彩釉覆盖），
 * 0 表示完全透光。u/v 为格面内归一化坐标。
 *
 * 周期处理：FritMask.scale 是世界尺度（米）的图案周期。
 * 非正方形分格的水平/竖直周期数不同，由 repeatsX/repeatsY 显式传入，
 * 用 maskRepeats() 依据格面尺寸换算。
 */

export interface MaskRepeats {
  rx: number;
  ry: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** 世界尺度周期（米）→ 格面内水平/竖直周期数 */
export function maskRepeats(mask: FritMask, cellWidth: number, cellHeight: number): MaskRepeats {
  const s = Math.max(mask.scale, 0.02);
  return { rx: Math.max(cellWidth / s, 1), ry: Math.max(cellHeight / s, 1) };
}

/** 归一化覆盖度参数：把用户给的 coverage 映射成图案的几何阈值 */
function threshold(mask: FritMask): number {
  return clamp(mask.coverage, 0.1, 0.9);
}

function fract(x: number): number {
  return x - Math.floor(x);
}

/** 平滑阶跃，用于遮罩边缘抗锯齿的软过渡 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 遮罩场函数（硬判定）。返回 0（透光）或 1（不透光）。
 */
export function maskField(mask: FritMask, u: number, v: number, rep: MaskRepeats): number {
  const t = threshold(mask);

  switch (mask.pattern) {
    case FritPattern.Dot: {
      const fu = fract(u * rep.rx);
      const fv = fract(v * rep.ry);
      const d = Math.min(
        Math.hypot(fu, fv),
        Math.hypot(fu - 1, fv),
        Math.hypot(fu, fv - 1),
        Math.hypot(fu - 1, fv - 1),
      );
      const r = Math.min(Math.sqrt(t / Math.PI), 0.5);
      return d < r ? 1 : 0;
    }
    case FritPattern.Stripe: {
      // 水平条纹：沿 v 周期变化，条带厚度即覆盖率 t
      const fv = fract(v * rep.ry);
      return fv < t ? 1 : 0;
    }
    case FritPattern.Diamond: {
      const fu = fract(u * rep.rx);
      const fv = fract(v * rep.ry);
      const d = Math.abs(fu - 0.5) + Math.abs(fv - 0.5);
      const r = Math.min(Math.sqrt(t / 2), 1);
      return d < r ? 1 : 0;
    }
  }
}

/**
 * 带抗锯齿软边的遮罩场（供贴图采样），返回不透光 alpha [0,1]。
 * 与 maskField 同构，但把硬判定换成宽度约一个采样周期的 smoothstep，
 * 配合渲染管线的 MSAA 实现遮罩边缘抗锯齿。
 */
export function maskFieldAA(mask: FritMask, u: number, v: number, rep: MaskRepeats): number {
  const t = threshold(mask);
  // 软边宽度（归一化坐标）：约为一个图案周期的 1/8，随周期数缩小
  const softY = Math.min(0.08, 0.125 / rep.ry);

  switch (mask.pattern) {
    case FritPattern.Dot: {
      const fu = fract(u * rep.rx);
      const fv = fract(v * rep.ry);
      const d = Math.min(
        Math.hypot(fu, fv),
        Math.hypot(fu - 1, fv),
        Math.hypot(fu, fv - 1),
        Math.hypot(fu - 1, fv - 1),
      );
      const r = Math.min(Math.sqrt(t / Math.PI), 0.5);
      // 软边宽度取图案归一化单元的固定比例，贴图随格面 UV 拉伸
      return 1 - smoothstep(r - 0.125, r + 0.125, d);
    }
    case FritPattern.Stripe: {
      const fv = fract(v * rep.ry);
      const s0 = smoothstep(0, softY, fv);
      const sT = 1 - smoothstep(t - softY, t + softY, fv);
      return Math.min(s0, sT);
    }
    case FritPattern.Diamond: {
      const fu = fract(u * rep.rx);
      const fv = fract(v * rep.ry);
      const d = Math.abs(fu - 0.5) + Math.abs(fv - 0.5);
      const r = Math.min(Math.sqrt(t / 2), 1);
      const soft = Math.min(0.08, 0.125 / Math.max(rep.rx, rep.ry));
      return 1 - smoothstep(r - soft, r + soft, d);
    }
  }
}

/**
 * 透光面积占比。三种图案的阈值均按面积标定，
 * 因此开孔率统一为 1 - coverage，与周期无关。
 */
export function openFraction(mask: FritMask): number {
  return 1 - threshold(mask);
}

export interface SubAperture {
  /** 格面归一化矩形 [u0,v0,u1,v1]，全部位于透光区内 */
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

/**
 * 把彩釉遮罩离散为若干透光子孔径矩形，用于光斑几何投影。
 * 采用规则网格采样：细分为 n×n，对采样点判透光，按行做游程合并为矩形条带。
 */
export function fritSubApertures(
  mask: FritMask,
  rep: MaskRepeats,
  resolution = 16,
): SubAperture[] {
  const step = 1 / resolution;
  const open: boolean[][] = [];
  for (let j = 0; j < resolution; j++) {
    open[j] = [];
    for (let i = 0; i < resolution; i++) {
      open[j][i] = maskField(mask, (i + 0.5) * step, (j + 0.5) * step, rep) < 0.5;
    }
  }

  const out: SubAperture[] = [];
  for (let j = 0; j < resolution; j++) {
    let runStart = -1;
    for (let i = 0; i <= resolution; i++) {
      const isOpen = i < resolution && open[j][i];
      if (isOpen && runStart < 0) runStart = i;
      if (!isOpen && runStart >= 0) {
        out.push({
          u0: runStart * step,
          v0: j * step,
          u1: i * step,
          v1: (j + 1) * step,
        });
        runStart = -1;
      }
    }
  }
  return out;
}
