import * as THREE from 'three'
import type { ModelData } from '../model/ModelLoader'

interface LabelRecord {
  partId: string
  el: HTMLDivElement
  dot: HTMLSpanElement
  /** 零件 pivot 顶部的本地锚点 */
  anchorLocal: THREE.Vector3
  screenX: number
  screenY: number
  visible: boolean
}

/**
 * 标签模块。
 *
 * 为 keyPart 零件生成 DOM 文字标注，每帧把零件世界坐标投影到屏幕：
 *   world -> NDC -> 容器像素坐标，标签位置随拆解状态联动。
 *
 * 密集区域防重叠采用 2D 迭代推开（relaxation）：
 * 每轮检测标签矩形对，重叠则沿中心连线互相推开，再做边界约束，
 * 6 轮内即可在 300 零件、~60 标签的密度下收敛。
 */
export class LabelManager {
  private container: HTMLElement
  private layer: HTMLDivElement
  private labels = new Map<string, LabelRecord>()
  private visible = true
  private readonly labelW = 118
  private readonly labelH = 26
  private readonly gap = 6

  constructor(
    private model: ModelData,
    private camera: THREE.PerspectiveCamera,
    container: HTMLElement,
  ) {
    this.container = container
    this.layer = document.createElement('div')
    this.layer.className = 'label-layer'
    this.layer.style.cssText =
      'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;'
    container.appendChild(this.layer)
    this.build()
  }

  private build(): void {
    this.model.runtime.forEach((rt) => {
      if (!rt.node.part?.keyPart) return
      const el = document.createElement('div')
      el.className = 'part-label'
      el.style.cssText =
        'position:absolute;left:0;top:0;will-change:transform;' +
        'padding:2px 8px;border-radius:10px;font-size:12px;line-height:20px;' +
        'background:rgba(16,20,26,0.78);color:#e8f4ff;border:1px solid rgba(94,201,255,0.55);' +
        'white-space:nowrap;backdrop-filter:blur(4px);box-shadow:0 2px 8px rgba(0,0,0,0.35);'
      const dot = document.createElement('span')
      dot.style.cssText =
        'display:inline-block;width:6px;height:6px;border-radius:50%;' +
        'background:#5ec9ff;margin-right:6px;vertical-align:middle;'
      el.appendChild(dot)
      el.appendChild(document.createTextNode(rt.node.part.name))
      this.layer.appendChild(el)

      // 锚点：取 pivot 包围盒顶部，没有几何时退化为原点上方
      const anchor = new THREE.Vector3(0, 0.12, 0)
      const box = new THREE.Box3()
      rt.meshes.forEach((m) => box.expandByObject(m))
      if (!box.isEmpty()) anchor.set(0, box.max.y + 0.05, 0)

      this.labels.set(rt.node.id, {
        partId: rt.node.id,
        el,
        dot,
        anchorLocal: anchor,
        screenX: 0,
        screenY: 0,
        visible: false,
      })
    })
  }

  setVisible(v: boolean): void {
    this.visible = v
    this.layer.style.display = v ? 'block' : 'none'
  }

  get isVisible(): boolean {
    return this.visible
  }

  private v = new THREE.Vector3()
  private frustum = new THREE.Frustum()
  private projScreenMatrix = new THREE.Matrix4()

  update(): void {
    if (!this.visible) return
    const rect = this.container.getBoundingClientRect()
    this.projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)

    const records: LabelRecord[] = []
    for (const rec of this.labels.values()) {
      const rt = this.model.runtime.get(rec.partId)!
      this.v.copy(rec.anchorLocal)
      rt.pivot.localToWorld(this.v)

      const inView = this.frustum.containsPoint(this.v)
      this.v.project(this.camera)
      const x = (this.v.x * 0.5 + 0.5) * rect.width
      const y = (-this.v.y * 0.5 + 0.5) * rect.height
      rec.screenX = x
      rec.screenY = y
      rec.visible = inView && this.v.z < 1
      if (rec.visible) records.push(rec)
    }

    this.resolveOverlaps(records, rect.width, rect.height)

    for (const rec of this.labels.values()) {
      if (!rec.visible) {
        rec.el.style.display = 'none'
        continue
      }
      rec.el.style.display = 'block'
      rec.el.style.transform = `translate(${Math.round(rec.screenX - this.labelW / 2)}px, ${Math.round(
        rec.screenY - this.labelH / 2,
      )}px)`
    }
  }

  /** 2D 矩形防重叠：迭代推开 + 容器边界约束 */
  private resolveOverlaps(records: LabelRecord[], width: number, height: number): void {
    const w = this.labelW
    const h = this.labelH
    const minX = w / 2
    const maxX = width - w / 2
    const minY = h / 2
    const maxY = height - h / 2

    for (let iter = 0; iter < 6; iter++) {
      let moved = false
      for (let i = 0; i < records.length; i++) {
        for (let j = i + 1; j < records.length; j++) {
          const a = records[i]
          const b = records[j]
          const dx = b.screenX - a.screenX
          const dy = b.screenY - a.screenY
          const overlapX = w + this.gap - Math.abs(dx)
          const overlapY = h + this.gap - Math.abs(dy)
          if (overlapX > 0 && overlapY > 0) {
            // 沿重叠较小的轴推开，分摊位移
            if (overlapX < overlapY) {
              const push = overlapX / 2
              const sign = dx === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dx)
              a.screenX -= sign * push
              b.screenX += sign * push
            } else {
              const push = overlapY / 2
              const sign = dy === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dy)
              a.screenY -= sign * push
              b.screenY += sign * push
            }
            moved = true
          }
        }
      }
      for (const r of records) {
        r.screenX = THREE.MathUtils.clamp(r.screenX, minX, maxX)
        r.screenY = THREE.MathUtils.clamp(r.screenY, minY, maxY)
      }
      if (!moved) break
    }
  }

  dispose(): void {
    this.layer.remove()
    this.labels.clear()
  }
}
