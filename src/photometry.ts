import type { EnvMode, FloorPlan, Lamp, LampType, Vec3 } from './types';

/* ---------------------------------- 灯具规格 ---------------------------------- */

export const CCTS = [2700, 4000, 6500] as const;

export interface LampSpec {
  label: string;
  /** 两档功率（W） */
  powers: [number, number];
  /** 光效 lm/W */
  efficacy: number;
  /** 表观发光面积 m²（用于 UGR） */
  area: number;
  /** 估算能耗用的日均点亮小时 */
  hoursPerDay: number;
}

export const LAMP_SPECS: Record<LampType, LampSpec> = {
  ceiling: { label: '吸顶灯', powers: [24, 36], efficacy: 95, area: 0.09, hoursPerDay: 5 },
  wall: { label: '壁灯', powers: [6, 10], efficacy: 85, area: 0.02, hoursPerDay: 3 },
  night: { label: '夜灯', powers: [0.8, 1.6], efficacy: 70, area: 0.004, hoursPerDay: 9 },
};

export function lampPower(l: Lamp): number {
  return LAMP_SPECS[l.type].powers[l.powerIndex] ?? 0;
}

export function lampFlux(l: Lamp): number {
  const s = LAMP_SPECS[l.type];
  return s.powers[l.powerIndex] * s.efficacy;
}

/** 色温 → 显示颜色（近似） */
export function cctColor(cct: number): string {
  if (cct <= 3000) return '#ffb168';
  if (cct <= 4500) return '#ffd9ad';
  return '#e9f0ff';
}

/* --------------------------------- 配光与照度 --------------------------------- */

/**
 * 灯具朝 dir（单位向量，灯具→目标点）方向的光强（cd）。
 * 吸顶灯：下半球余弦配光；壁灯：沿法线半球余弦配光；夜灯：全向。
 */
export function lampIntensity(l: Lamp, dx: number, dy: number, dz: number): number {
  const flux = lampFlux(l);
  if (l.type === 'night') return flux / (4 * Math.PI);
  const n = l.type === 'ceiling' ? DOWN : l.normal;
  const c = dx * n[0] + dy * n[1] + dz * n[2];
  if (c <= 0) return 0;
  // 半球余弦配光总通量 = π·I0
  return (flux / Math.PI) * c;
}
const DOWN: Vec3 = [0, -1, 0];

/** 点照度：E = Σ I(θ)·cos(入射角)/d² + 环境光（lx） */
export function illuminanceAt(
  px: number, py: number, pz: number,
  nx: number, ny: number, nz: number,
  lamps: Lamp[], ambient: number,
): number {
  let e = ambient;
  for (let i = 0; i < lamps.length; i++) {
    const l = lamps[i];
    const vx = px - l.position[0];
    const vy = py - l.position[1];
    const vz = pz - l.position[2];
    const d2 = vx * vx + vy * vy + vz * vz;
    if (d2 < 1e-4) continue;
    const d = Math.sqrt(d2);
    const idx = vx / d, idy = vy / d, idz = vz / d;
    const I = lampIntensity(l, idx, idy, idz);
    if (I <= 0) continue;
    const cos = -(idx * nx + idy * ny + idz * nz);
    if (cos <= 0) continue;
    e += (I * cos) / d2;
  }
  return e;
}

/** 环境光基准照度（lx）：白天含窗射日光贡献，夜间自动压低 */
export function ambientFor(mode: EnvMode): number {
  return mode === 'day' ? 70 : 4;
}

/** 适老低照度阈值 */
export const LOW_E_THRESHOLD = 150;

/* --------------------------------- 伪彩色映射 --------------------------------- */

export const E_SCALE_MAX = 500;

/** 照度 → 0..1（对数刻度，兼顾夜灯 1lx 与灯下数百 lx） */
export function heatT(e: number): number {
  return Math.min(1, Math.log10(1 + Math.max(0, e)) / Math.log10(1 + E_SCALE_MAX));
}

const STOPS: [number, [number, number, number]][] = [
  [0, [26, 42, 108]],
  [0.25, [31, 138, 192]],
  [0.5, [39, 174, 96]],
  [0.75, [241, 196, 15]],
  [1, [231, 76, 60]],
];

export function heatColor(t: number): [number, number, number] {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      const k = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
      ];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** 与 heatColor 一致的 CSS 渐变（图例用） */
export const HEAT_GRADIENT_CSS =
  'linear-gradient(90deg, #1a2a6c 0%, #1f8ac0 25%, #27ae60 50%, #f1c40f 75%, #e74c3c 100%)';

/* ----------------------------------- UGR ----------------------------------- */

/** Guth 位置指数近似（σ 为视线夹角，度） */
function positionIndex(sigmaDeg: number): number {
  return Math.exp(Math.min(Math.max(sigmaDeg, 0), 120) / 33);
}

/**
 * 统一眩光值 UGR = 8·log10( 0.25/Lb · Σ L²·ω/p² )
 * L：灯具在观察者方向亮度；ω：灯具对眼睛张角立体角；p：Guth 位置指数；Lb：背景亮度。
 */
export function computeUGR(
  lamps: Lamp[],
  eye: Vec3,
  look: Vec3,
  backgroundLum: number,
): number {
  const lb = Math.max(0.5, backgroundLum);
  let sum = 0;
  for (const l of lamps) {
    const vx = l.position[0] - eye[0];
    const vy = l.position[1] - eye[1];
    const vz = l.position[2] - eye[2];
    const d2 = vx * vx + vy * vy + vz * vz;
    if (d2 < 0.09) continue;
    const d = Math.sqrt(d2);
    const tx = vx / d, ty = vy / d, tz = vz / d;
    const cosView = tx * look[0] + ty * look[1] + tz * look[2];
    if (cosView <= 0) continue; // 视野后方不产生眩光
    const sigma = (Math.acos(Math.min(1, cosView)) * 180) / Math.PI;
    if (sigma > 90) continue;
    const I = lampIntensity(l, -tx, -ty, -tz);
    if (I <= 0) continue;
    const spec = LAMP_SPECS[l.type];
    const L = I / spec.area;
    const omega = spec.area / d2;
    const p = positionIndex(sigma);
    sum += (L * L * omega) / (p * p);
  }
  if (sum <= 0) return 0;
  return Math.max(0, 8 * Math.log10((0.25 / lb) * sum));
}

/** UGR → 1~5 级眩光等级 */
export function glareGrade(ugr: number): number {
  if (ugr <= 13) return 1;
  if (ugr <= 16) return 2;
  if (ugr <= 19) return 3;
  if (ugr <= 22) return 4;
  return 5;
}

export const GRADE_LABELS = [
  '',
  '1 级 · 几乎无眩光',
  '2 级 · 轻微眩光',
  '3 级 · 可感知眩光',
  '4 级 · 不舒适眩光',
  '5 级 · 强烈眩光',
];

/* --------------------------------- 几何工具 --------------------------------- */

/** 保证轮廓逆时针（XZ 平面，从 +Y 俯视） */
export function ensureCCW(outline: [number, number][]): [number, number][] {
  let a = 0;
  for (let i = 0; i < outline.length; i++) {
    const [x0, z0] = outline[i];
    const [x1, z1] = outline[(i + 1) % outline.length];
    a += x0 * z1 - x1 * z0;
  }
  return a >= 0 ? outline.slice() : outline.slice().reverse();
}

export function pointInPolygon(x: number, z: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function planBBox(outline: [number, number][]) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of outline) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { minX, minZ, w: Math.max(1e-6, maxX - minX), h: Math.max(1e-6, maxZ - minZ) };
}

/** 地面平均照度（采样估算，用于 UGR 背景亮度与面板显示） */
export function averageFloorIlluminance(
  plan: FloorPlan,
  lamps: Lamp[],
  ambient: number,
  samples = 14,
): number {
  const outline = ensureCCW(plan.outline);
  const bb = planBBox(outline);
  let sum = 0, n = 0;
  for (let iy = 0; iy < samples; iy++) {
    const z = bb.minZ + ((iy + 0.5) / samples) * bb.h;
    for (let ix = 0; ix < samples; ix++) {
      const x = bb.minX + ((ix + 0.5) / samples) * bb.w;
      if (!pointInPolygon(x, z, outline)) continue;
      sum += illuminanceAt(x, 0.02, z, 0, 1, 0, lamps, ambient);
      n++;
    }
  }
  return n > 0 ? sum / n : ambient;
}

/* ---------------------------------- 能耗 ---------------------------------- */

export function energyEstimate(lamps: Lamp[]) {
  let totalW = 0, kwhDay = 0;
  for (const l of lamps) {
    const p = lampPower(l);
    totalW += p;
    kwhDay += (p * LAMP_SPECS[l.type].hoursPerDay) / 1000;
  }
  return { totalW, kwhDay, kwhMonth: kwhDay * 30 };
}
