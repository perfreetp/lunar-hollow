import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { ModelData } from '../model/ModelLoader'
import { ExplodeEngine } from './ExplodeEngine'
import { HighlightManager, resolveLeafIds } from './HighlightManager'
import { LabelManager } from './LabelManager'
import { ObservationManager } from './ObservationManager'
import { selectionStore, setHoverId, setSelectedId } from '../store/selection'

/**
 * 三维场景总控：渲染器、相机、轨道控制、射线拾取、渲染循环，
 * 以及拆解/观察/标签/高亮各子系统的装配。
 */
export class ViewerScene {
  readonly engine: ExplodeEngine
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private highlight: HighlightManager
  private labels: LabelManager
  readonly observation: ObservationManager
  private clock = new THREE.Clock()
  private rafId = 0
  private container: HTMLElement
  private resizeObserver: ResizeObserver
  private grid: THREE.GridHelper

  constructor(container: HTMLElement, private model: ModelData) {
    this.container = container
    const width = container.clientWidth
    const height = container.clientHeight

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'

    this.scene.background = new THREE.Color(0x10151c)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 100)
    this.camera.position.set(4.2, 3.0, 4.6)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.target.set(0, 0.45, 0)
    this.controls.maxDistance = 14
    this.controls.minDistance = 1.2

    this.setupLights()
    this.grid = new THREE.GridHelper(12, 24, 0x3a4656, 0x232c38)
    this.grid.position.y = -0.02
    this.scene.add(this.grid)

    // 地面阴影承接
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.35 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)

    this.scene.add(model.sceneRoot)

    this.engine = new ExplodeEngine(model)
    this.engine.recomputeAll()
    this.highlight = new HighlightManager(model)
    this.observation = new ObservationManager(model)
    this.scene.add(this.observation.object3d)
    this.labels = new LabelManager(model, this.camera, container)

    this.bindEvents()
    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(container)
    this.loop()
  }

  private setupLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x2a2f36, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 7, 3)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 20
    const s = 4
    key.shadow.camera.left = -s
    key.shadow.camera.right = s
    key.shadow.camera.top = s
    key.shadow.camera.bottom = -s
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.7)
    fill.position.set(-5, 3, -4)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffe0b3, 0.6)
    rim.position.set(0, 4, -6)
    this.scene.add(rim)
  }

  // ------------------------------------------------------------- 拾取
  private bindEvents(): void {
    const el = this.renderer.domElement
    el.addEventListener('pointermove', this.onPointerMove)
    el.addEventListener('pointerdown', this.onPointerDown)
    el.addEventListener('pointerup', this.onPointerUp)
  }

  private downPos: [number, number] | null = null

  private onPointerDown = (e: PointerEvent): void => {
    this.downPos = [e.clientX, e.clientY]
  }

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.downPos) return
    const dx = e.clientX - this.downPos[0]
    const dy = e.clientY - this.downPos[1]
    this.downPos = null
    if (dx * dx + dy * dy > 25) return // 拖拽视角不触发选择
    const hit = this.pick(e)
    setSelectedId(hit ? hit : null)
  }

  private onPointerMove = (e: PointerEvent): void => {
    const hit = this.pick(e)
    setHoverId(hit)
    this.renderer.domElement.style.cursor = hit ? 'pointer' : 'default'
  }

  private pick(e: PointerEvent): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.model.pickables, false)
    for (const h of hits) {
      const id = h.object.userData.partId as string | undefined
      if (id) return id
    }
    return null
  }

  /** 供外部（树/观察面板）调用：应用选择 -> 高亮同步 */
  applySelection(nodeId: string | null): void {
    if (!nodeId) {
      this.highlight.setSelected([])
      return
    }
    this.highlight.setSelected(resolveLeafIds(this.model, nodeId))
  }

  applyHover(nodeId: string | null): void {
    this.highlight.setHover(nodeId)
  }

  /** 相机聚焦到某节点（树双击或观察时） */
  focusNode(nodeId: string): void {
    const ids = resolveLeafIds(this.model, nodeId)
    const box = new THREE.Box3()
    for (const id of ids) {
      const rt = this.model.runtime.get(id)
      if (rt) box.expandByObject(rt.pivot)
    }
    if (box.isEmpty()) return
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3()).length()
    this.controls.target.copy(center)
    const dir = this.camera.position.clone().sub(this.controls.target).normalize()
    this.camera.position.copy(center).add(dir.multiplyScalar(Math.max(1.6, size * 1.8)))
    this.controls.update()
  }

  setLabelsVisible(v: boolean): void {
    this.labels.setVisible(v)
  }

  setMarkersVisible(v: boolean): void {
    this.observation.setMarkersVisible(v)
  }

  private onResize(): void {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    this.controls.update()
    this.engine.update(dt)
    this.observation.update()

    // 选择/悬停状态 -> 高亮（store 由树和拾取共同驱动）
    this.applySelection(selectionStore.selectedId)
    this.applyHover(selectionStore.hoverId)

    this.labels.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId)
    this.resizeObserver.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointermove', this.onPointerMove)
    el.removeEventListener('pointerdown', this.onPointerDown)
    el.removeEventListener('pointerup', this.onPointerUp)
    this.controls.dispose()
    this.highlight.dispose()
    this.observation.dispose()
    this.labels.dispose()
    this.renderer.dispose()
    el.remove()
  }
}
