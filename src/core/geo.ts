/**
 * Geodesic helpers. Everything here is pure and runs in node for tests.
 */

export interface LngLat {
  lng: number;
  lat: number;
}

export const EARTH_RADIUS_M = 6371008.8;
export const NM_TO_M = 1852;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const toRad = (deg: number): number => deg * DEG;
export const toDeg = (rad: number): number => rad * RAD;

export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial great-circle bearing from a to b, degrees true, 0..360. */
export function initialBearingDeg(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return normalizeBearing(toDeg(Math.atan2(y, x)));
}

/** Destination point along a great circle. */
export function destination(a: LngLat, bearingDeg: number, distanceM: number): LngLat {
  const d = distanceM / EARTH_RADIUS_M;
  const brg = toRad(bearingDeg);
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brg),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brg) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lng: normalizeLng(toDeg(lng2)), lat: toDeg(lat2) };
}

export function normalizeBearing(deg: number): number {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

export function normalizeLng(lng: number): number {
  let v = lng;
  while (v > 180) v -= 360;
  while (v < -180) v += 360;
  return v;
}

/** Signed smallest difference a - b in (-180, 180]. */
export function bearingDeltaDeg(a: number, b: number): number {
  let d = normalizeBearing(a - b);
  if (d > 180) d -= 360;
  return d;
}

export function lerpLngLat(a: LngLat, b: LngLat, t: number): LngLat {
  return { lng: a.lng + (b.lng - a.lng) * t, lat: a.lat + (b.lat - a.lat) * t };
}

export interface SegmentProjection {
  distanceM: number;
  /** 0..1 position along a->b, clamped. */
  t: number;
  closest: LngLat;
  alongTrackM: number;
}

/**
 * Local planar projection onto a segment. Accurate enough for chart-scale
 * (tens of km) work and much cheaper than spherical nearest-point search.
 */
export function projectOnSegment(p: LngLat, a: LngLat, b: LngLat): SegmentProjection {
  const latRef = toRad((a.lat + b.lat) / 2);
  const kx = Math.cos(latRef) * 111320;
  const ky = 110540;
  const ax = (a.lng - p.lng) * kx;
  const ay = (a.lat - p.lat) * ky;
  const bx = (b.lng - p.lng) * kx;
  const by = (b.lat - p.lat) * ky;
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const tRaw = len2 === 0 ? 0 : (-ax * vx - ay * vy) / len2;
  const t = clamp(tRaw, 0, 1);
  const cx = ax + vx * t;
  const cy = ay + vy * t;
  return {
    distanceM: Math.hypot(cx, cy),
    t,
    closest: lerpLngLat(a, b, t),
    alongTrackM: Math.sqrt(Math.max(0, len2)) * t,
  };
}

export function segmentLengthM(a: LngLat, b: LngLat): number {
  return haversineM(a, b);
}

/** Web-mercator metres per screen pixel at a latitude and zoom. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos(toRad(lat))) / Math.pow(2, zoom);
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function bboxOf(points: LngLat[]): BBox {
  const box = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  for (const p of points) {
    box.west = Math.min(box.west, p.lng);
    box.east = Math.max(box.east, p.lng);
    box.south = Math.min(box.south, p.lat);
    box.north = Math.max(box.north, p.lat);
  }
  return box;
}

/** Closed polygon approximating a geodesic circle. */
export function circlePolygon(center: LngLat, radiusM: number, steps = 128): LngLat[] {
  const ring: LngLat[] = [];
  for (let i = 0; i < steps; i++) {
    ring.push(destination(center, (i / steps) * 360, radiusM));
  }
  return ring;
}

export function bboxContains(box: BBox, p: LngLat): boolean {
  return p.lng >= box.west && p.lng <= box.east && p.lat >= box.south && p.lat <= box.north;
}

export function expandBBox(box: BBox, ratio: number): BBox {
  const dx = (box.east - box.west) * ratio;
  const dy = (box.north - box.south) * ratio;
  return {
    west: box.west - dx,
    south: box.south - dy,
    east: box.east + dx,
    north: box.north + dy,
  };
}

/* ------------------------------- formatting ------------------------------- */

export function formatLatDms(lat: number, digits = 1): string {
  const hemi = lat >= 0 ? 'N' : 'S';
  const abs = Math.abs(lat);
  const deg = Math.floor(abs);
  const minAbs = (abs - deg) * 60;
  const min = Math.floor(minAbs);
  const sec = (minAbs - min) * 60;
  return `${String(deg).padStart(2, '0')}°${String(min).padStart(2, '0')}′${sec.toFixed(digits).padStart(4, '0')}″${hemi}`;
}

export function formatLngDms(lng: number, digits = 1): string {
  const hemi = lng >= 0 ? 'E' : 'W';
  const abs = Math.abs(lng);
  const deg = Math.floor(abs);
  const minAbs = (abs - deg) * 60;
  const min = Math.floor(minAbs);
  const sec = (minAbs - min) * 60;
  return `${String(deg).padStart(3, '0')}°${String(min).padStart(2, '0')}′${sec.toFixed(digits).padStart(4, '0')}″${hemi}`;
}

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  const nm = meters / NM_TO_M;
  if (nm < 10) return `${nm.toFixed(2)} nm`;
  return `${nm.toFixed(1)} nm`;
}

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function bearingToCompass(deg: number): string {
  const idx = Math.round(normalizeBearing(deg) / 22.5) % 16;
  return COMPASS[idx];
}

export function formatBearing(deg: number): string {
  return `${String(Math.round(normalizeBearing(deg)) % 360).padStart(3, '0')}° ${bearingToCompass(deg)}`;
}
