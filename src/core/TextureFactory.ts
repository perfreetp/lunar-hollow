import * as THREE from 'three'

/**
 * 程序化古建彩画纹理工厂
 *
 * 生成三类 512x512 纹理：
 *  - 表层颜料：朱红/石青/石绿/描金的彩画图案（sRGB）
 *  - 底层纹样：同构墨线稿，alpha 通道即墨线覆盖率（sRGB + 透明）
 *  - 褪色遮罩：径向斑块 + 噪点的灰度图，控制不均匀老化（线性）
 */

export const TEX_SIZE = 512
export const RESTORE_SIZE = 512

/** 确定性随机数，保证同一构件每次生成相同纹理 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 传统彩画配色组 */
const PALETTES: Array<Record<string, string>> = [
  { vermilion: '#9e2b25', azurite: '#2c5f8a', malachite: '#3f7d5e', gold: '#d4a84b', ground: '#e8dcc3' },
  { vermilion: '#a83c2a', azurite: '#274b7a', malachite: '#4a8069', gold: '#c99b3e', ground: '#efe3c8' },
  { vermilion: '#8f2f28', azurite: '#33507e', malachite: '#356b55', gold: '#e0b65a', ground: '#e2d4b8' }
]

function drawRosette(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rand: () => number): void {
  const petals = 8
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2
    ctx.save()
    ctx.translate(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  // 随机点缀，让每个构件纹样略有差异
  if (rand() > 0.4) {
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.12, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawScrolls(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number): void {
  ctx.lineWidth = 5
  ctx.beginPath()
  const rows = 3
  for (let r = 0; r < rows; r++) {
    const y = (h / (rows + 1)) * (r + 1)
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += 32) {
      const yy = y + Math.sin(x / 42 + r * 1.7 + rand() * 0.2) * 14
      ctx.lineTo(x, yy)
    }
  }
  ctx.stroke()
}

/** 绘制彩画布局，ink=true 时只画线稿（底层纹样） */
function paintLayout(canvas: HTMLCanvasElement, seedStr: string, ink: boolean): HTMLCanvasElement {
  const size = TEX_SIZE
  const rand = mulberry32(hashSeed(seedStr))
  const palette = PALETTES[Math.floor(rand() * PALETTES.length)]
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  if (ink) {
    // 底层：暖灰地 + 深墨线
    ctx.fillStyle = 'rgba(232,224,205,1)'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(38,30,22,0.92)'
    ctx.fillStyle = 'rgba(38,30,22,0.88)'
  } else {
    ctx.fillStyle = palette.ground
    ctx.fillRect(0, 0, size, size)
  }

  const band = size * 0.09
  // 外框色带
  if (!ink) {
    ctx.fillStyle = palette.vermilion
    ctx.fillRect(0, 0, size, band)
    ctx.fillRect(0, size - band, size, band)
    ctx.fillRect(0, 0, band, size)
    ctx.fillRect(size - band, 0, band, size)
    ctx.fillStyle = palette.gold
    ctx.fillRect(band * 0.8, band * 0.8, size - band * 1.6, band * 0.28)
    ctx.fillRect(band * 0.8, size - band * 1.08, size - band * 1.6, band * 0.28)
  }
  ctx.lineWidth = ink ? 4 : 3
  ctx.strokeStyle = ink ? 'rgba(38,30,22,0.9)' : palette.gold
  ctx.strokeRect(band * 0.45, band * 0.45, size - band * 0.9, size - band * 0.9)
  ctx.strokeRect(band * 1.25, band * 1.25, size - band * 2.5, size - band * 2.5)

  // 卷草纹带
  ctx.strokeStyle = ink ? 'rgba(38,30,22,0.75)' : palette.azurite
  drawScrolls(ctx, size, size, rand)

  // 中央藻头/团花
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.2
  ctx.fillStyle = ink ? 'rgba(38,30,22,0.85)' : palette.azurite
  drawRosette(ctx, cx, cy, r, rand)
  ctx.fillStyle = ink ? 'rgba(38,30,22,0.9)' : palette.gold
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2)
  ctx.fill()

  // 四角旋子花纹
  const corner = size * 0.19
  const corners: Array<[number, number]> = [
    [corner, corner],
    [size - corner, corner],
    [corner, size - corner],
    [size - corner, size - corner]
  ]
  for (const [x, y] of corners) {
    ctx.fillStyle = ink ? 'rgba(38,30,22,0.8)' : palette.malachite
    drawRosette(ctx, x, y, size * 0.085, rand)
  }

  // 描金点缀（表层）/ 墨点（底层）
  ctx.fillStyle = ink ? 'rgba(38,30,22,0.6)' : palette.vermilion
  for (let i = 0; i < 26; i++) {
    const x = band * 1.6 + rand() * (size - band * 3.2)
    const y = band * 1.6 + rand() * (size - band * 3.2)
    ctx.beginPath()
    ctx.arc(x, y, 3 + rand() * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  return canvas
}

function makeCanvas(size = TEX_SIZE): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return c
}

export function makeSurfaceTexture(seed: string): THREE.CanvasTexture {
  const canvas = paintLayout(makeCanvas(), seed, false)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function makeBaseTexture(seed: string): THREE.CanvasTexture {
  const canvas = paintLayout(makeCanvas(), seed, true)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** 褪色遮罩：整体偏高的灰度 + 随机老化斑块 + 细噪点，越暗表示越容易褪色 */
export function makeFadeMaskTexture(seed: string): THREE.CanvasTexture {
  const rand = mulberry32(hashSeed(seed + '::mask'))
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#d6d6d6' // 0.84 基础褪色敏感度
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)

  // 径向老化斑块
  for (let i = 0; i < 7; i++) {
    const x = rand() * TEX_SIZE
    const y = rand() * TEX_SIZE
    const radius = 60 + rand() * 150
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
    const v = Math.floor(90 + rand() * 70)
    g.addColorStop(0, `rgba(${v},${v},${v},0.9)`)
    g.addColorStop(1, 'rgba(214,214,214,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
  }

  // 细噪点
  const img = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 28
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = img.data[i]
    img.data[i + 2] = img.data[i]
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** 修复遮罩画布（全黑 = 无修复），同时返回 CanvasTexture */
export function makeRestoreLayer(): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = makeCanvas(RESTORE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, RESTORE_SIZE, RESTORE_SIZE)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.NoColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  return { canvas, texture }
}

/** 从 HTMLImageElement 生成 sRGB 贴图（用户上传的自定义纹理，打 custom 标记用于序列化） */
export function textureFromImage(img: HTMLImageElement, srgb = true): THREE.CanvasTexture {
  const canvas = makeCanvas()
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.userData.custom = true
  return tex
}

/** 从 dataURL 生成线性灰度贴图（褪色/修复遮罩用） */
export async function maskTextureFromDataUrl(dataUrl: string): Promise<THREE.CanvasTexture> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('遮罩图片解码失败'))
    i.src = dataUrl
  })
  const tex = textureFromImage(img, false)
  return tex
}
