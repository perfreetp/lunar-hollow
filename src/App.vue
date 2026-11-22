<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useStore } from './store/useStore'
import Toolbar from './components/Toolbar.vue'
import ComponentPanel from './components/ComponentPanel.vue'
import BrushPanel from './components/BrushPanel.vue'
import TimelineBar from './components/TimelineBar.vue'
import PerfBadge from './components/PerfBadge.vue'

const store = useStore()
const hostRef = ref<HTMLDivElement | null>(null)
const dragOver = ref(false)

onMounted(async () => {
  if (hostRef.value) await store.init(hostRef.value)

  window.addEventListener('keydown', onKey)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('drop', onDrop)
})

function onKey(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    store.redo()
  } else if (e.key.toLowerCase() === 'b') {
    store.setTool(store.state.tool === 'brush' ? 'orbit' : 'brush')
  } else if (e.key === '1') {
    store.setLayerMode('both')
  } else if (e.key === '2') {
    store.setLayerMode('base')
  } else if (e.key === '3') {
    store.setLayerMode('surface')
  }
}

function onDragOver(e: DragEvent): void {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave(e: DragEvent): void {
  if (e.relatedTarget === null) dragOver.value = false
}

async function onDrop(e: DragEvent): Promise<void> {
  e.preventDefault()
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await store.handleDropFile(file)
}
</script>

<template>
  <div class="app-shell">
    <Toolbar />
    <div class="main-area">
      <ComponentPanel />
      <div class="viewport-wrap">
        <div ref="hostRef" class="viewport-canvas-host"></div>
        <PerfBadge />
        <div v-if="store.state.statusMessage" class="overlay-toast">{{ store.state.statusMessage }}</div>
        <div v-if="dragOver" class="drop-hint">松开以导入 GLB 模型或 JSON 配置文件</div>
      </div>
      <BrushPanel />
    </div>
    <TimelineBar />
  </div>
</template>

<style scoped>
.main-area {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 10px;
  padding: 10px;
}
</style>
