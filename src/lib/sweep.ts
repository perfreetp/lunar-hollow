// 沿路径固定步长扫掠：BVH 射线测净宽 + 坡度计算 + 卡点分组
import * as THREE from 'three'
import type { Blockage, Plan, Pt, WheelchairParams } from './types'
import { heightAt } from './geometry'
import type { TurnIssue } from './pathfind'

const STEP = 0.25
const MAX_RAY = 6
const SLOPE_LIMIT = 1 / 12
const SLOPE_TOL = 1.03 // 容差：恰为 1:12 的坡道不因浮点误差误报

export function sweepPath(
  samples: Pt[],
  plan: Plan,
  params: WheelchairParams,
  bvhMesh: THREE.Mesh,
  turnIssues: TurnIssue[]
): Blockage[] {
  const n = samples.length
  if (n < 2) return []
  const ray = new THREE.Raycaster()
  ray.firstHitOnly = true
  ray.far = MAX_RAY

  const clearW = new Float32Array(n)
  const slope = new Float32Array(n)
  const heights = new Float32Array(n)
  for (let i = 0; i < n; i++) heights[i] = heightAt(plan, samples[i].x, samples[i].z)

  const origin = new THREE.Vector3()
  const dir = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    const p = samples[i]
    const q = samples[Math.min(n - 1, i + 1)]
    const p0 = samples[Math.max(0, i - 1)]
    let tx = q.x - p0.x
    let tz = q.z - p0.z
    const l = Math.hypot(tx, tz) || 1
    tx /= l
    tz /= l
    // 左右法向射线（轮椅躯干高度 0.6m）
    let total = 0
    for (const sgn of [1, -1]) {
      origin.set(p.x, heights[i] + 0.6, p.z)
      dir.set(-tz * sgn, 0, tx * sgn).normalize()
      ray.set(origin, dir)
      const hit = ray.intersectObject(bvhMesh, false)
      total += hit.length ? hit[0].distance : MAX_RAY
    }
    clearW[i] = total
    if (i > 0 && i < n - 1) {
      slope[i] = (heights[i + 1] - heights[i - 1]) / (2 * STEP)
    }
  }
  slope[0] = slope[1]
  slope[n - 1] = slope[n - 2]

  // 有效净宽：轮椅长度窗口内的最小值
  const halfWin = Math.max(1, Math.round(params.length / 2 / STEP))
  const effW = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let m = Infinity
    const a = Math.max(0, i - halfWin)
    const b = Math.min(n - 1, i + halfWin)
    for (let j = a; j <= b; j++) if (clearW[j] < m) m = clearW[j]
    effW[i] = m
  }

  // 按原因分别标记、分组连续超限区段（间隔 ≤2 个采样点的同因区段归并）
  const flagW = new Array<boolean>(n).fill(false)
  const flagS = new Array<boolean>(n).fill(false)
  for (let i = 0; i < n; i++) {
    if (effW[i] < params.threshold) flagW[i] = true
    if (Math.abs(slope[i]) > SLOPE_LIMIT * SLOPE_TOL) flagS[i] = true
  }
  const blockages: Blockage[] = []
  let id = 1
  const emitGroups = (flag: boolean[], isWidth: boolean) => {
    let i = 0
    while (i < n) {
      if (!flag[i]) {
        i++
        continue
      }
      let j = i
      for (;;) {
        let k = j + 1
        let gap = 0
        while (k < n && !flag[k] && gap < 2) {
          k++
          gap++
        }
        if (k < n && flag[k]) j = k
        else break
      }
      const mid = samples[(i + j) >> 1]
      let minW = Infinity
      let maxS = 0
      for (let k = i; k <= j; k++) {
        if (effW[k] < minW) minW = effW[k]
        if (Math.abs(slope[k]) > maxS) maxS = Math.abs(slope[k])
      }
      const reasons: string[] = []
      if (isWidth && minW < params.threshold)
        reasons.push(`净宽不足：${minW.toFixed(2)}m < ${params.threshold.toFixed(2)}m`)
      if (!isWidth && maxS > SLOPE_LIMIT * SLOPE_TOL)
        reasons.push(`坡度超限：1:${(1 / maxS).toFixed(1)} 陡于 1:12（${(maxS * 100).toFixed(1)}%）`)
      if (reasons.length)
        blockages.push({ id: id++, x: mid.x, z: mid.z, clearWidth: minW, slope: maxS, reasons })
      i = j + 1
    }
  }
  emitGroups(flagW, true)
  emitGroups(flagS, false)

  // 转弯半径不足的卡点
  for (const t of turnIssues) {
    blockages.push({
      id: id++,
      x: t.x,
      z: t.z,
      clearWidth: Infinity,
      slope: 0,
      reasons: [`转弯半径不足：无法布置 R=${t.radius.toFixed(1)}m 转弯圆弧`],
    })
  }
  return blockages
}
