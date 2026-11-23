<script setup lang="ts">
/**
 * One actor's lane in the timeline: a row label plus its task segments drawn
 * proportionally across the minute axis. Used for both the overview ruler rows
 * and the compact per-vehicle lanes.
 */
import { computed } from 'vue'
import type { ActorSpec, SegmentWindow } from '../domain/model'
import { isVehicleKind } from '../domain/io'

const props = defineProps<{
  actor: ActorSpec
  windows: SegmentWindow[]
  duration: number
  minute: number
  selected: boolean
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'seek', minute: number): void
}>()

const pct = (v: number): number => (v / props.duration) * 100

const active = computed(
  () => props.minute >= (props.windows[0]?.start ?? 0) && props.minute <= (props.windows.at(-1)?.end ?? 0),
)

const kindLabel = computed(() => {
  switch (props.actor.kind) {
    case 'aircraft':
      return '飞机'
    case 'fuelTruck':
      return '加油车'
    case 'bus':
      return '摆渡车'
    case 'baggageTractor':
      return '牵引车'
    case 'baggageCart':
      return '拖斗'
    case 'groundCrew':
      return '人员'
  }
})

function onSeek(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  emit('seek', ratio * props.duration)
}
</script>

<template>
  <div
    class="lane"
    :class="{ selected, compact, crew: !isVehicleKind(actor.kind) }"
    role="button"
    tabindex="0"
    :aria-label="`${actor.name} 任务时间条`"
    @click="emit('select', actor.id)"
    @keydown.enter.prevent="emit('select', actor.id)"
    @keydown.space.prevent="emit('select', actor.id)"
  >
    <div class="lane-label">
      <span class="swatch" :style="{ background: actor.color }" />
      <span class="name" :title="actor.name">{{ actor.name }}</span>
      <span v-if="!compact" class="kind">{{ kindLabel }}</span>
    </div>
    <div class="lane-track" @click.stop="onSeek">
      <div
        v-for="(win, i) in windows"
        :key="i"
        class="segment"
        :class="{ live: minute >= win.start && minute <= win.end }"
        :style="{
          left: `${pct(win.start)}%`,
          width: `${Math.max(pct(win.end - win.start), 0.35)}%`,
          background: actor.color,
        }"
        :title="`${win.label} ${win.start}–${win.end} 分`"
      />
      <div class="playhead-dot" :style="{ left: `${pct(minute)}%` }" :class="{ on: active }" />
    </div>
  </div>
</template>

<style scoped>
.lane {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
}
.lane:hover {
  background: rgba(148, 163, 184, 0.08);
}
.lane.selected {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.45);
}
.lane.compact {
  grid-template-columns: 118px minmax(0, 1fr);
  padding: 2px 6px;
}

.lane-label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  color: #cbd5e1;
}
.swatch {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  flex: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
}
.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.crew .name {
  color: #94a3b8;
}
.kind {
  flex: none;
  font-size: 10px;
  color: #64748b;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.12);
}

.lane-track {
  position: relative;
  height: 14px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.55);
  overflow: hidden;
}
.compact .lane-track {
  height: 12px;
}
.segment {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 3px;
  opacity: 0.5;
  transition: opacity 120ms ease;
}
.segment.live {
  opacity: 0.95;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
}
.playhead-dot {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1.5px;
  background: rgba(255, 255, 255, 0.28);
  pointer-events: none;
}
.playhead-dot.on {
  background: #fbbf24;
}
</style>
