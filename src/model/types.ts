/**
 * 装配层级数据模型
 *
 * 装配树由 AssemblyNode 组成：内部节点表示装配体/分组，叶子节点表示单个零件。
 * 每个叶子零件在 3D 场景中对应一个 Group（pivot），pivot 位于零件的装配位置，
 * 拆解位移只作用在 pivot 上，与零件自身几何完全解耦。
 */

/** 六大装配分组 id */
export type GroupId = 'body' | 'chassis' | 'motor' | 'gears' | 'suspension' | 'wheels'

/** 连接点：定义在零件局部空间，markerType 决定标记样式 */
export interface ConnectionPoint {
  id: string
  /** 相对 pivot 的局部坐标 */
  position: [number, number, number]
  label: string
  /** hole=孔位，shaft=轴位，snap=卡扣，bolt=螺接 */
  markerType: 'hole' | 'shaft' | 'snap' | 'bolt'
}

/** 叶子零件的静态定义 */
export interface PartDef {
  id: string
  name: string
  /** 世界空间单位化拆解方向 */
  explodeDir: [number, number, number]
  /** 该零件每级（单位因子）的拆解距离，单位与场景一致 */
  explodeStep: number
  /** 关键零件会生成名称标注 */
  keyPart: boolean
  connections: ConnectionPoint[]
}

/** 装配树节点（同时覆盖装配体与零件） */
export interface AssemblyNode {
  id: string
  name: string
  /** 仅六大顶层分组存在 */
  groupId?: GroupId
  children: AssemblyNode[]
  /** 叶子节点才有零件定义 */
  part?: PartDef
  parent: AssemblyNode | null
  depth: number
  /** 运行期附加数据（叶子数统计等） */
  userData: Record<string, unknown>
}

/** 运行时节点缓存，挂在 node.userData 旁的 Map 中管理 */
export interface NodeRuntime {
  node: AssemblyNode
  /** 叶子零件对应的场景 pivot（内部节点为 null） */
  pivot: THREE.Group
  /** 叶子零件的所有可拾取 mesh */
  meshes: THREE.Mesh[]
  /** pivot 的初始装配位置 */
  basePosition: THREE.Vector3
  /** 当前拆解目标位移（世界空间） */
  targetOffset: THREE.Vector3
  /** 当前实际位移（动画平滑趋近 targetOffset） */
  currentOffset: THREE.Vector3
  /** 单件观察拉出位移（叠加在拆解位移之上） */
  observeOffset: THREE.Vector3
  /** 单件观察目标位移 */
  observeTarget: THREE.Vector3
  /** 根到自身路径上因子之和（叶子缓存） */
  factorSum: number
  /** 该零件是否处于待重算/动画中 */
  moving: boolean
}

/** 序列化到文件的单零件位置记录 */
export interface SerializedPart {
  id: string
  name: string
  offset: [number, number, number]
  worldPosition: [number, number, number]
}

/** 导出/导入的完整拆解状态 */
export interface ExplodeState {
  version: 1
  exportedAt: string
  totalParts: number
  globalDistance: number
  observe: {
    partId: string | null
    axis: 'x' | 'y' | 'z'
    distance: number
  }
  /** 节点 id -> 展开因子（仅记录非零值） */
  factors: Record<string, number>
  parts: SerializedPart[]
}

import type * as THREE from 'three'
