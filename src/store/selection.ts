import { reactive } from 'vue'
import type { AssemblyNode } from '../model/types'

/**
 * 全局选择状态。树形列表与 3D 场景都读写这里，实现双向同步：
 * - 树点击 -> setSelectedId -> 场景监听变化做高亮/聚焦
 * - 场景射线拾取 -> setSelectedId -> 树监听变化展开并滚动到对应节点
 */
interface SelectionState {
  selectedId: string | null
  hoverId: string | null
  /** 观察模块当前拉出的零件 id（单件查看） */
  observeId: string | null
  observeAxis: 'x' | 'y' | 'z'
  observeDistance: number
  /** 标注总开关 */
  labelsVisible: boolean
  /** 连接点标记总开关 */
  markersVisible: boolean
}

export const selectionStore = reactive<SelectionState>({
  selectedId: null,
  hoverId: null,
  observeId: null,
  observeAxis: 'y',
  observeDistance: 0.8,
  labelsVisible: true,
  markersVisible: true,
})

export function setSelectedId(id: string | null): void {
  selectionStore.selectedId = id
}

export function setHoverId(id: string | null): void {
  selectionStore.hoverId = id
}

export function clearSelection(): void {
  selectionStore.selectedId = null
}

/** 判断某节点是否在当前选中节点的子树内（内部节点整组高亮用） */
export function isNodeInSubtree(node: AssemblyNode, ancestorId: string): boolean {
  let cur: AssemblyNode | null = node
  while (cur) {
    if (cur.id === ancestorId) return true
    cur = cur.parent
  }
  return false
}
