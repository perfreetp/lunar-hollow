/**
 * 局部米坐标 <-> 经纬度/高程 投影
 * 以跑道起点为原点的局部 ENU 切平面：x 沿跑道方位，y 垂直跑道向左，z 高程（米）。
 * 纵向坡度直接体现在 z = x * slope/100，标线沿坡面走向。
 */
import type { LngLatAlt, LocalPoint, RunwayConfig } from './types';
const R = 6378137; // WGS84 长半轴
const DEG = Math.PI / 180;

export interface LocalFrame {
  originLng: number;
  originLat: number;
  /** 跑道 x 轴真方位（弧度） */
  bearing: number;
  cosB: number;
  sinB: number;
  lat0Rad: number;
  cosLat0: number;
  slope: number; // 小数（slopePct / 100）
}

export function createFrame(runway: RunwayConfig): LocalFrame {
  const b = runway.bearing * DEG;
  const lat0 = runway.origin.lat * DEG;
  return {
    originLng: runway.origin.lng,
    originLat: runway.origin.lat,
    bearing: b,
    cosB: Math.cos(b),
    sinB: Math.sin(b),
    lat0Rad: lat0,
    cosLat0: Math.cos(lat0),
    slope: runway.slopePct / 100
  };
}

/** 局部坐标 -> 经纬度+高程（高程含纵向坡度） */
export function localToLngLat(frame: LocalFrame, p: LocalPoint): LngLatAlt {
  // 局部 x（沿跑道）/y（跑道左侧）旋转到东/北方向：
  // east = x·sinB - y·cosB；north = x·cosB + y·sinB
  const east = p.x * frame.sinB - p.y * frame.cosB;
  const north = p.x * frame.cosB + p.y * frame.sinB;
  const dLat = north / R;
  const dLng = east / (R * frame.cosLat0);
  return {
    lng: frame.originLng + dLng / DEG,
    lat: frame.originLat + dLat / DEG,
    alt: p.z
  };
}

/** 经纬度+高程 -> 局部坐标（逆变换，供重新载入/校验使用） */
export function lngLatToLocal(frame: LocalFrame, g: LngLatAlt): LocalPoint {
  const dLng = (g.lng - frame.originLng) * DEG;
  const dLat = (g.lat - frame.originLat) * DEG;
  const east = dLng * R * frame.cosLat0;
  const north = dLat * R;
  const x = east * frame.sinB + north * frame.cosB;
  const y = north * frame.sinB - east * frame.cosB;
  return { x, y, z: g.alt };
}

/** 两点局部坐标水平距离（忽略高程差，标线测量用） */
export function flatDistance(a: LocalPoint, b: LocalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** 两点三维距离（含坡度） */
export function distance3D(a: LocalPoint, b: LocalPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

/** 两个经纬高点之间的三维距离（米，含高程差），供跨跑道测量使用 */
export function geoDistance3D(a: LngLatAlt, b: LngLatAlt): number {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLat = (b.lat - a.lat) * DEG;
  const dLng = (b.lng - a.lng) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const ground = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.hypot(ground, b.alt - a.alt);
}

/** 跑道四角（局部坐标，含坡面高程） */
export function runwayCorners(frame: LocalFrame, length: number, width: number): LocalPoint[] {
  return [
    { x: 0, y: -width / 2, z: 0 },
    { x: length, y: -width / 2, z: length * frame.slope },
    { x: length, y: width / 2, z: length * frame.slope },
    { x: 0, y: width / 2, z: 0 }
  ];
}

/** 跑道地理包围盒中心与建议缩放 */
export function runwayView(runway: RunwayConfig): {
  center: [number, number];
  zoom: number;
  bearing: number;
} {
  const frame = createFrame(runway);
  const geo = runwayCorners(frame, runway.length, runway.width).map((p) => localToLngLat(frame, p));
  const lngs = geo.map((g) => g.lng);
  const lats = geo.map((g) => g.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  // MapLibre 世界瓦片 512px：zoom z 处每像素地面米数 ≈ 78271.5·cos(lat)/2^z
  // 跑道沿屏幕纵向铺开，按视口高度留 25% 边距，使其完整入镜
  const viewHeightPx = typeof window !== 'undefined' ? window.innerHeight * 0.72 : 720;
  const metersPerPixelNeeded = runway.length / viewHeightPx;
  const cosLat = Math.cos(((minLat + maxLat) / 2) * DEG);
  const zoom = Math.log2((78271.487 * cosLat) / metersPerPixelNeeded);
  return {
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    zoom: Math.min(16.5, Math.max(11, zoom)),
    bearing: (runway.bearing + 180) % 360
  };
}

/** 轴对齐矩形 -> 闭合四边形（逆时针，z 随坡面） */
export function rectToQuad(
  frame: LocalFrame,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): LocalPoint[] {
  const z = (x: number) => x * frame.slope;
  return [
    { x: x0, y: y0, z: z(x0) },
    { x: x1, y: y0, z: z(x1) },
    { x: x1, y: y1, z: z(x1) },
    { x: x0, y: y1, z: z(x0) }
  ];
}

/** 沿 x 轴的一条贴地折线（自动赋坡面高程） */
export function lineAlongX(frame: LocalFrame, y: number, x0: number, x1: number, steps = 2): LocalPoint[] {
  const pts: LocalPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const x = x0 + (x1 - x0) * t;
    pts.push({ x, y, z: x * frame.slope });
  }
  return pts;
}

/** 点到线段距离（水平二维），返回最近点与距离 */export function pointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { nearest: LocalPoint; dist: number; t: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-12;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const nx = ax + t * dx;
  const ny = ay + t * dy;
  return {
    nearest: { x: nx, y: ny, z: 0 },
    dist: Math.hypot(px - nx, py - ny),
    t
  };
}
