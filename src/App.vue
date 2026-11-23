<script setup lang="ts">
/**
 * Application shell.
 *
 * Layout: toolbar on top, a three-pane main area (roster | 3D viewport |
 * inspector) and the timeline docked at the bottom. The playhead lives here as
 * the single source of truth; every panel derives from it, which is what keeps
 * the time position identical across stand switches and camera changes.
 */
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppState } from './state/store'
import { flushScenario } from './state/storage'
import AppToolbar from './components/AppToolbar.vue'
import SceneViewport from './components/SceneViewport.vue'
import Timeline from './components/Timeline.vue'
import PlaybackTransport from './components/PlaybackTransport.vue'
import InspectorPanel from './components/InspectorPanel.vue'
import VehicleRoster from './components/VehicleRoster.vue'
import ToastStack from './components/ToastStack.vue'

const store = useAppState()
const {
  scenario,
  minute,
  playing,
  speed,
  selectedId,
  standFilter,
  viewMode,
  ghostMode,
  showLabels,
  toasts,
  duration,
  startsAt,
  stands,
  visibleActors,
  selectedActor,
  selectedPose,
  selectedWindows,
  selectedCurrentIndex,
  selectedTotalWindow,
  selectedOverallProgress,
  playingActors,
} = store

const viewportRef = ref<InstanceType<typeof SceneViewport> | null>(null)
const frameCost = ref(16.7)
const panelOpen = ref(true)

/* ------------------------------------------------------------------ */
/* Animation clock                                                      */
/* ------------------------------------------------------------------ */

let rafId = 0
let lastTs = 0
let perfTimer = 0

function tick(ts: number): void {
  rafId = requestAnimationFrame(tick)
  const dt = lastTs ? Math.min(ts - lastTs, 250) : 16.7
  lastTs = ts

  if (playing.value) {
    // Real-time playback: 1 real second = `speed` minutes.
    const next = minute.value + (dt / 1000) * speed.value
    if (next >= duration.value) {
      minute.value = duration.value
      playing.value = false
    } else {
      minute.value = Math.round(next * 1000) / 1000
    }
  }

  perfTimer += dt
  if (perfTimer > 500) {
    perfTimer = 0
    frameCost.value = viewportRef.value?.frameCost() ?? 16.7
  }
}

onMounted(() => {
  store.hydrate()
  rafId = requestAnimationFrame(tick)
  window.addEventListener('keydown', onGlobalKey)
  window.addEventListener('pagehide', flushScenario)
  window.addEventListener('beforeunload', flushScenario)

  // Small debug surface for the headless smoke test and manual console poking.
  ;(window as unknown as Record<string, unknown>).__apron = {
    store,
    viewport: () => viewportRef.value,
    scene: () => viewportRef.value?.controller() ?? null,
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onGlobalKey)
  window.removeEventListener('pagehide', flushScenario)
  window.removeEventListener('beforeunload', flushScenario)
  flushScenario()
})

onUnmounted(() => flushScenario())

/* ------------------------------------------------------------------ */
/* Persistence                                                          */
/* ------------------------------------------------------------------ */

watch(
  [scenario, minute],
  () => store.persist(),
  { flush: 'post' },
)

/* ------------------------------------------------------------------ */
/* Keyboard shortcuts                                                   */
/* ------------------------------------------------------------------ */

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function onGlobalKey(event: KeyboardEvent): void {
  if (isTypingTarget(event.target)) return
  switch (event.key) {
    case ' ':
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      store.stepMinute(-1)
      break
    case 'ArrowRight':
      event.preventDefault()
      store.stepMinute(1)
      break
    case 'Home':
      event.preventDefault()
      store.setMinute(0)
      break
    case 'End':
      event.preventDefault()
      store.setMinute(duration.value)
      break
    case '1':
      event.preventDefault()
      viewMode.value = 'perspective'
      break
    case '2':
      event.preventDefault()
      viewMode.value = 'orthographic'
      break
    case 't':
    case 'T':
      event.preventDefault()
      viewportRef.value?.topView()
      break
    case 'f':
    case 'F':
      event.preventDefault()
      focusSelected()
      break
    case 'Escape':
      if (selectedId.value) selectedId.value = null
      break
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function togglePlay(): void {
  if (minute.value >= duration.value) {
    minute.value = 0
    playing.value = true
    return
  }
  playing.value = !playing.value
}

function jumpStart(): void {
  minute.value = 0
  playing.value = false
}

function jumpEnd(): void {
  minute.value = duration.value
  playing.value = false
}

function onSeek(value: number): void {
  store.setMinute(value)
  if (playing.value && value >= duration.value) playing.value = false
}

function onSelect(id: string | null): void {
  selectedId.value = id
  if (id) panelOpen.value = true
}

function focusSelected(): void {
  const actor = selectedActor.value
  if (!actor) return
  standFilter.value = actor.stand
  panelOpen.value = true
  window.setTimeout(() => viewportRef.value?.topView(), 30)
}

function onExport(): void {
  const snap = viewportRef.value?.snapshot() ?? null
  const result = store.exportJson(snap)
  if (result.ok && result.data) store.downloadPayload(result.data)
}

async function onImport(file: File): Promise<void> {
  try {
    const text = await file.text()
    const result = store.importText(text)
    if (result.ok && result.view) {
      const { camera, viewMode: importedMode } = result.view
      viewMode.value = importedMode
      window.setTimeout(() => {
        viewportRef.value?.restore(camera)
      }, 40)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    store.pushToast('error', '读取文件失败', message)
  }
}

const standLabel = computed(() => {
  const actor = selectedActor.value
  if (!actor) return ''
  return stands.value.find((s) => s.id === actor.stand)?.label ?? actor.stand
})

function onFocusFromInspector(): void {
  focusSelected()
}
</script>

<template>
  <div class="app" :data-actor-count="scenario.actors.length">
    <AppToolbar
      :name="scenario.meta.name"
      :starts-at="startsAt"
      :duration="duration"
      :view-mode="viewMode"
      :ghost-mode="ghostMode"
      :show-labels="showLabels"
      :stand-filter="standFilter"
      :stands="stands"
      :frame-cost="frameCost"
      @view-mode="viewMode = $event"
      @ghost-mode="ghostMode = $event"
      @labels="showLabels = $event"
      @top-view="viewportRef?.topView()"
      @stand="store.setStandFilter($event)"
      @export="onExport"
      @import="onImport"
      @reset="store.resetScenario()"
    />

    <main class="workspace">
      <aside class="side left">
        <VehicleRoster
          :actors="visibleActors.filter((a) => a.kind !== 'groundCrew' && a.kind !== 'aircraft')"
          :minute="minute"
          :starts-at="startsAt"
          :selected-id="selectedId"
          @select="onSelect"
          @seek="onSeek"
        />
      </aside>

      <section class="stage">
        <SceneViewport
          ref="viewportRef"
          :scenario="scenario"
          :minute="minute"
          :selected-id="selectedId"
          :stand-filter="standFilter"
          :view-mode="viewMode"
          :ghost-mode="ghostMode"
          :show-labels="showLabels"
          @select="onSelect"
        />
      </section>

      <aside class="side right" :class="{ collapsed: !panelOpen }">
        <InspectorPanel
          v-if="selectedActor && selectedPose"
          :actor="selectedActor"
          :pose="selectedPose"
          :windows="selectedWindows"
          :current-index="selectedCurrentIndex"
          :minute="minute"
          :starts-at="startsAt"
          :overall-progress="selectedOverallProgress"
          :total-window="selectedTotalWindow"
          :stand-label="standLabel"
          @close="selectedId = null"
          @seek="onSeek"
          @focus="onFocusFromInspector"
        />
        <div v-else class="empty-inspector">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M5 4h14v16H5zM9 9h6M9 13h6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <p>点击场景中的车辆或人员</p>
          <span>查看该任务段的起止时间与当前进度</span>
        </div>
      </aside>
    </main>

    <footer class="dock">
      <PlaybackTransport
        :minute="minute"
        :duration="duration"
        :playing="playing"
        :speed="speed"
        :starts-at="startsAt"
        :playing-actors="playingActors"
        @toggle="togglePlay"
        @step="store.stepMinute($event)"
        @speed="speed = $event"
        @jump-start="jumpStart"
        @jump-end="jumpEnd"
      />
      <Timeline
        :actors="visibleActors"
        :duration="duration"
        :minute="minute"
        :starts-at="startsAt"
        :selected-id="selectedId"
        :hover-id="null"
        :stand-filter="standFilter"
        :stands="stands"
        @seek="onSeek"
        @select="onSelect"
        @stand="store.setStandFilter($event)"
      />
    </footer>

    <ToastStack :toasts="toasts" @dismiss="store.dismissToast($event)" />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 10px;
  height: 100%;
  padding: 10px;
  max-width: 1920px;
  margin: 0 auto;
}

.workspace {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr) 316px;
  gap: 10px;
  min-height: 0;
}

.side {
  min-height: 0;
  overflow: hidden;
  padding: 12px;
  border-radius: 12px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
}
.side.left {
  display: flex;
  flex-direction: column;
}
.side.right {
  display: flex;
  flex-direction: column;
}

.stage {
  min-height: 0;
  display: flex;
}
.stage > :deep(.viewport) {
  flex: 1;
}

.empty-inspector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  text-align: center;
  color: var(--text-3);
}
.empty-inspector p {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--text-2);
}
.empty-inspector span {
  font-size: 11px;
}

.dock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dock > :deep(.transport) {
  padding: 8px 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(10, 16, 26, 0.9));
  border: 1px solid var(--panel-border);
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: 216px minmax(0, 1fr) 280px;
  }
}

@media (max-width: 980px) {
  body {
    overflow: auto;
  }
  .app {
    height: auto;
    min-height: 100%;
  }
  .workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 60vh auto auto;
  }
  .side.left {
    order: 2;
    max-height: 220px;
  }
  .side.right {
    order: 3;
  }
  .stage {
    order: 1;
    min-height: 320px;
  }
}
</style>
