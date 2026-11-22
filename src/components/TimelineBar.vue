<script setup lang="ts">
import { useStore } from '../store/useStore'

const store = useStore()

function onInput(e: Event): void {
  store.setGlobalFade(Number((e.target as HTMLInputElement).value))
}

function reset(): void {
  store.setGlobalFade(0)
}

function fullFade(): void {
  store.setGlobalFade(100)
}
</script>

<template>
  <footer class="timeline-bar panel">
    <div class="fade-label">
      <span class="dot"></span>
      全局褪色时间轴
    </div>

    <div class="rail">
      <span class="rail-end">完好<br />0%</span>
      <input
        class="timeline"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="store.state.globalFade"
        @input="onInput"
      />
      <span class="rail-end">完全褪色<br />100%</span>
    </div>

    <div class="fade-value">{{ store.state.globalFade }}%</div>

    <div class="timeline-actions">
      <button @click="reset">重置 0</button>
      <button @click="fullFade()">满褪 100</button>
    </div>

    <div class="component-hint">
      拖动时间轴将实时重算全部 {{ store.components.value.length }} 个构件的分层混合
    </div>
  </footer>
</template>

<style scoped>
.timeline-bar {
  margin: 0 10px 10px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.fade-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  white-space: nowrap;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--vermilion));
}

.rail {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.timeline {
  flex: 1;
  height: 6px;
}

.rail-end {
  color: var(--text-dim);
  font-size: 10.5px;
  line-height: 1.3;
  white-space: nowrap;
}

.fade-value {
  min-width: 52px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-2);
  background: rgba(212, 168, 75, 0.12);
  border: 1px solid rgba(212, 168, 75, 0.35);
  border-radius: 8px;
  padding: 4px 0;
}

.timeline-actions {
  display: flex;
  gap: 6px;
}

.component-hint {
  color: var(--text-dim);
  font-size: 11px;
  white-space: nowrap;
  border-left: 1px solid var(--border);
  padding-left: 16px;
}
</style>
