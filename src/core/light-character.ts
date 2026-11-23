/**
 * IALA light-characteristic model.
 *
 * A characteristic is parsed from notation such as `Fl(2) W 10s`, `LFl 8s`,
 * `Iso G 6s`, `Oc R 8s`, `VQ(3) 5s` or `Mo(A) W 15s` and expanded into a
 * deterministic sequence of on/off phases. The sequence is the single source
 * of truth for both the beacon flicker and the halo intensity envelope.
 */

export type LightColor = 'W' | 'R' | 'G' | 'Y' | 'Bu';

export type LightFamily = 'F' | 'Fl' | 'LFl' | 'Q' | 'VQ' | 'UQ' | 'Iso' | 'Oc' | 'Mo';

export interface LightPhase {
  on: boolean;
  durationS: number;
  color: LightColor;
}

export interface LightCharacter {
  raw: string;
  family: LightFamily;
  groupCount: number;
  colors: LightColor[];
  periodS: number;
  phases: LightPhase[];
  morseLetter?: string;
}

export interface LightSample {
  intensity: number;
  color: LightColor;
  on: boolean;
  phaseIndex: number;
  tInPhase: number;
  periodFraction: number;
}

const COLOR_NAMES: Record<LightColor, string> = {
  W: '白',
  R: '红',
  G: '绿',
  Y: '黄',
  Bu: '蓝',
};

const FAMILY_NAMES: Record<LightFamily, string> = {
  F: '定光',
  Fl: '闪光',
  LFl: '长闪',
  Q: '快闪',
  VQ: '甚快闪',
  UQ: '超快闪',
  Iso: '等明暗',
  Oc: '明暗',
  Mo: '摩尔斯',
};

const FAMILY_ORDER = ['FL', 'LFL', 'VQ', 'UQ', 'ISO', 'OC', 'MO', 'Q', 'F'] as const;

const FAMILY_MAP: Record<string, LightFamily> = {
  F: 'F',
  FL: 'Fl',
  LFL: 'LFl',
  Q: 'Q',
  VQ: 'VQ',
  UQ: 'UQ',
  ISO: 'Iso',
  OC: 'Oc',
  MO: 'Mo',
};

const MORSE: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
};

const DEFAULT_PERIOD: Record<LightFamily, number> = {
  F: 1,
  Fl: 5,
  LFl: 10,
  Q: 1,
  VQ: 0.6,
  UQ: 0.25,
  Iso: 4,
  Oc: 4,
  Mo: 15,
};

const QUICK_RATE: Partial<Record<LightFamily, number>> = {
  Q: 0.5,
  VQ: 0.3,
  UQ: 0.125,
};

function parseColorToken(token: string): LightColor[] {
  const found = token.match(/BU|[WRGY]/g);
  return found ? (found.map((c) => c as LightColor)) : [];
}

function normalizeCodes(raw: string): string[] {
  return raw
    .replace(/[.·]/g, ' ')
    .replace(/[,/]/g, ' ')
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
}

interface ParsedSpec {
  family: LightFamily;
  groupCount: number;
  colors: LightColor[];
  periodS?: number;
  morseLetter?: string;
}

function parseTokens(raw: string): ParsedSpec {
  const tokens = normalizeCodes(raw);
  let family: LightFamily | undefined;
  let groupCount = 0;
  let colors: LightColor[] = [];
  let periodS: number | undefined;
  let morseLetter: string | undefined;

  for (const token of tokens) {
    if (!family) {
      for (const code of FAMILY_ORDER) {
        const m = new RegExp(`^${code}(?:\\(([0-9]{1,2}|[A-Z])\\))?$`).exec(token);
        if (m) {
          family = FAMILY_MAP[code];
          const arg = m[1];
          if (arg) {
            if (/^\d+$/.test(arg)) groupCount = Number(arg);
            else morseLetter = arg;
          }
          break;
        }
      }
      if (family) continue;
    }

    if (colors.length === 0 && /^(?:BU|[WRGY]){1,2}$/.test(token)) {
      colors = parseColorToken(token);
      continue;
    }

    const pm = /^(\d+(?:\.\d+)?)S?$/.exec(token);
    if (pm && periodS === undefined) {
      periodS = Number(pm[1]);
      continue;
    }
  }

  if (!family) {
    // Tolerant fallback: peel a trailing period off a compact notation.
    const compact = raw.replace(/[.·]/g, '').toUpperCase();
    const pm = /(\d+(?:\.\d+)?)S?$/.exec(compact);
    if (pm) periodS = Number(pm[1]);
    for (const code of FAMILY_ORDER) {
      if (compact.startsWith(code)) {
        family = FAMILY_MAP[code];
        break;
      }
    }
    if (!colors.length) colors = parseColorToken(compact);
    const gm = /\((\d+)\)/.exec(compact);
    if (gm) groupCount = Number(gm[1]);
    const mm = /MO\(([A-Z])\)/.exec(compact);
    if (mm) morseLetter = mm[1];
  }

  if (!family) {
    throw new Error(`无法解析灯质: ${raw}`);
  }

  return { family, groupCount, colors, periodS, morseLetter };
}

function pushOn(phases: LightPhase[], durationS: number, color: LightColor): void {
  if (durationS > 1e-4) phases.push({ on: true, durationS, color });
}

function pushOff(phases: LightPhase[], durationS: number, color: LightColor): void {
  if (durationS > 1e-4) phases.push({ on: false, durationS, color });
}

function phaseColor(colors: LightColor[], index: number): LightColor {
  return colors.length ? colors[index % colors.length] : 'W';
}

function buildMorsePhases(letter: string, periodS: number, color: LightColor): LightPhase[] {
  const pattern = MORSE[letter] ?? MORSE.A;
  const unit = 0.25;
  const raw: Array<{ on: boolean; units: number }> = [];
  for (let i = 0; i < pattern.length; i++) {
    const sym = pattern[i];
    raw.push({ on: true, units: sym === '-' ? 3 : 1 });
    if (i < pattern.length - 1) raw.push({ on: false, units: 1 });
  }
  const rawTotal = raw.reduce((sum, seg) => sum + seg.units, 0) * unit;
  const usable = Math.max(periodS * 0.8, rawTotal * 0.2);
  const scale = Math.min(1, usable / rawTotal);
  const phases: LightPhase[] = [];
  for (const seg of raw) {
    const d = seg.units * unit * scale;
    if (seg.on) pushOn(phases, d, color);
    else pushOff(phases, d, color);
  }
  const used = phases.reduce((sum, p) => sum + p.durationS, 0);
  pushOff(phases, Math.max(0, periodS - used), color);
  return phases;
}

function buildPhases(
  family: LightFamily,
  groupCount: number,
  periodS: number,
  colors: LightColor[],
  morseLetter?: string,
): LightPhase[] {
  const n = Math.max(1, groupCount);
  const phases: LightPhase[] = [];

  switch (family) {
    case 'F':
      phases.push({ on: true, durationS: periodS, color: phaseColor(colors, 0) });
      return phases;

    case 'Iso': {
      const half = periodS / 2;
      pushOn(phases, half, phaseColor(colors, 0));
      pushOff(phases, half, phaseColor(colors, 0));
      return phases;
    }

    case 'Oc': {
      const off = Math.min(Math.max(periodS * 0.22, 0.4), 2);
      const on = Math.max(0.1, periodS - off);
      pushOn(phases, on, phaseColor(colors, 0));
      pushOff(phases, periodS - on, phaseColor(colors, 0));
      return phases;
    }

    case 'Mo': {
      return buildMorsePhases(morseLetter ?? 'A', periodS, phaseColor(colors, 0));
    }

    case 'Q':
    case 'VQ':
    case 'UQ': {
      const flash = QUICK_RATE[family] ?? 0.3;
      if (groupCount <= 1) {
        pushOn(phases, flash, phaseColor(colors, 0));
        pushOff(phases, Math.max(0.05, periodS - flash), phaseColor(colors, 0));
        return phases;
      }
      const gap = flash;
      let groupSpan = n * flash + (n - 1) * gap;
      let flashDur = flash;
      if (groupSpan > periodS * 0.82) {
        flashDur = Math.max(0.06, (periodS * 0.82) / (n * 2 - 1));
        groupSpan = n * flashDur * 2 - flashDur;
      }
      for (let i = 0; i < n; i++) {
        pushOn(phases, flashDur, phaseColor(colors, i));
        pushOff(phases, i === n - 1 ? 0 : flashDur, phaseColor(colors, i));
      }
      pushOff(phases, Math.max(0, periodS - groupSpan), phaseColor(colors, n - 1));
      return phases;
    }

    case 'Fl':
    case 'LFl': {
      const isLong = family === 'LFl';
      const singleFlash = isLong
        ? Math.min(Math.max(periodS * 0.4, 2), 4.5)
        : Math.min(Math.max(periodS * 0.14, 0.4), 1.5);
      if (groupCount <= 1) {
        pushOn(phases, Math.min(singleFlash, periodS * 0.8), phaseColor(colors, 0));
        pushOff(phases, Math.max(0, periodS - Math.min(singleFlash, periodS * 0.8)), phaseColor(colors, 0));
        return phases;
      }
      let flashDur = singleFlash;
      const gapDefault = isLong ? flashDur * 0.4 : flashDur;
      let span = n * flashDur + (n - 1) * gapDefault;
      if (span > periodS * 0.8) {
        flashDur = Math.max(0.15, periodS * 0.8 / (n + (n - 1) * (isLong ? 0.4 : 1)));
        span = n * flashDur + (n - 1) * flashDur * (isLong ? 0.4 : 1);
      }
      const gap = (span - n * flashDur) / Math.max(1, n - 1);
      for (let i = 0; i < n; i++) {
        pushOn(phases, flashDur, phaseColor(colors, i));
        if (i < n - 1) pushOff(phases, gap, phaseColor(colors, i));
      }
      pushOff(phases, Math.max(0, periodS - span), phaseColor(colors, n - 1));
      return phases;
    }
  }
}

export function parseLightCharacter(raw: string): LightCharacter {
  const spec = parseTokens(raw);
  const periodS = spec.periodS ?? DEFAULT_PERIOD[spec.family];
  if (!(periodS > 0)) throw new Error(`灯质周期无效: ${raw}`);
  const colors: LightColor[] = spec.colors.length ? spec.colors : ['W'];
  const groupCount = spec.family === 'Mo' ? 1 : spec.groupCount;
  const phases = buildPhases(spec.family, groupCount, periodS, colors, spec.morseLetter);
  return {
    raw,
    family: spec.family,
    groupCount,
    colors,
    periodS,
    phases,
    morseLetter: spec.morseLetter,
  };
}

/**
 * Intensity envelope at time t (seconds). On/off edges are ramped slightly so
 * the glow reads as a real lamp rather than a hard rectangle.
 */
export function sampleLightCharacter(character: LightCharacter, tSec: number): LightSample {
  // A fixed light is on forever. Running it through the generic phase walk
  // would apply the edge ramp at every period boundary, making a 定光 blink once
  // a second — the one characteristic where that is unmistakably wrong.
  if (character.family === 'F') {
    const periodFraction = ((tSec % character.periodS) + character.periodS) % character.periodS / character.periodS;
    return {
      intensity: 1,
      color: character.phases[0].color,
      on: true,
      phaseIndex: 0,
      tInPhase: 0,
      periodFraction,
    };
  }
  const period = character.periodS;
  let t = ((tSec % period) + period) % period;
  let index = 0;
  let accumulate = 0;
  for (let i = 0; i < character.phases.length; i++) {
    const p = character.phases[i];
    if (t < accumulate + p.durationS || i === character.phases.length - 1) {
      index = i;
      break;
    }
    accumulate += p.durationS;
  }
  const phase = character.phases[index];
  const tInPhase = t - accumulate;
  const ramp = Math.min(0.07, phase.durationS / 3);
  let intensity = 0;
  if (phase.on) {
    const attack = ramp > 0 ? Math.min(1, tInPhase / ramp) : 1;
    const decay = ramp > 0 ? Math.min(1, (phase.durationS - tInPhase) / ramp) : 1;
    intensity = Math.max(0, Math.min(attack, decay));
    intensity = intensity * intensity * (3 - 2 * intensity);
  }
  return {
    intensity,
    color: phase.color,
    on: phase.on,
    phaseIndex: index,
    tInPhase,
    periodFraction: t / period,
  };
}

export function describeLightCharacter(character: LightCharacter): string {
  const family = FAMILY_NAMES[character.family];
  const color = character.colors.map((c) => COLOR_NAMES[c]).join('/');
  const group = character.groupCount > 1 ? `(${character.groupCount})` : '';
  const morse = character.family === 'Mo' ? `(${character.morseLetter ?? 'A'})` : '';
  return `${family}${group}${morse} ${color} ${formatPeriod(character.periodS)}`;
}

export function formatPeriod(seconds: number): string {
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

export const LIGHT_COLOR_NAMES = COLOR_NAMES;
