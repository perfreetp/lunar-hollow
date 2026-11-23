import { SEG, RINGS, VERT_COUNT, buildIndexArray } from '../sim/layout';

/**
 * Stress ramp. Starts at the resting head's own tone so an unstruck head
 * still reads as a drum head, then runs cold blue -> cyan -> green -> amber
 * -> red -> white hot as the dynamic stress rises.
 */
export const STRESS_STOPS: Array<[number, string]> = [
  [0.0, '#b3a88c'],
  [0.09, '#b9b6a4'],
  [0.18, '#8fb8bb'],
  [0.3, '#3f95c4'],
  [0.42, '#2a6fc4'],
  [0.55, '#39b79a'],
  [0.68, '#8ec93e'],
  [0.79, '#e8cf30'],
  [0.88, '#f2901e'],
  [0.95, '#e2441f'],
  [1.0, '#ffd2ab'],
];

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

const STOPS_RGB = STRESS_STOPS.map(([t, c]) => [t, ...hexToRgb(c)] as [number, number, number, number]);

/** Perceptual-ish stress colour ramp, 0..1 -> linear rgb. */
export function stressColor(t: number, out: [number, number, number]): void {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  let i = 0;
  while (i < STOPS_RGB.length - 2 && x > STOPS_RGB[i + 1][0]) i++;
  const a = STOPS_RGB[i];
  const b = STOPS_RGB[i + 1];
  const u = (x - a[0]) / (b[0] - a[0] || 1);
  out[0] = a[1] + (b[1] - a[1]) * u;
  out[1] = a[2] + (b[2] - a[2]) * u;
  out[2] = a[3] + (b[3] - a[3]) * u;
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Builds the static part of the head geometry: index, ring LUTs, uv. */
export interface HeadGeometryData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  index: Uint32Array;
}

export function makeHeadGeometryData(): HeadGeometryData {
  const positions = new Float32Array(VERT_COUNT * 3);
  const normals = new Float32Array(VERT_COUNT * 3);
  const colors = new Float32Array(VERT_COUNT * 3);
  const uvs = new Float32Array(VERT_COUNT * 2);
  for (let v = 0; v < VERT_COUNT; v++) {
    let ring: number;
    let j: number;
    if (v === 0) {
      ring = 0;
      j = 0;
    } else {
      ring = Math.floor((v - 1) / SEG) + 1;
      j = (v - 1) % SEG;
    }
    const rho = Math.min(1, ring / RINGS);
    uvs[v * 2] = 0.5 + 0.5 * rho * Math.cos((j / SEG) * Math.PI * 2);
    uvs[v * 2 + 1] = 0.5 + 0.5 * rho * Math.sin((j / SEG) * Math.PI * 2);
    colors[v * 3] = 1;
    colors[v * 3 + 1] = 1;
    colors[v * 3 + 2] = 1;
  }
  return { positions, normals, colors, uvs, index: buildIndexArray() };
}

