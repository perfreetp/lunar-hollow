import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CarBuilder } from './CarBuilder'
import type { AssemblyNode, NodeRuntime } from './types'
import { collectLeaves, walkTree } from './tree'

export interface ModelData {
  tree: AssemblyNode
  sceneRoot: THREE.Group
  leaves: AssemblyNode[]
  /** partId -> 运行时数据 */
  runtime: Map<string, NodeRuntime>
  /** 所有可拾取 mesh 的扁平数组（含 InstancedMesh） */
  pickables: THREE.Object3D[]
  totalParts: number
}

/**
 * 模型模块入口。
 *
 * loadProgrammatic：由 CarBuilder 生成带完整装配层级的演示整车。
 * loadGLB：加载外部 GLB。约定 GLB 中每个可拆解零件的 Object3D 都带
 *   userData.assemblyId（对应装配树叶子 id），装配树可由配套 JSON 描述；
 *   本方法负责把场景对象与装配树绑定为统一的 ModelData。
 */
export class ModelLoader {
  async loadProgrammatic(): Promise<ModelData> {
    const built = new CarBuilder().build()
    return this.attach(built.root, built.sceneRoot, built.leafCount)
  }

  async loadGLB(url: string, tree: AssemblyNode): Promise<ModelData> {
    const gltf = await new GLTFLoader().loadAsync(url)
    const sceneRoot = gltf.scene
    sceneRoot.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.partId && o.userData.assemblyId) {
        o.userData.partId = o.userData.assemblyId
      }
    })
    const leaves = collectLeaves(tree)
    return this.attach(tree, sceneRoot, leaves.length)
  }

  private attach(tree: AssemblyNode, sceneRoot: THREE.Group, totalParts: number): ModelData {
    const runtime = new Map<string, NodeRuntime>()
    const pickables: THREE.Object3D[] = []

    // 先按名字/partId 找到每个叶子对应的 pivot
    const pivotById = new Map<string, THREE.Group>()
    sceneRoot.traverse((o) => {
      if ((o as THREE.Group).isGroup && o.name) pivotById.set(o.name, o as THREE.Group)
    })

    const leaves = collectLeaves(tree)
    for (const leaf of leaves) {
      const id = leaf.id
      const pivot = pivotById.get(id)
      if (!pivot) throw new Error(`装配树零件在场景中找不到 pivot: ${id}`)

      const meshes: THREE.Mesh[] = []
      pivot.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.userData.partId = id
          meshes.push(o as THREE.Mesh)
          pickables.push(o)
        }
      })

      runtime.set(id, {
        node: leaf,
        pivot,
        meshes,
        basePosition: pivot.position.clone(),
        targetOffset: new THREE.Vector3(),
        currentOffset: new THREE.Vector3(),
        observeOffset: new THREE.Vector3(),
        observeTarget: new THREE.Vector3(),
        factorSum: 0,
        moving: false,
      })
    }

    // 内部节点记录叶子规模，供树形列表显示
    walkTree(tree, (n) => {
      if (n.children.length) {
        let count = 0
        walkTree(n, (m) => {
          if (!m.children.length) count++
        })
        n.userData.leafCount = count
      }
    })

    return { tree, sceneRoot, leaves, runtime, pickables, totalParts }
  }
}
