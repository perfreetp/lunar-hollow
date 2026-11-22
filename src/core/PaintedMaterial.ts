import * as THREE from 'three'
import type { LayerMode } from '../types'

/**
 * 彩画材质
 *
 * 在 MeshStandardMaterial 的 PBR 光照管线之前注入自定义片段着色，
 * 实现「底层纹样 + 表层颜料 + 褪色遮罩 + 修复遮罩」的分层混合：
 *
 *   effectiveFade = fade * (1 - restore) * fadeMask.r
 *   - both   : 表层颜料向老化色衰减，并按有效褪色度逐渐透出底层纹样
 *   - surface: 只显示表层颜料（仍按褪色度老化）
 *   - base   : 只显示底层纹样（墨线稿）
 *
 * 混合结果写入 diffuseColor，后续仍走标准 PBR 光照，保证三维体积感。
 */

const VERTEX_PARS = /* glsl */ `
varying vec2 vCaihuaUV;
`

const VERTEX_MAIN = /* glsl */ `
vCaihuaUV = uv;
`

const FRAGMENT_PARS = /* glsl */ `
varying vec2 vCaihuaUV;
uniform sampler2D uSurfaceTex;
uniform sampler2D uBaseTex;
uniform sampler2D uFadeMask;
uniform sampler2D uRestoreMask;
uniform float uFade;
uniform float uLayerMode;
uniform vec3 uAgedColor;

// 自带 sRGB 解码，避免依赖 three.js 按条件编译的 sRGBToLinear 声明
vec3 caihuaSRGBToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}
`

/** 替换内置 map_fragment 片段 */
const FRAGMENT_MAP = /* glsl */ `
#ifdef USE_MAP
  vec4 surfRaw = texture2D(uSurfaceTex, vCaihuaUV);
  vec3 surfCol = caihuaSRGBToLinear(surfRaw.rgb);

  vec4 baseRaw = texture2D(uBaseTex, vCaihuaUV);
  vec3 baseCol = caihuaSRGBToLinear(baseRaw.rgb);
  float baseInk = baseRaw.a;

  float fadeMask = texture2D(uFadeMask, vCaihuaUV).r;
  float restore = texture2D(uRestoreMask, vCaihuaUV).r;

  // 修复区域局部降低褪色程度，clamp 到 [0,1]
  float effectiveFade = clamp(uFade * (1.0 - restore) * fadeMask, 0.0, 1.0);

  // 表层颜料老化（向灰木色衰减）
  vec3 agedSurface = mix(surfCol, uAgedColor, effectiveFade * 0.85);

  vec3 finalColor;
  if (uLayerMode < 0.5) {
    // 双层：老化表层 + 随褪色显现的底层墨线纹样
    vec3 baseLayer = mix(uAgedColor, baseCol, baseInk);
    finalColor = mix(agedSurface, baseLayer, effectiveFade * baseInk);
  } else if (uLayerMode < 1.5) {
    // 仅底层纹样
    finalColor = mix(vec3(0.78, 0.74, 0.66), baseCol, baseInk);
  } else {
    // 仅表层颜料
    finalColor = agedSurface;
  }

  diffuseColor = vec4(finalColor, opacity);
#endif
`

export interface PaintedMaterialOptions {
  surface: THREE.Texture
  base: THREE.Texture
  fadeMask: THREE.Texture
  restore: THREE.CanvasTexture
  agedColor?: THREE.Color
}

export class PaintedMaterial extends THREE.MeshStandardMaterial {
  readonly uniforms: {
    uSurfaceTex: { value: THREE.Texture }
    uBaseTex: { value: THREE.Texture }
    uFadeMask: { value: THREE.Texture }
    uRestoreMask: { value: THREE.Texture }
    uFade: { value: number }
    uLayerMode: { value: number }
    uAgedColor: { value: THREE.Color }
  }

  /** onBeforeCompile 后 three.js 实际绑定到 GPU 程序的 uniforms（每程序一份） */
  private shaderRefs = new Set<THREE.WebGLProgramParametersWithUniforms['uniforms']>()

  constructor(opts: PaintedMaterialOptions) {
    super({
      map: opts.surface, // 保证 USE_UV / map 管线启用
      roughness: 0.82,
      metalness: 0.02
    })

    this.uniforms = {
      uSurfaceTex: { value: opts.surface },
      uBaseTex: { value: opts.base },
      uFadeMask: { value: opts.fadeMask },
      uRestoreMask: { value: opts.restore },
      uFade: { value: 0 },
      uLayerMode: { value: 0 },
      uAgedColor: {
        value: (opts.agedColor ?? new THREE.Color('#b9ac92')).clone()
      }
    }

    this.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${VERTEX_PARS}`)
        .replace('#include <uv_vertex>', `#include <uv_vertex>\n${VERTEX_MAIN}`)

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <map_pars_fragment>', `#include <map_pars_fragment>\n${FRAGMENT_PARS}`)
        .replace('#include <map_fragment>', FRAGMENT_MAP)

      // 逐个注入 uniform 对象引用：后续直接改 this.uniforms.xxx.value
      // 即可同步到 GPU（同一材质可能被多个 program 编译，全部登记）
      for (const key of Object.keys(this.uniforms)) {
        shader.uniforms[key] = this.uniforms[key as keyof typeof this.uniforms]
      }
      this.shaderRefs.add(shader.uniforms)
      // 留存最终 shader 源码，便于调试与自动化验证
      this.debugFragmentShader = shader.fragmentShader
      this.debugVertexShader = shader.vertexShader
    }
  }

  /** 调试用：onBeforeCompile 生成的最终 shader 源码 */
  debugFragmentShader = ''
  debugVertexShader = ''

  /** 同步值到所有已编译 program（数值类 uniform 变更保险通道） */
  private syncUniform(key: keyof typeof this.uniforms): void {
    const entry = this.uniforms[key]
    for (const u of this.shaderRefs) {
      if (u[key]) u[key].value = entry.value
    }
  }

  setFade(v: number): void {
    this.uniforms.uFade.value = v
    this.syncUniform('uFade')
  }

  setLayerMode(mode: LayerMode): void {
    this.uniforms.uLayerMode.value = mode === 'base' ? 1 : mode === 'surface' ? 2 : 0
    this.syncUniform('uLayerMode')
  }

  setRestoreTexture(tex: THREE.CanvasTexture): void {
    // 修复遮罩纹理在材质生命周期内保持同一对象，仅通过 needsUpdate 刷新内容；
    // 替换对象会导致 GPU program 仍引用旧纹理
    if (this.uniforms.uRestoreMask.value === tex) return
    this.uniforms.uRestoreMask.value = tex
    this.syncUniform('uRestoreMask')
  }

  setSurfaceTexture(tex: THREE.Texture): void {
    this.uniforms.uSurfaceTex.value = tex
    this.syncUniform('uSurfaceTex')
    this.map = tex
    this.needsUpdate = true
  }

  setBaseTexture(tex: THREE.Texture): void {
    this.uniforms.uBaseTex.value = tex
    this.syncUniform('uBaseTex')
  }

  setFadeMaskTexture(tex: THREE.Texture): void {
    this.uniforms.uFadeMask.value = tex
    this.syncUniform('uFadeMask')
  }

  get fade(): number {
    return this.uniforms.uFade.value
  }
}
