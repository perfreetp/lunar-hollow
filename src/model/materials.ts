import * as THREE from 'three'
import type { GroupId } from './types'

/**
 * 共享材质与几何工厂。
 * 300+ 零件若各自创建 Geometry/Material 会造成大量显存浪费，
 * 这里按参数缓存，相同规格复用同一份 GPU 资源。
 */

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

export function standardMaterial(
  color: number,
  opts: { metalness?: number; roughness?: number; transparent?: boolean; opacity?: number } = {},
): THREE.MeshStandardMaterial {
  const key = JSON.stringify([color, opts.metalness ?? 0.4, opts.roughness ?? 0.55, opts.transparent ?? false, opts.opacity ?? 1])
  let mat = materialCache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      metalness: opts.metalness ?? 0.4,
      roughness: opts.roughness ?? 0.55,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    })
    materialCache.set(key, mat)
  }
  return mat
}

/** 六大分组的主题色（用于树节点图标与高亮配色） */
export const GROUP_COLORS: Record<GroupId, number> = {
  body: 0xd2403a,
  chassis: 0x4b5563,
  motor: 0x9aa3ad,
  gears: 0xc9a227,
  suspension: 0xf5c518,
  wheels: 0x2f2f33,
}

export const GROUP_NAMES: Record<GroupId, string> = {
  body: '车壳',
  chassis: '底盘',
  motor: '电机',
  gears: '齿轮组',
  suspension: '悬挂',
  wheels: '轮胎',
}

const geoCache = new Map<string, THREE.BufferGeometry>()

function cached<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
  let geo = geoCache.get(key)
  if (!geo) {
    geo = factory()
    geoCache.set(key, geo)
  }
  return geo as T
}

export function boxGeo(w: number, h: number, d: number): THREE.BoxGeometry {
  return cached(`box:${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`, () => new THREE.BoxGeometry(w, h, d))
}

export function cylGeo(r: number, len: number, axis: 'x' | 'y' | 'z' = 'y', seg = 20): THREE.CylinderGeometry {
  const geo = cached(`cyl:${r.toFixed(3)},${len.toFixed(3)},${axis},${seg}`, () => {
    const g = new THREE.CylinderGeometry(r, r, len, seg)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    return g
  })
  return geo as THREE.CylinderGeometry
}

export function sphereGeo(r: number, seg = 16): THREE.SphereGeometry {
  return cached(`sph:${r.toFixed(3)},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg / 2)))
}

export function torusGeo(r: number, tube: number, radial = 12, tubular = 24, arc?: number): THREE.TorusGeometry {
  return cached(`tor:${r},${tube},${radial},${tubular},${arc ?? 0}`, () => new THREE.TorusGeometry(r, tube, radial, tubular, arc))
}

/** 螺旋弹簧曲线 */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radius: number,
    private height: number,
    private turns: number,
  ) {
    super()
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * this.turns * Math.PI * 2
    return target.set(
      Math.cos(angle) * this.radius,
      t * this.height - this.height / 2,
      Math.sin(angle) * this.radius,
    )
  }
}

export function springGeo(radius: number, height: number, turns: number, wire: number): THREE.TubeGeometry {
  const key = `spr:${radius},${height},${turns},${wire}`
  return cached(key, () => {
    const curve = new HelixCurve(radius, height, turns)
    return new THREE.TubeGeometry(curve, Math.ceil(turns * 16), wire, 8, false)
  }) as THREE.TubeGeometry
}

/** 近似直齿轮：轮毂圆柱 + 一圈齿（各自缓存） */
const gearSetCache = new Map<string, THREE.BufferGeometry[]>()

export function gearGeometries(radius: number, thickness: number, teeth: number): THREE.BufferGeometry[] {
  const key = `gear:${radius},${thickness},${teeth}`
  let list = gearSetCache.get(key)
  if (!list) {
    const hub = new THREE.CylinderGeometry(radius * 0.75, radius * 0.75, thickness, 24)
    hub.rotateX(Math.PI / 2)
    const toothW = (Math.PI * 2 * radius) / teeth / 2
    const tooth = new THREE.BoxGeometry(toothW, thickness * 0.9, radius * 0.28)
    list = [hub, tooth]
    gearSetCache.set(key, list)
  }
  return list
}

export function disposeGeometryCache(): void {
  geoCache.forEach((g) => g.dispose())
  geoCache.clear()
}
