// 场景测试：楼A路径 + 门加宽后的重求解
import { samplePlan } from '../src/lib/samplePlan'
import { buildScene, planColliders } from '../src/lib/geometry'
import { findPath } from '../src/lib/pathfind'
import { sweepPath } from '../src/lib/sweep'
import { computeBoundsTree } from 'three-mesh-bvh'
import * as THREE from 'three'
import type { WheelchairParams } from '../src/lib/types'

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
const params: WheelchairParams = { width: 0.72, length: 1.15, turnRadius: 1.5, threshold: 0.9 }

function run(plan: ReturnType<typeof samplePlan>, sx: number, sz: number, ex: number, ez: number, label: string) {
  const built = buildScene(plan, planColliders(plan))
  const r = findPath(plan, params, { x: sx, z: sz }, { x: ex, z: ez })
  if (!r) {
    console.log(label, ': 无可行路径')
    return
  }
  const bl = sweepPath(r.samples, plan, params, built.bvhMesh, r.turnIssues)
  console.log(`${label}: 卡点 ${bl.length} 处`)
  for (const b of bl)
    console.log(`  #${b.id} (${b.x.toFixed(1)},${b.z.toFixed(1)}) 净宽=${b.clearWidth === Infinity ? '—' : b.clearWidth.toFixed(2)} | ${b.reasons.join('；')}`)
}

// 大门 -> 楼A（坡道A合格、门A 1.0m 合格，应无卡点或仅转弯类）
run(samplePlan(), 35, 48, 18, 15, '大门->楼A')
// 门B加宽到1.0、坡道B加长到7.5（坡度0.6/7.5=8%合格）后应无卡点
const p2 = samplePlan()
p2.doors.find((d) => d.id === 'doorB')!.width = 1.0
const rb = p2.ramps.find((r) => r.id === 'rampB')!
rb.cx += (7.5 - rb.length) / 2 * -rb.dirX // 保持上坡端不动
rb.cz += (7.5 - rb.length) / 2 * -rb.dirZ
rb.length = 7.5
run(p2, 35, 48, 52, 15, '门B=1.0 坡道B=7.5 大门->楼B')
