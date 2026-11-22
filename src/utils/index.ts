/** 通用工具函数 */

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** 读取图片文件为 HTMLImageElement */
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`图片加载失败: ${file.name}`))
    }
    img.src = url
  })
}

/** 读取文本文件 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(file)
    reader.onerror = () => reject(reader.error)
  })
}

/** 生成短 id */
export function shortId(prefix = 'c'): string {
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rnd}`
}

/** 数值夹取 */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** 格式化时间戳为可读字符串 */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Canvas 转 dataURL（小尺寸遮罩用，质量/体积平衡） */
export function canvasToDataURL(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): string {
  return canvas.toDataURL(type, quality)
}

/** dataURL 载入为 HTMLImageElement */
export function loadDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('dataURL 图片解码失败'))
    img.src = dataUrl
  })
}
