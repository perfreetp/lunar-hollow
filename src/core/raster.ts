import type { LngLat } from './geo.ts';

export interface GridSpec {
  west: number;
  south: number;
  east: number;
  north: number;
  cols: number;
  rows: number;
}

export interface Grid {
  spec: GridSpec;
  /** Row-major, row 0 is south. */
  values: Float32Array;
}

export function cellLngLat(spec: GridSpec, col: number, row: number): LngLat {
  const fx = spec.cols <= 1 ? 0 : col / (spec.cols - 1);
  const fy = spec.rows <= 1 ? 0 : row / (spec.rows - 1);
  return {
    lng: spec.west + (spec.east - spec.west) * fx,
    lat: spec.south + (spec.north - spec.south) * fy,
  };
}

export function lngLatToCell(spec: GridSpec, p: LngLat): { col: number; row: number } {
  const fx = (p.lng - spec.west) / (spec.east - spec.west);
  const fy = (p.lat - spec.south) / (spec.north - spec.south);
  return {
    col: Math.round(fx * (spec.cols - 1)),
    row: Math.round(fy * (spec.rows - 1)),
  };
}

export function sampleGridBilinear(grid: Grid, p: LngLat): number {
  const { spec, values } = grid;
  const fx = ((p.lng - spec.west) / (spec.east - spec.west)) * (spec.cols - 1);
  const fy = ((p.lat - spec.south) / (spec.north - spec.south)) * (spec.rows - 1);
  const x0 = Math.max(0, Math.min(spec.cols - 1, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(spec.rows - 1, Math.floor(fy)));
  const x1 = Math.min(spec.cols - 1, x0 + 1);
  const y1 = Math.min(spec.rows - 1, y0 + 1);
  const tx = Math.max(0, Math.min(1, fx - x0));
  const ty = Math.max(0, Math.min(1, fy - y0));
  const v = (r: number, c: number): number => values[r * spec.cols + c];
  const a = v(y0, x0) * (1 - tx) + v(y0, x1) * tx;
  const b = v(y1, x0) * (1 - tx) + v(y1, x1) * tx;
  return a * (1 - ty) + b * ty;
}

/** Rasterise closed rings into a 1-inside mask using even-odd fill. */
export function rasteriseRings(spec: GridSpec, rings: LngLat[][]): Uint8Array {
  const mask = new Uint8Array(spec.cols * spec.rows);
  const lngStep = (spec.east - spec.west) / Math.max(1, spec.cols - 1);
  const latStep = (spec.north - spec.south) / Math.max(1, spec.rows - 1);
  for (let row = 0; row < spec.rows; row++) {
    const lat = spec.south + row * latStep;
    const xs: number[] = [];
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[j];
        const b = ring[i];
        if (a.lat > lat !== b.lat > lat) {
          xs.push(a.lng + ((lat - a.lat) / (b.lat - a.lat)) * (b.lng - a.lng));
        }
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.ceil((xs[k] - spec.west) / lngStep);
      const c1 = Math.floor((xs[k + 1] - spec.west) / lngStep);
      for (let c = Math.max(0, c0); c <= Math.min(spec.cols - 1, c1); c++) {
        mask[row * spec.cols + c] = 1;
      }
    }
  }
  return mask;
}

/**
 * Chamfer 3-4 distance transform in cells from the `seed` set.
 * Returns distance to the nearest seed (0 on seeds).
 */
export function chamferDistance(
  cols: number,
  rows: number,
  isSeed: (col: number, row: number) => boolean,
): Float32Array {
  const INF = 1e9;
  const dist = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dist[r * cols + c] = isSeed(c, r) ? 0 : INF;
    }
  }
  const at = (c: number, r: number): number =>
    c < 0 || r < 0 || c >= cols || r >= rows ? INF : dist[r * cols + c];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (dist[i] === 0) continue;
      dist[i] = Math.min(
        dist[i],
        at(c - 1, r) + 1,
        at(c, r - 1) + 1,
        at(c - 1, r - 1) + 1.4142,
        at(c + 1, r - 1) + 1.4142,
      );
    }
  }
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      const i = r * cols + c;
      if (dist[i] === 0) continue;
      dist[i] = Math.min(
        dist[i],
        at(c + 1, r) + 1,
        at(c, r + 1) + 1,
        at(c + 1, r + 1) + 1.4142,
        at(c - 1, r + 1) + 1.4142,
      );
    }
  }
  return dist;
}

export interface ContourLine {
  level: number;
  coordinates: LngLat[];
  closed: boolean;
}

/**
 * Marching squares isobaths. Segments are emitted per cell and then joined by
 * endpoint proximity into polylines, which is enough for chart hairlines.
 */
export function contourGrid(
  grid: Grid,
  levels: number[],
  minSegmentCells = 0.75,
): ContourLine[] {
  const { spec, values } = grid;
  const { cols, rows } = spec;
  const raw: Array<{ level: number; a: LngLat; b: LngLat }> = [];
  const cellLng = (spec.east - spec.west) / Math.max(1, cols - 1);
  const cellLat = (spec.north - spec.south) / Math.max(1, rows - 1);

  const edgePoint = (
    level: number,
    c0: number,
    r0: number,
    c1: number,
    r1: number,
  ): LngLat => {
    const v0 = values[r0 * cols + c0];
    const v1 = values[r1 * cols + c1];
    const t = Math.abs(v1 - v0) < 1e-9 ? 0.5 : (level - v0) / (v1 - v0);
    const p0 = cellLngLat(spec, c0, r0);
    const p1 = cellLngLat(spec, c1, r1);
    return { lng: p0.lng + (p1.lng - p0.lng) * t, lat: p0.lat + (p1.lat - p0.lat) * t };
  };

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const v00 = values[r * cols + c];
      const v10 = values[r * cols + c + 1];
      const v01 = values[(r + 1) * cols + c];
      const v11 = values[(r + 1) * cols + c + 1];
      for (const level of levels) {
        const idx =
          (v00 > level ? 1 : 0) |
          (v10 > level ? 2 : 0) |
          (v11 > level ? 4 : 0) |
          (v01 > level ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const bottom = (): LngLat => edgePoint(level, c, r, c + 1, r);
        const right = (): LngLat => edgePoint(level, c + 1, r, c + 1, r + 1);
        const top = (): LngLat => edgePoint(level, c, r + 1, c + 1, r + 1);
        const left = (): LngLat => edgePoint(level, c, r, c, r + 1);
        const push = (a: LngLat, b: LngLat): void => {
          raw.push({ level, a, b });
        };
        switch (idx) {
          case 1:
          case 14:
            push(left(), bottom());
            break;
          case 2:
          case 13:
            push(bottom(), right());
            break;
          case 3:
          case 12:
            push(left(), right());
            break;
          case 4:
          case 11:
            push(right(), top());
            break;
          case 6:
          case 9:
            push(bottom(), top());
            break;
          case 7:
          case 8:
            push(left(), top());
            break;
          case 5: {
            const centre = (v00 + v10 + v01 + v11) / 4;
            if (centre > level) {
              push(left(), top());
              push(bottom(), right());
            } else {
              push(left(), bottom());
              push(right(), top());
            }
            break;
          }
          case 10: {
            const centre = (v00 + v10 + v01 + v11) / 4;
            if (centre > level) {
              push(left(), bottom());
              push(right(), top());
            } else {
              push(left(), top());
              push(bottom(), right());
            }
            break;
          }
        }
      }
    }
  }

  const minLen = Math.hypot(cellLng, cellLat) * minSegmentCells;
  const snap = Math.max(cellLng, cellLat) * 0.01;
  const key = (p: LngLat): string =>
    `${Math.round(p.lng / snap)}:${Math.round(p.lat / snap)}`;
  const lines: ContourLine[] = [];
  const byLevel = new Map<number, Array<{ a: LngLat; b: LngLat }>>();
  for (const seg of raw) {
    const len = Math.hypot(seg.a.lng - seg.b.lng, seg.a.lat - seg.b.lat);
    if (len < minLen * 0.35) continue;
    const list = byLevel.get(seg.level) ?? [];
    list.push(seg);
    byLevel.set(seg.level, list);
  }

  for (const [level, segs] of byLevel) {
    const buckets = new Map<string, number[]>();
    segs.forEach((seg, i) => {
      for (const p of [seg.a, seg.b]) {
        const k = key(p);
        const list = buckets.get(k) ?? [];
        list.push(i);
        buckets.set(k, list);
      }
    });
    const used = new Uint8Array(segs.length);
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      const chain: LngLat[] = [segs[i].a, segs[i].b];
      let extended = true;
      let guard = 0;
      while (extended && guard++ < 20000) {
        extended = false;
        const tail = chain[chain.length - 1];
        const cand = buckets.get(key(tail)) ?? [];
        for (const j of cand) {
          if (used[j]) continue;
          const seg = segs[j];
          if (key(seg.a) === key(tail)) {
            chain.push(seg.b);
            used[j] = 1;
            extended = true;
            break;
          }
          // Reverse endpoint rarely matches exactly; fall through to next.
        }
      }
      // Extend from the head as well (chains built backwards).
      let back = true;
      guard = 0;
      while (back && guard++ < 20000) {
        back = false;
        const head = chain[0];
        const cand = buckets.get(key(head)) ?? [];
        for (const j of cand) {
          if (used[j]) continue;
          const seg = segs[j];
          if (key(seg.b) === key(head)) {
            chain.unshift(seg.a);
            used[j] = 1;
            back = true;
            break;
          }
        }
      }
      if (chain.length > 2) {
        lines.push({
          level,
          coordinates: chain,
          closed: key(chain[0]) === key(chain[chain.length - 1]),
        });
      }
    }
  }

  return lines;
}
