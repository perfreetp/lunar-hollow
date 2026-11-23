// 逻辑冒烟测试：node 环境验证寻路 / 扫掠 / 卡点（不涉及 WebGL）
import { samplePlan } from '../src/lib/samplePlan'
import { planColliders, colliderSegments, heightAt } from '../src/lib/geometry'
import { findPath } from '../src/lib/pathfind'
import type { WheelchairParams } from '../src/lib/types'

const params: WheelchairParams = { width: 0.72, length: 1.15, turnRadius: 1.5, threshold: 0.9 }

const plan = samplePlan()
const boxes = planColliders(plan)
console.log('碰撞体数量:', boxes.length, boxes.length > 200 ? 'OK(>200)' : 'FAIL(<=200)')

// 地面高度
console.log('坡道A底高度(应为0):', heightAt(plan, 17.5, 28).toFixed(2))
console.log('坡道A顶高度(应为0.5):', heightAt(plan, 17.5, 22.4).toFixed(2))
console.log('楼A室内(应为0.5):', heightAt(plan, 18, 15).toFixed(2))
console.log('坡道B中点(应为0.3):', heightAt(plan, 39.3, 15).toFixed(2))

// 寻路：大门 -> 楼B室内
const t0 = performance.now()
const r1 = findPath(plan, params, { x: 35, z: 48 }, { x: 52, z: 15 })
console.log('寻路 大门->楼B:', r1 ? `OK 点数=${r1.smooth.length} 转弯问题=${r1.turnIssues.length}` : 'FAIL 未找到', `(${(performance.now() - t0).toFixed(0)}ms)`)

// 寻路：大门 -> 楼A室内 （穿门A, 过坡道A)
const r2 = findPath(plan, params, { x: 35, z: 48 }, { x: 18, z: 15 })
console.log('寻路 大门->楼A:', r2 ? `OK 点数=${r2.smooth.length}` : 'FAIL 未找到')

// 净宽兜底：用 2D 线段距离验证门B处净宽（门宽0.85）
const segs = colliderSegments(boxes)
function dist(x: number, z: number) {
  let m = Infinity
  for (const s of segs) {
    const dx = s.x2 - s.x1, dz = s.z2 - s.z1
    const l2 = dx * dx + dz * dz
    let t = l2 > 0 ? ((x - s.x1) * dx + (z - s.z1) * dz) / l2 : 0
    t = Math.max(0, Math.min(1, t))
    m = Math.min(m, Math.hypot(x - (s.x1 + t * dx), z - (s.z1 + t * dz)))
  }
  return m
}
console.log('门B中心净距(应≈0.425):', dist(42, 15).toFixed(3))
console.log('走廊中心净距(应≈1.4):', dist(35, 40).toFixed(3))

// 门A改窄到0.6后，轮椅0.72应无法通过门A（仍可能走北门A2）
const plan2 = samplePlan()
plan2.doors.find((d) => d.id === 'doorA')!.width = 0.6
plan2.doors.find((d) => d.id === 'doorA2')!.width = 0.6
const r3 = findPath(plan2, params, { x: 35, z: 48 }, { x: 18, z: 15 })
console.log('楼A两门均0.6m时寻路(应失败):', r3 ? 'FAIL 仍找到' : 'OK 不可达')

// 坡道B坡度
const rampB = plan.ramps.find((r) => r.id === 'rampB')!
console.log('坡道B坡度(应≈1:8.3):', '1:' + (rampB.length / rampB.rise).toFixed(1), (rampB.rise / rampB.length > 1 / 12) ? '超限OK' : 'FAIL')
