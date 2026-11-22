<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import type { AssemblyNode, ExplodeState } from './model/types'
import { ModelLoader, type ModelData } from './model/ModelLoader'
import { findNode } from './model/tree'
import { ViewerScene } from './three/ViewerScene'
import { StateExporter } from './three/StateExporter'
import { selectionStore, setSelectedId } from './store/selection'
import TreeView from './components/TreeView.vue'
import ControlPanel from './components/ControlPanel.vue'

const viewHost = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const loadError = ref('')
const toast = ref('')
const totalParts = ref(0)
const fps = ref(0)

const modelData = shallowRef<ModelData | null>(null)
const tree = shallowRef<AssemblyNode | null>(null)
let viewer: ViewerScene | null = null
const exporter = new StateExporter()
let toastTimer = 0

const selectedNode = computed<AssemblyNode | null>(() => {
  if (!tree.value || !selectionStore.selectedId) return null
  return findNode(tree.value, selectionStore.selectedId)
})

const globalDistance = ref(1)
const markersVisible = ref(true)
/** 因子版本号：引擎内 Map 非响应式，变化时自增以驱动树徽标/面板重渲染 */
const factorTick = ref(0)

function bumpFactors(): void {
  factorTick.value++
}

const observeInfo = ref<{ part: string; connections: { id: string; label: string; markerType: string }[]; neighbors: number }>({
  part: '',
  connections: [],
  neighbors: 0,
})

function showToast(msg: string): void {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 2400)
}

onMounted(async () => {
  try {
    const data = await new ModelLoader().loadProgrammatic()
    modelData.value = data
    tree.value = data.tree
    totalParts.value = data.totalParts
    if (!viewHost.value) throw new Error('视图容器未就绪')
    viewer = new ViewerScene(viewHost.value, data)
    globalDistance.value = viewer.engine.globalDistance
    loading.value = false
    startFpsMeter()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e)
    loading.value = false
  }
})

// FPS 采样（验证 300 零件流畅度）
let frames = 0
let lastFpsTime = performance.now()
function startFpsMeter(): void {
  const tick = (): void => {
    frames++
    const now = performance.now()
    if (now - lastFpsTime >= 1000) {
      fps.value = Math.round((frames * 1000) / (now - lastFpsTime))
      frames = 0
      lastFpsTime = now
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// 选择变化 -> 观察信息面板联动
watch(
  () => selectionStore.selectedId,
  (id) => {
    if (!viewer || !id) {
      observeInfo.value = { part: '', connections: [], neighbors: 0 }
      return
    }
    // 选中别的零件时退出已有观察
    if (selectionStore.observeId && selectionStore.observeId !== id) {
      viewer.observation.exit()
      selectionStore.observeId = null
    }
    const node = findNode(modelData.value!.tree, id)
    if (node?.part) {
      observeInfo.value = {
        part: node.part.name,
        connections: node.part.connections.map((c) => ({ id: c.id, label: c.label, markerType: c.markerType })),
        neighbors: node.parent?.children.filter((n) => n !== node && n.part).length ?? 0,
      }
    } else {
      observeInfo.value = { part: '', connections: [], neighbors: 0 }
    }
  },
)

// ------------------------------------------------------------- 面板事件
function factorOf(id: string): number {
  void factorTick.value // 建立响应式依赖
  return viewer?.engine.getFactor(findNode(modelData.value!.tree, id)!) ?? 0
}

function onSetFactor(node: AssemblyNode, factor: number): void {
  viewer?.engine.setFactor(node, factor)
  bumpFactors()
}

function onSetGlobalDistance(v: number): void {
  globalDistance.value = v
  if (!viewer) return
  viewer.engine.globalDistance = v
  viewer.engine.recomputeAll()
}

function onResetAll(): void {
  viewer?.engine.resetAll()
  bumpFactors()
  if (viewer && selectionStore.observeId) {
    viewer.observation.exit()
    selectionStore.observeId = null
  }
  showToast('已回装复位')
}

function onExpandAll(): void {
  viewer?.engine.expandAll(1)
  bumpFactors()
  showToast('全部装配级已展开')
}

function onFocus(node: AssemblyNode): void {
  viewer?.focusNode(node.id)
}

function onEnterObserve(axis: 'x' | 'y' | 'z'): void {
  const id = selectionStore.selectedId
  if (!viewer || !id) return
  selectionStore.observeId = id
  viewer.observation.enter(id, axis, selectionStore.observeDistance)
  observeInfo.value = viewer.observation.describeActive()
  showToast(`单件观察：沿 ${axis.toUpperCase()} 轴拉出`)
}

function onExitObserve(): void {
  viewer?.observation.exit()
  selectionStore.observeId = null
}

function onSetObserveDistance(v: number): void {
  viewer?.observation.setDistance(selectionStore.observeAxis, v)
}

function onToggleLabels(v: boolean): void {
  selectionStore.labelsVisible = v
  viewer?.setLabelsVisible(v)
}

function onToggleMarkers(v: boolean): void {
  markersVisible.value = v
  selectionStore.markersVisible = v
  viewer?.setMarkersVisible(v)
}

async function onExportState(): Promise<void> {
  if (!viewer) return
  const state = viewer.engine.serialize(
    selectionStore.observeId,
    selectionStore.observeAxis,
    selectionStore.observeDistance,
  )
  exporter.download(state)
  showToast(`已导出 ${state.totalParts} 个零件的拆解状态`)
}

async function onImportState(): Promise<void> {
  if (!viewer) return
  try {
    const state: ExplodeState = await exporter.pickAndRead()
    const { observe } = viewer.engine.restore(state)
    bumpFactors()
    globalDistance.value = state.globalDistance
    if (observe.partId && findNode(modelData.value!.tree, observe.partId)?.part) {
      selectionStore.observeAxis = observe.axis
      selectionStore.observeDistance = observe.distance
      selectionStore.observeId = observe.partId
      setSelectedId(observe.partId)
      viewer.observation.enter(observe.partId, observe.axis, observe.distance)
      observeInfo.value = viewer.observation.describeActive()
    }
    showToast(`已复原拆解状态（${state.totalParts} 个零件）`)
  } catch (e) {
    showToast(e instanceof Error ? `导入失败：${e.message}` : '导入失败')
  }
}

function resetCamera(): void {
  viewer?.focusNode('car')
}

// 观察轴切换时同步 store（ControlPanel 内 watch 已处理 enter，这里做保险）
watch(
  () => selectionStore.observeAxis,
  () => {},
)
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>遥控玩具车 · 结构拆解工具</h1>
      <span class="stat">零件总数 <strong style="color: var(--accent)">{{ totalParts }}</strong></span>
      <span class="stat">帧率 <strong :style="{ color: fps >= 50 ? 'var(--ok)' : 'var(--warn)' }">{{ fps }} FPS</strong></span>
      <span class="spacer"></span>
      <span class="stat">Three.js r169 · Vue 3 · TypeScript</span>
    </header>

    <TreeView
      v-if="tree"
      :tree="tree"
      :factor-of="factorOf"
      :on-focus="onFocus"
      @select="() => {}"
    />

    <main class="pane-view">
      <div ref="viewHost" style="position: absolute; inset: 0"></div>
      <div v-if="loading" class="viewer-empty">正在装配遥控车模型…</div>
      <div v-else-if="loadError" class="viewer-empty" style="color: #ff8fa0">加载失败：{{ loadError }}</div>
      <div v-else class="view-toolbar">
        <button class="btn" @click="resetCamera">整车视角</button>
        <button class="btn" @click="onExpandAll">全展开</button>
        <button class="btn danger" @click="onResetAll">回装</button>
      </div>
      <div v-if="toast" class="toast">{{ toast }}</div>
    </main>

    <ControlPanel
      v-if="tree"
      :tree="tree"
      :selected-node="selectedNode"
      :factor-of="factorOf"
      :global-distance="globalDistance"
      :observe-info="observeInfo"
      :markers-visible="markersVisible"
      @set-factor="onSetFactor"
      @set-global-distance="onSetGlobalDistance"
      @reset-all="onResetAll"
      @expand-all="onExpandAll"
      @enter-observe="onEnterObserve"
      @exit-observe="onExitObserve"
      @set-observe-distance="onSetObserveDistance"
      @toggle-labels="onToggleLabels"
      @toggle-markers="onToggleMarkers"
      @export-state="onExportState"
      @import-state="onImportState"
    />
  </div>
</template>
