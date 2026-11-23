import type { BBox, LngLat } from './geo.ts';

export type Ring = LngLat[];

/** Chaikin corner cutting; keeps the ring closed and doubles resolution per pass. */
export function chaikin(ring: Ring, iterations = 2, closed = true): Ring {
  let pts = ring;
  for (let it = 0; it < iterations; it++) {
    const out: Ring = [];
    const n = pts.length;
    const last = closed ? n : n - 1;
    if (!closed) out.push(pts[0]);
    for (let i = 0; i < last; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      out.push({ lng: a.lng * 0.75 + b.lng * 0.25, lat: a.lat * 0.75 + b.lat * 0.25 });
      out.push({ lng: a.lng * 0.25 + b.lng * 0.75, lat: a.lat * 0.25 + b.lat * 0.75 });
    }
    if (!closed) out.push(pts[n - 1]);
    pts = out;
  }
  return pts;
}

export function pointInRing(p: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i];
    const pj = ring[j];
    const intersects =
      pi.lat > p.lat !== pj.lat > p.lat &&
      p.lng < ((pj.lng - pi.lng) * (p.lat - pi.lat)) / (pj.lat - pi.lat) + pi.lng;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function ringCentroid(ring: Ring): LngLat {
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    const cross = a.lng * b.lat - b.lng * a.lat;
    area += cross;
    x += (a.lng + b.lng) * cross;
    y += (a.lat + b.lat) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) return ring[0];
  return { lng: x / (6 * area), lat: y / (6 * area) };
}

export function ringArea(ring: Ring): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j].lng + ring[i].lng) * (ring[j].lat - ring[i].lat);
  }
  return Math.abs(area / 2);
}

/** Distance in degrees-ish metres from a point to the nearest ring vertex. */
export function distanceToRingM(p: LngLat, ring: Ring, latRef: number): number {
  const kx = Math.cos((latRef * Math.PI) / 180) * 111320;
  const ky = 110540;
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const dx = (ring[i].lng - p.lng) * kx;
    const dy = (ring[i].lat - p.lat) * ky;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

export function distanceToPolylineM(p: LngLat, line: Ring, latRef: number): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return distanceToRingM(p, line, latRef);
  const kx = Math.cos((latRef * Math.PI) / 180) * 111320;
  const ky = 110540;
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const ax = (line[i].lng - p.lng) * kx;
    const ay = (line[i].lat - p.lat) * ky;
    const bx = (line[i + 1].lng - p.lng) * kx;
    const by = (line[i + 1].lat - p.lat) * ky;
    const vx = bx - ax;
    const vy = by - ay;
    const len2 = vx * vx + vy * vy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (-ax * vx - ay * vy) / len2));
    const dx = ax + vx * t;
    const dy = ay + vy * t;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

export function ringBBox(ring: Ring): BBox {
  const box: BBox = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  for (const p of ring) {
    box.west = Math.min(box.west, p.lng);
    box.east = Math.max(box.east, p.lng);
    box.south = Math.min(box.south, p.lat);
    box.north = Math.max(box.north, p.lat);
  }
  return box;
}

export function resamplePolyline(pts: Ring, stepM: number): Ring {
  if (pts.length < 2) return pts.slice();
  const out: Ring = [pts[0]];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const latRef = (a.lat + b.lat) / 2;
    const dx = (b.lng - a.lng) * Math.cos((latRef * Math.PI) / 180) * 111320;
    const dy = (b.lat - a.lat) * 110540;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    let t = (stepM - carry) / len;
    while (t < 1) {
      out.push({ lng: a.lng + (b.lng - a.lng) * t, lat: a.lat + (b.lat - a.lat) * t });
      t += stepM / len;
    }
    carry = (len - (stepM - carry)) % stepM;
  }
  return out;
}
