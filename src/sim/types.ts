export type MaterialId = 'coated' | 'clear' | 'frosted' | 'double';
export type FinishId = 'walnut' | 'maple' | 'onyx';

export interface MaterialSpec {
  id: MaterialId;
  name: string;
  en: string;
  blurb: string;
  thicknessMm: number;
  density: number; // kg / m^3
  elasticMpa: number; // in-plane elastic modulus
  tensionMin: number; // N/m
  tensionMax: number; // N/m
  decay: number; // relative ring-down character
  headColor: string;
  headRoughness: number;
  headSheen: number;
  headClearcoat: number;
}

export interface FinishSpec {
  id: FinishId;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  grain: number;
}

export const MATERIALS: Record<MaterialId, MaterialSpec> = {
  coated: {
    id: 'coated',
    name: '涂层单层',
    en: 'COATED · 1-PLY',
    blurb: '温暖厚实,泛音适中,录音室通用',
    thicknessMm: 0.25,
    density: 1390,
    elasticMpa: 4800,
    tensionMin: 2400,
    tensionMax: 4600,
    decay: 1.0,
    headColor: '#b3a88c',
    headRoughness: 0.5,
    headSheen: 0.55,
    headClearcoat: 0.16,
  },
  clear: {
    id: 'clear',
    name: '透明单层',
    en: 'CLEAR · 1-PLY',
    blurb: '明亮通透,延音长,现场投射强',
    thicknessMm: 0.2,
    density: 1370,
    elasticMpa: 5600,
    tensionMin: 2600,
    tensionMax: 5000,
    decay: 1.24,
    headColor: '#a8bcc6',
    headRoughness: 0.24,
    headSheen: 0.85,
    headClearcoat: 0.4,
  },
  frosted: {
    id: 'frosted',
    name: '磨砂单层',
    en: 'FROSTED · 1-PLY',
    blurb: '干燥短促,刷鼓与合奏清晰',
    thicknessMm: 0.28,
    density: 1410,
    elasticMpa: 4200,
    tensionMin: 2250,
    tensionMax: 4200,
    decay: 0.7,
    headColor: '#aaa495',
    headRoughness: 0.74,
    headSheen: 0.3,
    headClearcoat: 0.05,
  },
  double: {
    id: 'double',
    name: '双层增强',
    en: 'DOUBLE · 2-PLY',
    blurb: '耐打,低频重心,延音短',
    thicknessMm: 0.52,
    density: 1420,
    elasticMpa: 2600,
    tensionMin: 2800,
    tensionMax: 5200,
    decay: 0.52,
    headColor: '#b0a482',
    headRoughness: 0.6,
    headSheen: 0.4,
    headClearcoat: 0.1,
  },
};

export const FINISHES: Record<FinishId, FinishSpec> = {
  walnut: { id: 'walnut', name: '胡桃木', color: '#4a2c1e', roughness: 0.5, metalness: 0.05, grain: 0.85 },
  maple: { id: 'maple', name: '枫木', color: '#c19a68', roughness: 0.44, metalness: 0.03, grain: 0.6 },
  onyx: { id: 'onyx', name: '哑光黑', color: '#191a1e', roughness: 0.4, metalness: 0.2, grain: 0.1 },
};

export interface DrumConfig {
  diameterIn: number;
  depthIn: number;
  materialId: MaterialId;
  finishId: FinishId;
  tensionLevel: number; // 1..6
}

export interface StrikeSpec {
  id: string;
  /** normalised radius of the strike, 0..1 of the membrane radius */
  rho: number;
  /** angle in radians */
  theta: number;
  /** 0..1 mallet velocity */
  strength: number;
  /** 0..1 mallet hardness (felt .. hard) */
  hardness: number;
}

export const DRUM_SIZES = [10, 12, 13, 14, 16, 18, 20, 22] as const;
export const TENSION_LEVELS = 6;
export const MAX_STRIKES = 6;

export const STRIKE_COLORS = ['#ffb454', '#57d8c4', '#ff7cbb', '#9fe060', '#a294ff', '#ff6f61'];

export function tensionFor(materialId: MaterialId, level: number): number {
  const m = MATERIALS[materialId];
  const u = (Math.min(TENSION_LEVELS, Math.max(1, level)) - 1) / (TENSION_LEVELS - 1);
  return m.tensionMin + (m.tensionMax - m.tensionMin) * u;
}

export function levelLabel(level: number): string {
  return ['极松', '松', '偏松', '中', '紧', '高张力'][Math.min(5, Math.max(0, level - 1))];
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function defaultConfig(): DrumConfig {
  return {
    diameterIn: 14,
    depthIn: 6.5,
    materialId: 'coated',
    finishId: 'walnut',
    tensionLevel: 4,
  };
}

export interface ExportBundle {
  kind: 'drumhead-tension-lab';
  version: 1;
  savedAt: string;
  config: DrumConfig;
  strikes: StrikeSpec[];
  view: {
    exaggeration: number;
    colorMode: ColorMode;
    playbackSpeed: number;
    activeStrikeId: string | null;
  };
}

export type ColorMode = 'stress' | 'plain' | 'displacement';
