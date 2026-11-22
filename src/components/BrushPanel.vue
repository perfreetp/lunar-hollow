<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store/useStore'
import type { LayerMode } from '../types'

const store = useStore()

const layers: Array<{ key: LayerMode; label: string; hint: string }> = [
  { key: 'both', label: '双层混合', hint: '表层+底层（1）' },
  { key: 'base', label: '仅底层纹样', hint: '墨线稿（2）' },
  { key: 'surface', label: '仅表层颜料', hint: '颜料层（3）' }
]

const selected = computed(() =>
  store.state.selectedId ? store.components.value.find((c) => c.id === store.state.selectedId) : null
)

const fpsOk = computed(() => store.state.perf.fps === 0 || store.state.perf.fps >= 30)
const latencyOk = computed(() => store.state.perf.brushLatencyMs === 0 || store.state.perf.brushLatencyMs < 80)
</script>

<template>
  <aside class="brush-panel panel">
    <h3 class="section-title">分层显示</h3>
    <div class="layer-grid">
      <button
        v-for="l in layers"
        :key="l.key"
        :class="{ active: store.state.layerMode === l.key }"
        @click="store.setLayerMode(l.key)"
      >
        {{ l.label }}
        <small>{{ l.hint }}</small>
      </button>
    </div>

    <h3 class="section-title" style="margin-top: 18px">修复笔刷</h3>
    <div class="slider-row">
      <div class="slider-label"><span>笔刷大小</span><b>{{ store.state.brushSize.toFixed(1) }}%</b></div>
      <input
        type="range"
        min="0.5"
        max="10"
        step="0.1"
        :value="store.state.brushSize"
        @input="store.setBrushSetting({ brushSize: Number(($event.target as HTMLInputElement).value) })"
      />
    </div>
    <div class="slider-row">
      <div class="slider-label"><span>笔刷硬度</span><b>{{ Math.round(store.state.brushHardness * 100) }}%</b></div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="store.state.brushHardness"
        @input="store.setBrushSetting({ brushHardness: Number(($event.target as HTMLInputElement).value) })"
      />
    </div>
    <div class="slider-row">
      <div class="slider-label"><span>修复强度</span><b>{{ Math.round(store.state.brushStrength * 100) }}%</b></div>
      <input
        type="range"
        min="0.05"
        max="1"
        step="0.05"
        :value="store.state.brushStrength"
        @input="store.setBrushSetting({ brushStrength: Number(($event.target as HTMLInputElement).value) })"
      />
    </div>

    <p class="brush-tip">
      切换到「修复笔刷」后在模型表面按住拖动涂抹，白色修复区域会局部降低褪色程度；
      高速移动自动插值补点。快捷键 <b>B</b> 切换工具。
    </p>

    <h3 class="section-title" style="margin-top: 14px">修复历史</h3>
    <div class="history-row">
      <button :disabled="!store.state.canUndo" @click="store.undo()">↶ 撤销</button>
      <button :disabled="!store.state.canRedo" @click="store.redo()">↷ 重做</button>
      <button @click="store.clearRestore()">全部清除</button>
    </div>
    <p class="history-depth">历史笔画：{{ store.state.historyDepth }} / 20（Ctrl+Z 撤销，Ctrl+Shift+Z 重做）</p>

    <div v-if="selected" class="selected-card">
      <h3 class="section-title" style="margin-top: 14px">当前选中</h3>
      <div class="sel-name">{{ selected.name }}</div>
      <div class="sel-meta">
        <span>分组：{{ selected.group }}</span>
        <span>ID：{{ selected.id }}</span>
        <span>当前褪色：{{ store.getComponentFade(selected.id).toFixed(0) }}%</span>
      </div>
    </div>

    <h3 class="section-title" style="margin-top: 14px">性能指标</h3>
    <div class="perf-grid">
      <div class="perf-item" :class="{ ok: fpsOk, bad: !fpsOk }">
        <strong>{{ store.state.perf.fps || '—' }}</strong>
        <span>FPS（目标 ≥30）</span>
      </div>
      <div class="perf-item" :class="{ ok: latencyOk, bad: !latencyOk }">
        <strong>{{ store.state.perf.brushLatencyMs || '—' }}<small>ms</small></strong>
        <span>笔刷延迟（&lt;80ms）</span>
      </div>
      <div class="perf-item neutral">
        <strong>{{ store.state.perf.frameMs || '—' }}<small>ms</small></strong>
        <span>单帧耗时</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.brush-panel {
  width: 268px;
  flex-shrink: 0;
  padding: 14px;
  overflow-y: auto;
}

.layer-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-grid button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
}

.layer-grid small {
  color: var(--text-dim);
  font-size: 10.5px;
}

.brush-tip {
  color: var(--text-dim);
  font-size: 11.5px;
  line-height: 1.6;
  margin: 6px 0 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 7px;
  padding: 8px 10px;
}

.history-row {
  display: flex;
  gap: 6px;
}

.history-row button {
  flex: 1;
}

.history-depth {
  color: var(--text-dim);
  font-size: 11px;
  margin: 8px 0 0;
}

.selected-card {
  border-top: 1px solid var(--border);
}

.sel-name {
  font-weight: 600;
  margin-bottom: 6px;
}

.sel-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--text-dim);
  font-size: 11.5px;
}

.perf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.perf-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--panel-2);
}

.perf-item strong {
  font-size: 18px;
}

.perf-item strong small {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-dim);
  margin-left: 2px;
}

.perf-item span {
  font-size: 10.5px;
  color: var(--text-dim);
}

.perf-item.ok {
  border-color: rgba(111, 191, 139, 0.5);
}

.perf-item.ok strong {
  color: var(--good);
}

.perf-item.bad {
  border-color: rgba(224, 153, 91, 0.7);
}

.perf-item.bad strong {
  color: var(--warn);
}

.perf-item.neutral strong {
  color: var(--azurite);
}
</style>
