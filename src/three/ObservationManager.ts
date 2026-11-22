import * as THREE from 'three'
import type { ModelData } from '../model/ModelLoader'
import type { ConnectionPoint } from '../model/types'
import { ancestorPath } from '../model/tree'

/**
 * 观察模块：
 * 1. 选中零件后可沿 X/Y/Z 轴单独拉出（observeOffset 叠加在拆解位移上）
 * 2. 连接点用小标记显示（孔=环、轴=圆柱、卡扣=方块、螺接=六棱柱）
 * 3. 与同装配层级相邻零件用虚线表达装配关系，端点跟随各自连接点
 */
export class ObservationManager {
  readonly markerRoot = new THREE.Group()
  private lineRoot = new THREE.Group()
  private axisHelper: THREE.AxesHelper | null = null
  private activePartId: string | null = null
  /** 当前观察零件的连接点标记（挂在零件 pivot 下，跟随位移） */
  private trackedMarkers: THREE.Mesh[] = []
  private lines: { line: THREE.Line; fromPart: string; fromCp: ConnectionPoint; toPart: string; toCp: ConnectionPoint }[] = []

  private static markerMaterials: Record<ConnectionPoint['markerType'], THREE.MeshStandardMaterial> = {
    hole: new THREE.MeshStandardMaterial({ color: 0x37e0ff, emissive: 0x1d8fa8, emissiveIntensity: 0.6 }),
    shaft: new THREE.MeshStandardMaterial({ color: 0xff9f43, emissive: 0xa85d1d, emissiveIntensity: 0.6 }),
    snap: new THREE.MeshStandardMaterial({ color: 0x7bed9f, emissive: 0x2f8f4d, emissiveIntensity: 0.6 }),
    bolt: new THREE.MeshStandardMaterial({ color: 0xff6b81, emissive: 0xa82f44, emissiveIntensity: 0.6 }),
  }

  constructor(private model: ModelData) {
    this.markerRoot.name = 'connection-markers'
    this.lineRoot.name = 'relation-lines'
    this.markerRoot.visible = false
    this.lineRoot.visible = false
  }

  get object3d(): THREE.Object3D {
    const g = new THREE.Group()
    g.add(this.lineRoot)
    return g
  }

  get activeId(): string | null {
    return this.activePartId
  }

  /** 进入单件观察：拉出零件、生成连接点与关系线 */
  enter(partId: string, axis: 'x' | 'y' | 'z', distance: number): void {
    const rt = this.model.runtime.get(partId)
    if (!rt || !rt.node.part) return
    this.exit()
    this.activePartId = partId

    const dir = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
    rt.observeTarget.copy(dir).multiplyScalar(distance)

    this.buildMarkers(rt.node)
    this.buildRelationLines(rt.node)
    this.axisHelper = new THREE.AxesHelper(0.6)
    this.axisHelper.position.copy(rt.pivot.position)
    this.markerRoot.add(this.axisHelper)
    this.markerRoot.visible = true
    this.lineRoot.visible = true
  }

  /** 沿轴调整拉出距离（滑块/输入实时驱动） */
  setDistance(axis: 'x' | 'y' | 'z', distance: number): void {
    if (!this.activePartId) return
    const rt = this.model.runtime.get(this.activePartId)!
    const dir = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
    rt.observeTarget.copy(dir).multiplyScalar(distance)
  }

  exit(): void {
    if (this.activePartId) {
      const rt = this.model.runtime.get(this.activePartId)
      if (rt) rt.observeTarget.set(0, 0, 0)
    }
    this.activePartId = null
    this.clearMarkers()
    this.clearLines()
    if (this.axisHelper) {
      this.axisHelper.removeFromParent()
      this.axisHelper.dispose()
      this.axisHelper = null
    }
    this.markerRoot.visible = false
    this.lineRoot.visible = false
  }

  setMarkersVisible(visible: boolean): void {
    if (this.activePartId) {
      this.markerRoot.visible = visible
      this.lineRoot.visible = visible
      for (const m of this.trackedMarkers) m.visible = visible
    }
  }

  private clearMarkers(): void {
    for (const m of this.trackedMarkers) {
      m.removeFromParent()
      m.geometry.dispose()
    }
    this.trackedMarkers = []
  }

  private clearLines(): void {
    for (const item of this.lines) item.line.geometry.dispose()
    this.lines = []
    while (this.lineRoot.children.length) this.lineRoot.remove(this.lineRoot.children[0]!)
  }

  private buildMarkers(node: import('../model/types').AssemblyNode): void {
    const rt = this.model.runtime.get(node.id)!
    for (const cp of node.part!.connections) {
      const marker = this.makeMarker(cp)
      marker.position.set(cp.position[0], cp.position[1], cp.position[2])
      marker.userData.cpLabel = cp.label
      // 标记挂到零件 pivot 下，自动跟随拆解/观察位移
      rt.pivot.add(marker)
      this.trackedMarkers.push(marker)
    }
    this.markerRoot.visible = true
  }

  private makeMarker(cp: ConnectionPoint): THREE.Mesh {
    const mat = ObservationManager.markerMaterials[cp.markerType]
    let mesh: THREE.Mesh
    switch (cp.markerType) {
      case 'hole':
        mesh = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 20), mat)
        break
      case 'shaft':
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.09, 12), mat)
        break
      case 'snap':
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), mat)
        break
      case 'bolt':
      default:
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6), mat)
        break
    }
    mesh.name = `marker:${cp.id}`
    return mesh
  }

  /**
   * 关系线：同一父装配体下、与当前零件带同类连接点的相邻零件各连一条虚线。
   * 为控制 300 零件场景的开销，每个观察零件最多取 6 个邻居。
   */
  private buildRelationLines(node: import('../model/types').AssemblyNode): void {
    const parent = node.parent
    if (!parent) return
    const siblings = parent.children.filter((n) => n !== node && n.part)
    const ownTypes = new Set(node.part!.connections.map((c) => c.markerType))
    const material = new THREE.LineDashedMaterial({
      color: 0x9ad8ff,
      dashSize: 0.05,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.85,
    })

    let count = 0
    for (const sib of siblings) {
      if (count >= 6) break
      const match = sib.part!.connections.find((c) => ownTypes.has(c.markerType))
      const ownCp = node.part!.connections.find((c) => c.markerType === (match?.markerType ?? node.part!.connections[0]?.markerType))
      if (!match || !ownCp) continue
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
      const line = new THREE.Line(geo, material)
      line.computeLineDistances()
      this.lineRoot.add(line)
      this.lines.push({ line, fromPart: node.id, fromCp: ownCp, toPart: sib.id, toCp: match })
      count++
    }
  }

  /** 每帧更新：关系线端点对齐世界坐标下的连接点（随拆解状态联动） */
  update(): void {
    if (!this.activePartId) return
    const fromWorld = new THREE.Vector3()
    const toWorld = new THREE.Vector3()
    for (const item of this.lines) {
      const a = this.model.runtime.get(item.fromPart)!
      const b = this.model.runtime.get(item.toPart)!
      fromWorld.set(item.fromCp.position[0], item.fromCp.position[1], item.fromCp.position[2])
      a.pivot.localToWorld(fromWorld)
      toWorld.set(item.toCp.position[0], item.toCp.position[1], item.toCp.position[2])
      b.pivot.localToWorld(toWorld)
      const pos = item.line.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, fromWorld.x, fromWorld.y, fromWorld.z)
      pos.setXYZ(1, toWorld.x, toWorld.y, toWorld.z)
      pos.needsUpdate = true
      item.line.geometry.computeBoundingSphere()
      item.line.computeLineDistances()
    }
    if (this.axisHelper) {
      const rt = this.model.runtime.get(this.activePartId)!
      this.axisHelper.position.copy(rt.pivot.position)
    }
  }

  dispose(): void {
    this.exit()
  }

  /** 供 UI 展示当前观察零件的连接点清单 */
  describeActive(): { part: string; connections: ConnectionPoint[]; neighbors: number } {
    if (!this.activePartId) return { part: '', connections: [], neighbors: 0 }
    const node = this.model.runtime.get(this.activePartId)!.node
    const path = ancestorPath(node)
    const parent = path[path.length - 2]
    const neighbors = parent ? parent.children.filter((n) => n !== node && n.part).length : 0
    return { part: node.part!.name, connections: node.part!.connections, neighbors }
  }
}
