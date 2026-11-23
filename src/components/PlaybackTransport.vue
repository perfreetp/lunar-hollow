<script setup lang="ts">
/**
 * Playback transport: play/pause, speed, and the single-minute stepper.
 */
import { computed } from 'vue'
import { formatClock } from '../domain/clock'

const props = defineProps<{
  minute: number
  duration: number
  playing: boolean
  speed: number
  startsAt: string
  playingActors: number
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'step', delta: number): void
  (e: 'speed', value: number): void
  (e: 'jump-start'): void
  (e: 'jump-end'): void
}>()

const SPEEDS = [0.5, 1, 2, 4, 8]

const clock = computed(() => formatClock(props.startsAt, props.minute))
const elapsed = computed(() => {
  const m = Math.floor(props.minute)
  return `${String(m).padStart(2, '0')} 分 ${String(Math.floor((props.minute - m) * 60)).padStart(2, '0')} 秒`
})
</script>

<template>
  <div class="transport">
    <div class="group">
      <button class="icon" title="跳到开始 (Home)" aria-label="跳到开始" @click="emit('jump-start')">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 5h2v14H6zM19 5v14l-10-7z" fill="currentColor"/></svg>
      </button>
      <button class="icon" title="后退一分钟 (←)" aria-label="后退一分钟" @click="emit('step', -1)">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 5v14l-9-7zM17 5h2v14h-2z" fill="currentColor"/></svg>
      </button>
      <button
        class="play"
        :class="{ on: playing }"
        :title="playing ? '暂停 (空格)' : '播放 (空格)'"
        :aria-label="playing ? '暂停' : '播放'"
        @click="emit('toggle')"
      >
        <svg v-if="!playing" viewBox="0 0 24 24" width="20" height="20"><path d="M7 4l14 8-14 8z" fill="currentColor"/></svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>
      </button>
      <button class="icon" title="前进一分钟 (→)" aria-label="前进一分钟" @click="emit('step', 1)">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 5l9 7-9 7zM5 5h2v14H5z" fill="currentColor"/></svg>
      </button>
      <button class="icon" title="跳到结束 (End)" aria-label="跳到结束" @click="emit('jump-end')">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M16 5h2v14h-2zM5 5l10 7-10 7z" fill="currentColor"/></svg>
      </button>
    </div>

    <div class="group speeds" role="group" aria-label="播放速度">
      <button
        v-for="s in SPEEDS"
        :key="s"
        class="speed"
        :class="{ on: speed === s }"
        @click="emit('speed', s)"
      >{{ s }}×</button>
    </div>

    <div class="readout">
      <span class="clock">{{ clock }}</span>
      <span class="sep">·</span>
      <span class="elapsed">{{ elapsed }}</span>
      <span class="sep">·</span>
      <span class="live"><i />{{ playingActors }} 个作业中</span>
    </div>
  </div>
</template>

<style scoped>
.transport {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.group {
  display: flex;
  align-items: center;
  gap: 4px;
}
.icon,
.speed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  min-width: 30px;
  padding: 0 8px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.icon:hover,
.speed:hover {
  background: rgba(51, 65, 85, 0.7);
  color: #f1f5f9;
}
.play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 36px;
  border-radius: 9px;
  border: 1px solid rgba(56, 189, 248, 0.5);
  background: linear-gradient(180deg, #0ea5e9, #0284c7);
  color: #f8fafc;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
}
.play.on {
  background: linear-gradient(180deg, #f59e0b, #d97706);
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);
}
.speeds {
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.55);
}
.speed {
  height: 26px;
  min-width: 34px;
  border: none;
  background: transparent;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
.speed.on {
  background: rgba(56, 189, 248, 0.22);
  color: #e0f2fe;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.45);
}
.readout {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}
.clock {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.elapsed {
  font-variant-numeric: tabular-nums;
}
.sep {
  color: #475569;
}
.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.live i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
}
</style>
