import * as THREE from 'three'
import type { SceneComponent, UndoSnapshot } from '../types'
import { clamp } from '../utils'

/**
 * 修复笔刷
 *
 * 工作方式：
 *  1. 射线拾取模型表面，读取交点 uv
 *  2. 在构件 512x512 修复遮罩画布上以灰度白色绘制（白 = 该点降低褪色）
 *  3. 高速移动时按 uv 距离插值补点，保证笔画连续
 *  4. 每次 pointerdown 保存 ImageData 快照，撤销即回滚
 *
 * 性能：pointermove 内同步完成 射线 + 画布绘制 + needsUpdate，
 * 单次处理通常在数毫秒内，满足 < 80ms 交互延迟。
 */

const HISTORY_LIMIT = 20

export interface BrushSettings {
  size: number // 0.5 - 10（uv 空间百分比半径）
  hardness: number // 0 - 1
  strength: number // 0.05 - 1
}

export class RestoreBrush {
  private canvas: HTMLCanvasElement
  private raycaster = new THREE.Raycaster()
  private components: SceneComponent[] = []
  private settings: BrushSettings = { size: 3, hardness: 0.6, strength: 0.6 }

  private active = false
  private current: SceneComponent | null = null
  private lastUV: THREE.Vector2 | null = null

  private undoStack: UndoSnapshot[] = []
  private redoStack: UndoSnapshot[] = []

  /** 最近一次笔刷处理耗时（ms），供性能面板展示 */
  lastLatencyMs = 0
  private onHistoryChange?: () => void
  private onStroke?: () => void

  // 表面光标环
  private cursor: THREE.Mesh
  private cursorMat: THREE.MeshBasicMaterial

  constructor(canvas: HTMLCanvasElement, private camera: THREE.PerspectiveCamera) {
    this.canvas = canvas
    this.cursorMat = new THREE.MeshBasicMaterial({
      color: 0xffd36b,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthTest: false
    })
    this.cursor = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), this.cursorMat)
    this.cursor.visible = false
    this.cursor.renderOrder = 999
    this.cursor.raycast = () => undefined // 光标自身不参与拾取

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
  }

  attach(scene: THREE.Scene): void {
    scene.add(this.cursor)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
  }

  setComponents(components: SceneComponent[]): void {
    this.components = components
  }

  setSettings(patch: Partial<BrushSettings>): void {
    Object.assign(this.settings, patch)
  }

  setHistoryCallbacks(cbs: { onHistoryChange?: () => void; onStroke?: () => void }): void {
    this.onHistoryChange = cbs.onHistoryChange
    this.onStroke = cbs.onStroke
  }

  setEnabled(enabled: boolean): void {
    this.active = false
    this.cursor.visible = enabled
    if (!enabled) {
      this.current = null
      this.lastUV = null
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  get historyDepth(): number {
    return this.undoStack.length
  }

  /** 撤销最近一笔 */
  undo(): void {
    const snap = this.undoStack.pop()
    if (!snap) return
    const comp = this.components.find((c) => c.id === snap.componentId)
    if (!comp) return
    // 先把当前状态压入 redo
    const ctx = comp.restoreCanvas.getContext('2d')!
    this.redoStack.push({ componentId: comp.id, imageData: ctx.getImageData(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height) })
    ctx.putImageData(snap.imageData, 0, 0)
    comp.restoreTexture.needsUpdate = true
    this.onHistoryChange?.()
  }

  /** 重做 */
  redo(): void {
    const snap = this.redoStack.pop()
    if (!snap) return
    const comp = this.components.find((c) => c.id === snap.componentId)
    if (!comp) return
    const ctx = comp.restoreCanvas.getContext('2d')!
    this.undoStack.push({ componentId: comp.id, imageData: ctx.getImageData(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height) })
    ctx.putImageData(snap.imageData, 0, 0)
    comp.restoreTexture.needsUpdate = true
    this.onHistoryChange?.()
  }

  /** 清空指定构件（或全部）的修复区域 */
  clear(componentId?: string): void {
    const targets = componentId ? this.components.filter((c) => c.id === componentId) : this.components
    for (const comp of targets) {
      const ctx = comp.restoreCanvas.getContext('2d')!
      this.undoStack.push({
        componentId: comp.id,
        imageData: ctx.getImageData(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
      })
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
      comp.restoreTexture.needsUpdate = true
    }
    this.redoStack.length = 0
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.splice(0, this.undoStack.length - HISTORY_LIMIT)
    this.onHistoryChange?.()
    this.onStroke?.()
  }

  /** 读取当前构件修复遮罩快照（导出/存储用） */
  snapshot(componentId: string): ImageData | null {
    const comp = this.components.find((c) => c.id === componentId)
    if (!comp) return null
    return comp.restoreCanvas.getContext('2d')!.getImageData(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
  }

  /** 从 ImageData 恢复修复遮罩（导入配置用） */
  restoreImageData(componentId: string, image: ImageData): void {
    const comp = this.components.find((c) => c.id === componentId)
    if (!comp) return
    comp.restoreCanvas.getContext('2d')!.putImageData(image, 0, 0)
    comp.restoreTexture.needsUpdate = true
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    this.cursor.geometry.dispose()
    this.cursorMat.dispose()
  }

  // ---------------------------------------------------------------- 事件处理

  private toNDC(e: PointerEvent): THREE.Vector2 {
    const rect = this.canvas.getBoundingClientRect()
    return new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
  }

  private pick(e: PointerEvent): { comp: SceneComponent; uv: THREE.Vector2; point: THREE.Vector3; normal: THREE.Vector3 } | null {
    this.raycaster.setFromCamera(this.toNDC(e), this.camera)
    const meshes = this.components.map((c) => c.mesh)
    const hits = this.raycaster.intersectObjects(meshes, false)
    if (!hits.length || !hits[0].uv) return null
    const hit = hits[0]
    const uv = hit.uv!
    const comp = this.components.find((c) => c.mesh === hit.object)
    if (!comp) return null
    return {
      comp,
      uv: uv.clone(),
      point: hit.point.clone(),
      normal: hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 0, 1)
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return
    const t0 = performance.now()
    const hit = this.pick(e)
    if (!hit) return
    e.preventDefault()
    this.canvas.setPointerCapture?.(e.pointerId)
    this.active = true
    this.current = hit.comp
    this.lastUV = null

    // 保存笔画前快照
    const ctx = hit.comp.restoreCanvas.getContext('2d')!
    this.undoStack.push({
      componentId: hit.comp.id,
      imageData: ctx.getImageData(0, 0, hit.comp.restoreCanvas.width, hit.comp.restoreCanvas.height)
    })
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift()
    this.redoStack.length = 0

    this.stamp(hit.comp, hit.uv, null)
    this.lastUV = hit.uv
    this.updateCursor(hit)
    this.lastLatencyMs = performance.now() - t0
    this.onHistoryChange?.()
  }

  private onPointerMove(e: PointerEvent): void {
    const t0 = performance.now()
    const hit = this.pick(e)
    if (!hit) {
      this.cursor.visible = false
      return
    }
    this.updateCursor(hit)

    if (this.active && this.current && hit.comp.id === this.current.id) {
      e.preventDefault()
      this.stamp(hit.comp, hit.uv, this.lastUV)
      this.lastUV = hit.uv
    }
    this.lastLatencyMs = performance.now() - t0
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.active) return
    this.canvas.releasePointerCapture?.(e.pointerId)
    this.active = false
    this.current = null
    this.lastUV = null
    this.onStroke?.()
  }

  // ---------------------------------------------------------------- 绘制

  /** 在修复遮罩上盖一个笔刷印；fromUV 存在时沿线段插值补点 */
  private stamp(comp: SceneComponent, uv: THREE.Vector2, fromUV: THREE.Vector2 | null): void {
    const canvas = comp.restoreCanvas
    const ctx = canvas.getContext('2d')!
    const { size, hardness, strength } = this.settings

    // size 以 512 画布宽度的百分比表示
    const radiusPx = (size / 100) * canvas.width
    const points: Array<[number, number]> = []
    const toPx = (v: THREE.Vector2): [number, number] => [v.x * canvas.width, v.y * canvas.height]

    if (fromUV) {
      const [x0, y0] = toPx(fromUV)
      const [x1, y1] = toPx(uv)
      const dist = Math.hypot(x1 - x0, y1 - y1)
      const steps = Math.max(1, Math.ceil(dist / (radiusPx * 0.35)))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        points.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t])
      }
    } else {
      points.push(toPx(uv))
    }

    ctx.globalCompositeOperation = 'lighter'
    for (const [px, py] of points) {
      // 硬度控制实心核比例：核外做线性衰减
      const inner = clamp(hardness, 0.02, 1)
      const g = ctx.createRadialGradient(px, py, radiusPx * inner, px, py, radiusPx)
      const a = Math.round(strength * 255)
      g.addColorStop(0, `rgba(${a},${a},${a},1)`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, radiusPx, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    comp.restoreTexture.needsUpdate = true
  }

  private updateCursor(hit: { point: THREE.Vector3; normal: THREE.Vector3 }): void {
    const radius = (this.settings.size / 100) * 1.6 // 世界空间近似缩放
    this.cursor.visible = true
    this.cursor.position.copy(hit.point).addScaledVector(hit.normal, 0.02)
    this.cursor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hit.normal)
    this.cursor.scale.setScalar(radius)
  }
}
