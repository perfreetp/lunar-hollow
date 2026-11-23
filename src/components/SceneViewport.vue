<script setup lang="ts">
/**
 * Three.js viewport host.
 *
 * Owns the SceneController lifecycle and bridges it to the store: time,
 * selection, hover, camera mode and stand focus flow in through watchers, and
 * pick/select events flow back out.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SceneController, type CameraSnapshot, type ViewMode } from '../three/sceneController'
import type { Scenario } from '../domain/model'

const props = defineProps<{
  scenario: Scenario
  minute: number
  selectedId: string | null
  standFilter: string
  viewMode: ViewMode
  ghostMode: 'off' | 'selected' | 'all'
  showLabels: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'hover', id: string | null): void
  (e: 'ready', payload: {
    frameCost: () => number
    poseCost: () => number
    stats: () => ReturnType<SceneController['stats']>
    projectActor: (id: string) => { x: number; y: number } | null
  }): void
  (e: 'camera', snap: CameraSnapshot): void
}>()

const host = ref<HTMLElement | null>(null)
const hintVisible = ref(true)
let controller: SceneController | null = null

onMounted(async () => {
  if (!host.value) return
  controller = new SceneController({
    onSelect: (id) => emit('select', id),
    onHover: (id) => emit('hover', id),
    onFirstFrame: () => {
      window.setTimeout(() => {
        hintVisible.value = false
      }, 2600)
    },
  })
  controller.mount(host.value)
  controller.setScenario(props.scenario)
  controller.setTime(props.minute)
  controller.setSelection(props.selectedId)
  controller.setGhostMode(props.ghostMode)
  controller.focusStand(props.standFilter === 'all' ? null : props.standFilter)
  controller.setViewMode(props.viewMode)
  emit('ready', {
    frameCost: () => controller?.frameCost() ?? 16.7,
    poseCost: () => controller?.poseCost() ?? 0,
    stats: () => controller?.stats() ?? { actors: 0, visible: 0, drawCalls: 0, triangles: 0 },
    projectActor: (id: string) => controller?.projectActor(id) ?? null,
  })
})

onBeforeUnmount(() => {
  controller?.dispose()
  controller = null
})

// Time is pushed on every scrub tick; the controller coalesces it into the
// next animation frame, so dragging never queues redundant work.
watch(
  () => props.minute,
  (t) => controller?.setTime(t),
)

watch(
  () => props.selectedId,
  (id) => controller?.setSelection(id),
)

watch(
  () => props.ghostMode,
  (mode) => controller?.setGhostMode(mode),
)

watch(
  () => props.viewMode,
  (mode) => controller?.setViewMode(mode),
)

watch(
  () => props.standFilter,
  (id) => controller?.focusStand(id === 'all' ? null : id),
)

watch(
  () => props.scenario,
  (scenario) => {
    controller?.setScenario(scenario)
    controller?.setTime(props.minute)
    controller?.setSelection(props.selectedId)
    controller?.setGhostMode(props.ghostMode)
    controller?.focusStand(props.standFilter === 'all' ? null : props.standFilter)
    controller?.setViewMode(props.viewMode)
  },
)

watch(
  () => props.showLabels,
  (show) => controller?.setLabelsVisible(show),
)

const labelsVisible = ref(true)

const LEGEND = [
  { color: '#e0a12c', label: '加油车' },
  { color: '#3f9bf5', label: '摆渡车' },
  { color: '#8b5cf6', label: '行李牵引' },
  { color: '#34d399', label: '地勤人员' },
]

defineExpose({
  snapshot: (): CameraSnapshot | null => controller?.cameraSnapshot() ?? null,
  restore: (snap: CameraSnapshot | undefined): void => controller?.restoreCamera(snap),
  topView: (): void => controller?.setTopView(),
  frameCost: (): number => controller?.frameCost() ?? 16.7,
  poseCost: (): number => controller?.poseCost() ?? 0,
  quality: (): string => controller?.qualityTier() ?? 'high',
  stats: () => controller?.stats(),
  controller: () => controller,
})

const ORTHO_HINT = '正交视角适合核对机位排布，拖动仍可平移'
const QUICK_KEYS = [
  { key: '空格', label: '播放/暂停' },
  { key: '← →', label: '逐分钟' },
  { key: '1 / 2', label: '透视/正交' },
  { key: 'T', label: '俯视' },
  { key: 'F', label: '聚焦选中' },
]
</script>

<template>
  <div class="viewport">
    <div ref="host" class="canvas-host" />

    <div class="vp-badges">
      <span class="badge" :class="{ accent: viewMode === 'orthographic' }">
        {{ viewMode === 'orthographic' ? '正交投影' : '透视投影' }}
      </span>
      <span class="badge">{{ showLabels ? '岗位标签 开' : '岗位标签 关' }}</span>
      <span class="badge">{{ ghostMode === 'all' ? '全量轮廓' : ghostMode === 'selected' ? '选中轮廓' : '轮廓关闭' }}</span>
    </div>

    <div class="vp-legend" aria-hidden="true">
      <span v-for="item in LEGEND" :key="item.label">
        <i :style="{ background: item.color }" />{{ item.label }}
      </span>
    </div>

    <transition name="fade">
      <div v-if="hintVisible" class="vp-hint">
        <p>{{ viewMode === 'orthographic' ? ORTHO_HINT : '拖动旋转 · 滚轮缩放 · 右键平移 · 点击车辆查看任务段' }}</p>
        <ul>
          <li v-for="k in QUICK_KEYS" :key="k.key"><kbd>{{ k.key }}</kbd>{{ k.label }}</li>
        </ul>
      </div>
    </transition>

    <slot v-if="labelsVisible" name="overlay" />
  </div>
</template>

<style scoped>
.viewport {
  position: relative;
  min-height: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #0d1420;
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.canvas-host {
  position: absolute;
  inset: 0;
}
.vp-badges {
  position: absolute;
  top: 10px;
  left: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  pointer-events: none;
}
.badge {
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: #94a3b8;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(6px);
}
.badge.accent {
  color: #bae6fd;
  border-color: rgba(56, 189, 248, 0.45);
}
.vp-legend {
  position: absolute;
  top: 10px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.14);
  pointer-events: none;
}
.vp-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #94a3b8;
}
.vp-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.vp-hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(8px);
  pointer-events: none;
  max-width: min(420px, calc(100% - 24px));
}
.vp-hint p {
  margin: 0 0 6px;
  font-size: 11.5px;
  color: #cbd5e1;
}
.vp-hint ul {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.vp-hint li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: #7d8ea4;
}
kbd {
  font-family: inherit;
  font-size: 10px;
  color: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.22);
}
.fade-leave-active {
  transition: opacity 500ms ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>
