/**
 * Scene controller.
 *
 * Owns the renderer, both cameras, orbit controls, actor views, picking and
 * the per-frame pose application. It is framework-agnostic: Vue only calls
 * `setTime`, `setSelection`, `setViewMode`, `focusStand` and reads events.
 *
 * Performance notes
 * -----------------
 * - Every actor's state is a pure function of `t`, so scrubbing is just
 *   re-evaluating 36 cheap pose functions and writing 36 transforms. No
 *   allocation happens in the hot path (`applyPose` writes in place).
 * - Poses are only re-applied when `t`, the selection or the scenario change.
 * - Ghost hulls get their renderOrder re-banded only when the camera actually
 *   moves, so a stationary scrub does no sorting work.
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ActorSpec, ActorPose, Scenario, StandSpec } from '../domain/model'
import { deg2rad, sampleActor } from '../domain/model'
import { buildEnvironment, type EnvironmentBuild } from './apron'
import {
  applyPose,
  buildActorView,
  disposeActorView,
  setGhost,
  type ActorView,
} from './actorViews'
import { createLabel, disposeLabelCache, preloadLabelFont, type LabelHandle } from './labels'

export type ViewMode = 'perspective' | 'orthographic'
export type GhostMode = 'off' | 'selected' | 'all'

export interface SceneEvents {
  /** Fired when an actor is picked (or picked away). */
  onSelect: (actorId: string | null) => void
  onHover: (actorId: string | null) => void
  /** Fired once after the first successful render. */
  onFirstFrame?: () => void
}

export interface CameraSnapshot {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
  zoom?: number
}

interface OrbitRig {
  theta: number
  phi: number
  radius: number
  target: THREE.Vector3
}

const DEFAULT_RIG: OrbitRig = {
  theta: deg2rad(38),
  phi: deg2rad(52),
  radius: 168,
  target: new THREE.Vector3(0, 2, 8),
}

const GHOST_ORDER_BASE = 100
const GHOST_ORDER_SPAN = 600

export class SceneController {
  private container: HTMLElement | null = null
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private perspCam: THREE.PerspectiveCamera
  private orthoCam: THREE.OrthographicCamera
  private controlsPersp: OrbitControls
  private controlsOrtho: OrbitControls
  private env: EnvironmentBuild | null = null
  private views = new Map<string, ActorView>()
  private standLabels: LabelHandle[] = []
  private scenario: Scenario | null = null
  private standsById = new Map<string, StandSpec>()

  private viewMode: ViewMode = 'perspective'
  private ghostMode: GhostMode = 'all'
  private selectedId: string | null = null
  private hoverId: string | null = null
  private focusedStand: string | null = null

  private time = 0
  private seconds = 0
  private timeDirty = true
  private selectionDirty = true
  private cameraDirty = true

  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private pointerDown: { x: number; y: number } | null = null
  private raf = 0
  private resizeObserver: ResizeObserver | null = null
  private disposed = false
  private firstFrameSent = false
  private lastFrameMs = 0
  private frameMsEma = 16.7

  /** Reusable scratch objects (no per-frame allocation). */
  private tmpVec = new THREE.Vector3()
  private tmpDir = new THREE.Vector3()
  private ghostRanks: Array<{ view: ActorView; dist: number }> = []
  /** Last measured cost of one `refreshActors()` pass, in ms. */
  private lastPoseMs = 0
  /** Adaptive quality: shadows are dropped if the GPU cannot keep up. */
  private quality: 'high' | 'balanced' | 'low' = 'high'
  private qualityProbeFrames = 0
  private qualityProbeMs = 0
  private gpuName = ''
  private shadowSize = 2048
  private labelsVisible = true
  private autoRefresh = true

  constructor(private events: SceneEvents) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.sortObjects = true

    this.perspCam = new THREE.PerspectiveCamera(42, 1, 0.5, 2400)
    this.orthoCam = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 4000)

    this.controlsPersp = new OrbitControls(this.perspCam, this.renderer.domElement)
    this.controlsOrtho = new OrbitControls(this.orthoCam, this.renderer.domElement)
    for (const c of [this.controlsPersp, this.controlsOrtho]) {
      c.enableDamping = true
      c.dampingFactor = 0.08
      c.maxPolarAngle = deg2rad(84)
      c.minPolarAngle = deg2rad(6)
      c.minDistance = 18
      c.maxDistance = 460
      c.screenSpacePanning = false
      c.addEventListener('change', () => {
        this.cameraDirty = true
      })
    }
    this.controlsOrtho.enabled = false

    this.scene.background = new THREE.Color('#0d1420')
    this.scene.fog = new THREE.Fog('#0d1420', 320, 760)

    this.detectBaselineQuality()
  }

  /**
   * Pick a sensible starting quality tier from the GL renderer string.
   *
   * Software rasterisers (SwiftShader, llvmpipe, …) render a 2048² shadow map
   * plus 100+ draws at a few frames per second, so they start with shadows off
   * and pixel ratio 1. Real GPUs start at 'high'; `adaptQuality` still demotes
   * them if frames run long.
   */
  private detectBaselineQuality(): void {
    let rendererName = ''
    try {
      const gl = this.renderer.getContext()
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      rendererName = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER))
    } catch {
      rendererName = ''
    }
    this.gpuName = rendererName

    const software = /swiftshader|llvmpipe|software|basic render/i.test(rendererName)
    if (software) {
      this.quality = 'balanced'
      this.renderer.shadowMap.enabled = false
      this.renderer.setPixelRatio(1)
      this.shadowSize = 512
    }
  }

  /** Renderer string, exposed for diagnostics. */
  gpu(): string {
    return this.gpuName
  }  /* ---------------------------------------------------------------- */
  /* Lifecycle                                                        */
  /* ---------------------------------------------------------------- */

  mount(container: HTMLElement): void {
    this.container = container
    container.appendChild(this.renderer.domElement)
    const canvas = this.renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerleave', this.onPointerLeave)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()

    this.applyRig(this.activeCamera)
    void preloadLabelFont()

    this.loop()
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerleave', this.onPointerLeave)
    this.resizeObserver?.disconnect()
    this.controlsPersp.dispose()
    this.controlsOrtho.dispose()
    for (const view of this.views.values()) disposeActorView(view)
    this.views.clear()
    for (const label of this.standLabels) label.dispose()
    this.standLabels = []
    disposeLabelCache()
    this.env?.dispose()
    this.renderer.dispose()
    canvas.remove()
  }

  /* ---------------------------------------------------------------- */
  /* Scenario                                                         */
  /* ---------------------------------------------------------------- */

  setScenario(scenario: Scenario): void {
    // Tear down the previous scene contents. disposeActorView also removes the
    // crew labels, which live at scene level rather than under the actor root.
    for (const view of this.views.values()) disposeActorView(view)
    this.views.clear()
    for (const label of this.standLabels) label.dispose()
    this.standLabels = []
    this.env?.dispose()
    this.env = null
    this.standsById.clear()

    this.scenario = scenario
    for (const stand of scenario.stands) this.standsById.set(stand.id, stand)

    this.env = buildEnvironment(scenario.stands, {
      shadows: this.quality === 'high',
      shadowSize: this.shadowSize,
    })
    this.scene.add(this.env.group)

    for (const spec of scenario.actors) {
      const view = buildActorView(spec, this.standsById.get(spec.stand))
      this.views.set(spec.id, view)
      this.scene.add(view.root)
      // Crew labels live at scene level so they can billboard freely.
      if (view.label) this.scene.add(view.label.object)
    }

    // Stand placards float high above the tail of each stand, clear of
    // vehicles, the guidance board and the light masts.
    for (const stand of scenario.stands) {
      const label = createLabel({
        id: `stand:${stand.id}`,
        text: `${stand.label}  ${stand.flight}`,
        color: '#e2f2ff',
        x: stand.origin.x,
        y: 17,
        z: stand.origin.z + 32,
        fontSize: 2.4,
      })
      this.standLabels.push(label)
      this.scene.add(label.object)
    }
    // Stand placards sit above the stands; `updateStandLabelBillboards` keeps
    // them facing the camera as it orbits.
    this.updateStandLabelBillboards()

    this.focusedStand = null
    this.selectedId = null
    this.hoverId = null
    this.timeDirty = true
    this.selectionDirty = true
    this.cameraDirty = true
    this.applyStandFocus()
  }

  /* ---------------------------------------------------------------- */
  /* Time & selection                                                 */
  /* ---------------------------------------------------------------- */

  setTime(t: number): void {
    if (t === this.time) return
    this.time = t
    this.timeDirty = true
  }

  setSelection(actorId: string | null): void {
    if (actorId === this.selectedId) return
    this.selectedId = actorId
    this.selectionDirty = true
    this.cameraDirty = true
  }

  setGhostMode(mode: GhostMode): void {
    this.ghostMode = mode
    this.selectionDirty = true
  }

  setLabelsVisible(visible: boolean): void {
    this.labelsVisible = visible
    this.updateLabels()
  }

  focusStand(standId: string | null): void {
    this.focusedStand = standId
    this.applyStandFocus()
    this.cameraDirty = true
  }

  private applyStandFocus(): void {
    for (const view of this.views.values()) {
      const dim = this.focusedStand !== null && view.spec.stand !== this.focusedStand
      view.root.visible = !dim
    }
    for (const label of this.standLabels) {
      const id = label.id.replace('stand:', '')
      label.setVisible(this.focusedStand === null || this.focusedStand === id)
    }
    const stand = this.focusedStand ? this.standsById.get(this.focusedStand) : null
    if (stand) {
      this.setRigTarget(new THREE.Vector3(stand.origin.x, 3, stand.origin.z + 6), 108)
    } else {
      this.setRigTarget(new THREE.Vector3(0, 2, 8), 168)
    }
  }

  /** Voice-over helper: current pose of an actor at the controller's time. */
  poseOf(actorId: string): ActorPose | null {
    const view = this.views.get(actorId)
    if (!view) return null
    return sampleActor(view.spec, this.time)
  }

  actorSpec(actorId: string): ActorSpec | null {
    return this.views.get(actorId)?.spec ?? null
  }

  /* ---------------------------------------------------------------- */
  /* Cameras                                                          */
  /* ---------------------------------------------------------------- */

  private get activeCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.viewMode === 'perspective' ? this.perspCam : this.orthoCam
  }

  private get activeControls(): OrbitControls {
    return this.viewMode === 'perspective' ? this.controlsPersp : this.controlsOrtho
  }

  private get rig(): OrbitRig {
    const target = this.activeControls.target
    const cam = this.activeCamera
    const offset = this.tmpVec.copy(cam.position).sub(target)
    const radius = offset.length() || 1
    const theta = Math.atan2(offset.x, offset.z)
    const phi = Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1))
    return { theta, phi, radius, target: target.clone() }
  }

  private applyRig(cam: THREE.PerspectiveCamera | THREE.OrthographicCamera): void {
    const rig = this.rig
    const dir = this.tmpDir
      .set(
        Math.sin(rig.phi) * Math.sin(rig.theta),
        Math.cos(rig.phi),
        Math.sin(rig.phi) * Math.cos(rig.theta),
      )
      .clone()
    cam.position.copy(rig.target).addScaledVector(dir, rig.radius)
    cam.lookAt(rig.target)
    if (cam === this.orthoCam) {
      this.updateOrthoFrustum(rig.radius)
    }
  }

  private rigOrDefault(): OrbitRig {
    if (this.rig.radius < 0.001) return { ...DEFAULT_RIG, target: DEFAULT_RIG.target.clone() }
    return this.rig
  }

  private setRigTarget(target: THREE.Vector3, radius: number): void {
    for (const controls of [this.controlsPersp, this.controlsOrtho]) {
      controls.target.copy(target)
    }
    for (const cam of [this.perspCam, this.orthoCam]) {
      const dir = this.tmpVec
        .copy(cam.position)
        .sub(target)
        .normalize()
      if (!Number.isFinite(dir.length()) || dir.lengthSq() < 1e-6) {
        dir.set(0.55, 0.8, 0.65).normalize()
      }
      cam.position.copy(target).addScaledVector(dir, radius)
      cam.lookAt(target)
    }
    this.updateOrthoFrustum(radius)
    this.controlsPersp.update()
    this.controlsOrtho.update()
  }

  /** Match the orthographic apparent size to the perspective one at target. */
  private updateOrthoFrustum(radius: number): void {
    const cam = this.orthoCam
    const viewHeight = 2 * radius * Math.tan(deg2rad(this.perspCam.fov / 2))
    const halfH = viewHeight / 2
    const halfW = halfH * this.aspect
    cam.left = -halfW
    cam.right = halfW
    cam.top = halfH
    cam.bottom = -halfH
    cam.updateProjectionMatrix()
  }

  setViewMode(mode: ViewMode): void {
    if (mode === this.viewMode) return
    const target = this.activeControls.target.clone()
    const cam = this.activeCamera
    const offset = this.tmpVec.copy(cam.position).sub(target)
    const radius = offset.length() || DEFAULT_RIG.radius
    const theta = Math.atan2(offset.x, offset.z)
    const phi = Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1))

    this.viewMode = mode
    this.controlsPersp.enabled = mode === 'perspective'
    this.controlsOrtho.enabled = mode === 'orthographic'

    for (const c of [this.controlsPersp, this.controlsOrtho]) {
      c.target.copy(target)
    }
    for (const c of [this.perspCam, this.orthoCam]) {
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.cos(theta),
      )
      c.position.copy(target).addScaledVector(dir, radius)
      c.lookAt(target)
    }
    this.updateOrthoFrustum(radius)
    this.controlsPersp.update()
    this.controlsOrtho.update()
    this.cameraDirty = true
  }

  /** Top-down preset: axis-aligned, north up, framed on the focused stand. */
  setTopView(): void {
    const target = this.activeControls.target.clone()
    const radius = this.activeCamera.position.distanceTo(target)
    // Set `up` to -Z so the apron's north edge is at the top of the screen and
    // the view never rolls arbitrarily when the direction is near-vertical.
    for (const cam of [this.perspCam, this.orthoCam]) {
      cam.up.set(0, 0, -1)
      cam.position.set(target.x, target.y + radius, target.z + 0.0001)
      cam.lookAt(target)
    }
    this.updateOrthoFrustum(radius)
    this.controlsPersp.update()
    this.controlsOrtho.update()
    this.cameraDirty = true
  }

  cameraSnapshot(): CameraSnapshot {
    const cam = this.activeCamera
    const snap: CameraSnapshot = {
      position: [cam.position.x, cam.position.y, cam.position.z],
      target: [
        this.activeControls.target.x,
        this.activeControls.target.y,
        this.activeControls.target.z,
      ],
    }
    if (this.viewMode === 'perspective') snap.fov = this.perspCam.fov
    else snap.zoom = this.orthoCam.zoom
    return snap
  }

  restoreCamera(snap: CameraSnapshot | undefined): void {
    if (!snap) return
    const target = new THREE.Vector3(...snap.target)
    const position = new THREE.Vector3(...snap.position)
    for (const controls of [this.controlsPersp, this.controlsOrtho]) {
      controls.target.copy(target)
    }
    this.perspCam.position.copy(position)
    this.perspCam.lookAt(target)
    this.orthoCam.position.copy(position)
    this.orthoCam.lookAt(target)
    const radius = Math.max(position.distanceTo(target), 1)
    this.updateOrthoFrustum(radius)
    if (snap.zoom && this.viewMode === 'orthographic') {
      this.orthoCam.zoom = snap.zoom
      this.orthoCam.updateProjectionMatrix()
    }
    this.controlsPersp.update()
    this.controlsOrtho.update()
    this.cameraDirty = true
  }

  private get aspect(): number {
    if (!this.container) return 1
    const { clientWidth, clientHeight } = this.container
    return clientHeight > 0 ? clientWidth / clientHeight : 1
  }

  private resize(): void {
    if (!this.container) return
    const w = Math.max(this.container.clientWidth, 1)
    const h = Math.max(this.container.clientHeight, 1)
    this.renderer.setSize(w, h, false)
    const aspect = w / h
    this.perspCam.aspect = aspect
    this.perspCam.updateProjectionMatrix()

    const rig = this.rigOrDefault()
    this.updateOrthoFrustum(rig.radius)
  }

  /* ---------------------------------------------------------------- */
  /* Rendering                                                        */
  /* ---------------------------------------------------------------- */

  private loop = (): void => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    this.seconds = performance.now() / 1000

    const active = this.activeControls
    // While auto-refresh is paused (diagnostics), leave the camera exactly
    // where the caller put it: damping in OrbitControls would otherwise drift
    // it between explicit renders.
    if (this.autoRefresh) active.update()

    if (this.autoRefresh) {
      if (this.timeDirty || this.selectionDirty) this.refreshActors()
      if (this.cameraDirty) this.sortGhosts()
      this.updateLabels()
      this.updateStandLabelBillboards()
    } else if (this.cameraDirty) {
      // Even when resting, keep ghost ordering and billboards in sync with the
      // camera so a manual inspection pass still looks right.
      this.sortGhosts()
      this.updateLabels()
      this.updateStandLabelBillboards()
    }

    this.renderer.render(this.scene, this.activeCamera)

    if (!this.firstFrameSent) {
      this.firstFrameSent = true
      this.events.onFirstFrame?.()
    }

    const now = performance.now()
    if (this.lastFrameMs) {
      this.frameMsEma = this.frameMsEma * 0.9 + (now - this.lastFrameMs) * 0.1
    }
    this.lastFrameMs = now
    this.adaptQuality(now)
  }

  /**
   * Drop expensive features when frames run long. Starts at 'high' and walks
   * down once, after ~1s of sustained slow frames, so weak GPUs (or software
   * rasterisers) stay interactive instead of crawling. Never walks back up:
   * visible pop-in is worse than a stable, slightly simpler image.
   */
  /**
   * Position crew labels over their figures and billboard them at the camera.
   * The label root is a scene child (not an actor child) so this rotation never
   * fights the actor's yaw. Cheap: one quaternion copy and one position write
   * per crew member.
   *
   * Labels are scaled by camera distance so a role chip stays roughly the same
   * size on screen whether the user is inspecting one stand or looking at the
   * whole apron. The clamp keeps it from becoming a billboard up close or a
   * speck at altitude.
   */
  private updateLabels(): void {
    const cam = this.activeCamera
    const isOrtho = this.viewMode === 'orthographic'
    // Orthographic: a fixed world size reads well at every zoom.
    const orthoScale = this.orthoViewHeight() / 90
    for (const view of this.views.values()) {
      const label = view.label
      if (!label) continue
      if (!view.root.visible) {
        label.setEnabled(false)
        continue
      }
      label.setEnabled(this.labelsVisible)
      const p = view.root.position
      label.object.position.set(p.x, 2.75, p.z)
      label.object.quaternion.copy(cam.quaternion)
      if (isOrtho) {
        // Orthographic apparent size is independent of distance.
        label.object.scale.setScalar(Math.max(0.8, orthoScale))
      } else {
        // Perspective: scale with distance so the chip holds a roughly constant
        // ~16px on-screen height from overview to close inspection.
        const dist = this.tmpVec.set(p.x, 2.75, p.z).distanceTo(cam.position)
        label.object.scale.setScalar(THREE.MathUtils.clamp(dist / 51, 0.7, 4.5))
      }
    }
  }

  /** Keep stand placards facing the camera, upright, at a readable size. */
  private updateStandLabelBillboards(): void {
    if (this.standLabels.length === 0) return
    const cam = this.activeCamera
    const isOrtho = this.viewMode === 'orthographic'
    for (const label of this.standLabels) {
      label.object.quaternion.copy(cam.quaternion)
      const scale = isOrtho
        ? Math.max(0.7, this.orthoViewHeight() / 90)
        : THREE.MathUtils.clamp(
            cam.position.distanceTo(label.object.position) / 70,
            0.7,
            3.2,
          )
      label.object.scale.setScalar(scale)
    }
  }

  /** World-space height currently visible through the orthographic camera. */
  private orthoViewHeight(): number {
    const cam = this.orthoCam
    return (cam.top - cam.bottom) / Math.max(cam.zoom, 0.0001)
  }

  private adaptQuality(now: number): void {
    if (this.quality === 'low') return
    this.qualityProbeFrames++
    this.qualityProbeMs += this.frameMsEma
    if (this.qualityProbeFrames < 60) return

    const avg = this.qualityProbeMs / this.qualityProbeFrames
    this.qualityProbeFrames = 0
    this.qualityProbeMs = 0

    if (avg > 34 && this.quality === 'high') {
      this.quality = 'balanced'
      this.renderer.shadowMap.enabled = false
      this.renderer.setPixelRatio(1)
      this.scene.traverse((obj) => {
        const light = obj as THREE.DirectionalLight
        if (light.isDirectionalLight) light.castShadow = false
      })
    } else if (avg > 46 && this.quality === 'balanced') {
      this.quality = 'low'
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    }
    void now
  }

  qualityTier(): 'high' | 'balanced' | 'low' {
    return this.quality
  }

  /** Average frame interval in ms, exposed for the perf readout. */
  frameCost(): number {
    return this.frameMsEma
  }

  private refreshActors(): void {
    if (!this.scenario) return
    const t0 = performance.now()
    for (const view of this.views.values()) {
      const inFocus =
        this.focusedStand === null || view.spec.stand === this.focusedStand
      if (!inFocus) continue
      const pose = sampleActor(view.spec, this.time)
      applyPose(view, pose, {
        selected: view.spec.id === this.selectedId,
        hovered: view.spec.id === this.hoverId,
        seconds: this.seconds,
      })
      this.updateGhost(view, pose)
    }
    this.lastPoseMs = performance.now() - t0
    this.timeDirty = false
    this.selectionDirty = false
    this.cameraDirty = true
  }

  /** Cost of the most recent full pose re-evaluation, in milliseconds. */
  poseCost(): number {
    return this.lastPoseMs
  }

  private updateGhost(view: ActorView, pose: ActorPose): void {
    const isVehicle =
      view.spec.kind !== 'aircraft' && view.spec.kind !== 'groundCrew'
    if (!isVehicle || this.ghostMode === 'off') {
      view.ghost.visible = false
      return
    }
    const selected = view.spec.id === this.selectedId
    const hovered = view.spec.id === this.hoverId
    const show = this.ghostMode === 'all' ? true : selected || hovered
    void pose
    setGhost(view, show, selected ? 1 : hovered ? 0.85 : 0.5)
  }

  /**
   * Re-band ghost render orders by camera distance so overlapping translucent
   * hulls blend back-to-front. Within a hull the BackSide pass always sorts
   * before FrontSide, so its own faces stay correct too.
   */
  private sortGhosts(): void {
    this.cameraDirty = false
    const cam = this.activeCamera
    this.ghostRanks.length = 0
    for (const view of this.views.values()) {
      if (!view.ghost.visible || !view.root.visible) continue
      this.ghostRanks.push({
        view,
        dist: this.tmpVec.set(view.root.position.x, 2, view.root.position.z).distanceTo(cam.position),
      })
    }
    if (this.ghostRanks.length === 0) return

    this.ghostRanks.sort((a, b) => b.dist - a.dist)
    const band = Math.max(1, Math.floor(GHOST_ORDER_SPAN / Math.max(this.ghostRanks.length, 1)))
    let order = GHOST_ORDER_BASE
    for (const { view } of this.ghostRanks) {
      for (const m of view.ghostBack) m.renderOrder = order
      for (const m of view.ghostFront) m.renderOrder = order + 1
      for (const l of view.ghostLines) l.renderOrder = order + 2
      order += band
    }

    // Labels sit above every ghost layer but still depth-test against solids.
    let labelOrder = GHOST_ORDER_BASE + GHOST_ORDER_SPAN
    for (const { view } of this.ghostRanks) {
      if (!view.label) continue
      view.label.object.renderOrder = labelOrder++
      view.label.text.renderOrder = labelOrder
      view.label.chip.renderOrder = labelOrder
    }
  }

  /* ---------------------------------------------------------------- */
  /* Picking                                                          */
  /* ---------------------------------------------------------------- */

  private setPointerFromEvent(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private pick(): string | null {
    if (!this.scenario) return null
    this.raycaster.setFromCamera(this.pointer, this.activeCamera)
    const targets: THREE.Object3D[] = []
    for (const view of this.views.values()) {
      if (!view.root.visible) continue
      for (const target of view.pickTargets) targets.push(target)
    }
    if (targets.length === 0) return null
    const hits = this.raycaster.intersectObjects(targets, false)
    if (hits.length === 0) return null
    const id = hits[0].object.userData.actorId as string | undefined
    return id ?? null
  }
  private onPointerDown = (event: PointerEvent): void => {
    this.pointerDown = { x: event.clientX, y: event.clientY }
  }

  private onPointerUp = (event: PointerEvent): void => {
    const down = this.pointerDown
    this.pointerDown = null
    if (!down) return
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
    if (moved > 6) return // a drag, not a click
    this.setPointerFromEvent(event)
    const id = this.pick()
    this.events.onSelect(id)
  }

  private onPointerMove = (event: PointerEvent): void => {
    this.setPointerFromEvent(event)
    const id = this.pick()
    if (id !== this.hoverId) {
      this.hoverId = id
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
      this.selectionDirty = true
      this.events.onHover(id)
    }
  }

  private onPointerLeave = (): void => {
    if (this.hoverId !== null) {
      this.hoverId = null
      this.selectionDirty = true
      this.events.onHover(null)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Diagnostics                                                      */
  /* ---------------------------------------------------------------- */

  stats(): { actors: number; visible: number; drawCalls: number; triangles: number } {
    const info = this.renderer.info
    let visible = 0
    for (const view of this.views.values()) if (view.root.visible) visible++
    return {
      actors: this.views.size,
      visible,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
    }
  }

  /** Project an actor's solid body centre to CSS pixels, for HTML overlays. */
  projectActor(actorId: string): { x: number; y: number } | null {
    const view = this.views.get(actorId)
    if (!view || !this.container) return null
    const box = new THREE.Box3().setFromObject(view.model)
    if (box.isEmpty()) return null
    const pos = box.getCenter(this.tmpVec)
    pos.project(this.activeCamera)
    if (pos.z > 1) return null
    return {
      x: (pos.x * 0.5 + 0.5) * this.container.clientWidth,
      y: (-pos.y * 0.5 + 0.5) * this.container.clientHeight,
    }
  }

  /** Debug hook used by the perf test: force a synchronous repaint. */
  renderNow(): void {
    this.renderer.render(this.scene, this.activeCamera)
  }

  /** Exposed for tests: number of objects currently in the scene. */
  actorCount(): number {
    return this.views.size
  }

  /** Exposed for tests: actor ids of one kind, in scene order. */
  actorIdsByKind(kind: string): string[] {
    const out: string[] = []
    for (const view of this.views.values()) {
      if (view.spec.kind === kind) out.push(view.spec.id)
    }
    return out
  }

  /**
   * Enable or disable automatic pose re-application in the render loop.
   *
   * Disabling lets a caller (diagnostics, tests, or an external inspector)
   * manipulate scene objects directly between explicit `renderNow()` calls
   * without the loop overwriting them on the next frame.
   */
  setAutoRefresh(enabled: boolean): void {
    this.autoRefresh = enabled
  }

  /** Exposed for tests: pick at normalized device coordinates. */
  pickAtNdc(x: number, y: number): string | null {
    this.pointer.set(x, y)
    return this.pick()
  }

  /** Exposed for tests: GPU renderer string. */
  rendererName(): string {
    return this.gpuName
  }
}
