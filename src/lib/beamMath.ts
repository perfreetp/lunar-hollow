import * as THREE from 'three';
import type { BeamConfig, LighthouseConfig, LightRuntimeInfo, Reef, ShipState } from '../types';

/** 色温(K) → 线性 RGB（Tanner Helland 近似，再做 sRGB→linear） */
export function kelvinToLinearRGB(kelvin: number, out = new THREE.Color()): THREE.Color {
  const t = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  out.setRGB(
    THREE.MathUtils.clamp(r, 0, 255) / 255,
    THREE.MathUtils.clamp(g, 0, 255) / 255,
    THREE.MathUtils.clamp(b, 0, 255) / 255,
  );
  // 输入近似为 sRGB，转到线性空间供渲染使用
  out.convertSRGBToLinear();
  return out;
}

/** 闪光强度包络（0/1 方波，带相位与占空比）。CPU 与 GLSL 保持同一语义 */
export function flashEnvelope(timeSec: number, b: BeamConfig): number {
  if (b.period <= 0.001 || b.duty >= 0.999) return 1;
  const phase = ((timeSec + b.phase) % b.period + b.period) % b.period;
  return phase < b.period * b.duty ? 1 : 0;
}

/** GLSL 共用：闪光方波（视觉端带 6% 周期的软边渐变，避免硬切闪烁） */
export const GLSL_FLASH = /* glsl */ `
float flashEnvelope(float time, float period, float phase, float duty) {
  if (period < 0.001 || duty > 0.999) return 1.0;
  float p = mod(time + phase, period);
  float ramp = min(period * 0.06, 0.25);
  return 1.0 - smoothstep(period * duty - ramp, period * duty, p);
}
`;

/**
 * 光束方向：azimuth=0 指向 +Z（正北），顺时针；pitch>0 向水面俯照。
 * 单位向量（局部 +Z 经 yaw/pitch 旋转后的世界方向）。
 */
export function beamDirection(b: BeamConfig, out = new THREE.Vector3()): THREE.Vector3 {
  const yaw = THREE.MathUtils.degToRad(b.azimuth);
  const pitch = THREE.MathUtils.degToRad(b.pitch);
  out.set(
    Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  );
  return out.normalize();
}

/** 光强档位 → 光程（米），档位 1..10 映射 80..420m */
export function beamRange(intensity: number): number {
  const k = THREE.MathUtils.clamp(intensity, 1, 10) / 10;
  return 80 + k * 340;
}

/** 光强档位 → 着色强度系数（供加色混合使用） */
export function beamPower(intensity: number): number {
  return 0.35 + (THREE.MathUtils.clamp(intensity, 1, 10) / 10) * 1.25;
}

export interface BeamFootprint {
  center: THREE.Vector3; // 水面光斑中心（y=0）
  radius: number; // 外接半径（米）
  hits: boolean; // 是否打到水面
}

/**
 * 解析光束与水面（y=0）的交点：
 * 以光轴中心射线、上下垂直边缘射线分别求水面交点，得到沿光轴的近/远端；
 * 横向半宽由水平半张角与水平距离解析得出；返回椭圆扇区的中心与外接半径。
 */
export function beamFootprint(lh: LighthouseConfig): BeamFootprint {
  const origin = new THREE.Vector3(lh.x, lh.height, lh.z);
  const dir = beamDirection(lh.beam);
  const noHit = { center: new THREE.Vector3(lh.x, 0, lh.z), radius: 0, hits: false };
  if (dir.y >= -1e-4) return noHit; // 平射或上仰，不触水面

  const range = beamRange(lh.beam.intensity);
  const pitch = THREE.MathUtils.degToRad(lh.beam.pitch);
  const halfV = THREE.MathUtils.degToRad(lh.beam.verticalAngle / 2);
  const halfH = THREE.MathUtils.degToRad(lh.beam.horizontalAngle / 2);
  const yaw = THREE.MathUtils.degToRad(lh.beam.azimuth);

  // 给定俯角（与水平面夹角）的射线与水面的水平距离
  const horizAt = (depression: number) => {
    const d = THREE.MathUtils.clamp(depression, 1e-3, Math.PI / 2 - 1e-3);
    return lh.height / Math.tan(d);
  };

  const dCenter = horizAt(pitch);
  const dNear = horizAt(pitch + halfV); // 下边缘 → 近端
  const dFar = pitch - halfV > 0.001 ? horizAt(pitch - halfV) : Infinity; // 上边缘 → 远端
  const dFarClamped = Math.min(dFar, range);
  const dNearClamped = Math.min(dNear, range);
  if (dNearClamped >= range && dCenter > range) return noHit;

  const mid = (dNearClamped + dFarClamped) / 2;
  const center = new THREE.Vector3(
    lh.x + Math.sin(yaw) * mid,
    0,
    lh.z + Math.cos(yaw) * mid,
  );
  const axial = (dFarClamped - dNearClamped) / 2;
  // 中点处的横向半宽：该距离上光束的水平扇面宽度
  const lateral = mid * Math.tan(halfH);
  const radius = Math.min(range, Math.hypot(axial, lateral));
  return { center, radius, hits: radius > 0.5 };
}

const _dir = new THREE.Vector3();
const _toPoint = new THREE.Vector3();

/** 点（船体位置，y≈0）是否在某灯的束锥内：水平张角 + 垂直发散角双判定 + 光程 */
export function pointInBeam(lh: LighthouseConfig, point: THREE.Vector3): boolean {
  const origin = new THREE.Vector3(lh.x, lh.height, lh.z);
  beamDirection(lh.beam, _dir);
  _toPoint.subVectors(point, origin);
  const dist = _toPoint.length();
  if (dist > beamRange(lh.beam.intensity) || dist < 1e-3) return false;
  _toPoint.multiplyScalar(1 / dist);
  const cosH = Math.cos(THREE.MathUtils.degToRad(lh.beam.horizontalAngle / 2));
  const cosV = Math.cos(THREE.MathUtils.degToRad(lh.beam.verticalAngle / 2));
  // 水平分量（XZ 平面）夹角
  const horizLen = Math.hypot(_toPoint.x, _toPoint.z);
  const horizDirLen = Math.hypot(_dir.x, _dir.z);
  let cosHA = 1;
  if (horizLen > 1e-5 && horizDirLen > 1e-5) {
    cosHA = (_toPoint.x * _dir.x + _toPoint.z * _dir.z) / (horizLen * horizDirLen);
  }
  if (cosHA < cosH) return false;
  if (_toPoint.dot(_dir) < cosV) return false;
  return true;
}

/** 线段（灯芯→目标点）是否被球体遮挡 */
function sphereOccludes(origin: THREE.Vector3, target: THREE.Vector3, c: THREE.Vector3, r: number): boolean {
  const rx = origin.x - c.x, ry = origin.y - c.y, rz = origin.z - c.z;
  const dx = target.x - origin.x, dy = target.y - origin.y, dz = target.z - origin.z;
  const L2 = dx * dx + dy * dy + dz * dz;
  if (L2 < 1e-6) return false;
  const b = (rx * dx + ry * dy + rz * dz) / L2;
  const cc = (rx * rx + ry * ry + rz * rz - r * r) / L2;
  const disc = b * b - cc;
  if (disc < 0) return false;
  const t = -b - Math.sqrt(disc);
  return t > 0 && t < 1;
}

/** 线段是否被竖直圆柱（塔身）遮挡 */
function cylinderOccludes(origin: THREE.Vector3, target: THREE.Vector3, cx: number, cz: number, r: number, h: number): boolean {
  const dx = target.x - origin.x, dz = target.z - origin.z;
  const ox = origin.x - cx, oz = origin.z - cz;
  const a = dx * dx + dz * dz;
  if (a < 1e-8) return false;
  const b = ox * dx + oz * dz;
  const c = ox * ox + oz * oz - r * r;
  const disc = b * b - a * c;
  if (disc < 0) return false;
  const t = (-b - Math.sqrt(disc)) / a;
  if (t <= 0 || t >= 1) return false;
  const y = origin.y + t * (target.y - origin.y);
  return y >= 0 && y <= h;
}

/** 船被某灯照亮判定：束锥内 且 未被礁石/其他塔身/本船自身遮挡 */
export function isShipLitBy(
  lh: LighthouseConfig,
  all: LighthouseConfig[],
  reefs: Reef[],
  ship: ShipState,
): boolean {
  const target = new THREE.Vector3(ship.x, 2, ship.z);
  if (!pointInBeam(lh, target)) return false;
  const origin = new THREE.Vector3(lh.x, lh.height, lh.z);
  for (const reef of reefs) {
    if (sphereOccludes(origin, target, new THREE.Vector3(reef.x, reef.radius * 0.45, reef.z), reef.radius)) return false;
  }
  for (const other of all) {
    if (other.id === lh.id) continue;
    if (cylinderOccludes(origin, target, other.x, other.z, other.towerRadius, other.height)) return false;
  }
  return true;
}

/** 汇总每盏灯的实时解算（拖动船体时每帧/每事件调用一次） */
export function computeRuntimeInfo(
  lighthouses: LighthouseConfig[],
  reefs: Reef[],
  ship: ShipState,
): LightRuntimeInfo[] {
  const shipPos = new THREE.Vector3(ship.x, 0, ship.z);
  return lighthouses.map((lh) => {
    const fp = beamFootprint(lh);
    const shipLit = isShipLitBy(lh, lighthouses, reefs, ship);
    const inBeam = pointInBeam(lh, new THREE.Vector3(ship.x, 2, ship.z));
    return {
      id: lh.id,
      name: lh.name,
      spot: { x: fp.center.x, z: fp.center.z },
      radius: fp.radius,
      shipLit,
      shipDistance: inBeam ? Math.hypot(ship.x - fp.center.x, ship.z - fp.center.z) : null,
    };
  });
}

let idCounter = 0;
export function uid(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}
