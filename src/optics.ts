import type { LayerConfig, WallConfig } from './types';

/**
 * 光学档位表
 * 透射档位：5 档对应基准法向透射率；镀膜档位：5 档对应 F0（法向反射率）。
 * 数值按常见幕墙玻璃（含 Low-E / 镀膜玻璃）的合理工程范围设定，仅用于实时估算。
 */
export const TRANSMISSION_TABLE: Record<number, number> = {
  1: 0.35,
  2: 0.5,
  3: 0.65,
  4: 0.78,
  5: 0.9,
};

/** 镀膜反射档位 → 法向反射率 F0（未镀膜普通玻璃约 0.04，强镀膜可达 0.2+） */
export const COATING_TABLE: Record<number, number> = {
  1: 0.04,
  2: 0.07,
  3: 0.11,
  4: 0.16,
  5: 0.22,
};

export const GEAR_MIN = 1;
export const GEAR_MAX = 5;

/** 单张玻璃片的物理约束 */
export const THICKNESS_MIN = 0.006;
export const THICKNESS_MAX = 0.04;
export const THICKNESS_DEFAULT = 0.012;

/** 层间距约束 */
export const SPACING_MIN = 0.06;
export const SPACING_MAX = 0.4;
export const SPACING_DEFAULT = 0.12;

/** 幕墙默认网格 */
export const DEFAULT_COLS = 8;
export const DEFAULT_ROWS = 12;
export const DEFAULT_PANEL_W = 1.2;
export const DEFAULT_PANEL_H = 0.8;

/** 固定四十层玻璃布置（需求硬性约束） */
export const DEFAULT_LAYER_COUNT = 40;

/**
 * 光学裁剪阈值：沿视线累积透射率低于该值后，更深层的玻璃在该视角下
 * 已不可分辨，计入“裁剪提示”，但仍参与几何渲染与排序。
 */
export const OPTICAL_CLIP_THRESHOLD = 0.02;

/** 每帧重排 + 求交的性能预算（毫秒）。四十层规模设计目标 ≤ 2ms。 */
export const FRAME_BUDGET_MS = 2;

/** 配置在浏览器本地存储中的键名 */
export const STORAGE_KEY = 'curtain-wall-optics:config:v1';

export function clampGear(v: number): number {
  if (!Number.isFinite(v)) return GEAR_MIN;
  return Math.min(GEAR_MAX, Math.max(GEAR_MIN, Math.round(v)));
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Schlick 近似：反射率随入射角（相对法线）增大而增强。
 * 镀膜档位决定 F0，视角越掠射反射越强 —— 即“镀膜反射强弱随视角变化”。
 *
 * @param cosTheta 视线与法线夹角的余弦（取绝对值，0-1）
 * @param f0 法向反射率，由镀膜档位查表得到
 */
export function fresnelReflectance(cosTheta: number, f0: number): number {
  const c = clamp(Math.abs(cosTheta), 0, 1);
  return f0 + (1 - f0) * Math.pow(1 - c, 5);
}

/**
 * 单层玻璃在给定视角下的有效透射率。
 * 能量守恒近似：T(θ) = T0 * (1 - R(θ)) / (1 - F0)
 * 视角越掠射，Fresnel 反射越强，有效透射越低。
 */
export function layerViewTransmission(layer: LayerConfig, cosTheta: number): number {
  const t0 = TRANSMISSION_TABLE[clampGear(layer.transmissionGear)] ?? 0.65;
  const f0 = COATING_TABLE[clampGear(layer.coatingGear)] ?? 0.07;
  const r = fresnelReflectance(cosTheta, f0);
  return clamp((t0 * (1 - r)) / (1 - f0), 0, 1);
}

/**
 * 总透射估算：视线穿过的各层有效透射率连乘（Beer-Lambert 风格的层叠模型）。
 * 同时返回被光学裁剪的层数。
 */
export function estimateTotalTransmission(
  layers: LayerConfig[],
  cosTheta: number,
): { total: number; clipped: number } {
  let total = 1;
  let clipped = 0;
  let clippedZone = false;
  for (const layer of layers) {
    if (!layer.enabled) continue;
    if (clippedZone) {
      clipped += 1;
      continue;
    }
    total *= layerViewTransmission(layer, cosTheta);
    if (total < OPTICAL_CLIP_THRESHOLD) clippedZone = true;
  }
  return { total, clipped };
}

/** 构造一整块幕墙的默认配置（四十层，档位交替分布以便观察层叠效果） */
export function createDefaultConfig(): WallConfig {
  const layers: LayerConfig[] = [];
  for (let i = 0; i < DEFAULT_LAYER_COUNT; i++) {
    // 深浅交替的档位组合，默认状态下即可看到层次差异
    const transmissionGear = (i % GEAR_MAX) + 1;
    const coatingGear = ((i + 2) % GEAR_MAX) + 1;
    layers.push({
      id: i,
      enabled: true,
      transmissionGear: clampGear(transmissionGear),
      coatingGear: clampGear(coatingGear),
      thickness: THICKNESS_DEFAULT,
    });
  }
  return {
    layerCount: DEFAULT_LAYER_COUNT,
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    spacing: SPACING_DEFAULT,
    panelWidth: DEFAULT_PANEL_W,
    panelHeight: DEFAULT_PANEL_H,
    layers,
  };
}

/** 导入配置时的结构校验，拒绝残缺或被篡改的文件 */
export function validateConfig(input: unknown): WallConfig | null {
  if (!input || typeof input !== 'object') return null;
  const cfg = input as Record<string, unknown>;
  const n = cfg.layerCount;
  if (typeof n !== 'number' || n < 1 || n > 200) return null;
  if (!Array.isArray(cfg.layers) || cfg.layers.length !== n) return null;
  if (
    typeof cfg.cols !== 'number' ||
    typeof cfg.rows !== 'number' ||
    typeof cfg.spacing !== 'number' ||
    typeof cfg.panelWidth !== 'number' ||
    typeof cfg.panelHeight !== 'number'
  ) {
    return null;
  }
  const layers: LayerConfig[] = [];
  for (let i = 0; i < n; i++) {
    const raw = cfg.layers[i] as Record<string, unknown>;
    if (
      !raw ||
      typeof raw.enabled !== 'boolean' ||
      typeof raw.transmissionGear !== 'number' ||
      typeof raw.coatingGear !== 'number' ||
      typeof raw.thickness !== 'number'
    ) {
      return null;
    }
    layers.push({
      id: i,
      enabled: raw.enabled,
      transmissionGear: clampGear(raw.transmissionGear),
      coatingGear: clampGear(raw.coatingGear),
      thickness: clamp(raw.thickness, THICKNESS_MIN, THICKNESS_MAX),
    });
  }
  return {
    layerCount: n,
    cols: Math.max(1, Math.min(40, Math.round(cfg.cols))),
    rows: Math.max(1, Math.min(40, Math.round(cfg.rows))),
    spacing: clamp(cfg.spacing, SPACING_MIN, SPACING_MAX),
    panelWidth: cfg.panelWidth,
    panelHeight: cfg.panelHeight,
    layers,
  };
}
