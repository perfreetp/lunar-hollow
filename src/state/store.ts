/**
 * Global editorial + playback state.
 *
 * The 3D layer is driven imperatively; Vue owns the playhead, selection,
 * camera mode and persistence. To keep scrubbing at 60fps the store never
 * deep-clones the scenario: actors/stands are `shallowRef` + `markRaw`, and
 * only the small reactive scalars change per scrub tick.
 */

import { computed, markRaw, reactive, ref, shallowRef } from 'vue'
import {
  type ActorSpec,
  type Scenario,
  type SegmentWindow,
  actorWindows,
  currentSegmentIndex,
  sampleActor,
  totalWindow,
} from '../domain/model'
import { createDemoScenario } from '../domain/scenario'
import {
  buildExport,
  isVehicleKind,
  serializeExport,
  validateScenario,
  type ValidationResult,
  type ViewSnapshot,
} from '../domain/io'
import type { CameraSnapshot, GhostMode, ViewMode } from '../three/sceneController'
import { loadScenario, saveScenario, clearScenario } from './storage'

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error' | 'warn'
  title: string
  detail?: string
}

let toastSeq = 0

export function useAppState() {
  const scenario = shallowRef<Scenario>(markRaw(createDemoScenario()))
  const minute = ref(0)
  const playing = ref(false)
  const speed = ref(1)
  const selectedId = ref<string | null>(null)
  const hoverId = ref<string | null>(null)
  const standFilter = ref<string>('all')
  const viewMode = ref<ViewMode>('perspective')
  const ghostMode = ref<GhostMode>('all')
  const showLabels = ref(true)
  const toasts = reactive<Toast[]>([])
  const lastExport = ref<string | null>(null)
  const ready = ref(false)

  const duration = computed(() => scenario.value.meta.duration)
  const startsAt = computed(() => scenario.value.meta.startsAt)

  const stands = computed(() => scenario.value.stands)
  const actors = computed(() => scenario.value.actors)

  const visibleActors = computed<ActorSpec[]>(() => {
    if (standFilter.value === 'all') return actors.value
    return actors.value.filter((a) => a.stand === standFilter.value)
  })

  const vehicles = computed(() => actors.value.filter((a) => isVehicleKind(a.kind)))

  const selectedActor = computed<ActorSpec | null>(() => {
    if (!selectedId.value) return null
    return actors.value.find((a) => a.id === selectedId.value) ?? null
  })

  const selectedPose = computed(() => {
    const actor = selectedActor.value
    if (!actor) return null
    return sampleActor(actor, minute.value)
  })

  const selectedWindows = computed<SegmentWindow[]>(() =>
    selectedActor.value ? actorWindows(selectedActor.value) : [],
  )

  const selectedCurrentIndex = computed(() => {
    const actor = selectedActor.value
    if (!actor) return -1
    return currentSegmentIndex(actor, minute.value)
  })

  const selectedTotalWindow = computed(() => {
    const actor = selectedActor.value
    return actor ? totalWindow(actor) : null
  })

  /** Progress across the actor's whole working window, 0..100. */
  const selectedOverallProgress = computed(() => {
    const win = selectedTotalWindow.value
    if (!win || win.end <= win.start) return 0
    const p = ((minute.value - win.start) / (win.end - win.start)) * 100
    return Math.min(100, Math.max(0, p))
  })

  const playingActors = computed(() => {
    let n = 0
    for (const actor of actors.value) {
      const pose = sampleActor(actor, minute.value)
      if (pose.active) n++
    }
    return n
  })

  /* --------------------------------------------------------------- */

  function pushToast(kind: Toast['kind'], title: string, detail?: string): void {
    const id = ++toastSeq
    toasts.push({ id, kind, title, detail })
    const ttl = kind === 'error' ? 7000 : 3800
    window.setTimeout(() => {
      const idx = toasts.findIndex((t) => t.id === id)
      if (idx >= 0) toasts.splice(idx, 1)
    }, ttl)
  }

  function dismissToast(id: number): void {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }

  function clampMinute(value: number): number {
    return Math.min(duration.value, Math.max(0, value))
  }

  function setMinute(value: number): void {
    minute.value = clampMinute(value)
  }

  function stepMinute(delta: number): void {
    setMinute(minute.value + delta)
  }

  function select(actorId: string | null): void {
    selectedId.value = actorId
  }

  function setStandFilter(id: string): void {
    standFilter.value = id
    // Keep the time axis untouched by design (requirement: stand switching
    // preserves the playhead). Only the selection is re-validated.
    if (selectedId.value) {
      const actor = actors.value.find((a) => a.id === selectedId.value)
      if (actor && id !== 'all' && actor.stand !== id) selectedId.value = null
    }
  }

  function resetScenario(): void {
    scenario.value = markRaw(createDemoScenario())
    minute.value = 0
    selectedId.value = null
    standFilter.value = 'all'
    playing.value = false
    clearScenario()
    pushToast('info', '已恢复演示数据', '三机位默认保障时序已重新生成')
  }

  /* --------------------------------------------------------------- */
  /* Persistence                                                      */
  /* --------------------------------------------------------------- */

  function currentViewSnapshot(camera: CameraSnapshot): ViewSnapshot {
    return {
      minute: minute.value,
      standId: standFilter.value,
      viewMode: viewMode.value,
      camera,
    }
  }

  function buildPayload(camera: CameraSnapshot | null): string {
    const view = camera ? currentViewSnapshot(camera) : undefined
    return serializeExport(buildExport(scenario.value, view))
  }

  function exportJson(camera: CameraSnapshot | null): { ok: boolean; data?: string; error?: string } {
    try {
      const data = buildPayload(camera)
      // Re-validate our own output: catches any authoring bug before the user
      // downloads a file that cannot be re-imported.
      const check = validateScenario(JSON.parse(data))
      if (!check.ok) {
        return { ok: false, error: check.errors.join('；') }
      }
      lastExport.value = new Date().toISOString()
      pushToast('success', '已生成动画 JSON', `${(data.length / 1024).toFixed(1)} KB · 含 ${actors.value.length} 个作业对象`)
      return { ok: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast('error', '导出失败', message)
      return { ok: false, error: message }
    }
  }

  function downloadPayload(data: string): void {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')
    a.download = `机坪保障时序-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importText(text: string): ValidationResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast('error', 'JSON 解析失败', message)
      return { ok: false, errors: [message], warnings: [] }
    }
    const result = validateScenario(parsed)
    if (!result.ok) {
      pushToast('error', '时序数据校验未通过', result.errors.slice(0, 3).join('；'))
      return result
    }
    scenario.value = markRaw(result.scenario!)
    minute.value = result.view ? clampTo(result.view.minute, result.scenario!.meta.duration) : 0
    standFilter.value =
      result.view && result.scenario!.stands.some((s) => s.id === result.view!.standId)
        ? result.view.standId
        : 'all'
    viewMode.value = result.view?.viewMode ?? 'perspective'
    selectedId.value = null
    playing.value = false
    persist()
    pushToast(
      'success',
      '动画时序已导入',
      `${result.scenario!.stands.length} 个机位 · ${result.scenario!.actors.length} 个作业对象 · ${result.scenario!.meta.duration} 分钟`,
    )
    if (result.warnings.length) {
      pushToast('warn', `${result.warnings.length} 条导入提示`, result.warnings[0])
    }
    return result
  }

  function clampTo(v: number, max: number): number {
    return Math.min(Math.max(v, 0), max)
  }

  function persist(): void {
    saveScenario(scenario.value, minute.value)
  }

  function hydrate(): boolean {
    const stored = loadScenario()
    if (!stored) return false
    const result = validateScenario(stored.payload)
    if (!result.ok) {
      pushToast('warn', '本地缓存时序已失效', '已回退到演示数据')
      return false
    }
    scenario.value = markRaw(result.scenario!)
    minute.value = clampTo(stored.minute, result.scenario!.meta.duration)
    return true
  }

  return {
    // state
    scenario,
    minute,
    playing,
    speed,
    selectedId,
    hoverId,
    standFilter,
    viewMode,
    ghostMode,
    showLabels,
    toasts,
    lastExport,
    ready,
    duration,
    startsAt,
    stands,
    actors,
    visibleActors,
    vehicles,
    selectedActor,
    selectedPose,
    selectedWindows,
    selectedCurrentIndex,
    selectedTotalWindow,
    selectedOverallProgress,
    playingActors,
    // actions
    pushToast,
    dismissToast,
    setMinute,
    stepMinute,
    select,
    setStandFilter,
    resetScenario,
    exportJson,
    downloadPayload,
    importText,
    persist,
    hydrate,
  }
}

export type AppState = ReturnType<typeof useAppState>
