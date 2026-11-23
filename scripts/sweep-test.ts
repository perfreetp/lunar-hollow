// 扫掠与转弯卡点检查
import { samplePlan } from '../src/lib/samplePlan'
import { buildScene, planColliders, heightAt } from '../src/lib/geometry'
import { findPath } from '../src/lib/pathfind'
import { sweepPath } from '../src/lib/sweep'
import { computeBoundsTree } from 'three-mesh-bvh'
import * as THREE from 'three'
import type { WheelchairParams } from '../src/lib/types'

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree

const params: WheelchairParams = { width: 0.72, length: 1.15, turnRadius: 1.5, threshold: 0.9 }
const plan = samplePlan()
const built = buildScene(plan, planColliders(plan))

const r = findPath(plan, params, { x: 35, z: 48 }, { x: 52, z: 15 })!
console.log('转弯问题点:', r.turnIssues.map((t) => `(${t.x.toFixed(1)},${t.z.toFixed(1)})`).join(' ') || '无')

const t0 = performance.now()
const bl = sweepPath(r.samples, plan, params, built.bvhMesh, r.turnIssues)
console.log(`扫掠耗时 ${(performance.now() - t0).toFixed(0)}ms, 卡点 ${bl.length} 处:`)
for (const b of bl) {
  console.log(`  #${b.id} (${b.x.toFixed(1)},${b.z.toFixed(1)}) 净宽=${b.clearWidth === Infinity ? '—' : b.clearWidth.toFixed(2)} 坡度=${(b.slope * 100).toFixed(1)}% | ${b.reasons.join('；')}`)
}

// 检查路径上走廊段的净宽是否正常（应≈2.8m）
const mid = r.samples[Math.floor(r.samples.length * 0.15)]
console.log('走廊附近样本点:', mid, '地面高:', heightAt(plan, mid.x, mid.z))
