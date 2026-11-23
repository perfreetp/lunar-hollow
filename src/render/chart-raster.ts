/**
 * Chart gallery-palette and raster generation.
 *
 * The depth raster doubles as the MapLibre image source. It is built at load
 * from the same depth model the isobaths and hover-readout use, so the shading
 * and the contours can never disagree.
 */
import { cellLngLat, type Grid } from '../core/raster.ts';
import type { LngLat } from '../core/geo.ts';
import { DEPTH_BANDS } from '../model/depth-field.ts';

export type Theme = 'night' | 'day';

export interface Palette {
  seaDeep: [number, number, number];
  seaMid: [number, number, number];
  seaShallow: [number, number, number];
  seaShoal: [number, number, number];
  land: [number, number, number];
  landEdge: [number, number, number];
  contour: string;
  contourMajor: string;
  coastline: string;
  grid: string;
  label: string;
  labelDim: string;
  route: string;
}

export const PALETTES: Record<Theme, Palette> = {
  night: {
    seaDeep: [8, 22, 33],
    seaMid: [11, 33, 44],
    seaShallow: [18, 53, 63],
    seaShoal: [34, 82, 86],
    land: [30, 41, 46],
    landEdge: [96, 124, 132],
    contour: 'rgba(120, 176, 186, 0.34)',
    contourMajor: 'rgba(160, 214, 220, 0.62)',
    coastline: 'rgba(178, 226, 228, 0.9)',
    grid: 'rgba(120, 170, 180, 0.14)',
    label: '#cfe6e8',
    labelDim: '#82a3a8',
    route: 'rgba(126, 214, 214, 0.5)',
  },
  day: {
    seaDeep: [214, 226, 226],
    seaMid: [201, 220, 222],
    seaShallow: [184, 212, 214],
    seaShoal: [163, 200, 199],
    land: [232, 226, 208],
    landEdge: [132, 122, 96],
    contour: 'rgba(96, 128, 132, 0.5)',
    contourMajor: 'rgba(60, 96, 100, 0.85)',
    coastline: 'rgba(52, 64, 58, 0.92)',
    grid: 'rgba(96, 128, 132, 0.2)',
    label: '#2c3c3e',
    labelDim: '#5f7376',
    route: 'rgba(28, 96, 108, 0.62)',
  },
};

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function depthColor(depth: number, theme: Theme): [number, number, number] {
  const p = PALETTES[theme];
  if (depth < 0) return p.land;
  const stops: Array<{ d: number; c: [number, number, number] }> = [
    { d: 0, c: p.seaShoal },
    { d: 2, c: p.seaShoal },
    { d: 5, c: p.seaShallow },
    { d: 10, c: p.seaMid },
    { d: 20, c: p.seaDeep },
    { d: 28, c: p.seaDeep },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (depth <= b.d) {
      const t = b.d === a.d ? 0 : (depth - a.d) / (b.d - a.d);
      return mix(a.c, b.c, t);
    }
  }
  return p.seaDeep;
}

export interface RasterImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  coordinates: [[number, number], [number, number], [number, number], [number, number]];
}

/**
 * Build the depth image. Pixels are supersampled 2x for a smoother bathymetry.
 * `coordinates` are MapLibre image corners: TL, TR, BR, BL.
 */
export async function buildDepthImage(grid: Grid, theme: Theme): Promise<RasterImage> {
  const { spec } = grid;
  const width = (spec.cols - 1) * 4;
  const height = (spec.rows - 1) * 4;
  const data = new Uint8ClampedArray(width * height * 4);
  const { values } = grid;

  const sampleGrid = (fx: number, fy: number): number => {
    const x = fx * (spec.cols - 1);
    const y = fy * (spec.rows - 1);
    const x0 = Math.max(0, Math.min(spec.cols - 1, Math.floor(x)));
    const y0 = Math.max(0, Math.min(spec.rows - 1, Math.floor(y)));
    const x1 = Math.min(spec.cols - 1, x0 + 1);
    const y1 = Math.min(spec.rows - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const v = (c: number, r: number): number => values[r * spec.cols + c];
    const top = v(x0, y0) * (1 - tx) + v(x1, y0) * tx;
    const bot = v(x0, y1) * (1 - tx) + v(x1, y1) * tx;
    return top * (1 - ty) + bot * ty;
  };

  const shade = (depth: number, slope: number, theme2: Theme): [number, number, number] => {
    const base = depthColor(depth, theme2);
    // Subtle relief shading from the south-west keeps the bathymetry readable.
    const shadeAmt = 1 - Math.max(-0.14, Math.min(0.14, slope * 0.9));
    return base.map((c) => Math.max(0, Math.min(255, Math.round(c * shadeAmt)))) as [
      number,
      number,
      number,
    ];
  };

  for (let py = 0; py < height; py++) {
    const fy = 1 - py / (height - 1);
    for (let px = 0; px < width; px++) {
      const fx = px / (width - 1);
      const d = sampleGrid(fx, fy);
      const dx = sampleGrid(Math.min(1, fx + 1 / width), fy) - d;
      const dy = sampleGrid(fx, Math.min(1, fy - 1 / height)) - d;
      const [r, g, b] = shade(d, (dx + dy) * 0.5, theme);
      const i = (py * width + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const tl = cellLngLat(spec, 0, spec.rows - 1);
  const tr = cellLngLat(spec, spec.cols - 1, spec.rows - 1);
  const br = cellLngLat(spec, spec.cols - 1, 0);
  const bl = cellLngLat(spec, 0, 0);

  return {
    data,
    width,
    height,
    coordinates: [
      [tl.lng, tl.lat],
      [tr.lng, tr.lat],
      [br.lng, br.lat],
      [bl.lng, bl.lat],
    ],
  };
}

export const DEPTH_LEGEND = DEPTH_BANDS;

/** Sounding text, chart style: 12.4 → 124; under 10 m gets a leading zero. */
export function formatSounding(depthM: number): string {
  if (depthM < 0) return '';
  if (depthM < 10) return depthM.toFixed(1).replace(/^(\d)\.(\d)$/, '0$1$2').replace('.', '');
  const rounded = Math.round(depthM * 10) / 10;
  return String(Math.round(rounded * 10));
}

export function formatDepthLabel(depthM: number): string {
  if (depthM < 0) return '陆地';
  return `${depthM.toFixed(1)} m`;
}

export function depthSafetyClass(depthM: number, draftM: number): 'safe' | 'caution' | 'grounding' {
  if (depthM < 0) return 'grounding';
  if (depthM < draftM) return 'grounding';
  if (depthM < draftM + 2) return 'caution';
  return 'safe';
}

export function chartGridLines(
  bounds: { west: number; south: number; east: number; north: number },
  stepDeg = 0.02,
): Array<{ start: LngLat; end: LngLat }> {
  const lines: Array<{ start: LngLat; end: LngLat }> = [];
  const west = Math.ceil(bounds.west / stepDeg) * stepDeg;
  const south = Math.ceil(bounds.south / stepDeg) * stepDeg;
  for (let lng = west; lng < bounds.east; lng += stepDeg) {
    lines.push({ start: { lng, lat: bounds.south }, end: { lng, lat: bounds.north } });
  }
  for (let lat = south; lat < bounds.north; lat += stepDeg) {
    lines.push({ start: { lng: bounds.west, lat }, end: { lng: bounds.east, lat } });
  }
  return lines;
}
