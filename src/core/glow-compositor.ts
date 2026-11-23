/**
 * Multi-light halo composition.
 *
 * The renderer must never let a stack of overlapping halos turn into grey mush.
 * Two rules do the work:
 *
 *  1. Painter's ordering by brightness and distance — dim, far lamps are laid
 *     down first; bright, near lamps last, so the dominant lamp owns the
 *     overlap core.
 *  2. Overlap suppression — each lamp's core exposure is divided by the energy
 *     of the higher-priority lamps it overlaps. The brighter lamp keeps its
 *     colour instead of every channel clipping to white, which is exactly the
 *     grey-out artefact.
 *
 * Everything here is pure so the ordering and suppression can be unit tested
 * without a browser.
 */

import { clamp } from './geo.ts';

export type RGB = readonly [number, number, number];

export interface GlowSource {
  id: string;
  /** Screen position, CSS pixels. */
  x: number;
  y: number;
  /** Screen radius, CSS pixels (derived from a ground range). */
  radiusPx: number;
  /** Luminous intensity in candela. */
  intensityCd: number;
  /** Normalised 0..~2 luminance used for ordering. */
  luminance: number;
  /** Distant (metres) from the observer, used for ordering. */
  distanceM: number;
  /** Current light-character envelope 0..1. */
  envelope: number;
  /** Display colour (already gamma-ish sRGB). */
  color: RGB;
  /** Focal height, used as a final deterministic tie-break. */
  focalHeightM: number;
  /** Viewport bounds, for culling. */
  visible: boolean;
}

export interface GlowDrawItem {
  source: GlowSource;
  /** Position in the draw list, 0 first. */
  index: number;
  /** Multiplier applied to the sprite's peak alpha. */
  gain: number;
  /** Effective peak alpha for this frame. */
  peakAlpha: number;
  /** Sum of higher-priority overlap energy that suppressed this source. */
  suppression: number;
}

export interface GlowComposition {
  items: GlowDrawItem[];
  /** Number of ordered pairs that actually overlap on screen. */
  overlapPairs: number;
  maxSuppression: number;
  totalPeak: number;
  /** True when the stack is dense enough that suppression is doing real work. */
  crowded: boolean;
}

export function glowPriority(s: GlowSource): number {
  const proximity = 1 / (1 + s.distanceM / 9000);
  return s.luminance * (0.3 + 0.7 * s.envelope) * proximity;
}

/**
 * Ascending priority: index 0 is drawn first (dim/far), the last item is the
 * brightest nearest lamp. Array#sort is not guaranteed stable for large lists
 * in older engines, so ties fall back to id for determinism.
 */
export function sortGlowSources(sources: readonly GlowSource[]): GlowSource[] {
  const keyed = sources.map((s) => ({ s, key: glowPriority(s) }));
  keyed.sort((a, b) => {
    if (a.key !== b.key) return a.key - b.key;
    if (a.s.distanceM !== b.s.distanceM) return b.s.distanceM - a.s.distanceM;
    if (a.s.focalHeightM !== b.s.focalHeightM) return a.s.focalHeightM - b.s.focalHeightM;
    return a.s.id < b.s.id ? -1 : a.s.id > b.s.id ? 1 : 0;
  });
  return keyed.map((k) => k.s);
}

/** Lens area of two overlapping circles. */
export function circleOverlapArea(r1: number, r2: number, d: number): number {
  if (r1 <= 0 || r2 <= 0) return 0;
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) {
    const rMin = Math.min(r1, r2);
    return Math.PI * rMin * rMin;
  }
  const a1 = Math.acos(clamp((d * d + r1 * r1 - r2 * r2) / (2 * d * r1), -1, 1));
  const a2 = Math.acos(clamp((d * d + r2 * r2 - r1 * r1) / (2 * d * r2), -1, 1));
  const tri = Math.sqrt(
    Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)),
  ) / 4;
  return r1 * r1 * a1 + r2 * r2 * a2 - tri * 2;
}

/** Fraction of circle 1's disc covered by the overlap with circle 2. */
export function overlapFraction(r1: number, r2: number, d: number): number {
  if (r1 <= 0) return 0;
  return clamp(circleOverlapArea(r1, r2, d) / (Math.PI * r1 * r1), 0, 1);
}

export interface ComposeOptions {
  /** How aggressively a bright overlapping lamp suppresses a dim one. */
  suppressionStrength?: number;
  /** Base gain floor so a suppressed lamp never disappears entirely. */
  minGain?: number;
  /** Below this effective alpha, skip the draw. */
  cullAlpha?: number;
}

/**
 * Build the ordered draw list with per-lamp exposure gains.
 *
 * Sources are sorted ascending by priority. For each source we sum the energy
 * of every later (brighter/nearer) source whose halo overlaps it, weighted by
 * the fraction of its own disc that is covered. That sum divides its exposure.
 */
export function composeGlows(
  sources: readonly GlowSource[],
  options: ComposeOptions = {},
): GlowComposition {
  const strength = options.suppressionStrength ?? 0.95;
  const minGain = options.minGain ?? 0.1;
  const cullAlpha = options.cullAlpha ?? 0.006;

  const live = sortGlowSources(
    sources.filter((s) => s.visible && s.radiusPx > 0 && s.intensityCd > 0),
  );

  const items: GlowDrawItem[] = [];
  let overlapPairs = 0;
  let maxSuppression = 0;
  let totalPeak = 0;

  for (let i = 0; i < live.length; i++) {
    const s = live[i];
    let suppression = 0;
    for (let j = i + 1; j < live.length; j++) {
      const t = live[j];
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d >= s.radiusPx + t.radiusPx) continue;
      const frac = overlapFraction(s.radiusPx, t.radiusPx, d);
      if (frac <= 0.0001) continue;
      overlapPairs++;
      const laterEnergy = t.luminance * (0.3 + 0.7 * t.envelope);
      suppression += laterEnergy * frac;
    }
    suppression = Math.max(0, suppression);
    maxSuppression = Math.max(maxSuppression, suppression);
    const gain = clamp(1 / (1 + strength * suppression), minGain, 1);
    const peakAlpha = s.envelope * gain;
    totalPeak += peakAlpha;
    if (peakAlpha < cullAlpha) continue;
    items.push({ source: s, index: items.length, gain, peakAlpha, suppression });
  }

  return {
    items,
    overlapPairs,
    maxSuppression,
    totalPeak,
    crowded: overlapPairs > 0 && maxSuppression > 0.2,
  };
}

/**
 * Apply exposure with a max-channel tone curve. Scaling every channel by the
 * same factor keeps hue and saturation, where per-channel clipping would drift
 * to white. Exposed for diagnostics and tests.
 */
export function huePreservingExposure(
  rgb: RGB,
  exposure: number,
  knee = 0.82,
): [number, number, number] {
  const r = Math.max(0, rgb[0] * exposure);
  const g = Math.max(0, rgb[1] * exposure);
  const b = Math.max(0, rgb[2] * exposure);
  const m = Math.max(r, g, b);
  if (m <= knee) return [r, g, b];
  const shoulder = knee + (1 - knee) * (1 - Math.exp(-(m - knee) / (1 - knee)));
  const f = shoulder / m;
  return [r * f, g * f, b * f];
}
