import type { ExplodeState } from '../model/types'

/**
 * 导出模块：把当前拆解状态序列化为 JSON 文件下载，
 * 并支持读回文件复原。记录内容：
 *  - 各级展开因子 factors
 *  - 全局平移距离 globalDistance
 *  - 单件观察状态 observe
 *  - 每个零件的相对位移 offset 与世界坐标 worldPosition
 */
export class StateExporter {
  private static readonly FILE_PREFIX = 'rc-car-explode-state'

  download(state: ExplodeState): void {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = state.exportedAt.replace(/[:.]/g, '-').slice(0, 19)
    a.href = url
    a.download = `${StateExporter.FILE_PREFIX}-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async pickAndRead(): Promise<ExplodeState> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.style.display = 'none'
      document.body.appendChild(input)
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) {
          reject(new Error('未选择文件'))
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const data = JSON.parse(String(reader.result)) as ExplodeState
            if (data.version !== 1 || !Array.isArray(data.parts)) {
              throw new Error('文件格式不兼容')
            }
            resolve(data)
          } catch (e) {
            reject(e instanceof Error ? e : new Error('解析失败'))
          } finally {
            input.remove()
          }
        }
        reader.onerror = () => {
          input.remove()
          reject(new Error('文件读取失败'))
        }
        reader.readAsText(file)
      }
      input.click()
    })
  }
}
