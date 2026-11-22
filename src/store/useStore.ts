import { computed, reactive, readonly, shallowRef } from 'vue'
import type { LayerMode, PerfStats, ProjectConfig, ProjectRecord, SceneComponent, ToolType } from '../types'
import { SceneEngine } from '../core/SceneEngine'
import { buildDemoModel } from '../core/ModelBuilder'
import { textureFromImage } from '../core/TextureFactory'
import { idb } from '../db/idb'
import { applyConfig, buildConfig, validateConfig } from '../io/serialize'
import { downloadBlob, loadImageFile, readTextFile, shortId } from '../utils'

const AUTOSAVE_KEY = 'autosave'
const AUTOSAVE_DEBOUNCE_MS = 1500

interface StoreState {
  ready: boolean
  tool: ToolType
  globalFade: number
  layerMode: LayerMode
  brushSize: number
  brushHardness: number
  brushStrength: number
  selectedId: string | null
  canUndo: boolean
  canRedo: boolean
  historyDepth: number
  perf: PerfStats
  projects: ProjectRecord[]
  statusMessage: string
  busy: boolean
}

const state = reactive<StoreState>({
  ready: false,
  tool: 'orbit',
  globalFade: 0,
  layerMode: 'both',
  brushSize: 3,
  brushHardness: 0.6,
  brushStrength: 0.6,
  selectedId: null,
  canUndo: false,
  canRedo: false,
  historyDepth: 0,
  perf: { fps: 0, frameMs: 0, brushLatencyMs: 0 },
  projects: [],
  statusMessage: '',
  busy: false
})

const engineRef = shallowRef<SceneEngine | null>(null)
const componentsRef = shallowRef<SceneComponent[]>([])
const componentVersion = reactive({ n: 0 }) // 构件列表结构性变化计数器
const fadeTick = reactive({ n: 0 }) // 任何褪色值变化计数器，驱动滑块 UI 刷新
let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let statusTimer: ReturnType<typeof setTimeout> | null = null

function flash(message: string): void {
  state.statusMessage = message
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (state.statusMessage = ''), 3200)
}

function scheduleAutosave(): void {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    void saveProject(AUTOSAVE_KEY, '自动保存', true).catch(() => undefined)
  }, AUTOSAVE_DEBOUNCE_MS)
}

function refreshHistoryFlags(): void {
  const engine = engineRef.value
  if (!engine) return
  state.canUndo = engine.brush.canUndo
  state.canRedo = engine.brush.canRedo
  state.historyDepth = engine.brush.historyDepth
}

// ---------------------------------------------------------------- 初始化

async function init(container: HTMLElement): Promise<void> {
  const engine = new SceneEngine(container)
  engineRef.value = engine
  // 自动化测试/控制台调试入口（生产环境无副作用）
  ;(window as unknown as Record<string, unknown>).__engine = engine

  engine.onPerf = (stats) => {
    state.perf.fps = stats.fps
    state.perf.frameMs = stats.frameMs
    state.perf.brushLatencyMs = stats.brushLatencyMs
  }

  const { group, components } = buildDemoModel()
  componentsRef.value = components
  engine.setComponents(components, group)
  engine.setLayerMode(state.layerMode)
  engine.brush.setSettings({
    size: state.brushSize,
    hardness: state.brushHardness,
    strength: state.brushStrength
  })
  engine.brush.setHistoryCallbacks({
    onHistoryChange: refreshHistoryFlags,
    onStroke: scheduleAutosave
  })

  state.ready = true
  componentVersion.n++
  await refreshProjectList()

  // 启动时恢复上次自动保存
  try {
    const saved = await idb.get<ProjectRecord>(AUTOSAVE_KEY)
    if (saved) {
      await applyProject(saved)
      flash('已恢复上次自动保存的工作状态')
    }
  } catch {
    /* 自动保存损坏时静默使用默认场景 */
  }
}

// ---------------------------------------------------------------- 选择 / 工具

function selectComponent(id: string | null): void {
  state.selectedId = id
  engineRef.value?.select(id)
}

function setTool(tool: ToolType): void {
  state.tool = tool
  engineRef.value?.setBrushMode(tool === 'brush')
  if (tool === 'orbit') selectComponent(null)
}

// ---------------------------------------------------------------- 褪色控制

function setGlobalFade(value: number): void {
  state.globalFade = value
  engineRef.value?.setAllFade(value / 100)
  fadeTick.n++
  scheduleAutosave()
}

function setComponentFade(id: string, value: number): void {
  engineRef.value?.setFade(id, value / 100)
  fadeTick.n++
  scheduleAutosave()
}

function setGroupFade(group: string, value: number): void {
  const engine = engineRef.value
  if (!engine) return
  for (const comp of engine.getComponents()) {
    if (comp.group === group) engine.setFade(comp.id, value / 100)
  }
  fadeTick.n++
  scheduleAutosave()
}

function getComponentFade(id: string): number {
  const comp = engineRef.value?.getComponent(id)
  return comp ? comp.material.fade * 100 : 0
}

function getGroupAverageFade(group: string): number {
  const list = engineRef.value?.getComponents().filter((c) => c.group === group) ?? []
  if (!list.length) return 0
  return (list.reduce((sum, c) => sum + c.material.fade, 0) / list.length) * 100
}

// ---------------------------------------------------------------- 分层 / 笔刷

function setLayerMode(mode: LayerMode): void {
  state.layerMode = mode
  engineRef.value?.setLayerMode(mode)
  scheduleAutosave()
}

function setBrushSetting(patch: Partial<Pick<StoreState, 'brushSize' | 'brushHardness' | 'brushStrength'>>): void {
  Object.assign(state, patch)
  engineRef.value?.brush.setSettings({
    size: state.brushSize,
    hardness: state.brushHardness,
    strength: state.brushStrength
  })
}

function undo(): void {
  engineRef.value?.brush.undo()
  refreshHistoryFlags()
  scheduleAutosave()
}

function redo(): void {
  engineRef.value?.brush.redo()
  refreshHistoryFlags()
  scheduleAutosave()
}

function clearRestore(componentId?: string): void {
  engineRef.value?.brush.clear(componentId)
  refreshHistoryFlags()
}

// ---------------------------------------------------------------- 纹理绑定

async function bindTexture(componentId: string, kind: 'surface' | 'base' | 'fadeMask', file: File): Promise<void> {
  const img = await loadImageFile(file)
  const tex = textureFromImage(img, kind !== 'fadeMask')
  engineRef.value?.replaceTexture(componentId, kind, tex)
  flash(`已为构件绑定${kind === 'surface' ? '表层' : kind === 'base' ? '底层' : '褪色遮罩'}纹理`)
  scheduleAutosave()
}

// ---------------------------------------------------------------- 模型导入

async function importModel(file: File): Promise<void> {
  const engine = engineRef.value
  if (!engine) return
  state.busy = true
  try {
    const built = await engine.loadGlb(file)
    componentsRef.value = built
    componentVersion.n++
    engine.setAllFade(state.globalFade / 100)
    engine.setLayerMode(state.layerMode)
    selectComponent(null)
    refreshHistoryFlags()
    flash(`模型导入成功，共 ${built.length} 个构件`)
    scheduleAutosave()
  } catch (err) {
    flash(`模型导入失败: ${(err as Error).message}`)
  } finally {
    state.busy = false
  }
}

// ---------------------------------------------------------------- 配置 / 截图

function currentConfig(): ProjectConfig {
  const engine = engineRef.value
  if (!engine) throw new Error('引擎未初始化')
  return buildConfig(engine.getComponents(), {
    globalFade: state.globalFade,
    layerMode: state.layerMode,
    brushSize: state.brushSize,
    brushHardness: state.brushHardness,
    brushStrength: state.brushStrength
  })
}

async function exportConfig(): Promise<void> {
  const config = currentConfig()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `caihua-config-${Date.now()}.json`)
  flash('褪色配置文件已导出')
}

async function exportScreenshot(): Promise<void> {
  const engine = engineRef.value
  if (!engine) return
  const dataUrl = engine.screenshot()
  const blob = await (await fetch(dataUrl)).blob()
  downloadBlob(blob, `caihua-view-${Date.now()}.png`)
  flash('当前视图截图已导出')
}

async function importConfig(file: File): Promise<void> {
  state.busy = true
  try {
    const json = JSON.parse(await readTextFile(file)) as unknown
    const config = validateConfig(json)
    const engine = engineRef.value
    if (!engine) return
    const unmatched = await applyConfig(engine.getComponents(), config)

    state.globalFade = config.globalFade
    state.layerMode = config.layerMode
    state.brushSize = config.brushSize
    state.brushHardness = config.brushHardness
    state.brushStrength = config.brushStrength
    engine.setLayerMode(config.layerMode)
    engine.brush.setSettings({
      size: config.brushSize,
      hardness: config.brushHardness,
      strength: config.brushStrength
    })
    fadeTick.n++
    refreshHistoryFlags()
    flash(unmatched.length ? `配置已导入，${unmatched.length} 个构件未匹配: ${unmatched.join('、')}` : '配置已导入，构件褪色状态已恢复')
    scheduleAutosave()
  } catch (err) {
    flash(`配置导入失败: ${(err as Error).message}`)
  } finally {
    state.busy = false
  }
}

/** 拖拽入口：按扩展名分流模型 / 配置 */
async function handleDropFile(file: File): Promise<void> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) await importModel(file)
  else if (lower.endsWith('.json')) await importConfig(file)
  else flash('仅支持 .glb / .gltf 模型与 .json 配置文件')
}

// ---------------------------------------------------------------- IndexedDB 项目

async function saveProject(key: string, name: string, silent = false): Promise<void> {
  const engine = engineRef.value
  if (!engine) return
  const config = currentConfig()
  const thumbnail = engine.screenshot()
  const record: ProjectRecord = {
    ...config,
    key,
    name,
    savedAt: Date.now(),
    thumbnail
  }
  await idb.put(record)
  await refreshProjectList()
  if (!silent) flash(`项目「${name}」已保存到本地 IndexedDB`)
}

async function saveNamedProject(name: string): Promise<void> {
  await saveProject(shortId('proj'), name || '未命名项目')
}

async function applyProject(record: ProjectRecord): Promise<void> {
  const engine = engineRef.value
  if (!engine) return
  state.busy = true
  try {
    await applyConfig(engine.getComponents(), record)
    state.globalFade = record.globalFade
    state.layerMode = record.layerMode
    state.brushSize = record.brushSize
    state.brushHardness = record.brushHardness
    state.brushStrength = record.brushStrength
    engine.setLayerMode(record.layerMode)
    engine.brush.setSettings({
      size: record.brushSize,
      hardness: record.brushHardness,
      strength: record.brushStrength
    })
    fadeTick.n++
    refreshHistoryFlags()
  } finally {
    state.busy = false
  }
}

async function openProject(key: string): Promise<void> {
  const record = await idb.get<ProjectRecord>(key)
  if (!record) return
  await applyProject(record)
  flash(`已打开项目「${record.name}」`)
}

async function deleteProject(key: string): Promise<void> {
  await idb.delete(key)
  await refreshProjectList()
  flash('项目已删除')
}

async function refreshProjectList(): Promise<void> {
  const all = await idb.getAll<ProjectRecord>()
  state.projects = all
    .filter((r) => r.key !== AUTOSAVE_KEY)
    .sort((a, b) => b.savedAt - a.savedAt)
}

// ---------------------------------------------------------------- 派生数据

const groups = computed(() => {
  void componentVersion.n
  const map = new Map<string, string[]>()
  for (const comp of componentsRef.value) {
    const list = map.get(comp.group) ?? []
    list.push(comp.id)
    map.set(comp.group, list)
  }
  return [...map.entries()].map(([group, ids]) => ({ group, ids }))
})

const components = computed(() => {
  void componentVersion.n
  return componentsRef.value
})

/** 供滑块组件建立响应式依赖 */
const fadeVersion = computed(() => fadeTick.n)

export function useStore() {
  return {
    state: readonly(state),
    groups,
    components,
    fadeVersion,
    init,
    selectComponent,
    setTool,
    setGlobalFade,
    setComponentFade,
    setGroupFade,
    getComponentFade,
    getGroupAverageFade,
    setLayerMode,
    setBrushSetting,
    undo,
    redo,
    clearRestore,
    bindTexture,
    importModel,
    exportConfig,
    exportScreenshot,
    importConfig,
    handleDropFile,
    saveNamedProject,
    openProject,
    deleteProject,
    refreshProjectList
  }
}
