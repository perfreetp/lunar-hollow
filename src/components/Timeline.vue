<script setup lang="ts">
/**
 * The timeline: a minute-ruled axis from task start to task end, a draggable
 * playhead, and one lane per visible actor.
 *
 * Interaction: click or drag anywhere on the axis/lane area to seek. Dragging
 * is pointer-capture based so the scrub keeps tracking outside the element.
 * Ticks thin out automatically when the axis gets too dense for the width, but
 * the underlying unit is always one minute, and arrow keys / the transport
 * buttons step by exactly one.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ActorSpec } from '../domain/model'
import { actorWindows } from '../domain/model'
import { formatClock } from '../domain/clock'
import TimelineLane from './TimelineLane.vue'

const props = defineProps<{
  actors: ActorSpec[]
  duration: number
  minute: number
  startsAt: string
  selectedId: string | null
  hoverId: string | null
  standFilter: string
  stands: Array<{ id: string; label: string }>
}>()

const emit = defineEmits<{
  (e: 'seek', minute: number): void
  (e: 'select', id: string | null): void
  (e: 'stand', id: string): void
}>()

const trackRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const width = ref(0)
const trackOffset = ref(158)

/** Pixel offset of the ruled track area inside the panel, for the guide. */
const playheadPx = computed(() => trackOffset.value + (width.value - trackOffset.value) * (playheadPct.value / 100))

const MAX_LANES = 14

const sortedActors = computed(() => {
  const order: Record<ActorSpec['kind'], number> = {
    aircraft: 0,
    fuelTruck: 1,
    bus: 2,
    baggageTractor: 3,
    baggageCart: 4,
    groundCrew: 5,
  }
  return [...props.actors].sort((a, b) => {
    const d = order[a.kind] - order[b.kind]
    return d !== 0 ? d : a.name.localeCompare(b.name, 'zh-CN')
  })
})

const shownActors = computed(() => {
  const list = sortedActors.value
  if (list.length <= MAX_LANES) return list
  // Keep the selected actor visible even when lanes overflow.
  const head = list.slice(0, MAX_LANES - 1)
  const sel = list.find((a) => a.id === props.selectedId)
  if (sel && !head.includes(sel)) head.push(sel)
  else head.push(list[MAX_LANES - 1])
  return head
})

const hiddenCount = computed(() => Math.max(0, sortedActors.value.length - shownActors.value.length))

/** Tick spacing in minutes, chosen so labels never overlap. */
const tickStep = computed(() => {
  const w = width.value || 900
  const pxPerMinute = w / Math.max(props.duration, 1)
  const candidates = [1, 2, 5, 10, 15, 30]
  for (const step of candidates) {
    if (pxPerMinute * step >= 46) return step
  }
  return 30
})

const ticks = computed(() => {
  const step = tickStep.value
  const out: Array<{ minute: number; pct: number; major: boolean; label: string }> = []
  for (let m = 0; m <= props.duration; m += step) {
    out.push({
      minute: m,
      pct: (m / props.duration) * 100,
      major: m % (step * 2) === 0,
      label: formatClock(props.startsAt, m),
    })
  }
  // Always label the final minute so the axis has a closing time.
  const last = out[out.length - 1]
  if (!last || last.minute !== props.duration) {
    out.push({
      minute: props.duration,
      pct: 100,
      major: true,
      label: formatClock(props.startsAt, props.duration),
    })
  }
  return out
})

const playheadPct = computed(() => (props.minute / props.duration) * 100)

function minuteFromEvent(event: MouseEvent | PointerEvent): number {
  const el = trackRef.value
  if (!el) return props.minute
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  // Snap to 0.25-min increments while scrubbing: fine enough to feel
  // continuous, coarse enough to stay legible on a 1-minute axis.
  const raw = ratio * props.duration
  return Math.round(raw * 4) / 4
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  emit('seek', minuteFromEvent(event))
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return
  emit('seek', minuteFromEvent(event))
}

function onPointerUp(event: PointerEvent): void {
  if (!dragging.value) return
  dragging.value = false
  const el = event.currentTarget as HTMLElement
  if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
}

/** Keyboard nudge by exactly one minute. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  const delta = event.key === 'ArrowLeft' ? -1 : 1
  emit('seek', Math.min(props.duration, Math.max(0, Math.round(props.minute) + delta)))
}

function laneWindows(actor: ActorSpec) {
  return actorWindows(actor)
}

let resizeObserver: ResizeObserver | null = null
watch(
  rootRef,
  (el) => {
    resizeObserver?.disconnect()
    if (!el) return
    width.value = el.clientWidth
    const sync = (): void => {
      width.value = el.clientWidth
      const lane = el.querySelector<HTMLElement>('.ruler')
      if (lane) trackOffset.value = lane.offsetLeft
    }
    sync()
    resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(el)
  },
  { immediate: true },
)
onBeforeUnmount(() => resizeObserver?.disconnect())

function tickLabelVisible(index: number): boolean {
  // At coarse durations the 2x-major rule already thins labels; guard against
  // the case where every tick is minor.
  return index % 2 === 0 || props.duration <= 60
}

function onStandChange(event: Event): void {
  emit('stand', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <section
    ref="rootRef"
    class="timeline"
    :class="{ dragging }"
    tabindex="0"
    aria-label="保障作业时间轴，左右方向键按分钟移动"
    @keydown="onKeydown"
  >
    <header class="tl-head">
      <div class="tl-title">
        <h2>作业时序</h2>
        <span class="sub">{{ actors.length }} 个作业对象 · {{ duration }} 分钟 · 1 分钟刻度</span>
      </div>
      <div class="tl-controls">
        <label class="field">
          <span>机位</span>
          <select :value="standFilter" @change="onStandChange">
            <option value="all">全部机位</option>
            <option v-for="s in stands" :key="s.id" :value="s.id">{{ s.label }}</option>
          </select>
        </label>
      </div>
    </header>

    <div class="tl-body">
      <!-- Ruler -->
      <div class="ruler-row">
        <div class="ruler-spacer" />
        <div
          ref="trackRef"
          class="ruler"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div
            v-for="(tick, i) in ticks"
            :key="tick.minute"
            class="tick"
            :class="{ major: tick.major }"
            :style="{ left: `${tick.pct}%` }"
          >
            <span v-if="tickLabelVisible(i)" class="tick-label">{{ tick.label }}</span>
          </div>

          <!-- Sub-minute guide ticks make the 1-minute unit readable. -->
          <div class="subtick-layer" aria-hidden="true">
            <i
              v-for="n in Math.min(duration * 2, 200)"
              :key="n"
              class="subtick"
              :style="{ left: `${((n * 0.5) / duration) * 100}%` }"
            />
          </div>

          <div class="playhead" :style="{ left: `${playheadPct}%` }">
            <span class="grab" />
          </div>
        </div>
      </div>

      <!-- Lanes -->
      <div class="lanes">
        <TimelineLane
          v-for="actor in shownActors"
          :key="actor.id"
          :actor="actor"
          :windows="laneWindows(actor)"
          :duration="duration"
          :minute="minute"
          :selected="selectedId === actor.id"
          :compact="shownActors.length > 9"
          @select="emit('select', selectedId === actor.id ? null : actor.id)"
          @seek="emit('seek', $event)"
        />
        <p v-if="hiddenCount > 0" class="more">
          另有 {{ hiddenCount }} 条人员作业轨道已折叠，切换机位可查看
        </p>
      </div>

      <!-- Full-width playhead for lane rows -->
      <div class="playhead-line" :style="{ left: `${playheadPx}px` }" />
    </div>
  </section>
</template>

<style scoped>
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 10px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(11, 17, 28, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.14);
  outline: none;
}
.timeline:focus-visible {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.22);
}

.tl-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tl-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.tl-title h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #e2e8f0;
  text-transform: uppercase;
}
.sub {
  font-size: 11px;
  color: #64748b;
}
.tl-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
}
.field select {
  height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
}

.tl-body {
  position: relative;
}
.ruler-row {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 6px;
}
.ruler-spacer {
  height: 26px;
}
.ruler {
  position: relative;
  height: 26px;
  cursor: pointer;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  user-select: none;
  touch-action: none;
}
.tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(148, 163, 184, 0.25);
}
.tick.major {
  background: rgba(148, 163, 184, 0.5);
}
.tick-label {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: #8b9bb0;
  white-space: nowrap;
}
.subtick-layer {
  position: absolute;
  inset: 18px 0 0;
  pointer-events: none;
}
.subtick {
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 4px;
  background: rgba(148, 163, 184, 0.18);
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: #fbbf24;
  pointer-events: none;
  z-index: 3;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}
.playhead .grab {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.25);
}
.dragging .playhead .grab {
  box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.3);
}

.lanes {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 258px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
}
.more {
  margin: 6px 8px 0;
  font-size: 11px;
  color: #64748b;
}

/* A full-height guide aligned with the playhead across the lane stack. */
.playhead-line {
  position: absolute;
  top: 32px;
  bottom: 2px;
  width: 1px;
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.7), rgba(251, 191, 36, 0.08));
  pointer-events: none;
  z-index: 2;
}

@media (max-width: 720px) {
  .ruler-row,
  .lane {
    grid-template-columns: 104px minmax(0, 1fr);
  }
}
</style>
