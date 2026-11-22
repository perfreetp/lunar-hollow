/** 分层显示模式 */
import type * as THREE from 'three'
import type { PaintedMaterial } from './core/PaintedMaterial'

export type LayerMode = 'both' | 'base' | 'surface'

/** 操作工具 */
export type ToolType = 'orbit' | 'brush'

/** 序列化到配置文件中的构件信息 */
export interface ComponentConfig {
  id: string
  name: string
  group: string
  fade: number
  /** 修复遮罩数据（base64 dataURL, 512x512 灰度图），无修复时为 null */
  restoreMask: string | null
  /** 自定义纹理（base64 dataURL），程序化默认纹理时为 null */
  surfaceDataUrl: string | null
  baseDataUrl: string | null
  fadeMaskDataUrl: string | null
}

/** 导出的配置文件结构 */
export interface ProjectConfig {
  format: 'caihua-fade-studio'
  version: 1
  exportedAt: string
  globalFade: number
  layerMode: LayerMode
  brushSize: number
  brushHardness: number
  brushStrength: number
  components: ComponentConfig[]
}

/** IndexedDB 中存储的项目记录 */
export interface ProjectRecord extends ProjectConfig {
  key: string
  name: string
  savedAt: number
  thumbnail?: string
}

/** 运行时构件（场景对象 + 业务数据） */
export interface SceneComponent {
  id: string
  name: string
  group: string
  mesh: THREE.Mesh
  material: PaintedMaterial
  restoreCanvas: HTMLCanvasElement
  restoreTexture: THREE.CanvasTexture
}

/** 撤销快照 */
export interface UndoSnapshot {
  componentId: string
  imageData: ImageData
}

/** 性能统计 */
export interface PerfStats {
  fps: number
  frameMs: number
  brushLatencyMs: number
}
