<script setup lang="ts">
/**
 * Vehicle roster for the active stand. Each row shows live status and offers
 * a one-click seek to the current task segment.
 */
import { computed } from 'vue'
import type { ActorSpec } from '../domain/model'
import { sampleActor, totalWindow } from '../domain/model'
import { formatClock } from '../domain/clock'

const props = defineProps<{
  actors: ActorSpec[]
  minute: number
  startsAt: string
  selectedId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'seek', minute: number): void
}>()

interface Row {
  actor: ActorSpec
  active: boolean
  progress: number
  status: 'move' | 'hold' | 'idle' | 'done'
  window: { start: number; end: number } | null
  segmentIndex: number
}

const rows = computed<Row[]>(() => {
  return props.actors
    .map((actor) => {
      const pose = sampleActor(actor, props.minute)
      const status: Row['status'] = pose.active ? (pose.parked ? 'hold' : 'move') : pose.segmentIndex >= 0 ? 'done' : 'idle'
      return {
        actor,
        active: pose.active,
        progress: pose.progress,
        status,
        window: totalWindow(actor),
        segmentIndex: pose.segmentIndex,
      }
    })
    .sort((a, b) => {
      const rank = (r: Row) => (r.status === 'move' ? 0 : r.status === 'hold' ? 1 : r.status === 'idle' ? 2 : 3)
      const d = rank(a) - rank(b)
      return d !== 0 ? d : a.actor.name.localeCompare(b.actor.name, 'zh-CN')
    })
})

const activeCount = computed(() => rows.value.filter((r) => r.active).length)

function label(actor: ActorSpec): string {
  switch (actor.kind) {
    case 'fuelTruck':
      return '加油'
    case 'bus':
      return '摆渡'
    case 'baggageTractor':
      return '牵引'
    case 'baggageCart':
      return '拖斗'
    default:
      return ''
  }
}

function statusText(row: Row): string {
  switch (row.status) {
    case 'move':
      return '行驶'
    case 'hold':
      return '驻车作业'
    case 'done':
      return '已完成'
    default:
      return '待命'
  }
}
</script>

<template>
  <section class="roster">
    <header class="r-head">
      <h2>作业车辆</h2>
      <span class="count">{{ activeCount }} / {{ rows.length }} 进行中</span>
    </header>

    <ul class="r-list">
      <li
        v-for="row in rows"
        :key="row.actor.id"
        :class="{ selected: row.actor.id === selectedId, live: row.active }"
      >
        <button class="row" @click="emit('select', row.actor.id)">
          <span class="swatch" :style="{ background: row.actor.color }" />
          <span class="body">
            <span class="line">
              <span class="name">{{ row.actor.name }}</span>
              <span class="tag">{{ label(row.actor) }}</span>
              <span class="status" :class="row.status">{{ statusText(row) }}</span>
            </span>
            <span class="line sub">
              <span v-if="row.window" class="range">
                {{ formatClock(startsAt, row.window.start) }} – {{ formatClock(startsAt, row.window.end) }}
              </span>
              <span v-else class="range">静态</span>
              <span class="progress">{{ Math.round(row.progress * 100) }}%</span>
            </span>
            <span class="track">
              <span
                class="fill"
                :class="row.status"
                :style="{ width: `${row.progress * 100}%` }"
              />
            </span>
          </span>
        </button>
        <button
          v-if="row.window"
          class="jump"
          :title="`跳到任务开始 ${formatClock(startsAt, row.window.start)}`"
          @click="emit('seek', row.window.start)"
        >
          起点
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.roster {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.r-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.r-head h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #e2e8f0;
  text-transform: uppercase;
}
.count {
  font-size: 10.5px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.r-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  max-height: 100%;
  scrollbar-width: thin;
}
.r-list li {
  display: flex;
  align-items: stretch;
  gap: 4px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.r-list li.live {
  background: rgba(56, 189, 248, 0.06);
}
.r-list li.selected {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.4);
}
.row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.row:hover {
  background: rgba(148, 163, 184, 0.08);
}
.swatch {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 2px;
  flex: none;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.name {
  font-size: 12px;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag {
  flex: none;
  font-size: 9.5px;
  color: #94a3b8;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.14);
}
.status {
  flex: none;
  margin-left: auto;
  font-size: 9.5px;
  padding: 0 5px;
  border-radius: 999px;
}
.status.move {
  color: #7dd3fc;
  background: rgba(56, 189, 248, 0.14);
}
.status.hold {
  color: #fcd34d;
  background: rgba(251, 191, 36, 0.14);
}
.status.idle {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
}
.status.done {
  color: #64748b;
  background: rgba(100, 116, 139, 0.14);
}
.sub {
  font-size: 10.5px;
  color: #7d8ea4;
  font-variant-numeric: tabular-nums;
}
.progress {
  margin-left: auto;
  color: #94a3b8;
}
.track {
  height: 3px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.14);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: #38bdf8;
  transition: width 90ms linear;
}
.fill.hold {
  background: #fbbf24;
}
.fill.done {
  background: #475569;
}
.fill.idle {
  background: transparent;
}
.jump {
  flex: none;
  align-self: center;
  margin-right: 4px;
  height: 22px;
  padding: 0 7px;
  font-size: 10px;
  color: #64748b;
  border-radius: 5px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: transparent;
  cursor: pointer;
}
.jump:hover {
  color: #e0f2fe;
  border-color: rgba(56, 189, 248, 0.45);
}
</style>
