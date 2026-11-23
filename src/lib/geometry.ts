// 平面 -> 三维几何：墙体拉伸、门洞开洞、坡道、合并 BVH 碰撞体
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Plan, Wall } from './types'

export const DOOR_HEIGHT = 2.1

/** 轴对齐（可绕 Y 旋转）的碰撞盒 */
export interface ColliderBox {
  cx: number
  cz: number
  hx: number // 沿局部 x 半长
  hz: number // 沿局部 z 半宽
  angle: number // 绕 Y 旋转（平面内）
  y0: number
  h: number
}

export interface Seg {
  x1: number
  z1: number
  x2: number
  z2: number
}

function wallAngle(w: Wall): number {
  return Math.atan2(-(w.z2 - w.z1), w.x2 - w.x1) // three 中 z 朝屏幕外，取负
}

/** 把平面展开为碰撞盒列表（墙段 + 门楣 + 柱） */
export function planColliders(plan: Plan): ColliderBox[] {
  const boxes: ColliderBox[] = []
  for (const w of plan.walls) {
    const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
    const ang = wallAngle(w)
    const doors = plan.doors
      .filter((d) => d.wallId === w.id)
      .map((d) => ({ a: d.offset - d.width / 2, b: d.offset + d.width / 2, width: d.width }))
      .sort((p, q) => p.a - q.a)
    // 门洞之间的实体墙段
    let cursor = 0
    const intervals: [number, number][] = []
    for (const d of doors) {
      const a = Math.max(0, d.a)
      const b = Math.min(len, d.b)
      if (a > cursor) intervals.push([cursor, a])
      cursor = Math.max(cursor, b)
      // 门楣（门洞上方）
      boxes.push({
        cx: w.x1 + ((a + b) / 2 / len) * (w.x2 - w.x1),
        cz: w.z1 + ((a + b) / 2 / len) * (w.z2 - w.z1),
        hx: (b - a) / 2,
        hz: w.thickness / 2,
        angle: ang,
        y0: DOOR_HEIGHT,
        h: Math.max(0.01, w.height - DOOR_HEIGHT),
      })
    }
    if (cursor < len) intervals.push([cursor, len])
    for (const [a, b] of intervals) {
      if (b - a < 0.01) continue
      boxes.push({
        cx: w.x1 + ((a + b) / 2 / len) * (w.x2 - w.x1),
        cz: w.z1 + ((a + b) / 2 / len) * (w.z2 - w.z1),
        hx: (b - a) / 2,
        hz: w.thickness / 2,
        angle: ang,
        y0: 0,
        h: w.height,
      })
    }
  }
  for (const p of plan.pillars) {
    boxes.push({ cx: p.x, cz: p.z, hx: p.w / 2, hz: p.d / 2, angle: 0, y0: 0, h: p.h })
  }
  return boxes
}

/** 碰撞盒的 2D 轮廓线段（用于栅格膨胀与净宽兜底计算），只取与轮椅车体高度带相交的盒 */
export function colliderSegments(boxes: ColliderBox[], bandLo = 0.05, bandHi = 1.1): Seg[] {
  const segs: Seg[] = []
  for (const b of boxes) {
    if (b.y0 > bandHi || b.y0 + b.h < bandLo) continue
    const c = Math.cos(b.angle)
    const s = Math.sin(b.angle)
    const corners: [number, number][] = [
      [-b.hx, -b.hz],
      [b.hx, -b.hz],
      [b.hx, b.hz],
      [-b.hx, b.hz],
    ]
    const pts = corners.map(([lx, lz]) => ({
      // 局部 x 沿墙方向，局部 z 为法向；与 wallAngle 的约定一致
      x: b.cx + lx * c + lz * s,
      z: b.cz - lx * s + lz * c,
    }))
    for (let i = 0; i < 4; i++) {
      const p = pts[i]
      const q = pts[(i + 1) % 4]
      segs.push({ x1: p.x, z1: p.z, x2: q.x, z2: q.z })
    }
  }
  return segs
}

function boxGeometry(b: ColliderBox): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(b.hx * 2, b.h, b.hz * 2)
  const m = new THREE.Matrix4()
    .makeRotationY(b.angle)
    .setPosition(b.cx, b.y0 + b.h / 2, b.cz)
  g.applyMatrix4(m)
  return g
}

export interface BuiltScene {
  group: THREE.Group
  bvhMesh: THREE.Mesh // 合并后的碰撞网格（挂 boundsTree）
  colliderCount: number
}

/** 构建三维场景：地面、墙体、坡道，并返回合并 BVH 网格 */
export function buildScene(plan: Plan, boxes: ColliderBox[]): BuiltScene {
  const group = new THREE.Group()

  // 地面
  const { x1, z1, x2, z2 } = plan.bounds
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(x2 - x1 + 20, z2 - z1 + 20),
    new THREE.MeshLambertMaterial({ color: 0x9db08a })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set((x1 + x2) / 2, -0.01, (z1 + z2) / 2)
  ground.receiveShadow = true
  group.add(ground)

  // 室内地坪
  for (const f of plan.floors) {
    if (f.h <= 0.01) continue
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(f.x2 - f.x1, f.h, f.z2 - f.z1),
      new THREE.MeshLambertMaterial({ color: 0xcfc8b8 })
    )
    m.position.set((f.x1 + f.x2) / 2, f.h / 2, (f.z1 + f.z2) / 2)
    group.add(m)
  }

  // 坡道（可行走，不进碰撞 BVH）
  const rampMat = new THREE.MeshLambertMaterial({ color: 0xb8a888 })
  for (const r of plan.ramps) {
    const slopeLen = Math.hypot(r.length, r.rise)
    const g = new THREE.BoxGeometry(r.width, 0.12, slopeLen)
    const mesh = new THREE.Mesh(g, rampMat)
    const yaw = Math.atan2(-r.dirZ, r.dirX) + Math.PI / 2
    const pitch = Math.atan2(r.rise, r.length)
    mesh.rotation.order = 'YXZ'
    mesh.rotation.y = yaw
    mesh.rotation.x = -pitch
    const midH = r.rise / 2
    mesh.position.set(r.cx, midH - 0.06 * Math.cos(pitch), r.cz)
    group.add(mesh)
  }

  // 合并所有碰撞盒为单网格 + BVH
  const geoms = boxes.map(boxGeometry)
  const merged = mergeGeometries(geoms, false)!
  geoms.forEach((g) => g.dispose())
  merged.computeBoundsTree()
  const bvhMesh = new THREE.Mesh(
    merged,
    new THREE.MeshLambertMaterial({ color: 0xd8d2c4 })
  )
  bvhMesh.castShadow = true
  bvhMesh.receiveShadow = true
  group.add(bvhMesh)

  return { group, bvhMesh, colliderCount: boxes.length }
}

/** 地面高度：坡道内按坡度插值（上坡端外延 0.6m 衔接室内地坪），室内地坪按 floors，其余为 0 */
export function heightAt(plan: Plan, x: number, z: number): number {
  for (const r of plan.ramps) {
    // 局部坐标：u 沿 dir（上坡为正），v 横向
    const dx = x - r.cx
    const dz = z - r.cz
    const u = dx * r.dirX + dz * r.dirZ
    const v = -dx * r.dirZ + dz * r.dirX
    if (u >= -r.length / 2 && u <= r.length / 2 + 0.6 && Math.abs(v) <= r.width / 2) {
      return Math.min(1, (u + r.length / 2) / r.length) * r.rise
    }
  }
  let h = 0
  for (const f of plan.floors) {
    if (x >= f.x1 && x <= f.x2 && z >= f.z1 && z <= f.z2) h = Math.max(h, f.h)
  }
  return h
}
