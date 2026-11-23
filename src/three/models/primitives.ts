/**
 * Shared primitive geometries and material library.
 *
 * Every actor is assembled from a handful of unit primitives scaled per part.
 * That keeps geometry count tiny (a few dozen buffers for the whole scene),
 * which is what lets 20+ objects resample smoothly while scrubbing.
 */

import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const PRIM = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
  cylLow: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 18),
  sphere: new THREE.SphereGeometry(0.5, 20, 14),
  plane: new THREE.PlaneGeometry(1, 1),
  torus: new THREE.TorusGeometry(0.5, 0.08, 8, 24),
}

export interface PartOptions {
  pos?: [number, number, number]
  scale?: [number, number, number]
  /** Euler rotation in radians. */
  rot?: [number, number, number]
  castShadow?: boolean
  receiveShadow?: boolean
}

export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  opts: PartOptions = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material)
  const { pos, scale, rot } = opts
  if (pos) mesh.position.set(pos[0], pos[1], pos[2])
  if (scale) mesh.scale.set(scale[0], scale[1], scale[2])
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2])
  mesh.castShadow = opts.castShadow ?? true
  mesh.receiveShadow = opts.receiveShadow ?? false
  return mesh
}

/** Material cache keyed by color+params so all actors share draws. */
const materialCache = new Map<string, THREE.MeshStandardMaterial>()

export function standard(
  color: string,
  opts: {
    roughness?: number
    metalness?: number
    emissive?: string
    emissiveIntensity?: number
    transparent?: boolean
    opacity?: number
  } = {},
): THREE.MeshStandardMaterial {
  const key = JSON.stringify([color, opts])
  const hit = materialCache.get(key)
  if (hit) return hit
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.18,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    envMapIntensity: 0.6,
  })
  materialCache.set(key, mat)
  return mat
}

/** Dark glass used for windscreens and cabin windows. */
export const GLASS = standard('#16202c', {
  roughness: 0.12,
  metalness: 0.85,
  emissive: '#0b1a2a',
  emissiveIntensity: 0.35,
})

/** Sooty rubber for tyres. */
export const TYRE = standard('#1a1c20', { roughness: 0.92, metalness: 0.02 })

/** Bare metal for chassis and tow bars. */
export const METAL = standard('#9aa3ad', { roughness: 0.4, metalness: 0.75 })

/** Amber beacon. */
export const BEACON = standard('#f5a623', {
  emissive: '#ffb020',
  emissiveIntensity: 2.2,
  roughness: 0.3,
})

/** Red position light. */
export const LIGHT_RED = standard('#ff4d4d', {
  emissive: '#ff2b2b',
  emissiveIntensity: 2.0,
  roughness: 0.3,
})

export const LIGHT_GREEN = standard('#25e07a', {
  emissive: '#18d068',
  emissiveIntensity: 2.0,
  roughness: 0.3,
})

/**
 * Translucent hull material. `depthWrite: false` + `depthTest: true` means the
 * ghost is correctly hidden behind solid geometry, while the two-pass
 * back/front rendering (see ghost.ts) keeps its own faces blending in the
 * right order.
 */
const hullCache = new Map<string, THREE.MeshBasicMaterial>()

export function hullMaterial(color: string, side: THREE.Side, opacity: number): THREE.MeshBasicMaterial {
  const key = `${color}|${side}|${opacity}`
  const hit = hullCache.get(key)
  if (hit) return hit
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  })
  hullCache.set(key, mat)
  return mat
}

export function wheel(radius: number, width: number): THREE.Mesh {
  return part(PRIM.cyl, TYRE, {
    scale: [radius * 2, width, radius * 2],
    rot: [0, 0, Math.PI / 2],
  })
}

export interface BatchList {
  /** Add a primitive instance to the batch (baked in local space). */
  add: (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    opts?: PartOptions,
  ) => void
  /** Build one merged Mesh per material. */
  build: (name?: string) => THREE.Group
}

/**
 * Accumulate many primitive instances sharing a handful of materials, then
 * merge each material's instances into a single BufferGeometry.
 *
 * This is what keeps the scene cheap to draw: a 36-actor scene with four
 * vehicle types goes from ~280 draw calls to roughly (materials × actors), and
 * most actors end up at 3-5 draws each. Poses still move whole actor roots, so
 * merging never affects the interpolation path.
 */
export function createBatch(): BatchList {
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>()

  const add: BatchList['add'] = (geometry, material, opts = {}) => {
    const clone = geometry.clone()
    const matrix = new THREE.Matrix4()
    const pos = opts.pos ?? [0, 0, 0]
    const rot = opts.rot ?? [0, 0, 0]
    const scale = opts.scale ?? [1, 1, 1]
    matrix.compose(
      new THREE.Vector3(pos[0], pos[1], pos[2]),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
      new THREE.Vector3(scale[0], scale[1], scale[2]),
    )
    clone.applyMatrix4(matrix)
    // Normalise attribute sets so mergeGeometries never sees a mismatch
    // (e.g. UV-less primitives meeting UV-bearing ones).
    if (!clone.getAttribute('normal')) clone.computeVertexNormals()
    if (!clone.getAttribute('uv')) {
      const count = clone.getAttribute('position').count
      clone.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2))
    }
    const list = buckets.get(material)
    if (list) list.push(clone)
    else buckets.set(material, [clone])
  }

  const build = (name = 'batch'): THREE.Group => {
    const group = new THREE.Group()
    group.name = name
    for (const [material, geometries] of buckets) {
      if (geometries.length === 0) continue
      const merged =
        geometries.length === 1
          ? geometries[0].toNonIndexed()
          : mergeGeometries(geometries.map((g) => g.toNonIndexed()), false)
      if (!merged) {
        geometries.forEach((g) => g.dispose())
        continue
      }
      geometries.forEach((g) => g.dispose())
      const mesh = new THREE.Mesh(merged, material)
      mesh.castShadow = true
      mesh.receiveShadow = false
      group.add(mesh)
    }
    buckets.clear()
    return group
  }

  return { add, build }
}
