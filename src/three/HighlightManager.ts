import * as THREE from 'three'
import type { ModelData } from '../model/ModelLoader'
import { collectLeaves } from '../model/tree'

const HIGHLIGHT_COLOR = new THREE.Color(0x37e0ff)
const HOVER_COLOR = new THREE.Color(0xffe27a)

interface MaterialSnapshot {
  material: THREE.MeshStandardMaterial
  emissive: THREE.Color
  emissiveIntensity: number
  cloned: boolean
}

/**
 * 高亮管理器。
 *
 * 为避免修改共享材质影响其它零件，首次高亮某 mesh 时克隆其材质并缓存；
 * 取消高亮后保留克隆体（下次复用），通过 emissive 自发光表现选中/悬停。
 * 内部装配节点被选中时，其子树全部叶子一起高亮。
 */
export class HighlightManager {
  private snapshots = new Map<THREE.Mesh, MaterialSnapshot>()
  private selectedIds = new Set<string>()
  private hoverId: string | null = null

  constructor(private model: ModelData) {}

  setSelected(ids: string[]): void {
    const next = new Set(ids)
    if (this.sameSet(this.selectedIds, next)) return
    this.selectedIds = next
    this.refresh()
  }

  setHover(id: string | null): void {
    if (this.hoverId === id) return
    this.hoverId = id
    this.refresh()
  }

  private sameSet(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false
    for (const v of a) if (!b.has(v)) return false
    return true
  }

  private snapshotOf(mesh: THREE.Mesh): MaterialSnapshot {
    let snap = this.snapshots.get(mesh)
    if (!snap) {
      const src = mesh.material as THREE.MeshStandardMaterial
      const cloned = src.clone()
      mesh.material = cloned
      snap = {
        material: cloned,
        emissive: src.emissive.clone(),
        emissiveIntensity: src.emissiveIntensity,
        cloned: true,
      }
      this.snapshots.set(mesh, snap)
    }
    return snap
  }

  private refresh(): void {
    this.model.runtime.forEach((rt) => {
      const selected = this.selectedIds.has(rt.node.id)
      const hovered = this.hoverId === rt.node.id
      for (const mesh of rt.meshes) {
        const snap = this.snapshotOf(mesh)
        if (selected) {
          snap.material.emissive.copy(HIGHLIGHT_COLOR)
          snap.material.emissiveIntensity = 0.55
        } else if (hovered) {
          snap.material.emissive.copy(HOVER_COLOR)
          snap.material.emissiveIntensity = 0.35
        } else {
          snap.material.emissive.copy(snap.emissive)
          snap.material.emissiveIntensity = snap.emissiveIntensity
        }
      }
    })
  }

  /** 释放全部克隆材质（组件卸载时） */
  dispose(): void {
    this.snapshots.forEach((snap) => snap.material.dispose())
    this.snapshots.clear()
  }
}

/** 收集节点对应的全部叶子 id（叶子返回自身） */
export function resolveLeafIds(model: ModelData, nodeId: string): string[] {
  const node = findInModel(model, nodeId)
  if (!node) return []
  return collectLeaves(node).map((n) => n.id)
}

function findInModel(model: ModelData, id: string): import('../model/types').AssemblyNode | null {
  let found: import('../model/types').AssemblyNode | null = null
  const stack = [model.tree]
  while (stack.length) {
    const n = stack.pop()!
    if (n.id === id) {
      found = n
      break
    }
    stack.push(...n.children)
  }
  return found
}
