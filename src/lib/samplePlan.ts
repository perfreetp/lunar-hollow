// 内置示例社区平面：含门洞、坡道、连廊、柱阵（碰撞体 > 200）
import type { Plan, Pillar } from './types'

export function samplePlan(): Plan {
  const walls = [
    // 小区周边围墙
    { id: 'pN', x1: 0, z1: 0, x2: 70, z2: 0, thickness: 0.3, height: 2.6 },
    { id: 'pE', x1: 70, z1: 0, x2: 70, z2: 50, thickness: 0.3, height: 2.6 },
    { id: 'pS', x1: 70, z1: 50, x2: 0, z2: 50, thickness: 0.3, height: 2.6 },
    { id: 'pW', x1: 0, z1: 50, x2: 0, z2: 0, thickness: 0.3, height: 2.6 },
    // 住宅楼 A（室内地坪 +0.5）
    { id: 'aS', x1: 8, z1: 22, x2: 28, z2: 22, thickness: 0.25, height: 3 },
    { id: 'aN', x1: 28, z1: 8, x2: 8, z2: 8, thickness: 0.25, height: 3 },
    { id: 'aW', x1: 8, z1: 8, x2: 8, z2: 22, thickness: 0.25, height: 3 },
    { id: 'aE', x1: 28, z1: 22, x2: 28, z2: 8, thickness: 0.25, height: 3 },
    // 住宅楼 B（室内地坪 +0.6）
    { id: 'bW', x1: 42, z1: 8, x2: 42, z2: 22, thickness: 0.25, height: 3 },
    { id: 'bS', x1: 42, z1: 22, x2: 62, z2: 22, thickness: 0.25, height: 3 },
    { id: 'bE', x1: 62, z1: 22, x2: 62, z2: 8, thickness: 0.25, height: 3 },
    { id: 'bN', x1: 62, z1: 8, x2: 42, z2: 8, thickness: 0.25, height: 3 },
    // 大门入口连廊（有顶走廊两侧墙）
    { id: 'cW', x1: 33.5, z1: 50, x2: 33.5, z2: 30, thickness: 0.2, height: 2.8 },
    { id: 'cE', x1: 36.5, z1: 50, x2: 36.5, z2: 30, thickness: 0.2, height: 2.8 },
  ]

  const doors = [
    { id: 'gate', wallId: 'pS', offset: 35, width: 3.5 },   // 小区大门（墙起点为 x=70 端，offset 沿墙）
    { id: 'doorA', wallId: 'aS', offset: 9.5, width: 1.0 }, // 楼 A 南门
    { id: 'doorA2', wallId: 'aN', offset: 10, width: 1.2 }, // 楼 A 北门
    { id: 'doorB', wallId: 'bW', offset: 7, width: 0.85 },  // 楼 B 西门（偏窄，触发净宽告警）
  ]

  const ramps = [
    // 楼 A 门前坡道：0.5/6 = 1:12，合格
    { id: 'rampA', cx: 17.5, cz: 25.3, dirX: 0, dirZ: -1, length: 6, width: 3, rise: 0.5 },
    // 楼 B 门前坡道：0.6/5 ≈ 1:8.3，超限
    { id: 'rampB', cx: 39.3, cz: 15, dirX: 1, dirZ: 0, length: 5, width: 2.5, rise: 0.6 },
  ]

  const pillars: Pillar[] = []
  // 东西向步道两侧柱廊
  for (let x = 6; x <= 64; x += 2.5) {
    if (x > 14 && x < 21) continue // 避开坡道 A
    pillars.push({ x, z: 26.5, w: 0.4, d: 0.4, h: 2.8 })
    pillars.push({ x, z: 31.5, w: 0.4, d: 0.4, h: 2.8 })
  }
  // 东南柱阵广场
  for (let x = 44; x <= 64; x += 2.5) {
    for (let z = 28; z <= 46; z += 2.5) {
      pillars.push({ x, z, w: 0.4, d: 0.4, h: 2.8 })
    }
  }
  // 南侧与北侧绿篱墩
  for (let x = 6; x <= 64; x += 2.5) {
    pillars.push({ x, z: 44, w: 0.35, d: 0.35, h: 1.2 })
    pillars.push({ x, z: 4, w: 0.35, d: 0.35, h: 1.2 })
  }
  // 步道缘石墩（避开坡道 A 区域与连廊主通道）
  for (let x = 6; x <= 64; x += 2) {
    if ((x < 14 || x > 21) && (x < 31 || x > 39)) pillars.push({ x, z: 24.6, w: 0.25, d: 0.25, h: 0.9 })
    if (x < 31 || x > 39) pillars.push({ x, z: 33.5, w: 0.25, d: 0.25, h: 0.9 })
  }

  const floors = [
    { x1: 8, z1: 8, x2: 28, z2: 22, h: 0.5 },  // 楼 A 室内
    { x1: 42, z1: 8, x2: 62, z2: 22, h: 0.6 }, // 楼 B 室内
  ]

  return {
    name: '示例社区平面',
    walls,
    doors,
    ramps,
    pillars,
    floors,
    bounds: { x1: 0, z1: 0, x2: 70, z2: 50 },
  }
}
