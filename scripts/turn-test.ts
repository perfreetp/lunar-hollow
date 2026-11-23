// 1.2m 宽 L 型走廊：R=1.5 应报转弯卡点；R=0.6 应通过
import { findPath } from '../src/lib/pathfind'
import type { Plan } from '../src/lib/types'

const plan: Plan = {
  name: '窄L走廊',
  walls: [
    { id: 'n', x1: 0, z1: 0, x2: 12, z2: 0, thickness: 0.2, height: 3 },
    { id: 'e', x1: 12, z1: 0, x2: 12, z2: 12, thickness: 0.2, height: 3 },
    { id: 's', x1: 12, z1: 12, x2: 0, z2: 12, thickness: 0.2, height: 3 },
    { id: 'w', x1: 0, z1: 12, x2: 0, z2: 0, thickness: 0.2, height: 3 },
    // L 内角：竖廊 x∈[0,1.2]，横廊 z∈[10.8,12]
    { id: 'i1', x1: 1.2, z1: 0, x2: 1.2, z2: 10.8, thickness: 0.2, height: 3 },
    { id: 'i2', x1: 1.2, z1: 10.8, x2: 12, z2: 10.8, thickness: 0.2, height: 3 },
  ],
  doors: [],
  ramps: [],
  pillars: [],
  floors: [],
  bounds: { x1: 0, z1: 0, x2: 12, z2: 12 },
}
for (const tr of [0.6, 1.0, 1.5]) {
  const r = findPath(plan, { width: 0.72, length: 1.15, turnRadius: tr, threshold: 0.9 }, { x: 0.6, z: 1 }, { x: 11, z: 11.4 })
  console.log(`turnRadius=${tr}:`, r ? `路径OK 转弯问题=${r.turnIssues.length}` : '不可达', r?.turnIssues.map(t => `(${t.x.toFixed(1)},${t.z.toFixed(1)})`).join(' ') ?? '')
}
