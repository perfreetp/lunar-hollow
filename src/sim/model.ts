import {
  SEG, RINGS, TOTAL_RINGS, VERT_COUNT,
  vertexIndex, ringRho, collarDrop,
} from './layout.ts';
import {
  MATERIALS, tensionFor, type DrumConfig, type StrikeSpec, type MaterialId,
  type MaterialSpec,
} from './types.ts';

/* ------------------------------------------------------------------ */
/* Bessel J_m and the circular-membrane mode table.                    */
/* ------------------------------------------------------------------ */

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export function besselJ(m: number, x: number): number {
  if (m === 0) {
    let term = 1;
    let sum = 1;
    for (let k = 1; k < 140; k++) {
      term *= -(x * x) / (4 * k * k);
      sum += term;
      if (Math.abs(term) < 1e-18 * Math.abs(sum) || Math.abs(term) < 1e-24) break;
    }
    return sum;
  }
  let term = Math.pow(x / 2, m) / factorial(m);
  let sum = term;
  for (let k = 1; k < 140; k++) {
    term *= -(x * x / 4) / (k * (k + m));
    sum += term;
    if (Math.abs(term) < 1e-18 * Math.abs(sum) || Math.abs(term) < 1e-24) break;
  }
  return sum;
}

interface Mode { m: number; n: number; x: number }

/**
 * Zeros of J_m for m = 0..8, capped at x <= 12.35. That is 29 modes, enough
 * to carry the visible body of the head's response without letting
 * unrepresentable high modes alias into the animation.
 */
const ZEROS: Record<number, number[]> = {
  0: [2.404826, 5.520078, 8.653728, 11.791534],
  1: [3.831706, 7.015587, 10.173468],
  2: [5.135622, 8.417244, 11.619841],
  3: [6.380162, 9.761023],
  4: [7.588342, 11.064709],
  5: [8.771484],
  6: [9.93611],
  7: [11.08637],
  8: [12.225092],
};

export const MODES: Mode[] = (() => {
  const out: Mode[] = [];
  for (const key of Object.keys(ZEROS)) {
    const m = Number(key);
    ZEROS[m].forEach((x, n) => out.push({ m, n: n + 1, x }));
  }
  out.sort((p, q) => p.x - q.x);
  return out;
})();

/* ------------------------------------------------------------------ */
/* Playback time base.                                                 */
/*                                                                     */
/* A real head rings at 100-1000 Hz, far faster than a display can show. */
/* The animation therefore runs in "view time": modal frequencies are    */
/* divided by TIME_DILATION and the damping stretched to match, giving   */
/* a clean slow-motion ring-down. Physical numbers (Hz, MPa, mm, real    */
/* sustain) are still derived from the undilated model and shown as such.*/
/* ------------------------------------------------------------------ */

export const FRAME_COUNT = 108;
export const VIEW_DURATION = 2.6;
export const TIME_DILATION = 34;

export const FRAME_TIMES: Float32Array = (() => {
  const t = new Float32Array(FRAME_COUNT);
  const dense = 48; // first 90 ms of view time, ~1.9 ms steps
  for (let i = 0; i <= dense; i++) t[i] = (0.09 * i) / dense;
  for (let i = dense + 1; i < FRAME_COUNT; i++) {
    const u = (i - dense) / (FRAME_COUNT - 1 - dense);
    t[i] = 0.09 + (VIEW_DURATION - 0.09) * Math.pow(u, 1.1);
  }
  return t;
})();

/* ------------------------------------------------------------------ */
/* Pre-tension geometry.                                               */
/* ------------------------------------------------------------------ */

export interface HeadBase {
  /** mm, interleaved xyz, y up. */
  positions: Float32Array;
  /** mm, resting y per vertex. */
  baseY: Float32Array;
  crownMm: number;
  wrinkleMm: number;
  tension: number; // N/m
  f0: number; // Hz
  waveSpeed: number; // m/s
  aMm: number;
  rimRadiusMm: number;
  depthMm: number;
  preStressMpa: number;
}

export function buildHeadBase(config: DrumConfig): HeadBase {
  const mat = MATERIALS[config.materialId];
  const diameterMm = config.diameterIn * 25.4;
  const rimRadiusMm = diameterMm / 2;
  const aMm = rimRadiusMm;
  const tension = tensionFor(config.materialId, config.tensionLevel);
  const hM = mat.thicknessMm * 1e-3;
  const sigma = mat.density * hM;
  const waveSpeed = Math.sqrt(tension / sigma);
  const aM = aMm / 1000;

  const crownMm = (0.34 + 1.55 * Math.pow(2400 / tension, 0.85)) * Math.pow(aMm / 171, 0.35);

  // Only the very slackest setting shows a standing wrinkle ring near the edge.
  const slack = Math.max(
    0,
    1 - (tension - mat.tensionMin) / (0.26 * (mat.tensionMax - mat.tensionMin)),
  );
  const wrinkleMm = 0.3 * Math.pow(slack, 1.8);

  const edgeDropMm = 5.5 + config.depthIn * 0.28;
  const positions = new Float32Array(VERT_COUNT * 3);
  const baseY = new Float32Array(VERT_COUNT);

  for (let ring = 0; ring <= TOTAL_RINGS; ring++) {
    const start = ring === 0 ? 0 : 1 + (ring - 1) * SEG;
    const count = ring === 0 ? 1 : SEG;
    for (let j = 0; j < count; j++) {
      const theta = (j / SEG) * Math.PI * 2;
      const r = ringRho(ring) * aMm;
      let y: number;
      if (ring <= RINGS) {
        const rr = ring / RINGS;
        y = crownMm * (1 - rr * rr);
        if (wrinkleMm > 0.001 && ring > 0) {
          const env = Math.pow(rr, 2.6) * Math.pow(Math.max(0, 1 - rr), 0.6) * 4.2;
          y += wrinkleMm * env * Math.sin(9 * theta + 2.2);
        }
      } else {
        y = -edgeDropMm * collarDrop(ring) - wrinkleMm * 0.2;
      }
      const vi = start + j;
      positions[vi * 3] = Math.cos(theta) * r;
      positions[vi * 3 + 1] = y;
      positions[vi * 3 + 2] = Math.sin(theta) * r;
      baseY[vi] = y;
    }
  }

  const f0 = (MODES[0].x * waveSpeed) / (Math.PI * 2 * aM);
  return {
    positions,
    baseY,
    crownMm,
    wrinkleMm,
    tension,
    f0,
    waveSpeed,
    aMm,
    rimRadiusMm,
    depthMm: config.depthIn * 25.4,
    preStressMpa: tension / hM / 1e6,
  };
}

/* ------------------------------------------------------------------ */
/* Stress model.                                                       */
/*                                                                     */
/* Membrane stress = pre-tension (with the classical edge              */
/* concentration near the bearing edge) + a dynamic term driven by the  */
/* local slope and curvature of the travelling wave + the contact       */
/* pressure while the mallet is down.                                   */
/* ------------------------------------------------------------------ */

export interface StressContext {
  preStressMpa: number;
  eMpa: number;
  hMm: number;
  dr: number;
  invDr: number;
  invDth: number;
  invR2: Float32Array;
  staticCurv: number;
  edgeGain: Float32Array;
  collarStress: Float32Array;
  dynGain: number;
}

export function makeStressContext(base: HeadBase, mat: MaterialSpec): StressContext {
  const dr = base.aMm / RINGS;
  const edgeGain = new Float32Array(RINGS + 1);
  const invR2 = new Float32Array(RINGS + 1);
  for (let ri = 1; ri <= RINGS; ri++) {
    edgeGain[ri] = 0.42 * Math.exp(-(1 - ri / RINGS) * 16);
    invR2[ri] = 1 / (ri * dr * ri * dr);
  }
  const collarStress = new Float32Array(TOTAL_RINGS + 1);
  for (let ri = RINGS; ri <= TOTAL_RINGS; ri++) {
    collarStress[ri] = base.preStressMpa * Math.max(0.35, 0.95 - 0.11 * (ri - RINGS));
  }
  return {
    preStressMpa: base.preStressMpa,
    eMpa: mat.elasticMpa,
    hMm: mat.thicknessMm,
    dr,
    invDr: 1 / dr,
    invDth: SEG / (Math.PI * 2),
    invR2,
    staticCurv: (2 * base.crownMm) / (base.aMm * base.aMm),
    edgeGain,
    collarStress,
    dynGain: 2.2 * mat.elasticMpa,
  };
}

/**
 * Writes one stress frame into `out` at `off` (MPa, frame-major).
 * `disp` may be null for the resting head. `contact` is an optional additive
 * pressure field of length VERT_COUNT.
 */
export function fillStressFrame(
  out: Float32Array,
  off: number,
  disp: Float32Array | null,
  dispOff: number,
  ctx: StressContext,
  contact: Float32Array | null,
): { max: number; maxRho: number } {
  const { invDr, invDth, invR2, staticCurv, edgeGain, preStressMpa, dynGain } = ctx;
  let max = 0;
  let maxRho = 0;
  for (let ri = 1; ri <= RINGS; ri++) {
    const pre = preStressMpa * (1 + edgeGain[ri]);
    const invR = 1 / (ri * ctx.dr);
    const start = 1 + (ri - 1) * SEG;
    const upStart = ri === 1 ? 0 : 1 + (ri - 2) * SEG;
    const dnStart = ri < RINGS ? 1 + ri * SEG : start;
    const r2 = invR2[ri];
    const isRim = ri === RINGS;
    const wu2Start = isRim ? 1 + (RINGS - 3) * SEG : 0;
    for (let j = 0; j < SEG; j++) {
      const jp = j + 1 === SEG ? 0 : j + 1;
      const jm = j === 0 ? SEG - 1 : j - 1;
      const vi = start + j;
      let wc = 0;
      let wu = 0;
      let wl = 0;
      let wr = 0;
      let wd = 0;
      let wu2 = 0;
      if (disp) {
        wc = disp[dispOff + vi];
        wu = ri === 1 ? disp[dispOff] : disp[dispOff + upStart + j];
        wl = disp[dispOff + start + jm];
        wr = disp[dispOff + start + jp];
        wd = ri < RINGS ? disp[dispOff + dnStart + j] : wc;
        wu2 = isRim ? disp[dispOff + wu2Start + j] : 0;
      }
      const dwdr = isRim ? (wc - wu) * invDr : (wd - wu) * 0.5 * invDr;
      const dwdt = (wr - wl) * 0.5 * invDth * invR;
      const slope2 = dwdr * dwdr + dwdt * dwdt;
      let d2r: number;
      if (isRim) d2r = (wc - 2 * wu + wu2) * invDr * invDr;
      else if (ri === 1) {
        // inward neighbour of ring 1 is the centre vertex
        d2r = (wd - 2 * wc + (disp ? disp[dispOff] : 0)) * invDr * invDr;
      } else d2r = (wd - 2 * wc + wu) * invDr * invDr;
      const d2t = (wr - 2 * wc + wl) * invDth * invDth * r2;
      const curv = Math.abs(d2r + dwdr * invR + d2t) + staticCurv;
      const membraneStrain = 0.5 * slope2;
      const bendingStrain = ctx.hMm * 0.5 * curv;
      const rawDyn = dynGain * Math.sqrt(membraneStrain * membraneStrain + bendingStrain * bendingStrain);
      // Soft ceiling: strikes right at the bearing edge would otherwise
      // report hundreds of MPa. The knee keeps ordinary playing levels linear.
      const dyn = rawDyn <= 45 ? rawDyn : 45 + (rawDyn - 45) / (1 + (rawDyn - 45) / 55);
      let value = pre + dyn;
      if (contact) {
        const c = contact[vi];
        if (c !== 0) value += c;
      }
      out[off + vi] = value;
      if (value > max) {
        max = value;
        maxRho = ri / RINGS;
      }
    }
  }
  let centre = 0;
  for (let j = 0; j < SEG; j++) centre += out[off + vertexIndex(1, j)];
  out[off] = centre / SEG;
  if (out[off] > max) {
    max = out[off];
    maxRho = 0;
  }
  for (let ri = RINGS + 1; ri <= TOTAL_RINGS; ri++) {
    const start = 1 + (ri - 1) * SEG;
    const v = ctx.collarStress[ri];
    for (let j = 0; j < SEG; j++) out[off + start + j] = v;
  }
  return { max, maxRho };
}

/* ------------------------------------------------------------------ */
/* One strike: contact dent + modal ring-down (in view time).          */
/* ------------------------------------------------------------------ */

/**
 * Clamp window over the membrane: the head is fixed at the bearing edge, so
 * any displacement must vanish there. Without this, a strike near the rim
 * drags vertices over the edge and the mesh visually tears.
 */
const RIM_WINDOW: Float32Array = (() => {
  const w = new Float32Array(RINGS + 1);
  for (let r = 0; r <= RINGS; r++) {
    const rho = r / RINGS;
    // full amplitude in the middle, rolling off over the last ~6 %
    const t = Math.min(1, Math.max(0, (1 - rho) / 0.07));
    w[r] = t * t * (3 - 2 * t);
  }
  w[RINGS] = 0;
  return w;
})();

export function contactRadiusMm(strike: StrikeSpec): number {
  return 2.2 + 4.4 * strike.hardness;
}

export function dentDepthMm(base: HeadBase, strike: StrikeSpec): number {
  return (
    (0.55 + 1.5 * strike.strength) *
    Math.pow(2400 / base.tension, 0.95) *
    Math.pow(base.aMm / 171, 0.85) *
    (1.06 - 0.26 * strike.hardness)
  );
}

/** Contact-pressure envelope in view time, 0..1. */
export function contactEnvelope(t: number): number {
  return (1 - Math.exp(-t / 0.0022)) * Math.exp(-t / 0.028);
}

/** Dent envelope in view time, 0..1. */
export function dentEnvelope(t: number): number {
  return (1 - Math.exp(-t / 0.0045)) * Math.exp(-t / 0.036);
}

/**
 * View-time damping constant used to build the animation. Deliberately
 * independent of the physical damping so the ring-down is watchable.
 */
export function viewTau(mat: MaterialSpec, fView: number): number {
  return (2.5 * mat.decay) / (1 + Math.pow(fView / 2.4, 1.45));
}

/**
 * Physical amplitude time constant of the fundamental (seconds), from the
 * material's loss character and how fast it is driven. Reported in the UI.
 */
export function physicalTau(mat: MaterialSpec, f0: number): number {
  return mat.decay / (1 + Math.pow(f0 / 430, 1.05));
}

export function modeFrequenciesPhys(base: HeadBase): Float64Array {
  const aM = base.aMm / 1000;
  const out = new Float64Array(MODES.length);
  for (let q = 0; q < MODES.length; q++) {
    out[q] = (MODES[q].x * base.waveSpeed) / (Math.PI * 2 * aM);
  }
  return out;
}

/** Modal ring-down shape, normalised to its own global peak. */
export function buildRingField(
  base: HeadBase,
  strike: StrikeSpec,
  mat: MaterialSpec,
  freqsPhys: Float64Array,
): Float32Array {
  const Q = MODES.length;
  const V = VERT_COUNT;
  const contact = contactRadiusMm(strike);

  const weight = new Float64Array(Q);
  let maxW = 1e-12;
  for (let q = 0; q < Q; q++) {
    const md = MODES[q];
    const fView = freqsPhys[q] / TIME_DILATION;
    const kb = (md.x * contact) / base.aMm;
    const disk = kb < 1e-5 ? 1 : (2 * besselJ(1, kb)) / kb;
    const radial = besselJ(md.m, md.x * strike.rho);
    // Slow modes carry the visible shape; the 1/f^1.6 roll-off keeps the fast
    // ripples from aliasing into a shimmer.
    const w = radial * disk * Math.pow(2.6 / Math.max(0.42, fView), 0.62);
    weight[q] = w;
    maxW = Math.max(maxW, Math.abs(w));
  }
  for (let q = 0; q < Q; q++) weight[q] /= maxW;

  const shape = new Float32Array(Q * V);
  for (let q = 0; q < Q; q++) {
    const md = MODES[q];
    const baseOff = q * V;
    shape[baseOff] = besselJ(md.m, 0);
    for (let ring = 1; ring <= RINGS; ring++) {
      const jr = besselJ(md.m, md.x * (ring / RINGS));
      const start = 1 + (ring - 1) * SEG;
      for (let j = 0; j < SEG; j++) {
        shape[baseOff + start + j] =
          jr * Math.cos(md.m * ((j / SEG) * Math.PI * 2 - strike.theta));
      }
    }
  }

  const freqView = new Float64Array(Q);
  const tau = new Float64Array(Q);
  for (let q = 0; q < Q; q++) {
    freqView[q] = freqsPhys[q] / TIME_DILATION;
    tau[q] = viewTau(mat, freqView[q]);
  }

  const field = new Float32Array(FRAME_COUNT * V);
  const env = new Float64Array(Q);
  for (let fi = 0; fi < FRAME_COUNT; fi++) {
    const t = FRAME_TIMES[fi];
    for (let q = 0; q < Q; q++) {
      env[q] = Math.sin(2 * Math.PI * freqView[q] * t) * Math.exp(-t / tau[q]) * weight[q];
    }
    const off = fi * V;
    for (let q = 0; q < Q; q++) {
      const e = env[q];
      if (e === 0) continue;
      const sb = q * V;
      for (let v = 0; v < V; v++) {
        const s = shape[sb + v];
        if (s !== 0) field[off + v] += e * s;
      }
    }
  }
  return field;
}

export interface StrikeSim {
  displacement: Float32Array; // FRAME_COUNT * VERT_COUNT, mm
  stress: Float32Array; // FRAME_COUNT * VERT_COUNT, MPa
  footprint: Float32Array; // VERT_COUNT, 0..1 contact shape
  dentMm: number;
  dentRadiusMm: number;
  contactRadiusMm: number;
  frameMaxDisp: Float32Array;
  peakFrame: number;
}

export function buildStrike(
  base: HeadBase,
  strike: StrikeSpec,
  mat: MaterialSpec,
  ctx: StressContext,
  freqsPhys: Float64Array,
): StrikeSim {
  const N = FRAME_COUNT;
  const V = VERT_COUNT;
  const contact = contactRadiusMm(strike);
  const dentRadiusMm = contact * 5.4;
  const dentMm = dentDepthMm(base, strike);
  const ring = buildRingField(base, strike, mat, freqsPhys);
  const ringScale = dentMm * 1.1;

  // Contact footprint at rest.
  const footprint = new Float32Array(V);
  const sx = Math.cos(strike.theta) * strike.rho * base.aMm;
  const sz = Math.sin(strike.theta) * strike.rho * base.aMm;
  for (let ring_i = 1; ring_i <= RINGS; ring_i++) {
    const r = (ring_i / RINGS) * base.aMm;
    const start = 1 + (ring_i - 1) * SEG;
    for (let j = 0; j < SEG; j++) {
      const theta = (j / SEG) * Math.PI * 2;
      const d = Math.hypot(r * Math.cos(theta) - sx, r * Math.sin(theta) - sz) / dentRadiusMm;
      if (d < 1) footprint[start + j] = -Math.pow(1 - d * d, 2.4) * RIM_WINDOW[ring_i];
    }
  }
  {
    const d = Math.hypot(sx, sz) / dentRadiusMm;
    footprint[0] = d < 1 ? -Math.pow(1 - d * d, 2.4) : 0;
  }

  const displacement = new Float32Array(N * V);
  const stress = new Float32Array(N * V);
  const frameMaxDisp = new Float32Array(N);
  const contactField = new Float32Array(V);
  const contactAmp = 1.35 * base.preStressMpa * strike.strength;
  let peakDisp = 0;
  let peakFrame = 0;

  for (let fi = 0; fi < N; fi++) {
    const t = FRAME_TIMES[fi];
    const dentNow = dentMm * dentEnvelope(t);
    const off = fi * V;
    let fm = 0;
    for (let v = 0; v < V; v++) {
      const d = footprint[v] * dentNow + ring[off + v] * ringScale;
      displacement[off + v] = d;
      const ad = d < 0 ? -d : d;
      if (ad > fm) fm = ad;
      if (ad > peakDisp) {
        peakDisp = ad;
        peakFrame = fi;
      }
    }
    frameMaxDisp[fi] = fm;

    const amp = contactAmp * contactEnvelope(t);
    if (amp > 0.001) {
      for (let v = 0; v < V; v++) contactField[v] = footprint[v] * amp;
    } else {
      contactField.fill(0);
    }
    fillStressFrame(stress, off, displacement, off, ctx, contactField);
  }

  return {
    displacement,
    stress,
    footprint,
    dentMm,
    dentRadiusMm,
    contactRadiusMm: contact,
    frameMaxDisp,
    peakFrame,
  };
}

/* ------------------------------------------------------------------ */
/* Full simulation: per strike and combined (linear superposition).    */
/* ------------------------------------------------------------------ */

export interface StrikeMetrics {
  peakDispMm: number;
  peakFrame: number;
  peakStressMpa: number;
  peakStressRho: number;
  sustainSec: number;
  fundamentalHz: number;
  overtones: number[];
  dentMm: number;
  contactRadiusMm: number;
  strikeRho: number;
  strikeTheta: number;
  strength: number;
  hardness: number;
  /** Dynamic rise above the resting field at the concentration centre (MPa). */
  deltaStressMpa: number;
}

export interface SimResult {
  base: HeadBase;
  times: Float32Array;
  restStress: Float32Array;
  disp: Float32Array;
  stress: Float32Array;
  frameMaxDisp: Float32Array;
  frameMaxStress: Float32Array;
  peakFrame: number;
  peakStressMpa: number;
  peakStressRho: number;
  /** Largest rise above the resting stress field anywhere, any frame (MPa). */
  maxDeltaStress: number;
  metrics: StrikeMetrics[];
  perStrikeDisp: Float32Array[];
  perStrikeStress: Float32Array[];
  perStrikeGlow: Float32Array[];
  /** N*V, smoothed positive stress rise used for shading. */
  glow: Float32Array;
  strikeIds: string[];
  computeMs: number;
}

/**
 * Smoothed "hot spot" channel for shading. The dynamic stress rise is very
 * localised (a few millimetres under the mallet, sharp bends at wave crests),
 * which is physically right but nearly invisible on a 14-inch head. This
 * diffuses the rise over a couple of centimetres so stress concentration
 * reads at a glance, while the numbers stay the real ones.
 */
export function buildGlowField(
  stress: Float32Array,
  restStress: Float32Array,
  frames: number,
): Float32Array {
  const V = VERT_COUNT;
  const glow = new Float32Array(frames * V);
  // Coarse grid for a wide, cheap diffusion: GR x GS cells over the membrane.
  const GR = 22;
  const GS = 52;
  const coarse = new Float32Array(GR * GS);
  const temp = new Float32Array(GR * GS);
  const cellCount = new Float32Array(GR * GS);
  const rimTaper = new Float32Array(RINGS + 1);
  for (let r = 1; r <= RINGS; r++) {
    const rho = r / RINGS;
    rimTaper[r] = 0.28 + 0.72 * Math.min(1, Math.max(0, (1 - rho) / 0.14));
  }
  for (let fi = 0; fi < frames; fi++) {
    const off = fi * V;
    coarse.fill(0);
    cellCount.fill(0);
    // bin the fine field into cells
    for (let ri = 1; ri <= RINGS; ri++) {
      const cr = Math.min(GR - 1, Math.floor(((ri - 1) / RINGS) * GR));
      const rowOff = cr * GS;
      const start = 1 + (ri - 1) * SEG;
      for (let j = 0; j < SEG; j++) {
        const d = stress[off + start + j] - restStress[start + j];
        if (d <= 0) continue;
        const cj = Math.floor((j / SEG) * GS) % GS;
        coarse[rowOff + cj] += d;
        cellCount[rowOff + cj] += 1;
      }
    }
    for (let i = 0; i < coarse.length; i++) {
      coarse[i] = cellCount[i] > 0 ? coarse[i] / cellCount[i] : 0;
    }
    // diffuse on the coarse grid, wrapping around the angular direction
    // Diffuse only where there is something to diffuse. A plain box blur
    // spreads one hot cell over the whole grid and a radial blur turns it
    // into a ring, so the heat kernel is weighted by local activity.
    for (let pass = 0; pass < 7; pass++) {
      for (let r = 0; r < GR; r++) {
        for (let c = 0; c < GS; c++) {
          const i = r * GS + c;
          const up = r === 0 ? 0 : (r - 1) * GS + c;
          const dnI = (r === GR - 1 ? GR - 1 : r + 1) * GS + c;
          const l = r * GS + ((c + GS - 1) % GS);
          const rt = r * GS + ((c + 1) % GS);
          const near = Math.max(coarse[up], coarse[dnI], coarse[l], coarse[rt]);
          const w = near > coarse[i] ? 0.16 : 0.34;
          temp[i] = coarse[i] * w + (coarse[up] + coarse[dnI] + coarse[l] + coarse[rt]) * ((1 - w) / 4);
        }
      }
      coarse.set(temp);
    }
    // bilinear upsample back to the fine membrane
    for (let ri = 1; ri <= RINGS; ri++) {
      const fr = ((ri - 1) / RINGS) * GR - 0.5;
      const r0 = Math.max(0, Math.min(GR - 1, Math.floor(fr)));
      const r1 = Math.min(GR - 1, r0 + 1);
      const tr = Math.max(0, Math.min(1, fr - r0));
      const start = 1 + (ri - 1) * SEG;
      for (let j = 0; j < SEG; j++) {
        const fc = (j / SEG) * GS;
        const c0 = Math.floor(fc);
        const tc = fc - c0;
        const cA = c0 % GS;
        const cB = (c0 + 1) % GS;
        const top = coarse[r0 * GS + cA] * (1 - tc) + coarse[r0 * GS + cB] * tc;
        const bot = coarse[r1 * GS + cA] * (1 - tc) + coarse[r1 * GS + cB] * tc;
        // Taper toward the clamped edge: the geometry there is genuinely
        // steep, but a hot halo around the whole rim hides the strike zone.
        glow[off + start + j] = (top * (1 - tr) + bot * tr) * rimTaper[ri];
      }
    }
    glow[off] = glow[off + 1];
    for (let ri = RINGS + 1; ri <= TOTAL_RINGS; ri++) {
      const start = 1 + (ri - 1) * SEG;
      const src = 1 + (RINGS - 1) * SEG;
      for (let j = 0; j < SEG; j++) glow[off + start + j] = glow[off + src + j];
    }
  }
  return glow;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function runSimulation(config: DrumConfig, strikes: StrikeSpec[]): SimResult {
  const t0 = now();
  const base = buildHeadBase(config);
  const mat = MATERIALS[config.materialId as MaterialId];
  const ctx = makeStressContext(base, mat);
  const freqs = modeFrequenciesPhys(base);
  const N = FRAME_COUNT;
  const V = VERT_COUNT;

  const restStress = new Float32Array(V);
  fillStressFrame(restStress, 0, null, 0, ctx, null);

  const sims = strikes.map((s) => buildStrike(base, s, mat, ctx, freqs));
  const combinedDisp = new Float32Array(N * V);
  const combinedStress = new Float32Array(N * V);
  const frameMaxDisp = new Float32Array(N);
  const frameMaxStress = new Float32Array(N);

  const contactSum = new Float32Array(V);
  const dispScratch = new Float32Array(V);
  const ampEnv = new Float32Array(N);
  const contactAmp = strikes.map((s) => 1.35 * base.preStressMpa * s.strength);
  for (let fi = 0; fi < N; fi++) ampEnv[fi] = contactEnvelope(FRAME_TIMES[fi]);

  for (let fi = 0; fi < N; fi++) {
    const off = fi * V;
    contactSum.fill(0);
    for (let k = 0; k < sims.length; k++) {
      const sd = sims[k];
      const dsrc = sd.displacement;
      for (let v = 0; v < V; v++) combinedDisp[off + v] += dsrc[off + v];
      const a = contactAmp[k] * ampEnv[fi];
      if (a > 0.001) {
        const fp = sd.footprint;
        for (let v = 0; v < V; v++) {
          const f = fp[v];
          if (f !== 0) contactSum[v] += f * a;
        }
      }
    }
    let md = 0;
    for (let v = 0; v < V; v++) {
      const a = combinedDisp[off + v];
      const abs = a < 0 ? -a : a;
      if (abs > md) md = abs;
    }
    frameMaxDisp[fi] = md;
    fillStressFrame(combinedStress, off, combinedDisp, off, ctx, contactSum);
    let peakRise = 0;
    for (let v = 0; v < V; v++) {
      const rise = combinedStress[off + v] - restStress[v];
      if (rise > peakRise) peakRise = rise;
    }
    frameMaxStress[fi] = peakRise;
  }
  void dispScratch;

  let maxDeltaStress = 1e-6;
  for (let fi = 0; fi < N; fi++) {
    const off = fi * V;
    for (let v = 0; v < V; v++) {
      const d = combinedStress[off + v] - restStress[v];
      if (d > maxDeltaStress) maxDeltaStress = d;
    }
  }

  let peakFrame = 0;
  let best = -1;
  for (let fi = 0; fi < N; fi++) {
    if (frameMaxDisp[fi] > best) {
      best = frameMaxDisp[fi];
      peakFrame = fi;
    }
  }

  // Absolute peak across all frames, and where the dynamic part peaks (the
  // stress-concentration centre the shading is built around).
  let peakStressMpa = 0;
  let deltaPeak = 0;
  let peakStressRho = 0;
  for (let fi = 0; fi < N; fi++) {
    const off = fi * V;
    for (let v = 0; v < V; v++) {
      const s = combinedStress[off + v];
      if (s > peakStressMpa) peakStressMpa = s;
      const d = s - restStress[v];
      if (d > deltaPeak) {
        deltaPeak = d;
        const q = v === 0 ? 0 : Math.floor((v - 1) / SEG) + 1;
        peakStressRho = Math.min(1, q / RINGS);
      }
    }
  }

  const sustainSec = physicalTau(mat, base.f0) * Math.log(10);
  const metrics: StrikeMetrics[] = strikes.map((s, k) => {
    const sd = sims[k];
    let soloPeak = 0;
    let soloRise = 0;
    let soloRho = 0;
    for (let fi = 0; fi < N; fi++) {
      const off = fi * V;
      for (let v = 0; v < V; v++) {
        const val = sd.stress[off + v];
        if (val > soloPeak) soloPeak = val;
        const rise = val - restStress[v];
        if (rise > soloRise) {
          soloRise = rise;
          const q = v === 0 ? 0 : Math.floor((v - 1) / SEG) + 1;
          soloRho = Math.min(1, q / RINGS);
        }
      }
    }
    const pf = sd.peakFrame;
    return {
      peakDispMm: sd.frameMaxDisp[pf],
      peakFrame: pf,
      peakStressMpa: soloPeak,
      peakStressRho: soloRho,
      sustainSec,
      fundamentalHz: base.f0,
      overtones: Array.from(freqs.slice(1, 5), (f) => Math.round(f)),
      dentMm: sd.dentMm,
      contactRadiusMm: sd.contactRadiusMm,
      strikeRho: s.rho,
      strikeTheta: s.theta,
      strength: s.strength,
      hardness: s.hardness,
      deltaStressMpa: soloRise,
    };
  });

  return {
    base,
    times: FRAME_TIMES.slice(),
    restStress,
    disp: combinedDisp,
    stress: combinedStress,
    frameMaxDisp,
    frameMaxStress,
    peakFrame,
    peakStressMpa,
    peakStressRho,
    maxDeltaStress,
    metrics,
    perStrikeDisp: sims.map((s) => s.displacement),
    perStrikeStress: sims.map((s) => s.stress),
    perStrikeGlow: sims.map((s) => buildGlowField(s.stress, restStress, N)),
    glow: buildGlowField(combinedStress, restStress, N),
    strikeIds: strikes.map((s) => s.id),
    computeMs: now() - t0,
  };
}
