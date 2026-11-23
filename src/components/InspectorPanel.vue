<script setup lang="ts">
/**
 * Selected-object inspector: which task segment a vehicle is in, when it
 * starts and ends, how far through it is right now, and its whole-day window.
 */
import { computed } from 'vue'
import type { ActorSpec, SegmentWindow } from '../domain/model'
import { formatClock, formatDuration, formatOffset } from '../domain/clock'

const props = defineProps<{
  actor: ActorSpec
  pose: { active: boolean; progress: number; segmentIndex: number; parked: boolean } | null
  windows: SegmentWindow[]
  currentIndex: number
  minute: number
  startsAt: string
  overallProgress: number
  totalWindow: { start: number; end: number } | null
  standLabel: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'seek', minute: number): void
  (e: 'focus'): void
}>()

const kindLabel = computed(() => {
  switch (props.actor.kind) {
    case 'aircraft':
      return '飞机'
    case 'fuelTruck':
      return '加油车'
    case 'bus':
      return '摆渡车'
    case 'baggageTractor':
      return '行李牵引车'
    case 'baggageCart':
      return '行李拖斗'
    case 'groundCrew':
      return '地勤人员'
  }
})

const current = computed(() => props.windows[props.currentIndex] ?? null)
const next = computed(() => props.windows[props.currentIndex + 1] ?? null)

const segmentProgress = computed(() => {
  if (!props.pose) return 0
  return Math.round(props.pose.progress * 100)
})

const statusText = computed(() => {
  if (!props.pose) return '未知'
  if (props.pose.active) return props.pose.parked ? '作业中（驻车）' : '作业中（行驶）'
  if (props.currentIndex < 0) return '待命'
  return '任务已完成'
})

const progressTone = computed(() => {
  if (!props.pose) return 'idle'
  if (!props.pose.active) return 'idle'
  return props.pose.parked ? 'hold' : 'move'
})

function seekTo(minute: number): void {
  emit('seek', Math.max(0, Math.min(minute, Number.MAX_SAFE_INTEGER)))
}
</script>

<template>
  <aside class="inspector" :aria-label="`${actor.name} 任务详情`">
    <header class="head">
      <span class="swatch" :style="{ background: actor.color }" />
      <div class="title">
        <h3>{{ actor.name }}</h3>
        <p class="meta">
          <span>{{ kindLabel }}</span>
          <span v-if="actor.role" class="role">{{ actor.role }}</span>
          <span>{{ standLabel }} 机位</span>
        </p>
      </div>
      <button class="close" title="关闭详情 (Esc)" aria-label="关闭详情" @click="emit('close')">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" fill="none"/></svg>
      </button>
    </header>

    <div class="status-row">
      <span class="status" :class="progressTone">
        <i />{{ statusText }}
      </span>
      <span class="now">{{ formatClock(startsAt, minute) }}</span>
    </div>

    <section v-if="current" class="block">
      <div class="block-head">
        <span class="eyebrow">当前任务段</span>
        <span class="range">
          {{ formatClock(startsAt, current.start) }} – {{ formatClock(startsAt, current.end) }}
          <em>({{ formatDuration(current.end - current.start) }})</em>
        </span>
      </div>
      <p class="label">{{ current.label }}</p>

      <div class="bar" :class="progressTone">
        <div class="fill" :style="{ width: `${segmentProgress}%` }" />
        <span class="bar-text">{{ segmentProgress }}%</span>
      </div>
      <div class="bar-legend">
        <span>{{ formatClock(startsAt, current.start) }}</span>
        <span class="tl-hint" v-if="pose?.active">
          剩余 {{ formatDuration(current.end - minute) }}
        </span>
        <span v-else class="tl-hint">该时刻不在任务段内</span>
        <span>{{ formatClock(startsAt, current.end) }}</span>
      </div>

      <div class="bar-wrap">
        <div class="mini-bar">
          <div class="mini-fill" :style="{ width: `${overallProgress}%` }" />
        </div>
        <p class="mini-legend">
          当日作业窗口
          <template v-if="totalWindow">
            {{ formatClock(startsAt, totalWindow.start) }} – {{ formatClock(startsAt, totalWindow.end) }}
          </template>
          <strong>{{ Math.round(overallProgress) }}%</strong>
        </p>
      </div>
    </section>

    <section v-else class="block empty">
      <p>该对象没有时间驱动的移动任务。</p>
    </section>

    <section class="block">
      <span class="eyebrow">任务段（点击跳转）</span>
      <ol class="segments">
        <li
          v-for="(win, i) in windows"
          :key="i"
          :class="{
            current: i === currentIndex,
            past: i < currentIndex,
          }"
        >
          <button @click="seekTo(win.start)">
            <span class="dot" />
            <span class="seg-name">{{ win.label }}</span>
            <span class="seg-time">{{ formatClock(startsAt, win.start) }}</span>
            <span class="seg-offset">{{ formatOffset(win.start) }}</span>
          </button>
        </li>
      </ol>
      <p v-if="next" class="next-hint">
        下一段 <strong>{{ next.label }}</strong> 将于
        {{ formatClock(startsAt, next.start) }} 开始（{{ formatDuration(next.start - minute) }}后）
      </p>
    </section>

    <footer class="foot">
      <button class="ghost-btn" @click="emit('focus')">在场景中聚焦</button>
      <button class="ghost-btn" @click="seekTo(current?.start ?? 0)">跳到本段起点</button>
    </footer>
  </aside>
</template>

<style scoped>
.inspector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(9, 14, 23, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 16px 40px rgba(2, 6, 23, 0.45);
  overflow-y: auto;
  scrollbar-width: thin;
}
.head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.swatch {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 3px;
  flex: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}
.title {
  min-width: 0;
  flex: 1;
}
.title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 3px 0 0;
  font-size: 11px;
  color: #7d8ea4;
}
.role {
  color: #cbd5e1;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.14);
}
.close {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}
.close:hover {
  color: #f8fafc;
  background: rgba(148, 163, 184, 0.14);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status.move {
  color: #7dd3fc;
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.1);
}
.status.hold {
  color: #fcd34d;
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.1);
}
.status.idle {
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.25);
}
.now {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}
.block.empty p {
  margin: 0;
  font-size: 12px;
  color: #7d8ea4;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748b;
}
.range {
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: #cbd5e1;
}
.range em {
  font-style: normal;
  color: #64748b;
}
.label {
  margin: 0;
  font-size: 13px;
  color: #e2e8f0;
}

.bar {
  position: relative;
  height: 22px;
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.16);
  overflow: hidden;
}
.fill {
  height: 100%;
  transition: width 90ms linear;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
}
.bar.hold .fill {
  background: linear-gradient(90deg, #b45309, #fbbf24);
}
.bar.idle .fill {
  background: linear-gradient(90deg, #334155, #475569);
}
.bar-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: #f8fafc;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
.bar-legend {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 10.5px;
  color: #7d8ea4;
  font-variant-numeric: tabular-nums;
}
.tl-hint {
  color: #94a3b8;
}
.bar-wrap {
  margin-top: 2px;
}
.mini-bar {
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}
.mini-fill {
  height: 100%;
  background: rgba(148, 163, 184, 0.7);
  transition: width 90ms linear;
}
.mini-legend {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 5px 0 0;
  font-size: 10.5px;
  color: #64748b;
}
.mini-legend strong {
  color: #cbd5e1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.segments {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.segments button {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
}
.segments button:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.4);
}
.segments li.current button {
  color: #f8fafc;
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
}
.segments li.current .dot {
  background: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22);
}
.segments li.past .dot {
  background: #475569;
}
.seg-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.seg-time {
  font-variant-numeric: tabular-nums;
  color: #cbd5e1;
}
.seg-offset {
  font-variant-numeric: tabular-nums;
  font-size: 10px;
  color: #64748b;
  min-width: 42px;
  text-align: right;
}
.next-hint {
  margin: 2px 0 0;
  font-size: 11px;
  color: #7d8ea4;
  line-height: 1.5;
}
.next-hint strong {
  color: #cbd5e1;
  font-weight: 500;
}

.foot {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}
.ghost-btn {
  flex: 1;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  font-size: 11.5px;
  cursor: pointer;
}
.ghost-btn:hover {
  border-color: rgba(56, 189, 248, 0.45);
  color: #e0f2fe;
}
</style>
