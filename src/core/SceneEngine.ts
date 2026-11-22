import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer, RenderPass, EffectPass, SMAAEffect, BloomEffect, VignetteEffect } from 'postprocessing'
import { PaintedMaterial } from './PaintedMaterial'
import { RestoreBrush } from './RestoreBrush'
import { makeBaseTexture, makeFadeMaskTexture, makeRestoreLayer, makeSurfaceTexture } from './TextureFactory'
import type { LayerMode, PerfStats, SceneComponent } from '../types'

/**
 * 三维场景引擎
 * 负责渲染管线、轨道控制、后处理、构件生命周期与性能统计。
 */
export class SceneEngine {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  readonly brush: RestoreBrush
  readonly composer: EffectComposer

  private components: SceneComponent[] = []
  private modelRoot: THREE.Group | null = null
  private selectionHelper: THREE.BoxHelper | null = null

  private rafId = 0
  private lastFrameTime = performance.now()
  private fpsAccum = 0
  private fpsFrames = 0
  private currentFps = 60
  private currentFrameMs = 16.7

  onPerf?: (stats: PerfStats) => void
  private perfTimer = 0

  constructor(private container: HTMLElement) {
    const width = container.clientWidth
    const height = container.clientHeight

    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // 由 postprocessing 的 SMAA 接管
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.touchAction = 'none'

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#1b1e24')
    this.scene.fog = new THREE.Fog('#1b1e24', 18, 42)

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200)
    this.camera.position.set(7.5, 3.2, 9.5)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 3
    this.controls.maxDistance = 30
    this.controls.maxPolarAngle = Math.PI * 0.92
    this.controls.target.set(0, 0.4, 0)

    this.setupLights()
    this.setupGround()

    // 后处理：SMAA 抗锯齿 + 轻微 bloom + 暗角
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    const smaa = new SMAAEffect()
    const bloom = new BloomEffect({ intensity: 0.22, luminanceThreshold: 0.72, mipmapBlur: true })
    const vignette = new VignetteEffect({ darkness: 0.32, offset: 0.28 })
    const effectPass = new EffectPass(this.camera, smaa, bloom, vignette)
    this.composer.addPass(effectPass)
    this.composer.setSize(width, height)

    this.brush = new RestoreBrush(this.renderer.domElement, this.camera)
    this.brush.attach(this.scene)

    window.addEventListener('resize', this.handleResize)
    this.loop = this.loop.bind(this)
    this.rafId = requestAnimationFrame(this.loop)
  }

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(0xdfe8f5, 0x5a4c3a, 0.85)
    this.scene.add(hemi)

    const key = new THREE.DirectionalLight(0xfff1d6, 2.1)
    key.position.set(6, 10, 7)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -10
    key.shadow.camera.right = 10
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -10
    key.shadow.camera.near = 1
    key.shadow.camera.far = 35
    this.scene.add(key)

    const fill = new THREE.DirectionalLight(0x8fb4e8, 0.5)
    fill.position.set(-7, 4, -5)
    this.scene.add(fill)
  }

  private setupGround(): void {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.95, metalness: 0 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -4.42
    ground.receiveShadow = true
    this.scene.add(ground)

    const grid = new THREE.GridHelper(40, 40, 0x55606e, 0x39414c)
    grid.position.y = -4.41
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material]
    mats.forEach((m) => {
      ;(m as THREE.Material).transparent = true
      ;(m as THREE.Material).opacity = 0.35
    })
    this.scene.add(grid)
  }

  setComponents(components: SceneComponent[], root: THREE.Group): void {
    this.clearModel()
    this.components = components
    this.modelRoot = root
    this.scene.add(root)
    this.brush.setComponents(components)
    this.controls.target.set(0, 0.4, 0)
  }

  getComponents(): SceneComponent[] {
    return this.components
  }

  getComponent(id: string): SceneComponent | undefined {
    return this.components.find((c) => c.id === id)
  }

  /** 高亮选中构件 */
  select(id: string | null): void {
    if (this.selectionHelper) {
      this.scene.remove(this.selectionHelper)
      this.selectionHelper.geometry.dispose()
      this.selectionHelper = null
    }
    if (!id) return
    const comp = this.components.find((c) => c.id === id)
    if (!comp) return
    this.selectionHelper = new THREE.BoxHelper(comp.mesh, 0xffd36b)
    this.scene.add(this.selectionHelper)
  }

  setFade(id: string, fade: number): void {
    this.components.find((c) => c.id === id)?.material.setFade(fade)
  }

  setAllFade(fade: number): void {
    for (const c of this.components) c.material.setFade(fade)
  }

  setLayerMode(mode: LayerMode): void {
    for (const c of this.components) c.material.setLayerMode(mode)
  }

  setBrushMode(enabled: boolean): void {
    this.brush.setEnabled(enabled)
    this.controls.enabled = !enabled
    this.renderer.domElement.style.cursor = enabled ? 'crosshair' : 'grab'
  }

  /** 替换构件的某一层纹理 */
  replaceTexture(id: string, kind: 'surface' | 'base' | 'fadeMask', tex: THREE.Texture): void {
    const comp = this.components.find((c) => c.id === id)
    if (!comp) return
    if (kind === 'surface') comp.material.setSurfaceTexture(tex)
    else if (kind === 'base') comp.material.setBaseTexture(tex)
    else comp.material.setFadeMaskTexture(tex)
  }

  /** 导入 GLB/GLTF：每个 Mesh 作为一个构件，赋予程序化默认彩画纹理 */
  async loadGlb(file: File): Promise<SceneComponent[]> {
    const url = URL.createObjectURL(file)
    try {
      const gltf = await new GLTFLoader().loadAsync(url)
      const root = gltf.scene
      const built: SceneComponent[] = []
      let index = 0

      root.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return
        const mesh = obj as THREE.Mesh
        index += 1
        const id = `imported-${index}-${mesh.uuid.slice(0, 6)}`
        const seed = id
        const restore = makeRestoreLayer()
        const material = new PaintedMaterial({
          surface: makeSurfaceTexture(seed),
          base: makeBaseTexture(seed),
          fadeMask: makeFadeMaskTexture(seed),
          restore: restore.texture
        })
        // 保留 GLTF 自带几何，替换材质
        const oldMat = mesh.material
        mesh.material = material
        if (oldMat) {
          const arr = Array.isArray(oldMat) ? oldMat : [oldMat]
          arr.forEach((m) => m.dispose())
        }
        mesh.userData.componentId = id
        mesh.castShadow = true
        mesh.receiveShadow = true
        built.push({
          id,
          name: mesh.name || `导入构件 ${index}`,
          group: '导入模型',
          mesh,
          material,
          restoreCanvas: restore.canvas,
          restoreTexture: restore.texture
        })
      })

      if (!built.length) throw new Error('模型中没有可用的网格构件')
      this.setComponents(built, root)
      return built
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /** 截图：直接渲染一帧到默认缓冲再导出，保证与视口一致 */
  screenshot(): string {
    const prevTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)
    const dataUrl = this.renderer.domElement.toDataURL('image/png')
    this.renderer.setRenderTarget(prevTarget)
    return dataUrl
  }

  /** 调试采样专用离屏 target，惰性创建并随容器尺寸调整 */
  private sampleTarget: THREE.WebGLRenderTarget | null = null

  /**
   * 调试/自动化用：离屏渲染一帧并回读像素，完全不影响 composer 的 rAF 管线。
   * 返回画面平均亮度、模型区域亮度与 8x6 网格亮度分布。
   */
  debugSample(): { avg: number; grid: number[]; modelLum: number } {
    const gl = this.renderer.getContext()
    const w = gl.drawingBufferWidth
    const h = gl.drawingBufferHeight
    if (!this.sampleTarget) {
      this.sampleTarget = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace })
    }
    if (this.sampleTarget.width !== w || this.sampleTarget.height !== h) {
      this.sampleTarget.setSize(w, h)
    }

    const prevTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.sampleTarget)
    this.renderer.render(this.scene, this.camera)
    const px = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px)
    this.renderer.setRenderTarget(prevTarget)

    // 背景色为线性 0-1，转 sRGB 0-255 后与回读像素比较
    const bg = new THREE.Color(this.scene.background as THREE.Color)
    const toSrgbByte = (c: number): number => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255
    const bgLum = (toSrgbByte(bg.r) + toSrgbByte(bg.g) + toSrgbByte(bg.b)) / 3
    let sum = 0
    let modelSum = 0
    let modelN = 0
    const grid: number[] = new Array(48).fill(0)
    const gridN: number[] = new Array(48).fill(0)
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4
        const lum = (px[i] + px[i + 1] + px[i + 2]) / 3
        sum += lum
        if (Math.abs(lum - bgLum) > 10) {
          modelSum += lum
          modelN++
        }
        const gx = Math.min(7, Math.floor((x / w) * 8))
        const gy = Math.min(5, Math.floor(((h - y) / h) * 6))
        const gi = gy * 8 + gx
        grid[gi] += lum
        gridN[gi] += 1
      }
    }
    const n = Math.ceil(w / 2) * Math.ceil(h / 2)
    return {
      avg: Math.round(sum / n),
      modelLum: modelN ? Math.round(modelSum / modelN) : 0,
      grid: grid.map((v, i) => Math.round(v / Math.max(1, gridN[i])))
    }
  }

  private clearModel(): void {
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot)
      this.modelRoot.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) {
          mesh.geometry?.dispose()
          const mat = mesh.material
          if (mat) {
            const arr = Array.isArray(mat) ? mat : [mat]
            arr.forEach((m) => m.dispose())
          }
        }
      })
    }
    this.select(null)
    this.modelRoot = null
    this.components = []
  }

  private handleResize = (): void => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    if (!width || !height) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
  }

  private loop(): void {
    this.rafId = requestAnimationFrame(this.loop)
    const now = performance.now()
    const delta = now - this.lastFrameTime
    this.lastFrameTime = now

    this.controls.update()
    if (this.selectionHelper) this.selectionHelper.update()
    this.composer.render()

    // FPS 统计（500ms 刷新一次）
    this.fpsAccum += delta
    this.fpsFrames += 1
    this.perfTimer += delta
    if (this.perfTimer >= 500) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / this.fpsAccum)
      this.currentFrameMs = this.fpsAccum / this.fpsFrames
      this.fpsAccum = 0
      this.fpsFrames = 0
      this.perfTimer = 0
      this.onPerf?.({
        fps: this.currentFps,
        frameMs: Math.round(this.currentFrameMs * 10) / 10,
        brushLatencyMs: Math.round(this.brush.lastLatencyMs * 10) / 10
      })
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.handleResize)
    this.brush.dispose()
    this.clearModel()
    this.controls.dispose()
    this.composer.dispose()
    this.sampleTarget?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
