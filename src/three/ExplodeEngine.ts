import * as THREE from 'three'
import type { ModelData } from '../model/ModelLoader'
import type { AssemblyNode, ExplodeState, SerializedPart } from '../model/types'
import { ancestorPath, collectLeaves, walkTree } from '../model/tree'

const tmpDir = new THREE.Vector3()

/**
 * 拆解引擎。
 *
 * 位移模型（关键不变量）：
 *   对任一叶子零件 p，其拆解目标位移 =
 *     globalDistance × Σ ( factor(a) × p.part.explodeStep × p.part.explodeDir )
 *   其中 a 取遍 p 的所有祖先内部节点（含六大组、子装配，不含叶子自身）。
 *
 * 含义：每一级装配体展开时，该级管辖的所有零件沿各自方向平移 step×factor，
 * 多级展开的效果沿同一方向线性累加。上层（更靠近根的）装配体因子较大或
 * 方向不同，会先把上层零件整体让出，再由下级因子继续分散，遮挡关系由
 * “各零件独立方向 + 层级累加”天然保持。
 *
 * 性能：setFactor 只重算该节点子树内的叶子（题目要求的“只重算该级及上级”，
 * 因为上级因子变化等价于作用在该子树）。300 零件全量重算也是纯向量运算，
 * 每帧仅在动画中的零件写入 pivot.position。
 */
export class ExplodeEngine {
  /** 节点 id -> 展开因子 0~1 */
  readonly factors = new Map<string, number>()
  /** 全局平移距离倍率（用户可调的“平移距离”） */
  globalDistance = 1

  private dirtySubtrees = new Set<AssemblyNode>()
  private anyFactorAnimating = false

  constructor(private model: ModelData) {}

  // ------------------------------------------------------------- 因子操作
  setFactor(node: AssemblyNode, factor: number): void {
    if (node.children.length === 0) return // 叶子没有“展开”概念
    const clamped = THREE.MathUtils.clamp(factor, 0, 1)
    if (Math.abs((this.factors.get(node.id) ?? 0) - clamped) < 1e-6) return
    this.factors.set(node.id, clamped)
    this.dirtySubtrees.add(node)
  }

  getFactor(node: AssemblyNode): number {
    return this.factors.get(node.id) ?? 0
  }

  /** 逐级展开：从当前因子平滑到目标因子 */
  expandTo(node: AssemblyNode, factor: number): void {
    this.setFactor(node, factor)
  }

  /** 一键回装：全部因子归零（动画由 update 平滑完成） */
  resetAll(): void {
    this.factors.clear()
    this.dirtySubtrees.clear()
    this.dirtySubtrees.add(this.model.tree)
  }

  /** 全部逐级展开到指定因子（演示用） */
  expandAll(factor = 1): void {
    walkTree(this.model.tree, (n) => {
      if (n.children.length) this.setFactor(n, factor)
    })
  }

  isFullyAssembled(): boolean {
    for (const v of this.factors.values()) if (v > 1e-4) return false
    return true
  }

  // ------------------------------------------------------------- 位移重算
  /**
   * 重算指定节点子树内全部叶子的目标位移。
   * 复杂度 O(子树叶子数 × 平均层级深度)，层级深度通常 ≤4。
   */
  private recomputeSubtree(node: AssemblyNode): void {
    const { runtime } = this.model
    const leaves = collectLeaves(node)
    for (const leaf of leaves) {
      const rt = runtime.get(leaf.id)!
      const part = leaf.part!
      const path = ancestorPath(leaf)
      let sum = 0
      for (const ancestor of path) {
        if (ancestor === leaf) continue
        sum += this.factors.get(ancestor.id) ?? 0
      }
      rt.factorSum = sum
      tmpDir.set(part.explodeDir[0], part.explodeDir[1], part.explodeDir[2]).normalize()
      rt.targetOffset.copy(tmpDir).multiplyScalar(part.explodeStep * sum * this.globalDistance)
    }
  }

  /** 全局距离变化时需要全量重算一次（仅在用户拖动距离滑块时发生） */
  recomputeAll(): void {
    this.recomputeSubtree(this.model.tree)
  }

  // ------------------------------------------------------------- 每帧更新
  /**
   * 平滑动画：currentOffset 以指数趋近 targetOffset，observeOffset 同理。
   * 返回本帧是否仍有零件在运动（用于决定渲染循环是否可以降频）。
   */
  update(dt: number): boolean {
    if (this.dirtySubtrees.size) {
      for (const node of this.dirtySubtrees) this.recomputeSubtree(node)
      this.dirtySubtrees.clear()
    }

    const alpha = 1 - Math.exp(-dt * 9) // 帧率无关的平滑系数
    let moving = false
    const eps = 2e-4

    this.model.runtime.forEach((rt) => {
      const before = rt.currentOffset.x + rt.currentOffset.y + rt.currentOffset.z
      rt.currentOffset.lerp(rt.targetOffset, alpha)
      rt.observeOffset.lerp(rt.observeTarget, alpha)

      const stillMoving =
        rt.currentOffset.distanceToSquared(rt.targetOffset) > eps * eps ||
        rt.observeOffset.distanceToSquared(rt.observeTarget) > eps * eps
      if (stillMoving) moving = true

      const after = rt.currentOffset.x + rt.currentOffset.y + rt.currentOffset.z
      // 静止零件跳过矩阵写入，减少 300 零件场景下的 CPU 开销
      if (stillMoving || Math.abs(after - before) > 0) {
        rt.pivot.position.copy(rt.basePosition).add(rt.currentOffset).add(rt.observeOffset)
      }
    })

    this.anyFactorAnimating = moving
    return moving
  }

  get animating(): boolean {
    return this.anyFactorAnimating
  }

  // ------------------------------------------------------------- 序列化
  serialize(observePartId: string | null, observeAxis: 'x' | 'y' | 'z', observeDistance: number): ExplodeState {
    const factors: Record<string, number> = {}
    this.factors.forEach((v, id) => {
      if (v > 1e-6) factors[id] = Number(v.toFixed(4))
    })

    const parts: SerializedPart[] = []
    const world = new THREE.Vector3()
    this.model.runtime.forEach((rt) => {
      rt.pivot.getWorldPosition(world)
      parts.push({
        id: rt.node.id,
        name: rt.node.part!.name,
        offset: round3(rt.currentOffset),
        worldPosition: [round(world.x), round(world.y), round(world.z)],
      })
    })

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      totalParts: parts.length,
      globalDistance: this.globalDistance,
      observe: { partId: observePartId, axis: observeAxis, distance: observeDistance },
      factors,
      parts,
    }
  }

  /** 从导出文件恢复：因子重建 + 触发子树重算 + 观察状态由调用方应用 */
  restore(state: ExplodeState): { observe: ExplodeState['observe'] } {
    this.factors.clear()
    this.globalDistance = state.globalDistance
    for (const [id, f] of Object.entries(state.factors)) {
      if (this.model.runtime.has(id) || this.hasInternalNode(id)) this.factors.set(id, f)
    }
    this.dirtySubtrees.clear()
    this.dirtySubtrees.add(this.model.tree)
    // 立即重算目标，动画平滑趋近
    this.recomputeAll()
    return { observe: state.observe }
  }

  private hasInternalNode(id: string): boolean {
    let found = false
    walkTree(this.model.tree, (n) => {
      if (n.id === id) {
        found = true
        return false
      }
    })
    return found
  }
}

function round(v: number): number {
  return Math.round(v * 1e4) / 1e4
}
function round3(v: THREE.Vector3): [number, number, number] {
  return [round(v.x), round(v.y), round(v.z)]
}
