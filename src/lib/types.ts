// 数据模型：社区平面（墙、门洞、坡道、柱、地面高程）

export interface Wall {
  id: string
  x1: number
  z1: number
  x2: number
  z2: number
  thickness: number
  height: number
}

/** 门洞：挂在某面墙上，offset 为门中心距墙起点 (x1,z1) 的距离 */
export interface Door {
  id: string
  wallId: string
  offset: number
  width: number
}

/** 坡道：dir 为指向上坡端的单位向量，上坡高端位于中心 + dir*length/2 */
export interface Ramp {
  id: string
  cx: number
  cz: number
  dirX: number
  dirZ: number
  length: number
  width: number
  rise: number
}

export interface Pillar {
  x: number
  z: number
  w: number
  d: number
  h: number
}

export interface FloorRect {
  x1: number
  z1: number
  x2: number
  z2: number
  h: number
}

export interface Plan {
  name: string
  walls: Wall[]
  doors: Door[]
  ramps: Ramp[]
  pillars: Pillar[]
  floors: FloorRect[]
  bounds: { x1: number; z1: number; x2: number; z2: number }
}

export interface WheelchairParams {
  width: number        // 轮椅宽 m
  length: number       // 轮椅长 m
  turnRadius: number   // 最小转弯半径 m
  threshold: number    // 净宽阈值 m
}

export interface Pt {
  x: number
  z: number
}

export interface Blockage {
  id: number
  x: number
  z: number
  clearWidth: number   // 该区域最小有效净宽
  slope: number        // 该区域最大坡度绝对值 (rise/run)
  reasons: string[]
}

export interface ExportData {
  version: 1
  plan: Plan
  params: WheelchairParams
  start: Pt | null
  end: Pt | null
  path: Pt[]
  blockages: Blockage[]
}
