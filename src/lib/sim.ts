// 仿真主控：三维场景、拾取与拖拽编辑、漫游、标记、导入导出
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh'
import type { Blockage, ExportData, Plan, Pt, WheelchairParams } from './types'
import { buildScene, heightAt, planColliders, type ColliderBox } from './geometry'
import { findPath, type PathResult } from './pathfind'
import { sweepPath } from './sweep'
import {
  blockages, endPt, hasPath, hasPlan, params, pickMode, roaming,
  selected, startPt, stats, status, viewMode,
} from './stores'
import { get } from 'svelte/store'

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

const MARKER_H = 1.6

export class Sim {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private clock = new THREE.Clock()

  private plan: Plan | null = null
  private boxes: ColliderBox[] = []
  private planGroup: THREE.Group | null = null
  private bvhMesh: THREE.Mesh | null = null

  private handlesGroup = new THREE.Group()
  private markersGroup = new THREE.Group()
  private pathLine: THREE.Line | null = null
  private startPost: THREE.Mesh
  private endPost: THREE.Mesh

  private path: PathResult | null = null
  private start: Pt | null = null
  private end: Pt | null = null

  private raycaster = new THREE.Raycaster()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private dragging: { type: 'door'; doorId: string; side: 1 | -1 } | { type: 'ramp'; rampId: string } | null = null
  private geomDirty = false

  private roamT = 0 // 沿路径里程
  private pathLengths: number[] = [] // 累计里程表
  private pathTotal = 0

  private frames = 0
  private fpsTimer = 0

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a2230)
    this.scene.fog = new THREE.Fog(0x1a2230, 80, 220)

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
    this.camera.position.set(35, 55, 75)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.target.set(35, 0, 25)
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02

    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(40, 60, 20)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -60
    sun.shadow.camera.right = 60
    sun.shadow.camera.top = 60
    sun.shadow.camera.bottom = -60
    this.scene.add(sun)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55))

    this.scene.add(this.handlesGroup)
    this.scene.add(this.markersGroup)

    this.startPost = this.makePost(0x2ecc71)
    this.endPost = this.makePost(0x3498db)
    this.startPost.visible = this.endPost.visible = false
    this.scene.add(this.startPost, this.endPost)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    this.resize()
    window.addEventListener('resize', this.resize)
    this.renderer.setAnimationLoop(this.tick)
  }

  private makePost(color: number): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.2, 12),
      new THREE.MeshLambertMaterial({ color })
    )
    m.position.y = 0.6
    return m
  }

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  // ---------- 平面载入与几何重建 ----------

  loadPlan(plan: Plan) {
    this.plan = plan
    this.start = this.end = null
    startPt.set(null)
    endPt.set(null)
    this.startPost.visible = this.endPost.visible = false
    this.clearPath()
    this.rebuildGeometry()
    hasPlan.set(true)
    status.set(`已载入「${plan.name}」，碰撞体 ${this.boxes.length} 个。请设置起点和终点`)
  }

  private rebuildGeometry() {
    if (!this.plan) return
    if (this.planGroup) {
      this.scene.remove(this.planGroup)
      this.planGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.disposeBoundsTree?.()
          o.geometry.dispose()
        }
      })
    }
    this.boxes = planColliders(this.plan)
    const built = buildScene(this.plan, this.boxes)
    this.planGroup = built.group
    this.bvhMesh = built.bvhMesh
    this.scene.add(this.planGroup)
    this.buildHandles()
    stats.update((s) => ({ ...s, colliders: built.colliderCount }))
  }

  /** 门/坡道的拖拽手柄 */
  private buildHandles() {
    this.handlesGroup.clear()
    if (!this.plan) return
    const doorMat = new THREE.MeshLambertMaterial({ color: 0xf39c12, emissive: 0x663a00 })
    const rampMat = new THREE.MeshLambertMaterial({ color: 0x3498db, emissive: 0x0a2a44 })
    for (const d of this.plan.doors) {
      const w = this.plan.walls.find((x) => x.id === d.wallId)
      if (!w) continue
      const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
      const ux = (w.x2 - w.x1) / len
      const uz = (w.z2 - w.z1) / len
      for (const side of [-1, 1] as const) {
        const off = d.offset + (side * d.width) / 2
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), doorMat)
        h.position.set(w.x1 + ux * off, 1.0, w.z1 + uz * off)
        h.userData = { handle: true, type: 'door', doorId: d.id, side }
        this.handlesGroup.add(h)
      }
    }
    for (const r of this.plan.ramps) {
      // 下坡端手柄：拖动改变坡道长度
      const ex = r.cx - (r.dirX * r.length) / 2
      const ez = r.cz - (r.dirZ * r.length) / 2
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), rampMat)
      h.position.set(ex, 0.35, ez)
      h.userData = { handle: true, type: 'ramp', rampId: r.id }
      this.handlesGroup.add(h)
    }
  }

  // ---------- 路径求解与扫掠 ----------

  solve() {
    if (!this.plan || !this.start || !this.end) return
    const t0 = performance.now()
    const result = findPath(this.plan, get(params), this.start, this.end)
    if (!result) {
      this.clearPath()
      status.set('未找到可行路径：请检查轮椅宽度参数或调整门宽/坡道')
      return
    }
    this.path = result
    this.buildPathLine()
    this.sweepAndMark()
    this.roamT = 0
    hasPath.set(true)
    let len = 0
    for (let i = 1; i < result.smooth.length; i++)
      len += Math.hypot(result.smooth[i].x - result.smooth[i - 1].x, result.smooth[i].z - result.smooth[i - 1].z)
    stats.update((s) => ({ ...s, pathLen: Math.round(len * 10) / 10 }))
    status.set(
      `路径已生成（${(performance.now() - t0).toFixed(0)}ms），全长 ${len.toFixed(1)}m，发现 ${get(blockages).length} 处卡点`
    )
  }

  private sweepAndMark() {
    if (!this.plan || !this.path || !this.bvhMesh) return
    const list = sweepPath(this.path.samples, this.plan, get(params), this.bvhMesh, this.path.turnIssues)
    blockages.set(list)
    this.rebuildMarkers(list)
  }

  private rebuildMarkers(list: Blockage[]) {
    this.markersGroup.clear()
    const mat = new THREE.MeshLambertMaterial({ color: 0xe74c3c, emissive: 0x5a0f08 })
    const cylGeo = new THREE.CylinderGeometry(0.08, 0.08, MARKER_H, 10)
    const topGeo = new THREE.SphereGeometry(0.16, 12, 8)
    for (const b of list) {
      const g = new THREE.Group()
      const y = this.plan ? heightAt(this.plan, b.x, b.z) : 0
      const cyl = new THREE.Mesh(cylGeo, mat)
      cyl.position.y = MARKER_H / 2
      const top = new THREE.Mesh(topGeo, mat)
      top.position.y = MARKER_H + 0.12
      g.add(cyl, top)
      g.position.set(b.x, y, b.z)
      g.userData = { blockageId: b.id }
      this.markersGroup.add(g)
    }
  }

  private buildPathLine() {
    if (this.pathLine) {
      this.scene.remove(this.pathLine)
      this.pathLine.geometry.dispose()
    }
    if (!this.plan || !this.path) return
    const pts = this.path.smooth.map(
      (p) => new THREE.Vector3(p.x, heightAt(this.plan!, p.x, p.z) + 0.06, p.z)
    )
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    this.pathLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00e5ff }))
    this.scene.add(this.pathLine)
    // 里程表
    this.pathLengths = [0]
    for (let i = 1; i < pts.length; i++)
      this.pathLengths.push(this.pathLengths[i - 1] + pts[i].distanceTo(pts[i - 1]))
    this.pathTotal = this.pathLengths[this.pathLengths.length - 1] || 0
  }

  private clearPath() {
    this.path = null
    if (this.pathLine) {
      this.scene.remove(this.pathLine)
      this.pathLine = null
    }
    this.markersGroup.clear()
    blockages.set([])
    selected.set(null)
    hasPath.set(false)
    stats.update((s) => ({ ...s, pathLen: 0 }))
  }

  // ---------- 交互 ----------

  private ndc(e: PointerEvent): THREE.Vector2 {
    const r = this.canvas.getBoundingClientRect()
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    )
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || !this.plan) return
    this.raycaster.setFromCamera(this.ndc(e), this.camera)
    const mode = get(pickMode)
    if (mode !== 'none') {
      const hit = new THREE.Vector3()
      if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
        const p = { x: hit.x, z: hit.z }
        if (mode === 'start') {
          this.start = p
          startPt.set(p)
          this.startPost.position.set(p.x, heightAt(this.plan, p.x, p.z) + 0.6, p.z)
          this.startPost.visible = true
        } else {
          this.end = p
          endPt.set(p)
          this.endPost.position.set(p.x, heightAt(this.plan, p.x, p.z) + 0.6, p.z)
          this.endPost.visible = true
        }
        pickMode.set('none')
        if (this.start && this.end) this.solve()
        else status.set('已设置一点，请再设置另一点')
      }
      return
    }
    // 手柄拖拽
    const hits = this.raycaster.intersectObjects(this.handlesGroup.children, false)
    if (hits.length) {
      const u = hits[0].object.userData
      if (u.type === 'door') this.dragging = { type: 'door', doorId: u.doorId, side: u.side }
      else this.dragging = { type: 'ramp', rampId: u.rampId }
      this.controls.enabled = false
      return
    }
    // 标记柱点选
    const mh = this.raycaster.intersectObjects(this.markersGroup.children, true)
    if (mh.length) {
      let o: THREE.Object3D | null = mh[0].object
      while (o && o.userData.blockageId === undefined) o = o.parent
      if (o) {
        const b = get(blockages).find((x) => x.id === o!.userData.blockageId)
        if (b) {
          selected.set(b)
          status.set(`卡点 #${b.id}：${b.reasons.join('；')}`)
        }
      }
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging || !this.plan) return
    this.raycaster.setFromCamera(this.ndc(e), this.camera)
    const hit = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, hit)) return
    if (this.dragging.type === 'door') {
      const d = this.plan.doors.find((x) => x.id === (this.dragging as { doorId: string }).doorId)
      if (!d) return
      const w = this.plan.walls.find((x) => x.id === d.wallId)!
      const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1)
      const ux = (w.x2 - w.x1) / len
      const uz = (w.z2 - w.z1) / len
      // 投影到墙轴，得到该侧门垛新位置
      const t = (hit.x - w.x1) * ux + (hit.z - w.z1) * uz
      const side = (this.dragging as { side: 1 | -1 }).side
      const center = d.offset
      const other = center - (side * d.width) / 2
      const half = side * (t - other) > 0 ? Math.abs(t - other) / 2 : d.width / 2
      const newWidth = Math.max(0.6, Math.min(3.0, half * 2))
      const newCenter = other + (side * newWidth) / 2
      if (newCenter - newWidth / 2 < 0.2 || newCenter + newWidth / 2 > len - 0.2) return
      d.offset = newCenter
      d.width = Math.round(newWidth * 100) / 100
    } else {
      const r = this.plan.ramps.find((x) => x.id === (this.dragging as { rampId: string }).rampId)
      if (!r) return
      // 上坡端固定，下坡端沿坡向拖动
      const upX = r.cx + (r.dirX * r.length) / 2
      const upZ = r.cz + (r.dirZ * r.length) / 2
      const t = (hit.x - upX) * -r.dirX + (hit.z - upZ) * -r.dirZ
      const newLen = Math.max(2, Math.min(14, t))
      r.length = Math.round(newLen * 10) / 10
      r.cx = upX - (r.dirX * r.length) / 2
      r.cz = upZ - (r.dirZ * r.length) / 2
    }
    this.geomDirty = true
  }

  private onPointerUp = () => {
    if (this.dragging) {
      this.dragging = null
      this.controls.enabled = true
      // 拖动结束后：重新求解路径并更新所有标记
      if (this.start && this.end) this.solve()
      status.set('构件已调整，路径与卡点已重新计算')
    }
  }

  // ---------- 漫游 ----------

  setViewMode(m: 'free' | 'top' | 'fps') {
    viewMode.set(m)
    this.controls.enabled = m === 'free'
    if (m !== 'free') roaming.set(true)
    else roaming.set(false)
  }

  private pathPointAt(s: number): { pos: THREE.Vector3; dir: THREE.Vector3 } {
    const pts = this.path!.smooth
    const L = this.pathLengths
    let i = 1
    while (i < L.length - 1 && L[i] < s) i++
    const a = pts[i - 1]
    const b = pts[i]
    const seg = L[i] - L[i - 1] || 1
    const t = Math.max(0, Math.min(1, (s - L[i - 1]) / seg))
    const x = a.x + (b.x - a.x) * t
    const z = a.z + (b.z - a.z) * t
    const h = this.plan ? heightAt(this.plan, x, z) : 0
    const dl = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return {
      pos: new THREE.Vector3(x, h, z),
      dir: new THREE.Vector3((b.x - a.x) / dl, 0, (b.z - a.z) / dl),
    }
  }

  // ---------- 主循环 ----------

  private tick = () => {
    const dt = Math.min(this.clock.getDelta(), 0.1)
    if (this.geomDirty) {
      this.geomDirty = false
      this.rebuildGeometry()
    }
    const mode = get(viewMode)
    const isRoaming = get(roaming)
    if (mode !== 'free' && this.path && this.pathTotal > 0) {
      if (isRoaming) {
        this.roamT += dt * 1.4
        if (this.roamT > this.pathTotal) this.roamT = 0
      }
      const { pos, dir } = this.pathPointAt(this.roamT)
      if (mode === 'top') {
        this.camera.position.set(pos.x, pos.y + 16, pos.z + 0.01)
        this.camera.lookAt(pos)
      } else {
        this.camera.position.set(pos.x, pos.y + 1.2, pos.z)
        this.camera.lookAt(pos.x + dir.x * 2.5, pos.y + 1.1, pos.z + dir.z * 2.5)
      }
    } else {
      this.controls.update()
    }
    this.renderer.render(this.scene, this.camera)
    this.frames++
    this.fpsTimer += dt
    if (this.fpsTimer >= 1) {
      stats.update((s) => ({ ...s, fps: Math.round(this.frames / this.fpsTimer) }))
      this.frames = 0
      this.fpsTimer = 0
    }
  }

  // ---------- 对外操作 ----------

  setPickMode(m: 'start' | 'end') {
    pickMode.set(m)
    status.set(m === 'start' ? '在平面图上点击选择起点' : '在平面图上点击选择终点')
  }

  focusBlockage(b: Blockage) {
    selected.set(b)
    const y = this.plan ? heightAt(this.plan, b.x, b.z) : 0
    viewMode.set('free')
    this.controls.enabled = true
    this.controls.target.set(b.x, y + 1, b.z)
    this.camera.position.set(b.x + 5, y + 6, b.z + 5)
    this.controls.update()
  }

  updateParams(p: WheelchairParams) {
    params.set(p)
    if (this.start && this.end) this.solve()
  }

  exportData(): ExportData {
    return {
      version: 1,
      plan: this.plan!,
      params: get(params),
      start: this.start,
      end: this.end,
      path: this.path ? this.path.smooth : [],
      blockages: get(blockages),
    }
  }

  importData(d: ExportData): string {
    if (!d || !d.plan || !Array.isArray(d.plan.walls)) return '文件格式不正确：缺少 plan.walls'
    this.plan = d.plan
    if (d.params) params.set(d.params)
    this.start = d.start ?? null
    this.end = d.end ?? null
    startPt.set(this.start)
    endPt.set(this.end)
    this.clearPath()
    this.rebuildGeometry()
    hasPlan.set(true)
    if (this.start) {
      this.startPost.position.set(this.start.x, heightAt(this.plan, this.start.x, this.start.z) + 0.6, this.start.z)
    }
    if (this.end) {
      this.endPost.position.set(this.end.x, heightAt(this.plan, this.end.x, this.end.z) + 0.6, this.end.z)
    }
    this.startPost.visible = !!this.start
    this.endPost.visible = !!this.end
    if (d.path && d.path.length >= 2) {
      // 直接恢复导出的路径与卡点清单
      this.path = { smooth: d.path, samples: d.path, turnIssues: [] }
      this.buildPathLine()
      blockages.set(d.blockages ?? [])
      this.rebuildMarkers(d.blockages ?? [])
      hasPath.set(true)
      this.roamT = 0
    } else if (this.start && this.end) {
      this.solve()
    }
    return ''
  }

  /** 仅载入平面文件（无路径信息） */
  importPlanOnly(p: Plan): string {
    if (!p || !Array.isArray(p.walls)) return '文件格式不正确'
    this.plan = p
    this.start = this.end = null
    startPt.set(null)
    endPt.set(null)
    this.startPost.visible = this.endPost.visible = false
    this.clearPath()
    this.rebuildGeometry()
    hasPlan.set(true)
    return ''
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointerup', this.onPointerUp)
  }
}
