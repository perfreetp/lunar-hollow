import * as THREE from 'three'
import type { AssemblyNode, ConnectionPoint, GroupId, PartDef } from './types'
import {
  boxGeo,
  cylGeo,
  gearGeometries,
  sphereGeo,
  springGeo,
  standardMaterial,
  torusGeo,
} from './materials'

const V = (x: number, y: number, z: number): [number, number, number] => [x, y, z]
const UP: [number, number, number] = [0, 1, 0]

interface PartOptions {
  id: string
  name: string
  pos: THREE.Vector3 | [number, number, number]
  dir: [number, number, number]
  step?: number
  key?: boolean
  conns?: ConnectionPoint[]
  build: (pivot: THREE.Group, helper: BuildHelper) => void
}

class BuildHelper {
  constructor(private pivot: THREE.Group, private partId: string) {}

  mesh(
    geo: THREE.BufferGeometry,
    mat: THREE.MeshStandardMaterial,
    pos: [number, number, number] = [0, 0, 0],
    rot: [number, number, number] = [0, 0, 0],
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...pos)
    m.rotation.set(...rot)
    m.userData.partId = this.partId
    m.castShadow = true
    m.receiveShadow = true
    this.pivot.add(m)
    return m
  }

  /** 齿圈等重复结构用 InstancedMesh，拾取时整体归属于同一零件 */
  instanced(
    geo: THREE.BufferGeometry,
    mat: THREE.MeshStandardMaterial,
    count: number,
    setMatrix: (i: number, m: THREE.Matrix4) => void,
  ): THREE.InstancedMesh {
    const im = new THREE.InstancedMesh(geo, mat, count)
    const m4 = new THREE.Matrix4()
    for (let i = 0; i < count; i++) {
      setMatrix(i, m4)
      im.setMatrixAt(i, m4)
    }
    im.instanceMatrix.needsUpdate = true
    im.userData.partId = this.partId
    im.castShadow = true
    this.pivot.add(im)
    return im
  }
}

/**
 * 程序化遥控车构建器。
 * 产出：装配树 root + 与叶子一一对应的 pivot 场景节点。
 * 同时也是 GLB 加载器产出数据的参照结构（见 ModelLoader）。
 */
export class CarBuilder {
  readonly root: AssemblyNode = {
    id: 'car',
    name: '遥控车整车',
    children: [],
    parent: null,
    depth: 0,
    userData: {},
  }
  readonly sceneRoot = new THREE.Group()
  readonly leafCount = { value: 0 }

  private ids = new Set<string>()

  group(parent: AssemblyNode, id: string, name: string, groupId?: GroupId): AssemblyNode {
    const node: AssemblyNode = {
      id,
      name,
      groupId,
      children: [],
      parent,
      depth: parent.depth + 1,
      userData: {},
    }
    parent.children.push(node)
    return node
  }

  part(parent: AssemblyNode, opts: PartOptions): AssemblyNode {
    if (this.ids.has(opts.id)) throw new Error(`重复零件 id: ${opts.id}`)
    this.ids.add(opts.id)

    const pivot = new THREE.Group()
    const p = opts.pos
    if (Array.isArray(p)) pivot.position.set(...p)
    else pivot.position.copy(p)
    pivot.name = opts.id
    this.sceneRoot.add(pivot)

    const helper = new BuildHelper(pivot, opts.id)
    opts.build(pivot, helper)

    const part: PartDef = {
      id: opts.id,
      name: opts.name,
      explodeDir: opts.dir,
      explodeStep: opts.step ?? 0.6,
      keyPart: opts.key ?? false,
      connections: opts.conns ?? [],
    }
    const node: AssemblyNode = {
      id: opts.id,
      name: opts.name,
      children: [],
      parent,
      depth: parent.depth + 1,
      part,
      userData: {},
    }
    parent.children.push(node)
    this.leafCount.value++
    return node
  }

  build(): { root: AssemblyNode; sceneRoot: THREE.Group; leafCount: number } {
    this.buildBody()
    this.buildChassis()
    this.buildMotor()
    this.buildGears()
    this.buildSuspension()
    this.buildWheels()
    this.sceneRoot.traverse((o) => {
      o.userData.treeRoot = true
    })
    return { root: this.root, sceneRoot: this.sceneRoot, leafCount: this.leafCount.value }
  }

  // ---------------------------------------------------------------- 车壳
  private buildBody(): void {
    const g = this.group(this.root, 'g-body', '车壳', 'body')
    const red = standardMaterial(0xd2403a, { metalness: 0.3, roughness: 0.35 })
    const glass = standardMaterial(0x9fd8e8, { metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.42 })
    const dark = standardMaterial(0x222428, { roughness: 0.6 })
    const black = standardMaterial(0x14161a, { roughness: 0.7 })
    const lamp = standardMaterial(0xfff3c4, { roughness: 0.2 })
    const redLamp = standardMaterial(0xb31b1b, { roughness: 0.25 })
    const chrome = standardMaterial(0xcfd6dd, { metalness: 0.95, roughness: 0.18 })
    const interior = standardMaterial(0x30363f, { roughness: 0.8 })

    const cover = this.group(g, 'g-body-cover', '外壳覆盖件')
    this.part(cover, {
      id: 'body-shell-main', name: '主车壳', key: true, pos: V(0, 0.78, 0), dir: UP, step: 0.9,
      conns: [{ id: 'c1', position: [0, -0.28, 0], label: '车壳固定孔', markerType: 'hole' }],
      build: (_pv, h) => {
        h.mesh(boxGeo(2.35, 0.12, 1.95), red, [0, 0.16, 0])
        h.mesh(boxGeo(1.05, 0.1, 1.7), red, [-0.5, 0.02, 0])
        h.mesh(boxGeo(0.9, 0.34, 1.95), red, [0.62, 0.3, 0])
        h.mesh(boxGeo(0.5, 0.1, 1.75), red, [1.18, 0.12, 0])
      },
    })
    this.part(cover, { id: 'body-bumper-f', name: '前保险杠', pos: V(-1.52, 0.62, 0), dir: [-1, 0, 0], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.16, 0.22, 1.9), red) })
    this.part(cover, { id: 'body-bumper-r', name: '后保险杠', pos: V(1.52, 0.62, 0), dir: [1, 0, 0], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.16, 0.22, 1.9), red) })
    this.part(cover, { id: 'body-hood', name: '发动机舱盖', key: true, pos: V(-0.72, 0.86, 0), dir: UP, step: 0.75, build: (_pv, h) => h.mesh(boxGeo(0.85, 0.05, 1.78), red) })
    this.part(cover, { id: 'body-roof', name: '车顶', key: true, pos: V(0.35, 1.12, 0), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(boxGeo(0.95, 0.07, 1.7), red) })
    this.part(cover, { id: 'body-spoiler', name: '后扰流板', pos: V(1.42, 1.0, 0), dir: UP, step: 0.85, build: (_pv, h) => {
      h.mesh(boxGeo(0.22, 0.04, 1.8), red, [0, 0.08, 0])
      h.mesh(boxGeo(0.05, 0.12, 0.08), dark, [-0.06, 0, 0.6])
      h.mesh(boxGeo(0.05, 0.12, 0.08), dark, [-0.06, 0, -0.6])
    } })
    for (const side of [-1, 1]) {
      const z = side
      this.part(cover, {
        id: `body-door-${side}`, name: side < 0 ? '车门(左)' : '车门(右)', key: true,
        pos: V(0.25, 0.78, z * 0.99), dir: [0, 0, z], step: 0.7,
        build: (_pv, h) => h.mesh(boxGeo(0.95, 0.42, 0.05), red),
      })
      this.part(cover, {
        id: `body-mirror-${side}`, name: side < 0 ? '后视镜(左)' : '后视镜(右)',
        pos: V(-0.28, 0.92, z * 1.02), dir: [0, 0, z], step: 0.6,
        build: (_pv, h) => h.mesh(boxGeo(0.1, 0.07, 0.12), dark),
      })
      this.part(cover, {
        id: `body-fender-${side}-f`, name: `前轮眉(${side < 0 ? '左' : '右'})`,
        pos: V(-1.28, 0.66, z * 1.0), dir: [0, 0, z], step: 0.65,
        build: (_pv, h) => h.mesh(torusGeo(0.4, 0.05, 8, 20, Math.PI), red),
      })
      this.part(cover, {
        id: `body-fender-${side}-r`, name: `后轮眉(${side < 0 ? '左' : '右'})`,
        pos: V(1.28, 0.66, z * 1.0), dir: [0, 0, z], step: 0.65,
        build: (_pv, h) => h.mesh(torusGeo(0.4, 0.05, 8, 20, Math.PI), red),
      })
    }
    this.part(cover, { id: 'body-grille', name: '进气格栅', pos: V(-1.56, 0.7, 0), dir: [-1, 0, 0], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.04, 0.16, 1.2), dark) })
    this.part(cover, { id: 'body-antena', name: '天线', pos: V(0.9, 1.0, 0.75), dir: UP, step: 0.9, build: (_pv, h) => h.mesh(cylGeo(0.012, 0.5, 'y', 8), dark) })
    for (const side of [-1, 1]) {
      this.part(cover, { id: `body-exhaust-${side}`, name: `排气管(${side < 0 ? '左' : '右'})`, pos: V(1.58, 0.45, side * 0.55), dir: [1, 0, 0], step: 0.65, build: (_pv, h) => h.mesh(cylGeo(0.045, 0.22, 'x', 12), chrome) })
    }

    const winG = this.group(g, 'g-body-glass', '车窗玻璃')
    this.part(winG, { id: 'glass-windshield', name: '前挡风玻璃', key: true, pos: V(-0.28, 1.0, 0), dir: UP, step: 0.85, build: (_pv, h) => h.mesh(boxGeo(0.04, 0.3, 1.6), glass, [0, 0, 0], [0, 0, 0.55]) })
    this.part(winG, { id: 'glass-rear', name: '后窗玻璃', pos: V(0.86, 1.0, 0), dir: UP, step: 0.85, build: (_pv, h) => h.mesh(boxGeo(0.04, 0.28, 1.5), glass, [0, 0, 0], [0, 0, -0.5]) })
    for (const side of [-1, 1]) {
      this.part(winG, { id: `glass-side-${side}`, name: `侧窗玻璃(${side < 0 ? '左' : '右'})`, pos: V(0.3, 0.98, side * 0.96), dir: [0, 0, side], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.8, 0.24, 0.03), glass) })
    }

    const lampG = this.group(g, 'g-body-lamp', '灯具')
    for (const side of [-1, 1]) {
      this.part(lampG, { id: `lamp-head-${side}`, name: `前大灯(${side < 0 ? '左' : '右'})`, key: true, pos: V(-1.55, 0.72, side * 0.62), dir: [-1, 0, 0], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.05, 0.12, 0.28), lamp) })
      this.part(lampG, { id: `lamp-tail-${side}`, name: `尾灯(${side < 0 ? '左' : '右'})`, pos: V(1.55, 0.72, side * 0.62), dir: [1, 0, 0], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.05, 0.12, 0.24), redLamp) })
      this.part(lampG, { id: `lamp-fog-${side}`, name: `雾灯(${side < 0 ? '左' : '右'})`, pos: V(-1.56, 0.52, side * 0.5), dir: [-1, 0, 0], step: 0.55, build: (_pv, h) => h.mesh(sphereGeo(0.05, 12), lamp) })
    }

    const inner = this.group(g, 'g-body-inner', '内饰')
    this.part(inner, { id: 'inner-seat-l', name: '座椅(左)', key: true, pos: V(0.25, 0.62, 0.38), dir: UP, step: 0.7, build: (_pv, h) => {
      h.mesh(boxGeo(0.34, 0.1, 0.36), interior, [0, 0, 0])
      h.mesh(boxGeo(0.1, 0.34, 0.36), interior, [0.16, 0.2, 0])
    } })
    this.part(inner, { id: 'inner-seat-r', name: '座椅(右)', pos: V(0.25, 0.62, -0.38), dir: UP, step: 0.7, build: (_pv, h) => {
      h.mesh(boxGeo(0.34, 0.1, 0.36), interior)
      h.mesh(boxGeo(0.1, 0.34, 0.36), interior, [0.16, 0.2, 0])
    } })
    this.part(inner, { id: 'inner-dash', name: '仪表台', pos: V(-0.25, 0.7, 0), dir: UP, step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.22, 0.16, 1.4), dark) })
    this.part(inner, { id: 'inner-steering', name: '方向盘', key: true, pos: V(-0.42, 0.78, 0.38), dir: [-1, 0, 0], step: 0.6, build: (_pv, h) => h.mesh(torusGeo(0.11, 0.015, 8, 20), dark, [0, 0, 0], [0, Math.PI / 2, 0]) })
    this.part(inner, { id: 'inner-gear-lever', name: '换挡杆', pos: V(-0.05, 0.66, 0), dir: UP, step: 0.7, build: (_pv, h) => {
      h.mesh(cylGeo(0.015, 0.14, 'y', 8), chrome)
      h.mesh(sphereGeo(0.035, 12), black, [0, 0.08, 0])
    } })
    this.part(inner, { id: 'inner-mirror', name: '内后视镜', pos: V(-0.32, 1.06, 0), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(boxGeo(0.03, 0.06, 0.2), dark) })
    for (const side of [-1, 1]) {
      this.part(inner, { id: `inner-pedal-${side}`, name: side < 0 ? '油门踏板' : '刹车踏板', pos: V(-0.48, 0.46, side * 0.22), dir: [-1, 0, 0], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.04, 0.08, 0.1), dark) })
    }

    const clipG = this.group(g, 'g-body-clip', '车壳固定件')
    const clipPos: [number, number, number][] = [[-0.9, 0.72, 0.7], [-0.9, 0.72, -0.7], [0.9, 0.72, 0.7], [0.9, 0.72, -0.7], [0, 0.72, 0.8], [0, 0.72, -0.8]]
    clipPos.forEach((p, i) => {
      this.part(clipG, { id: `body-clip-${i}`, name: `车壳卡扣 ${i + 1}`, pos: p, dir: UP, step: 0.95,
        conns: [{ id: 'cp', position: [0, -0.03, 0], label: '卡扣孔', markerType: 'snap' }],
        build: (_pv, h) => h.mesh(boxGeo(0.06, 0.05, 0.12), chrome) })
    })
  }

  // ---------------------------------------------------------------- 底盘
  private buildChassis(): void {
    const g = this.group(this.root, 'g-chassis', '底盘', 'chassis')
    const frame = standardMaterial(0x4b5563, { metalness: 0.7, roughness: 0.4 })
    const alloy = standardMaterial(0x8b95a1, { metalness: 0.85, roughness: 0.3 })
    const chrome = standardMaterial(0xcfd6dd, { metalness: 0.95, roughness: 0.18 })
    const pcb = standardMaterial(0x1f6f4a, { roughness: 0.5 })
    const black = standardMaterial(0x1c1e22, { roughness: 0.7 })
    const brass = standardMaterial(0xb08d57, { metalness: 0.9, roughness: 0.3 })

    const frameG = this.group(g, 'g-chassis-frame', '主车架')
    this.part(frameG, { id: 'chassis-rail-l', name: '纵梁(左)', key: true, pos: V(0, 0.3, 0.82), dir: [0, 0, 1], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(3.0, 0.12, 0.1), frame) })
    this.part(frameG, { id: 'chassis-rail-r', name: '纵梁(右)', key: true, pos: V(0, 0.3, -0.82), dir: [0, 0, -1], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(3.0, 0.12, 0.1), frame) })
    ;[-1.1, 0, 1.1].forEach((x, i) => {
      this.part(frameG, { id: `chassis-cross-${i}`, name: `横梁 ${i + 1}`, pos: V(x, 0.3, 0), dir: UP, step: 0.65,
        conns: [{ id: 'cp', position: [0, 0.06, 0], label: '横梁螺栓孔', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(boxGeo(0.1, 0.1, 1.75), frame) })
    })
    this.part(frameG, { id: 'chassis-plate', name: '底盘底板', key: true, pos: V(0, 0.22, 0), dir: UP, step: 0.55, build: (_pv, h) => h.mesh(boxGeo(2.7, 0.05, 1.6), frame) })
    this.part(frameG, { id: 'chassis-brace-l', name: '加强筋(左)', pos: V(0, 0.34, 0.55), dir: [0, 0, 1], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(2.2, 0.04, 0.05), alloy) })
    this.part(frameG, { id: 'chassis-brace-r', name: '加强筋(右)', pos: V(0, 0.34, -0.55), dir: [0, 0, -1], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(2.2, 0.04, 0.05), alloy) })
    ;[[-1.1, 0.82], [-1.1, -0.82], [1.1, 0.82], [1.1, -0.82]].forEach(([x, z], i) => {
      this.part(frameG, { id: `chassis-tower-${i}`, name: `减震塔 ${i + 1}`, key: true, pos: V(x, 0.42, z), dir: z > 0 ? [0, 0, 1] : [0, 0, -1], step: 0.7,
        conns: [{ id: 'cp', position: [0, 0.1, 0], label: '避震安装点', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(boxGeo(0.14, 0.28, 0.12), alloy) })
    })
    ;[[-1.3, 0.82], [-1.3, -0.82], [1.3, 0.82], [1.3, -0.82]].forEach(([x, z], i) => {
      this.part(frameG, { id: `chassis-bracket-${i}`, name: `安装角码 ${i + 1}`, pos: V(x, 0.3, z), dir: z > 0 ? [0, 0, 1] : [0, 0, -1], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.1, 0.16, 0.1), alloy) })
    })

    const elec = this.group(g, 'g-chassis-elec', '电子系统')
    this.part(elec, { id: 'elec-battery', name: '锂电池组', key: true, pos: V(0.45, 0.42, 0), dir: UP, step: 0.85,
      conns: [{ id: 'cp', position: [-0.3, 0.06, 0], label: '电源插头', markerType: 'snap' }],
      build: (_pv, h) => h.mesh(boxGeo(0.55, 0.18, 0.5), standardMaterial(0x2a5db0, { roughness: 0.5 })) })
    this.part(elec, { id: 'elec-esc', name: '电调 ESC', key: true, pos: V(-0.15, 0.42, 0.45), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(boxGeo(0.3, 0.12, 0.3), pcb) })
    this.part(elec, { id: 'elec-receiver', name: '接收机', key: true, pos: V(-0.15, 0.42, -0.45), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(boxGeo(0.26, 0.1, 0.22), pcb) })
    this.part(elec, { id: 'elec-servo', name: '转向舵机', key: true, pos: V(-0.85, 0.4, 0), dir: [-1, 0, 0], step: 0.7,
      conns: [{ id: 'cp', position: [0, 0.08, 0], label: '舵机臂花键', markerType: 'shaft' }],
      build: (_pv, h) => h.mesh(boxGeo(0.32, 0.18, 0.28), black) })
    this.part(elec, { id: 'elec-servo-arm', name: '舵机臂', pos: V(-0.85, 0.54, 0), dir: UP, step: 0.85, build: (_pv, h) => h.mesh(boxGeo(0.05, 0.03, 0.3), alloy) })
    this.part(elec, { id: 'elec-switch', name: '电源开关', pos: V(0.1, 0.36, 0.78), dir: [0, 0, 1], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.1, 0.06, 0.04), black) })
    this.part(elec, { id: 'elec-antena-base', name: '天线座', pos: V(-0.15, 0.52, -0.45), dir: UP, step: 0.9, build: (_pv, h) => h.mesh(cylGeo(0.03, 0.08, 'y', 10), black) })
    for (const i of [0, 1]) {
      this.part(elec, { id: `elec-battery-strap-${i}`, name: `电池绑带 ${i + 1}`, pos: V(0.3 + i * 0.3, 0.54, 0), dir: UP, step: 0.9, build: (_pv, h) => h.mesh(boxGeo(0.06, 0.02, 0.56), black) })
    }
    for (let i = 0; i < 6; i++) {
      this.part(elec, { id: `elec-cable-tie-${i}`, name: `线束扎带 ${i + 1}`, pos: V(-0.9 + i * 0.32, 0.36, -0.7), dir: [0, 0, -1], step: 0.55, build: (_pv, h) => h.mesh(boxGeo(0.04, 0.04, 0.08), black) })
    }

    const steer = this.group(g, 'g-chassis-steer', '转向系统')
    this.part(steer, { id: 'steer-rocker', name: '转向摇臂', pos: V(-0.95, 0.48, 0), dir: UP, step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.06, 0.04, 0.5), alloy) })
    for (const side of [-1, 1]) {
      this.part(steer, { id: `steer-rod-${side}`, name: `转向拉杆(${side < 0 ? '左' : '右'})`, key: true, pos: V(-1.05, 0.44, side * 0.45), dir: [0, 0, side], step: 0.65,
        conns: [{ id: 'c1', position: [0, 0, side * 0.18], label: '球头窝', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(cylGeo(0.02, 0.5, 'z', 10), alloy) })
    }
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1
      this.part(steer, { id: `steer-ball-${i}`, name: `转向球头 ${i + 1}`, pos: V(-1.05 + (i < 2 ? 0 : 0.05), 0.44, side * (i < 2 ? 0.2 : 0.7)), dir: [0, 0, side], step: 0.6,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '球铰', markerType: 'bolt' }],
        build: (_pv, h) => h.mesh(sphereGeo(0.035, 12), chrome) })
    }

    const shaft = this.group(g, 'g-chassis-shaft', '中央传动')
    ;[-0.55, 0.15, 0.8].forEach((x, i) => {
      this.part(shaft, { id: `driveshaft-${i}`, name: `传动轴段 ${i + 1}`, key: i === 1, pos: V(x, 0.32, 0), dir: i === 0 ? [-1, 0, 0] : [1, 0, 0], step: 0.6,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '花键轴端', markerType: 'shaft' }],
        build: (_pv, h) => h.mesh(cylGeo(0.035, 0.6, 'x', 14), alloy) })
    })
    for (let i = 0; i < 4; i++) {
      this.part(shaft, { id: `driveshaft-ujoint-${i}`, name: `万向节 ${i + 1}`, key: i === 0, pos: V(-0.9 + i * 0.62, 0.32, 0), dir: i < 2 ? [-1, 0, 0] : [1, 0, 0], step: 0.65, build: (_pv, h) => {
        h.mesh(torusGeo(0.05, 0.014, 8, 16), alloy)
        h.mesh(torusGeo(0.05, 0.014, 8, 16), alloy, [0, 0, 0], [Math.PI / 2, 0, 0])
      } })
    }
    for (let i = 0; i < 4; i++) {
      this.part(shaft, { id: `driveshaft-bearing-${i}`, name: `传动轴轴承座 ${i + 1}`, pos: V(-1.0 + i * 0.66, 0.32, 0), dir: UP, step: 0.7,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '轴承位', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(cylGeo(0.07, 0.08, 'x', 16), brass) })
    }

    const guard = this.group(g, 'g-chassis-guard', '防护件')
    this.part(guard, { id: 'guard-bumper-f', name: '前防撞梁', pos: V(-1.55, 0.3, 0), dir: [-1, 0, 0], step: 0.65, build: (_pv, h) => h.mesh(boxGeo(0.08, 0.1, 1.8), black) })
    this.part(guard, { id: 'guard-bumper-r', name: '后防撞梁', pos: V(1.55, 0.3, 0), dir: [1, 0, 0], step: 0.65, build: (_pv, h) => h.mesh(boxGeo(0.08, 0.1, 1.8), black) })
    for (const side of [-1, 1]) {
      this.part(guard, { id: `guard-side-${side}`, name: `侧踏板(${side < 0 ? '左' : '右'})`, pos: V(0, 0.26, side * 0.98), dir: [0, 0, side], step: 0.6, build: (_pv, h) => h.mesh(boxGeo(2.0, 0.05, 0.12), black) })
    }
    for (let i = 0; i < 3; i++) {
      this.part(guard, { id: `guard-skid-${i}`, name: `底盘护板 ${i + 1}`, pos: V(-0.9 + i * 0.9, 0.17, 0), dir: UP, step: 0.55, build: (_pv, h) => h.mesh(boxGeo(0.7, 0.03, 1.4), alloy) })
    }

    const fastener = this.group(g, 'g-chassis-fastener', '底盘紧固件')
    for (let i = 0; i < 28; i++) {
      const x = -1.35 + (i % 14) * 0.208
      const z = i < 14 ? 0.82 : -0.82
      this.part(fastener, { id: `chassis-bolt-${i}`, name: `车架螺栓 M3×16 #${i + 1}`, pos: V(x, 0.38, z), dir: UP, step: 0.9,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '螺纹孔', markerType: 'bolt' }],
        build: (_pv, h) => h.mesh(cylGeo(0.022, 0.08, 'y', 6), brass) })
    }
    for (let i = 0; i < 8; i++) {
      this.part(fastener, { id: `chassis-nut-${i}`, name: `防松螺母 #${i + 1}`, pos: V(-1.2 + (i % 4) * 0.8, 0.26, i < 4 ? 0.82 : -0.82), dir: UP, step: 0.85, build: (_pv, h) => h.mesh(cylGeo(0.03, 0.03, 'y', 6), alloy) })
    }
  }

  // ---------------------------------------------------------------- 电机
  private buildMotor(): void {
    const g = this.group(this.root, 'g-motor', '电机', 'motor')
    const can = standardMaterial(0x9aa3ad, { metalness: 0.85, roughness: 0.32 })
    const copper = standardMaterial(0xb87333, { metalness: 0.9, roughness: 0.35 })
    const magnet = standardMaterial(0x3a4a6b, { metalness: 0.6, roughness: 0.4 })
    const black = standardMaterial(0x1c1e22, { roughness: 0.7 })
    const brass = standardMaterial(0xb08d57, { metalness: 0.9, roughness: 0.3 })

    const housing = this.group(g, 'g-motor-housing', '电机壳体')
    this.part(housing, { id: 'motor-can', name: '电机主壳体', key: true, pos: V(-0.55, 0.45, 0), dir: UP, step: 0.95,
      conns: [{ id: 'c1', position: [-0.22, 0, 0], label: '前端盖止口', markerType: 'hole' }],
      build: (_pv, h) => h.mesh(cylGeo(0.17, 0.4, 'x', 28), can) })
    this.part(housing, { id: 'motor-cap-f', name: '前端盖', pos: V(-0.78, 0.45, 0), dir: [-1, 0, 0], step: 0.85,
      conns: [{ id: 'cp', position: [0, 0, 0], label: '轴孔', markerType: 'hole' }],
      build: (_pv, h) => h.mesh(cylGeo(0.17, 0.04, 'x', 28), can) })
    this.part(housing, { id: 'motor-cap-r', name: '后端盖', pos: V(-0.32, 0.45, 0), dir: [1, 0, 0], step: 0.85, build: (_pv, h) => h.mesh(cylGeo(0.17, 0.04, 'x', 28), can) })
    for (const side of [-1, 1]) {
      this.part(housing, { id: `motor-mount-${side}`, name: `电机固定座(${side < 0 ? '上' : '下'})`, pos: V(-0.55, 0.45 + side * 0.2, 0), dir: [0, side, 0], step: 0.8,
        conns: [{ id: 'cp', position: [0, -side * 0.05, 0], label: '固定螺丝孔', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(boxGeo(0.46, 0.05, 0.24), black) })
    }
    this.part(housing, { id: 'motor-adjust-screw', name: '张紧调节螺丝', pos: V(-0.4, 0.62, 0.18), dir: UP, step: 0.9, build: (_pv, h) => h.mesh(cylGeo(0.02, 0.12, 'y', 10), brass) })

    const inner = this.group(g, 'g-motor-inner', '电机内部')
    this.part(inner, { id: 'motor-shaft', name: '转子轴', key: true, pos: V(-0.55, 0.45, 0), dir: [-1, 0, 0], step: 0.9,
      conns: [{ id: 'cp', position: [-0.25, 0, 0], label: '电机齿安装位', markerType: 'shaft' }],
      build: (_pv, h) => h.mesh(cylGeo(0.025, 0.62, 'x', 12), brass) })
    this.part(inner, { id: 'motor-rotor', name: '转子铁芯', key: true, pos: V(-0.55, 0.45, 0), dir: [1, 0, 0], step: 0.8, build: (_pv, h) => h.mesh(cylGeo(0.12, 0.26, 'x', 24), magnet) })
    for (const side of [-1, 1]) {
      this.part(inner, { id: `motor-stator-${side}`, name: `定子磁瓦(${side < 0 ? '上' : '下'})`, pos: V(-0.55, 0.45 + side * 0.14, 0), dir: [0, side, 0], step: 0.75, build: (_pv, h) => h.mesh(cylGeo(0.15, 0.24, 'x', 24), copper, [0, 0, 0], [0, 0, Math.PI / 2]) })
    }
    this.part(inner, { id: 'motor-commutator', name: '换向器', pos: V(-0.4, 0.45, 0), dir: [1, 0, 0], step: 0.75, build: (_pv, h) => h.mesh(cylGeo(0.06, 0.06, 'x', 18), copper) })
    for (const side of [-1, 1]) {
      this.part(inner, { id: `motor-brush-${side}`, name: `碳刷(${side < 0 ? '上' : '下'})`, pos: V(-0.4, 0.45 + side * 0.1, 0), dir: [0, side, 0], step: 0.7, build: (_pv, h) => h.mesh(boxGeo(0.05, 0.04, 0.06), black) })
    }
    for (const side of [-1, 1]) {
      this.part(inner, { id: `motor-bearing-${side}`, name: `电机轴承(${side < 0 ? '前' : '后'})`, pos: V(-0.55 + side * 0.2, 0.45, 0), dir: side < 0 ? [-1, 0, 0] : [1, 0, 0], step: 0.8,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '轴承内圈', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(torusGeo(0.05, 0.018, 10, 20).rotateY(Math.PI / 2), brass) })
    }
    this.part(inner, { id: 'motor-fan', name: '散热风扇', pos: V(-0.3, 0.45, 0), dir: [1, 0, 0], step: 0.8, build: (_pv, h) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        h.mesh(boxGeo(0.02, 0.1, 0.04), black, [0, Math.cos(a) * 0.07, Math.sin(a) * 0.07], [a, 0, 0])
      }
    } })
    this.part(inner, { id: 'motor-pinion', name: '电机齿(小齿轮)', key: true, pos: V(-0.88, 0.45, 0), dir: [-1, 0, 0], step: 0.85,
      conns: [{ id: 'cp', position: [0, 0, 0], label: '顶丝孔', markerType: 'bolt' }],
      build: (_pv, h) => {
        const [hub, tooth] = gearGeometries(0.07, 0.05, 14)
        h.mesh(hub, brass)
        h.instanced(tooth, brass, 14, (i, m) => {
          const a = (i / 14) * Math.PI * 2
          m.makeRotationX(a).setPosition(0, Math.cos(a) * 0.075, Math.sin(a) * 0.075)
        })
      } })

    const elec = this.group(g, 'g-motor-elec', '电机电气件')
    for (const side of [-1, 1]) {
      this.part(elec, { id: `motor-terminal-${side}`, name: `接线柱(${side < 0 ? '正' : '负'})`, pos: V(-0.35, 0.58, side * 0.1), dir: UP, step: 0.85,
        conns: [{ id: 'cp', position: [0, 0.03, 0], label: '焊线点', markerType: 'bolt' }],
        build: (_pv, h) => h.mesh(cylGeo(0.018, 0.06, 'y', 10), brass) })
    }
    for (let i = 0; i < 3; i++) {
      this.part(elec, { id: `motor-capacitor-${i}`, name: `消弧电容 ${i + 1}`, pos: V(-0.38, 0.56, -0.08 + i * 0.08), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(cylGeo(0.014, 0.06, 'y', 8), standardMaterial(0x2a5db0, { roughness: 0.4 })) })
    }
    this.part(elec, { id: 'motor-retainer', name: '线束固定卡扣', pos: V(-0.5, 0.6, -0.16), dir: UP, step: 0.75, build: (_pv, h) => h.mesh(boxGeo(0.08, 0.03, 0.05), black) })
  }

  // ---------------------------------------------------------------- 齿轮组
  private buildGears(): void {
    const g = this.group(this.root, 'g-gears', '齿轮组', 'gears')
    const caseMat = standardMaterial(0x6b7280, { metalness: 0.7, roughness: 0.4 })
    const gearMat = standardMaterial(0xc9a227, { metalness: 0.85, roughness: 0.3 })
    const brass = standardMaterial(0xb08d57, { metalness: 0.9, roughness: 0.3 })
    const dark = standardMaterial(0x3a3f47, { metalness: 0.7, roughness: 0.4 })

    const buildDiff = (prefix: string, label: string, cx: number): void => {
      const dg = this.group(g, `g-gears-${prefix}`, `${label}差速器`)
      this.part(dg, { id: `${prefix}-diff-case-a`, name: '差速器壳(上)', key: true, pos: V(cx, 0.24, 0), dir: UP, step: 0.85,
        conns: [{ id: 'cp', position: [0, -0.06, 0], label: '壳体结合面', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(boxGeo(0.24, 0.1, 0.3), caseMat, [0, 0.05, 0]) })
      this.part(dg, { id: `${prefix}-diff-case-b`, name: '差速器壳(下)', pos: V(cx, 0.1, 0), dir: [0, -1, 0], step: 0.85, build: (_pv, h) => h.mesh(boxGeo(0.24, 0.1, 0.3), caseMat) })
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2
        this.part(dg, { id: `${prefix}-diff-planet-${i}`, name: `行星齿轮 ${i + 1}`, key: i === 0, pos: V(cx, 0.18 + Math.cos(a) * 0.08, Math.sin(a) * 0.09), dir: UP, step: 0.8,
          build: (_pv, h) => h.mesh(cylGeo(0.045, 0.04, 'x', 14), gearMat) })
      }
      for (const side of [-1, 1]) {
        this.part(dg, { id: `${prefix}-diff-side-gear-${side}`, name: `半轴齿(${side < 0 ? '左' : '右'})`, pos: V(cx, 0.18, side * 0.1), dir: [0, 0, side], step: 0.75,
          conns: [{ id: 'cp', position: [0, 0, side * 0.04], label: '半轴花键', markerType: 'shaft' }],
          build: (_pv, h) => h.mesh(cylGeo(0.06, 0.05, 'z', 16), gearMat) })
      }
      this.part(dg, { id: `${prefix}-diff-ring`, name: '从动大齿圈', key: true, pos: V(cx - 0.14, 0.18, 0), dir: [-1, 0, 0], step: 0.8,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '与电机齿啮合', markerType: 'bolt' }],
        build: (_pv, h) => {
          const [hub, tooth] = gearGeometries(0.13, 0.05, 26)
          h.mesh(hub, gearMat)
          h.instanced(tooth, gearMat, 26, (i, m) => {
            const a = (i / 26) * Math.PI * 2
            m.makeRotationX(a).setPosition(0, Math.cos(a) * 0.14, Math.sin(a) * 0.14)
          })
        } })
      for (const side of [-1, 1]) {
        this.part(dg, { id: `${prefix}-diff-bearing-${side}`, name: `差速器轴承(${side < 0 ? '左' : '右'})`, pos: V(cx, 0.18, side * 0.17), dir: [0, 0, side], step: 0.7,
          conns: [{ id: 'cp', position: [0, 0, 0], label: '轴承位', markerType: 'hole' }],
          build: (_pv, h) => h.mesh(torusGeo(0.05, 0.016, 10, 20), brass, [0, 0, 0], [Math.PI / 2, 0, 0]) })
        this.part(dg, { id: `${prefix}-diff-shim-${side}`, name: `调整垫片(${side < 0 ? '左' : '右'})`, pos: V(cx, 0.18, side * 0.14), dir: [0, 0, side], step: 0.65, build: (_pv, h) => h.mesh(cylGeo(0.06, 0.012, 'z', 16), dark) })
      }
    }
    buildDiff('f', '前', -1.05)
    buildDiff('r', '后', 1.05)

    const mid = this.group(g, 'g-gears-mid', '中间减速组')
    this.part(mid, { id: 'gear-mid-shaft', name: '中间齿轮轴', pos: V(0, 0.24, 0), dir: UP, step: 0.8,
      conns: [{ id: 'cp', position: [0, 0, 0], label: '轴颈', markerType: 'shaft' }],
      build: (_pv, h) => h.mesh(cylGeo(0.03, 0.3, 'x', 12), brass) })
    this.part(mid, { id: 'gear-mid-big', name: '减速大齿轮', key: true, pos: V(-0.05, 0.24, 0), dir: UP, step: 0.85,
      build: (_pv, h) => {
        const [hub, tooth] = gearGeometries(0.11, 0.05, 22)
        h.mesh(hub, gearMat)
        h.instanced(tooth, gearMat, 22, (i, m) => {
          const a = (i / 22) * Math.PI * 2
          m.makeRotationX(a).setPosition(0, Math.cos(a) * 0.12, Math.sin(a) * 0.12)
        })
      } })
    this.part(mid, { id: 'gear-mid-idler', name: '惰轮', pos: V(0.1, 0.24, 0), dir: [1, 0, 0], step: 0.75, build: (_pv, h) => h.mesh(cylGeo(0.07, 0.05, 'x', 18), gearMat) })
    for (const side of [-1, 1]) {
      this.part(mid, { id: `gear-mid-bearing-${side}`, name: `中间轴轴承(${side < 0 ? '前' : '后'})`, pos: V(side * 0.17, 0.24, 0), dir: side < 0 ? [-1, 0, 0] : [1, 0, 0], step: 0.7,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '轴承位', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(torusGeo(0.045, 0.015, 10, 20).rotateY(Math.PI / 2), brass) })
    }
    for (let i = 0; i < 6; i++) {
      this.part(mid, { id: `gear-case-bolt-${i}`, name: `齿轮箱螺栓 #${i + 1}`, pos: V(-0.1 + (i % 3) * 0.1, 0.3, (i < 3 ? 0.12 : -0.12)), dir: UP, step: 0.85,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '螺纹孔', markerType: 'bolt' }],
        build: (_pv, h) => h.mesh(cylGeo(0.018, 0.07, 'y', 6), brass) })
    }
  }

  // ---------------------------------------------------------------- 悬挂
  private buildSuspension(): void {
    const g = this.group(this.root, 'g-suspension', '悬挂', 'suspension')
    const arm = standardMaterial(0xf5c518, { metalness: 0.6, roughness: 0.4 })
    const shockBody = standardMaterial(0x2f6fb0, { metalness: 0.5, roughness: 0.35 })
    const chrome = standardMaterial(0xcfd6dd, { metalness: 0.95, roughness: 0.18 })
    const black = standardMaterial(0x1c1e22, { roughness: 0.7 })
    const alloy = standardMaterial(0x8b95a1, { metalness: 0.85, roughness: 0.3 })

    const corners: [number, number, string][] = [
      [-1.3, 1.02, '前左'], [1.3, 1.02, '后左'], [-1.3, -1.02, '前右'], [1.3, -1.02, '后右'],
    ]
    for (const [cx, cz, label] of corners) {
      const side = cz > 0 ? 1 : -1
      const cg = this.group(g, `g-susp-${cx < 0 ? 'f' : 'r'}-${side}`, `${label}悬挂`)
      const out: [number, number, number] = [0, 0, side]
      for (let k = 0; k < 2; k++) {
        this.part(cg, { id: `susp-arm-up-${cx}-${cz}-${k}`, name: `${label}上A臂 ${k + 1}`, key: k === 0, pos: V(cx + (k - 0.5) * 0.12, 0.42, cz - side * 0.12), dir: out, step: 0.6,
          conns: [{ id: 'cp', position: [0, 0, side * 0.1], label: '球头安装孔', markerType: 'hole' }],
          build: (_pv, h) => h.mesh(boxGeo(0.06, 0.05, 0.28), arm) })
        this.part(cg, { id: `susp-arm-low-${cx}-${cz}-${k}`, name: `${label}下A臂 ${k + 1}`, key: k === 0, pos: V(cx + (k - 0.5) * 0.12, 0.26, cz - side * 0.12), dir: out, step: 0.6,
          conns: [{ id: 'cp', position: [0, 0, side * 0.1], label: '球头安装孔', markerType: 'hole' }],
          build: (_pv, h) => h.mesh(boxGeo(0.07, 0.06, 0.3), arm) })
      }
      this.part(cg, { id: `susp-shock-body-${cx}-${cz}`, name: `${label}避震筒`, key: true, pos: V(cx, 0.5, cz - side * 0.08), dir: out, step: 0.72,
        conns: [{ id: 'cp', position: [0, 0.14, 0], label: '活塞腔', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(cylGeo(0.05, 0.26, 'y', 18), shockBody) })
      this.part(cg, { id: `susp-shock-rod-${cx}-${cz}`, name: `${label}避震活塞杆`, pos: V(cx, 0.7, cz - side * 0.08), dir: UP, step: 0.85,
        conns: [{ id: 'cp', position: [0, -0.08, 0], label: '活塞', markerType: 'shaft' }],
        build: (_pv, h) => h.mesh(cylGeo(0.016, 0.22, 'y', 10), chrome) })
      this.part(cg, { id: `susp-spring-${cx}-${cz}`, name: `${label}避震弹簧`, key: true, pos: V(cx, 0.56, cz - side * 0.08), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(springGeo(0.065, 0.26, 5, 0.012), chrome) })
      this.part(cg, { id: `susp-knuckle-${cx}-${cz}`, name: `${label}转向节`, key: true, pos: V(cx, 0.34, cz - side * 0.02), dir: out, step: 0.65,
        conns: [{ id: 'cp', position: [0, 0, side * 0.05], label: '轮毂轴孔', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(boxGeo(0.12, 0.16, 0.1), alloy) })
      this.part(cg, { id: `susp-hub-${cx}-${cz}`, name: `${label}轮毂座`, pos: V(cx, 0.34, cz + side * 0.06), dir: out, step: 0.65, build: (_pv, h) => h.mesh(cylGeo(0.09, 0.08, 'z', 18), alloy) })
      this.part(cg, { id: `susp-c-hub-${cx}-${cz}`, name: `${label}C 座`, pos: V(cx, 0.34, cz - side * 0.1), dir: out, step: 0.6, build: (_pv, h) => h.mesh(boxGeo(0.1, 0.18, 0.06), arm) })
      for (let k = 0; k < 4; k++) {
        const upper = k < 2
        this.part(cg, { id: `susp-ball-${cx}-${cz}-${k}`, name: `${label}${upper ? '上' : '下'}球头 ${(k % 2) + 1}`, pos: V(cx + (k % 2 ? 0.06 : -0.06), upper ? 0.42 : 0.26, cz + side * 0.04), dir: out, step: 0.6,
          conns: [{ id: 'cp', position: [0, 0, 0], label: '球铰', markerType: 'bolt' }],
          build: (_pv, h) => h.mesh(sphereGeo(0.03, 12), chrome) })
      }
      this.part(cg, { id: `susp-preload-${cx}-${cz}`, name: `${label}弹簧预紧调节环`, pos: V(cx, 0.42, cz - side * 0.08), dir: UP, step: 0.8, build: (_pv, h) => h.mesh(torusGeo(0.055, 0.018, 8, 20).rotateX(Math.PI / 2), black) })
      this.part(cg, { id: `susp-boot-${cx}-${cz}`, name: `${label}防尘套`, pos: V(cx, 0.66, cz - side * 0.08), dir: UP, step: 0.75, build: (_pv, h) => h.mesh(cylGeo(0.035, 0.08, 'y', 12), black) })
    }

    const sway = this.group(g, 'g-susp-sway', '防倾杆')
    for (const [x, label] of [[-1.15, '前'], [1.15, '后']] as const) {
      this.part(sway, { id: `sway-bar-${x}`, name: `${label}防倾杆`, key: true, pos: V(x, 0.28, 0), dir: UP, step: 0.7,
        conns: [{ id: 'cp', position: [0, 0, 0.7], label: '连杆连接点', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(cylGeo(0.02, 1.7, 'z', 10), chrome) })
    }
  }

  // ---------------------------------------------------------------- 轮胎
  private buildWheels(): void {
    const g = this.group(this.root, 'g-wheels', '轮胎', 'wheels')
    const rubber = standardMaterial(0x2f2f33, { roughness: 0.92 })
    const rim = standardMaterial(0xc0c6cc, { metalness: 0.85, roughness: 0.28 })
    const brass = standardMaterial(0xb08d57, { metalness: 0.9, roughness: 0.3 })
    const brake = standardMaterial(0x9aa3ad, { metalness: 0.8, roughness: 0.35 })
    const red = standardMaterial(0xb31b1b, { metalness: 0.5, roughness: 0.4 })

    const corners: [number, number, string][] = [
      [-1.3, 1.05, '前左'], [1.3, 1.05, '后左'], [-1.3, -1.05, '前右'], [1.3, -1.05, '后右'],
    ]
    for (const [cx, cz, label] of corners) {
      const side = cz > 0 ? 1 : -1
      const wg = this.group(g, `g-wheel-${cx < 0 ? 'f' : 'r'}-${side}`, `${label}车轮`)
      this.part(wg, { id: `wheel-tire-${cx}-${cz}`, name: `${label}轮胎`, key: true, pos: V(cx, 0.34, cz), dir: [0, 0, side], step: 0.8,
        conns: [{ id: 'cp', position: [0, 0, -side * 0.12], label: '胎唇贴合面', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(torusGeo(0.24, 0.1, 16, 32).rotateX(Math.PI / 2), rubber) })
      this.part(wg, { id: `wheel-rim-${cx}-${cz}`, name: `${label}轮毂`, key: true, pos: V(cx, 0.34, cz), dir: [0, 0, side], step: 0.72,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '六角结合面', markerType: 'shaft' }],
        build: (_pv, h) => {
          h.mesh(cylGeo(0.18, 0.12, 'z', 24), rim)
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2
            h.mesh(boxGeo(0.12, 0.03, 0.04), rim, [Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0], [0, 0, a])
          }
        } })
      this.part(wg, { id: `wheel-cap-${cx}-${cz}`, name: `${label}轮毂盖`, pos: V(cx, 0.34, cz + side * 0.08), dir: [0, 0, side], step: 0.7, build: (_pv, h) => h.mesh(cylGeo(0.07, 0.03, 'z', 20), standardMaterial(0xd8dde2, { metalness: 0.9, roughness: 0.2 })) })
      this.part(wg, { id: `wheel-hex-${cx}-${cz}`, name: `${label}六角结合器`, pos: V(cx, 0.34, cz - side * 0.08), dir: [0, 0, side], step: 0.65,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '六角孔', markerType: 'hole' }],
        build: (_pv, h) => h.mesh(cylGeo(0.07, 0.06, 'z', 6), brass) })
      this.part(wg, { id: `wheel-axle-${cx}-${cz}`, name: `${label}轮轴`, key: true, pos: V(cx, 0.34, cz - side * 0.12), dir: [0, 0, side], step: 0.6,
        conns: [{ id: 'cp', position: [0, 0, side * 0.1], label: '轮螺母螺纹', markerType: 'shaft' }],
        build: (_pv, h) => h.mesh(cylGeo(0.025, 0.24, 'z', 12), brass) })
      this.part(wg, { id: `wheel-nut-${cx}-${cz}`, name: `${label}轮螺母`, pos: V(cx, 0.34, cz + side * 0.13), dir: [0, 0, side], step: 0.75,
        conns: [{ id: 'cp', position: [0, 0, 0], label: '内螺纹', markerType: 'bolt' }],
        build: (_pv, h) => h.mesh(cylGeo(0.035, 0.04, 'z', 6), brass) })
      for (let k = 0; k < 2; k++) {
        this.part(wg, { id: `wheel-bearing-${cx}-${cz}-${k}`, name: `${label}轮毂轴承 ${k + 1}`, pos: V(cx, 0.34, cz - side * (0.02 + k * 0.07)), dir: [0, 0, side], step: 0.6,
          conns: [{ id: 'cp', position: [0, 0, 0], label: '轴承位', markerType: 'hole' }],
          build: (_pv, h) => h.mesh(torusGeo(0.04, 0.014, 10, 20), brass, [0, 0, 0], [Math.PI / 2, 0, 0]) })
      }
      this.part(wg, { id: `wheel-brake-disc-${cx}-${cz}`, name: `${label}刹车盘`, pos: V(cx, 0.34, cz - side * 0.1), dir: [0, 0, side], step: 0.62, build: (_pv, h) => h.mesh(cylGeo(0.13, 0.02, 'z', 24), brake) })
      this.part(wg, { id: `wheel-caliper-${cx}-${cz}`, name: `${label}刹车卡钳`, pos: V(cx + 0.12, 0.4, cz - side * 0.1), dir: [0, 0, side], step: 0.62, build: (_pv, h) => h.mesh(boxGeo(0.06, 0.1, 0.08), red) })
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4
        this.part(wg, { id: `wheel-lug-${cx}-${cz}-${k}`, name: `${label}轮毂螺丝 ${k + 1}`, pos: V(cx + Math.cos(a) * 0.1, 0.34 + Math.sin(a) * 0.1, cz + side * 0.1), dir: [0, 0, side], step: 0.7,
          conns: [{ id: 'cp', position: [0, 0, 0], label: '螺纹', markerType: 'bolt' }],
          build: (_pv, h) => h.mesh(cylGeo(0.016, 0.03, 'z', 6), brass) })
      }
    }
  }
}
