/**
 * Photometry and atmospheric attenuation.
 *
 * Ranges follow the standard charting relationship:
 *   - luminous range by Allard's law with a Koschmieder extinction coefficient
 *   - geographic range by the dip-of-horizon formula (2.08·(√H + √h) nm)
 *   - the visible range is the smaller of the two, further capped by visibility
 *
 * Halos use the resulting range in metres; the renderer converts to pixels with
 * the current Web-Mercator scale so the halo keeps a stable ground footprint
 * while zooming.
 */
import { clamp, metersPerPixel, NM_TO_M } from './geo.ts';

export type Mode = 'night' | 'day';

export interface VisibilityGrade {
  id: VisibilityGradeId;
  label: string;
  en: string;
  visNm: number;
  short: string;
}

export type VisibilityGradeId = 'clear' | 'good' | 'moderate' | 'poor' | 'fog';

export const VISIBILITY_GRADES: readonly VisibilityGrade[] = [
  { id: 'clear', label: '晴朗', en: 'CLEAR', visNm: 12, short: '12 nm' },
  { id: 'good', label: '良好', en: 'GOOD', visNm: 6, short: '6 nm' },
  { id: 'moderate', label: '中等', en: 'MODERATE', visNm: 3, short: '3 nm' },
  { id: 'poor', label: '能见度差', en: 'POOR', visNm: 1.5, short: '1.5 nm' },
  { id: 'fog', label: '浓雾', en: 'FOG', visNm: 0.5, short: '0.5 nm' },
];

export function visibilityGrade(id: VisibilityGradeId): VisibilityGrade {
  return VISIBILITY_GRADES.find((g) => g.id === id) ?? VISIBILITY_GRADES[0];
}

/** Koschmieder extinction coefficient, per metre. */
export function extinctionPerM(visNm: number): number {
  return 3.912 / Math.max(50, visNm * NM_TO_M);
}

const KOSCHMIEDER_THRESHOLD_LUX: Record<Mode, number> = {
  night: 2.1e-7,
  day: 4.2e-6,
};

/**
 * Solve I/d²·e^(−σd) = E_t for d by bisection.
 * The function is strictly decreasing in d on (0, ∞).
 */
export function allardRangeM(intensityCd: number, visNm: number, mode: Mode): number {
  if (!(intensityCd > 0)) return 0;
  const sigma = extinctionPerM(visNm);
  const target = KOSCHMIEDER_THRESHOLD_LUX[mode];
  let lo = 1;
  let hi = 200_000;
  const at = (d: number): number => (intensityCd / (d * d)) * Math.exp(-sigma * d);
  if (at(lo) <= target) return 0;
  if (at(hi) > target) return hi;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (at(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function geographicRangeM(focalHeightM: number, eyeHeightM: number): number {
  const h = Math.max(0, focalHeightM);
  const e = Math.max(0.5, eyeHeightM);
  return 2.08 * (Math.sqrt(h) + Math.sqrt(e)) * NM_TO_M;
}

export interface Atmosphere {
  mode: Mode;
  visNm: number;
  eyeHeightM: number;
  extinction: number;
  /** Ambient darkness 0..1, used for basemap dimming and label contrast. */
  darkness: number;
}

export function atmosphereFor(mode: Mode, grade: VisibilityGradeId, eyeHeightM = 9): Atmosphere {
  const visNm = visibilityGrade(grade).visNm;
  return {
    mode,
    visNm,
    eyeHeightM,
    extinction: extinctionPerM(visNm),
    darkness: mode === 'night' ? clamp(0.55 + (1 - visNm / 12) * 0.35, 0.55, 0.95) : 0,
  };
}

export interface LightReach {
  luminousRangeM: number;
  geographicRangeM: number;
  visibleRangeM: number;
  /** Peak relative energy used for glow brightness, 0..~1.6. */
  energy: number;
  /** Attenuation relative to a clear night. */
  attenuation: number;
  /** Pixel radius at the given zoom; computed by haloRangePx. */
}

export function computeReach(
  intensityCd: number,
  focalHeightM: number,
  atmosphere: Atmosphere,
): LightReach {
  const luminous = allardRangeM(intensityCd, atmosphere.visNm, atmosphere.mode);
  const geographic = geographicRangeM(focalHeightM, atmosphere.eyeHeightM);
  const visibilityCap = atmosphere.visNm * NM_TO_M * 1.35;
  const visible = Math.min(luminous, geographic, visibilityCap);
  const attenuation =
    Math.exp(-atmosphere.extinction * Math.max(visible * 0.32, 1)) *
    (atmosphere.mode === 'night' ? 1 : 0.18);
  const intensityTerm = clamp(0.46 + 0.29 * Math.log10(Math.max(1, intensityCd) / 1000), 0.2, 1.5);
  const energy = clamp(
    intensityTerm * (0.5 + 0.5 * clamp(atmosphere.visNm / 10, 0.05, 1.2)) * (0.55 + 0.9 * attenuation),
    0.05,
    1.55,
  );
  return {
    luminousRangeM: luminous,
    geographicRangeM: geographic,
    visibleRangeM: Math.max(0, visible),
    energy,
    attenuation,
  };
}

export interface HaloScale {
  radiusPx: number;
  radiusRawPx: number;
  clamped: boolean;
  metersPerPx: number;
}

/**
 * Convert a ground range to a screen radius at a zoom level. Clamps keep the
 * halo usable at both extremes; `clamped` is surfaced in the inspector so the
 * operator can see when the scale lock is no longer exact.
 */
export function haloRangePx(
  visibleRangeM: number,
  lat: number,
  zoom: number,
  minPx = 26,
  maxPx = 560,
): HaloScale {
  const mpp = metersPerPixel(lat, zoom);
  const raw = visibleRangeM / mpp;
  const radiusPx = clamp(raw, minPx, maxPx);
  return {
    radiusPx,
    radiusRawPx: raw,
    clamped: raw < minPx || raw > maxPx,
    metersPerPx: mpp,
  };
}

/**
 * Near-field atmospheric bloom radius, in ground metres.
 *
 * This is deliberately separate from the charted luminous range: the bloom is
 * the visually dominant scattering around the lamp, and would cover the whole
 * chart if it followed a 20 nm range at chart scale. Long-range illumination is
 * shown instead by the lit stretches of the route. The bloom still responds to
 * luminous intensity, focal height, visibility and day/night, and converts to
 * pixels with the live Web-Mercator scale, so its footprint stays fixed while
 * zooming.
 */
export function haloGroundRadiusM(
  intensityCd: number,
  focalHeightM: number,
  atmosphere: Atmosphere,
): number {
  // Calibrated so a 480 kcd tower on a 34 m focal plane has a ~2.6 km bloom —
  // roughly a sixth of the chart window at the default zoom, which reads as a
  // light rather than as weather. A 9 kcd buoy falls to ~1.2 km. The renderer
  // additionally bounds the footprint to a fraction of the viewport so a close
  // zoom cannot turn one lamp into a full-screen wash.
  const intensityTerm = clamp(Math.log10(Math.max(1, intensityCd) / 1000) + 1.2, 0, 4);
  const base = 560 + 430 * intensityTerm;
  const heightTerm = 0.55 + 0.45 * clamp(focalHeightM / 40, 0, 1.6);
  const visTerm = 0.45 + 0.55 * clamp(atmosphere.visNm / 12, 0.08, 1);
  const modeTerm = atmosphere.mode === 'night' ? 1 : 0.22;
  return base * heightTerm * visTerm * modeTerm;
}

export interface HaloGeometry {
  groundRadiusM: number;
  radiusPx: number;
  radiusRawPx: number;
  clamped: boolean;
  metersPerPx: number;
}

export function haloGeometry(
  intensityCd: number,
  focalHeightM: number,
  lat: number,
  zoom: number,
  atmosphere: Atmosphere,
): HaloGeometry {
  const ground = haloGroundRadiusM(intensityCd, focalHeightM, atmosphere);
  const scale = haloRangePx(ground, lat, zoom, 34, 460);
  return {
    groundRadiusM: ground,
    radiusPx: scale.radiusPx,
    radiusRawPx: scale.radiusRawPx,
    clamped: scale.clamped,
    metersPerPx: scale.metersPerPx,
  };
}

/** Glow strength multiplier for the current mode and visibility. */
export function glowGain(atmosphere: Atmosphere): number {
  const night = atmosphere.mode === 'night' ? 1 : 0.12;
  const vis = clamp(atmosphere.visNm / 12, 0.16, 1);
  return night * (0.45 + 0.75 * Math.pow(vis, 0.7));
}

export interface ScreenRadiusReport {
  id: string;
  radiusPx: number;
  radiusRawPx: number;
  clamped: boolean;
  visibleRangeNm: number;
}

export function describeReach(reach: LightReach): string {
  const nm = reach.visibleRangeM / NM_TO_M;
  return nm >= 10 ? `${nm.toFixed(0)} nm` : `${nm.toFixed(1)} nm`;
}
