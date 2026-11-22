<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store/useStore'

const store = useStore()
const fpsOk = computed(() => store.state.perf.fps === 0 || store.state.perf.fps >= 30)
const latencyOk = computed(() => store.state.perf.brushLatencyMs === 0 || store.state.perf.brushLatencyMs < 80)
</script>

<template>
  <div class="perf-badge">
    <span :class="{ ok: fpsOk, bad: !fpsOk }">FPS {{ store.state.perf.fps || '—' }}</span>
    <span class="sep">|</span>
    <span :class="{ ok: latencyOk, bad: !latencyOk }">笔刷 {{ store.state.perf.brushLatencyMs || '—' }}ms</span>
    <span class="sep">|</span>
    <span>{{ store.state.tool === 'brush' ? '笔刷模式' : '轨道模式' }}</span>
  </div>
</template>

<style scoped>
.perf-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(20, 23, 28, 0.82);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 11.5px;
  color: var(--text-dim);
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 20;
  pointer-events: none;
}

.ok {
  color: var(--good);
}

.bad {
  color: var(--warn);
}

.sep {
  opacity: 0.4;
}
</style>
