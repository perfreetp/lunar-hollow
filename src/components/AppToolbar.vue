<script setup lang="ts">
/**
 * Top bar: scenario identity, camera mode, ghost mode, label toggle, and the
 * JSON import/export controls.
 */
import { formatDate } from '../domain/clock'

const props = defineProps<{
  name: string
  startsAt: string
  duration: number
  viewMode: 'perspective' | 'orthographic'
  ghostMode: 'off' | 'selected' | 'all'
  showLabels: boolean
  standFilter: string
  stands: Array<{ id: string; label: string }>
  frameCost: number
}>()

const emit = defineEmits<{
  (e: 'view-mode', mode: 'perspective' | 'orthographic'): void
  (e: 'ghost-mode', mode: 'off' | 'selected' | 'all'): void
  (e: 'labels', value: boolean): void
  (e: 'top-view'): void
  (e: 'stand', id: string): void
  (e: 'export'): void
  (e: 'import', file: File): void
  (e: 'reset'): void
}>()

const dateLabel = formatDate(props.startsAt)
void props.duration

function onFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('import', file)
  input.value = ''
}

function onDrop(event: DragEvent): void {
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('import', file)
}
</script>

<template>
  <header class="toolbar" @dragover.prevent @drop.prevent="onDrop">
    <div class="brand">
      <div class="mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26">
          <path d="M4 26h24M8 26V12l8-6 8 6v14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
          <path d="M16 4v6M12 13h8" stroke="currentColor" stroke-width="1.4" />
          <circle cx="16" cy="20" r="2.4" fill="#38bdf8" />
        </svg>
      </div>
      <div class="titles">
        <h1>{{ name }}</h1>
        <p>
          <span>{{ dateLabel }}</span>
          <span class="dot">·</span>
          <span>{{ duration }} 分钟时间轴</span>
          <span class="dot">·</span>
          <span class="perf" :class="{ slow: frameCost > 28 }">
            {{ frameCost.toFixed(1) }} ms/帧
          </span>
        </p>
      </div>
    </div>

    <div class="controls">
      <div class="seg" role="group" aria-label="投影方式">
        <button
          :class="{ on: viewMode === 'perspective' }"
          title="透视视角 (1)"
          @click="emit('view-mode', 'perspective')"
        >透视</button>
        <button
          :class="{ on: viewMode === 'orthographic' }"
          title="正交视角 (2)"
          @click="emit('view-mode', 'orthographic')"
        >正交</button>
      </div>

      <div class="seg" role="group" aria-label="轮廓显示">
        <button :class="{ on: ghostMode === 'all' }" title="所有车辆显示半透明轮廓" @click="emit('ghost-mode', 'all')">全量轮廓</button>
        <button :class="{ on: ghostMode === 'selected' }" title="仅选中车辆显示轮廓" @click="emit('ghost-mode', 'selected')">选中轮廓</button>
        <button :class="{ on: ghostMode === 'off' }" title="关闭半透明轮廓" @click="emit('ghost-mode', 'off')">关闭</button>
      </div>

      <label class="toggle" title="显示/隐藏岗位标签">
        <input
          type="checkbox"
          :checked="showLabels"
          @change="emit('labels', ($event.target as HTMLInputElement).checked)"
        />
        <span>岗位标签</span>
      </label>

      <label class="field">
        <span>机位</span>
        <select :value="standFilter" @change="emit('stand', ($event.target as HTMLSelectElement).value)">
          <option value="all">全部</option>
          <option v-for="s in stands" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </label>

      <button class="icon-btn" title="俯视视角 (T)" aria-label="俯视视角" @click="emit('top-view')">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 4l8 4-8 4-8-4z" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M4 12l8 4 8-4M4 16l8 4 8-4" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" />
        </svg>
      </button>

      <div class="io">
        <label class="btn" title="导入时序 JSON（也可直接拖入窗口）">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 16V4m0 0L7 9m5-5l5 5M5 16v3h14v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          导入
          <input type="file" accept="application/json,.json" hidden @change="onFile" />
        </label>
        <button class="btn primary" title="导出时序动画 JSON" @click="emit('export')">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          导出 JSON
        </button>
        <button class="btn subtle" title="恢复演示数据" @click="emit('reset')">重置</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(10, 16, 26, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #7dd3fc;
  background: radial-gradient(circle at 30% 25%, rgba(56, 189, 248, 0.25), rgba(2, 6, 23, 0.4));
  border: 1px solid rgba(56, 189, 248, 0.28);
  flex: none;
}
.titles {
  min-width: 0;
}
.titles h1 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.titles p {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 2px 0 0;
  font-size: 11px;
  color: #7d8ea4;
}
.dot {
  color: #475569;
}
.perf {
  font-variant-numeric: tabular-nums;
  color: #4ade80;
}
.perf.slow {
  color: #fbbf24;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.16);
}
.seg button {
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 11.5px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.seg button:hover {
  color: #e2e8f0;
}
.seg button.on {
  background: rgba(56, 189, 248, 0.2);
  color: #e0f2fe;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.4);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #94a3b8;
  cursor: pointer;
  user-select: none;
}
.toggle input {
  accent-color: #0ea5e9;
}
.field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #94a3b8;
}
.field select {
  height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
  font-size: 11.5px;
  cursor: pointer;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  cursor: pointer;
}
.icon-btn:hover {
  color: #e0f2fe;
  border-color: rgba(56, 189, 248, 0.45);
}
.io {
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.7);
  color: #cbd5e1;
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
}
.btn:hover {
  border-color: rgba(148, 163, 184, 0.4);
  color: #f8fafc;
}
.btn.primary {
  border-color: rgba(56, 189, 248, 0.5);
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.9), rgba(3, 105, 161, 0.9));
  color: #f0f9ff;
}
.btn.primary:hover {
  filter: brightness(1.08);
}
.btn.subtle {
  color: #7d8ea4;
}
</style>
