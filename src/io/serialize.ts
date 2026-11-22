import type { ComponentConfig, ProjectConfig, SceneComponent } from '../types'
import { loadDataUrl } from '../utils'
import { makeBaseTexture, makeFadeMaskTexture, makeRestoreLayer, makeSurfaceTexture, textureFromImage } from '../core/TextureFactory'
import * as THREE from 'three'

/**
 * 项目配置序列化 / 反序列化
 * 配置为自包含 JSON：纹理与修复遮罩以 dataURL 内嵌，可通过文件分享完整恢复。
 */

function canvasHasContent(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')!
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 4 || data[i + 1] > 4 || data[i + 2] > 4) return true
  }
  return false
}

export function serializeComponent(comp: SceneComponent): ComponentConfig {
  const mat = comp.material
  const surfaceTex = mat.uniforms.uSurfaceTex.value as THREE.CanvasTexture
  const baseTex = mat.uniforms.uBaseTex.value as THREE.CanvasTexture
  const fadeMaskTex = mat.uniforms.uFadeMask.value as THREE.CanvasTexture

  const customDataUrl = (tex: THREE.CanvasTexture): string | null =>
    tex.userData.custom ? tex.image.toDataURL('image/png') : null

  return {
    id: comp.id,
    name: comp.name,
    group: comp.group,
    fade: mat.fade,
    restoreMask: canvasHasContent(comp.restoreCanvas) ? comp.restoreCanvas.toDataURL('image/png') : null,
    surfaceDataUrl: customDataUrl(surfaceTex),
    baseDataUrl: customDataUrl(baseTex),
    fadeMaskDataUrl: customDataUrl(fadeMaskTex)
  }
}

export function buildConfig(
  components: SceneComponent[],
  meta: Pick<ProjectConfig, 'globalFade' | 'layerMode' | 'brushSize' | 'brushHardness' | 'brushStrength'>
): ProjectConfig {
  return {
    format: 'caihua-fade-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...meta,
    components: components.map(serializeComponent)
  }
}

/** 把 dataURL 遮罩绘制到修复画布 */
export async function applyRestoreMask(comp: SceneComponent, dataUrl: string): Promise<void> {
  const img = await loadDataUrl(dataUrl)
  const ctx = comp.restoreCanvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
  ctx.drawImage(img, 0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
  comp.restoreTexture.needsUpdate = true
}

/**
 * 按配置恢复构件状态。
 * 匹配优先级：id → 名称；缺失的纹理层回退为程序化默认纹理。
 * 返回未匹配上的配置项名称。
 */
export async function applyConfig(components: SceneComponent[], config: ProjectConfig): Promise<string[]> {
  const unmatched: string[] = []

  for (const cc of config.components) {
    const comp = components.find((c) => c.id === cc.id) ?? components.find((c) => c.name === cc.name)
    if (!comp) {
      unmatched.push(cc.name)
      continue
    }

    comp.material.setFade(cc.fade)

    if (cc.restoreMask) {
      await applyRestoreMask(comp, cc.restoreMask)
    } else {
      const ctx = comp.restoreCanvas.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, comp.restoreCanvas.width, comp.restoreCanvas.height)
      comp.restoreTexture.needsUpdate = true
    }

    if (cc.surfaceDataUrl) {
      comp.material.setSurfaceTexture(textureFromImage(await loadDataUrl(cc.surfaceDataUrl), true))
    }
    if (cc.baseDataUrl) {
      comp.material.setBaseTexture(textureFromImage(await loadDataUrl(cc.baseDataUrl), true))
    }
    if (cc.fadeMaskDataUrl) {
      comp.material.setFadeMaskTexture(textureFromImage(await loadDataUrl(cc.fadeMaskDataUrl), false))
    }
  }

  return unmatched
}

/** 校验配置文件结构 */
export function validateConfig(json: unknown): ProjectConfig {
  const cfg = json as ProjectConfig
  if (!cfg || cfg.format !== 'caihua-fade-studio' || !Array.isArray(cfg.components)) {
    throw new Error('配置文件格式不正确：缺少 format 标识或 components 数组')
  }
  if (cfg.version !== 1) throw new Error(`不支持的配置版本: ${cfg.version}`)
  return cfg
}

/** 为尚未在当前模型中创建的配置项生成兜底构件纹理（仅在需要扩展模型时使用，当前保留接口） */
export function fallbackTextures(seed: string) {
  const restore = makeRestoreLayer()
  return {
    surface: makeSurfaceTexture(seed),
    base: makeBaseTexture(seed),
    fadeMask: makeFadeMaskTexture(seed),
    restore
  }
}
