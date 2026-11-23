<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LabViewport from './components/LabViewport.vue';
import AssemblyPanel from './components/AssemblyPanel.vue';
import TravelPanel from './components/TravelPanel.vue';
import PreviewPanel from './components/PreviewPanel.vue';
import ExportPanel from './components/ExportPanel.vue';
import { useLabStore } from './stores/lab';
import { PART_INFO, SOCKETS } from './core/rigSpec';
import type { PartKind } from './core/model';

const store = useLabStore();
const viewport = ref<InstanceType<typeof LabViewport> | null>(null);

type Tab = 'assembly' | 'travel' | 'preview' | 'export';
const tab = ref<Tab>('assembly');
const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: 'assembly', label: '连杆装配', hint: '拖入零件 · 吸附轴位' },
  { id: 'travel', label: '行程调节', hint: '行程 / 预压 · 联动重算' },
  { id: 'preview', label: '姿态预览', hint: '遮挡 · 层级 · 穿插' },
  { id: 'export', label: '配置导出', hint: '序列化 · 分享 · 导入' },
];

const installedCount = computed(() => store.assembly.order.length);

function onDragPart(part: PartKind, evt: PointerEvent) {
  if (!store.canInstall(part)) {
    store.pushMessage({ level: 'warn', code: 'prereq', message: `请先安装 ${PART_INFO[part].label} 的前置零件` });
    return;
  }
  viewport.value?.beginLibraryDrag(part, evt);
}

function onKey(evt: KeyboardEvent) {
  if (evt.target instanceof HTMLInputElement || evt.target instanceof HTMLTextAreaElement) return;
  if (evt.key === '1') tab.value = 'assembly';
  if (evt.key === '2') tab.value = 'travel';
  if (evt.key === '3') tab.value = 'preview';
  if (evt.key === '4') tab.value = 'export';
  if (evt.key === 'ArrowUp') store.stepTravel(1);
  if (evt.key === 'ArrowDown') store.stepTravel(-1);
  if (evt.key === 'r' || evt.key === 'R') store.setPreviewTravel(0);
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <span />
        </span>
        <div class="brand-text">
          <h1>RC 悬挂姿态实验室</h1>
          <p>Suspension Attitude Lab · Vue 3 + Babylon.js</p>
        </div>
      </div>
      <nav class="tabs" role="tablist">
        <button
          v-for="(t, i) in tabs"
          :key="t.id"
          role="tab"
          :aria-selected="tab === t.id"
          :class="{ active: tab === t.id }"
          :data-testid="`tab-${t.id}`"
          @click="tab = t.id"
        >
          <span class="tab-index mono">0{{ i + 1 }}</span>
          <span class="tab-label">{{ t.label }}</span>
          <span class="tab-hint">{{ t.hint }}</span>
        </button>
      </nav>
      <div class="topbar-status">
        <span class="chip" :class="{ ok: store.assemblyComplete }">
          {{ installedCount }}/4 零件
        </span>
        <span class="chip mono">{{ store.signature }}</span>
        <button class="ghost-btn" data-testid="reset-all" @click="store.resetAll()">重置全部</button>
      </div>
    </header>

    <main class="workspace">
      <div class="stage">
        <LabViewport ref="viewport" />
      </div>
      <aside class="dock" data-testid="dock">
        <AssemblyPanel v-show="tab === 'assembly'" @drag-part="onDragPart" />
        <TravelPanel v-show="tab === 'travel'" />
        <PreviewPanel v-show="tab === 'preview'" />
        <ExportPanel v-show="tab === 'export'" />
      </aside>
    </main>

    <footer class="bottombar">
      <div class="flow">
        <template v-for="(part, i) in store.assembly.order" :key="part">
          <span class="flow-node" :style="{ '--tone': PART_INFO[part].tone }">
            {{ PART_INFO[part].label }}
          </span>
          <span v-if="i < store.assembly.order.length - 1" class="flow-arrow">→</span>
        </template>
        <span v-if="!store.assembly.order.length" class="flow-empty">零件库为空 · 从左侧拖入零件开始装配</span>
      </div>
      <div class="kbd-hints">
        <span><kbd>1</kbd>–<kbd>4</kbd> 切换模块</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> 微调行程</span>
        <span><kbd>R</kbd> 回中</span>
      </div>
    </footer>
  </div>
</template>

<style>
/* ---------------------------------------------------------------- *
 * Design tokens — dark instrument-panel look, single visual theme.
 * ---------------------------------------------------------------- */
:root {
  --bg-0: #070a0f;
  --bg-1: #0b1017;
  --bg-2: #101722;
  --bg-3: #16202c;
  --line: rgba(122, 158, 199, 0.16);
  --line-strong: rgba(122, 158, 199, 0.3);
  --fg: #e6eef8;
  --fg-dim: #93a5ba;
  --fg-faint: #63758a;
  --accent: #4fd1c5;
  --accent-2: #63b3ed;
  --accent-3: #f6ad55;
  --accent-4: #b794f4;
  --danger: #f56565;
  --ok: #68d391;
  --warn: #f6ad55;
  --radius: 14px;
  --shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

body {
  background:
    radial-gradient(1200px 700px at 12% -10%, #14202e 0%, transparent 58%),
    radial-gradient(900px 500px at 96% 4%, #101b26 0%, transparent 55%),
    var(--bg-0);
  color: var(--fg);
  font-family: 'Inter', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

.mono {
  font-family: 'JetBrains Mono', 'Cascadia Mono', 'SFMono-Regular', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

.dim {
  color: var(--fg-faint);
}

.app-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 0;
}

/* ------------------------------ topbar ------------------------------ */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(16, 23, 34, 0.92), rgba(10, 14, 20, 0.72));
  backdrop-filter: blur(14px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(140deg, rgba(79, 209, 197, 0.22), rgba(99, 179, 237, 0.1));
  border: 1px solid rgba(79, 209, 197, 0.35);
  box-shadow: inset 0 0 18px rgba(79, 209, 197, 0.16);
}

.brand-mark span {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  border-right-color: transparent;
  animation: spin 3.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.brand-text h1 {
  font-size: 15px;
  margin: 0;
  letter-spacing: 0.02em;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 10.5px;
  color: var(--fg-faint);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tabs {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.tabs button {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 0 8px;
  padding: 8px 16px;
  border-radius: 11px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--fg-dim);
  cursor: pointer;
  text-align: left;
  transition: background 0.16s, border-color 0.16s, color 0.16s;
}

.tabs button:hover {
  background: rgba(99, 179, 237, 0.08);
  color: var(--fg);
}

.tabs button.active {
  background: linear-gradient(160deg, rgba(79, 209, 197, 0.16), rgba(99, 179, 237, 0.08));
  border-color: rgba(79, 209, 197, 0.38);
  color: var(--fg);
}

.tab-index {
  grid-row: span 2;
  font-size: 10px;
  color: var(--accent);
  opacity: 0.75;
  align-self: center;
}

.tab-label {
  font-size: 13px;
  font-weight: 600;
}

.tab-hint {
  font-size: 10px;
  color: var(--fg-faint);
  letter-spacing: 0.02em;
}

.topbar-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(120, 160, 200, 0.1);
  border: 1px solid var(--line);
  color: var(--fg-dim);
  white-space: nowrap;
}

.chip.ok {
  color: var(--ok);
  border-color: rgba(104, 211, 145, 0.35);
  background: rgba(104, 211, 145, 0.1);
}

/* ----------------------------- workspace ----------------------------- */
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 14px;
  padding: 14px 16px;
  min-height: 0;
}

.stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: radial-gradient(120% 90% at 50% 0%, #121b26 0%, #070a0f 78%);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.dock {
  min-height: 0;
  overflow-y: auto;
  overflow-anchor: none;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 160, 200, 0.28) transparent;
}

.dock::-webkit-scrollbar {
  width: 8px;
}

.dock::-webkit-scrollbar-thumb {
  background: rgba(120, 160, 200, 0.24);
  border-radius: 8px;
}

/* ------------------------------ viewport ---------------------------- */
.viewport {
  position: absolute;
  inset: 0;
}

.viewport-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}

.viewport.is-dragging .viewport-canvas {
  cursor: grabbing;
}

.viewport-hud {
  position: absolute;
  left: 14px;
  top: 14px;
  width: 168px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(9, 13, 19, 0.78);
  border: 1px solid var(--line);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.hud-title {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.hud-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2px 0;
}

.hud-line.sub {
  opacity: 0.72;
}

.hud-key {
  color: var(--fg-faint);
  font-size: 11px;
}

.hud-val {
  font-family: 'JetBrains Mono', 'Cascadia Mono', ui-monospace, monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--fg);
}

.viewport-stats {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  pointer-events: none;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--fg-dim);
  background: rgba(9, 13, 19, 0.8);
  border: 1px solid var(--line);
}

.stat.warn {
  color: var(--warn);
  border-color: rgba(246, 173, 85, 0.36);
}

.stat .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 8px var(--ok);
}

.stat.warn .dot {
  background: var(--warn);
  box-shadow: 0 0 8px var(--warn);
}

.viewport-corner {
  position: absolute;
  right: 14px;
  top: 14px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 260px;
}

.mini {
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(9, 13, 19, 0.78);
  color: var(--fg-dim);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.mini:hover {
  color: var(--fg);
  border-color: var(--line-strong);
}

.mini.on {
  color: var(--accent);
  border-color: rgba(79, 209, 197, 0.45);
  background: rgba(79, 209, 197, 0.12);
}

.viewport-tip {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--fg-faint);
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(9, 13, 19, 0.68);
  border: 1px solid var(--line);
  pointer-events: none;
  white-space: nowrap;
}

.viewport-loading,
.viewport-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 8px;
  color: var(--fg-dim);
}

.viewport-error {
  color: var(--danger);
  background: rgba(9, 13, 19, 0.82);
}

.viewport-error pre {
  max-width: 80%;
  white-space: pre-wrap;
  font-size: 11px;
  color: var(--fg-dim);
  margin: 0 auto;
}

.drag-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 60;
  display: none;
}

.drag-ghost-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px dashed currentColor;
  transform: translate(-50%, -50%);
  animation: pulse 1.1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.18);
    opacity: 0.55;
  }
}

.drag-ghost-label {
  position: absolute;
  left: 50%;
  top: 26px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: rgba(9, 13, 19, 0.9);
}

.socket-chip {
  position: absolute;
  transform: translate(-50%, -140%);
  font-size: 10.5px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: rgba(9, 13, 19, 0.86);
  white-space: nowrap;
  pointer-events: none;
}

.socket-chip.active {
  font-weight: 600;
  box-shadow: 0 0 16px currentColor;
}

.viewport-legend {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.clearance-badges {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 300px;
}

.clearance-badge {
  display: inline-flex;
  gap: 8px;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(9, 13, 19, 0.8);
  border: 1px solid rgba(104, 211, 145, 0.26);
  color: var(--fg-dim);
}

.clearance-badge b {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: var(--ok);
}

.clearance-badge.bad {
  border-color: rgba(245, 101, 101, 0.5);
  background: rgba(60, 14, 18, 0.72);
}

.clearance-badge.bad b {
  color: var(--danger);
}

/* ------------------------------- panel ------------------------------ */
.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(16, 23, 34, 0.9), rgba(10, 14, 20, 0.86));
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.panel-head h2 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.02em;
}

.panel-head p {
  margin: 3px 0 0;
  font-size: 11px;
  color: var(--fg-faint);
  line-height: 1.5;
}

.head-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ghost-btn {
  padding: 5px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.06);
  color: var(--fg-dim);
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.ghost-btn:hover {
  color: var(--fg);
  border-color: var(--line-strong);
  background: rgba(120, 160, 200, 0.12);
}

.ghost-btn.active {
  color: var(--accent);
  border-color: rgba(79, 209, 197, 0.42);
  background: rgba(79, 209, 197, 0.12);
}

.primary {
  padding: 7px 14px;
  border-radius: 9px;
  border: 1px solid rgba(79, 209, 197, 0.5);
  background: linear-gradient(160deg, rgba(79, 209, 197, 0.26), rgba(99, 179, 237, 0.14));
  color: #eafffb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.primary:hover {
  background: linear-gradient(160deg, rgba(79, 209, 197, 0.4), rgba(99, 179, 237, 0.22));
  box-shadow: 0 0 18px rgba(79, 209, 197, 0.22);
}

.block-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-faint);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 6px;
}

.block-head.sub {
  margin-top: 10px;
}

/* ---------------------------- assembly ---------------------------- */
.library {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.part-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 9px 11px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
  cursor: grab;
  transition: border-color 0.16s, background 0.16s, transform 0.16s;
  user-select: none;
  touch-action: none;
}

.part-card:hover {
  border-color: color-mix(in srgb, var(--tone) 50%, transparent);
  background: rgba(120, 160, 200, 0.1);
}

.part-card.selected {
  border-color: color-mix(in srgb, var(--tone) 60%, transparent);
}

.part-card.installed {
  background: color-mix(in srgb, var(--tone) 10%, transparent);
  border-color: color-mix(in srgb, var(--tone) 34%, transparent);
  cursor: default;
}

.part-card.over {
  border-color: rgba(245, 101, 101, 0.62);
  background: rgba(70, 16, 20, 0.4);
}

.part-card.over .part-title strong {
  color: #ffb3b3;
}

.part-card.forced {
  border-color: rgba(246, 173, 85, 0.55);
  background: rgba(60, 40, 14, 0.34);
}

.part-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.part-card.dragging {
  opacity: 0.4;
}

.part-glyph {
  width: 44px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
  display: grid;
  place-items: center;
}

.glyph-core {
  display: block;
  width: 26px;
  height: 6px;
  border-radius: 3px;
  background: var(--tone);
  box-shadow: 0 0 14px color-mix(in srgb, var(--tone) 60%, transparent);
}

.glyph-knuckle .glyph-core {
  width: 10px;
  height: 24px;
  border-radius: 4px;
}

.glyph-tieRod .glyph-core {
  width: 30px;
  height: 4px;
}

.glyph-upperArm .glyph-core {
  width: 20px;
  height: 5px;
}

.part-body {
  min-width: 0;
}

.part-title {
  display: flex;
  align-items: baseline;
  gap: 7px;
}

.part-title strong {
  font-size: 13px;
}

.part-title em {
  font-size: 10px;
  color: var(--fg-faint);
  font-style: normal;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.part-blurb {
  margin: 2px 0 4px;
  font-size: 10.5px;
  color: var(--fg-faint);
  line-height: 1.45;
}

.part-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line);
  color: var(--fg-dim);
}

.tag.ok {
  color: var(--ok);
  border-color: rgba(104, 211, 145, 0.34);
}

.tag.ready {
  color: var(--accent-2);
  border-color: rgba(99, 179, 237, 0.34);
}

.tag.lock {
  color: var(--warn);
  border-color: rgba(246, 173, 85, 0.32);
}

.detach {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--fg-faint);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.detach:hover {
  color: var(--danger);
  border-color: rgba(245, 101, 101, 0.4);
}

.socket-map ul {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.socket-map li {
  display: grid;
  grid-template-columns: 10px 74px 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--fg-faint);
  padding: 3px 0;
}

.socket-map li.filled {
  color: var(--fg-dim);
}

.socket-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid currentColor;
}

.socket-map li.filled .socket-dot {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.socket-name {
  color: var(--fg-dim);
}

.socket-hint {
  font-size: 10px;
  color: var(--fg-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.socket-map-head {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-faint);
  margin-bottom: 4px;
}

.tolerance-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: var(--fg-faint);
}

.tolerance-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 18px;
  background: transparent;
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(79, 209, 197, 0.4), rgba(99, 179, 237, 0.24));
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 50%;
  background: #0c1219;
  border: 2px solid var(--accent);
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
}

input[type='range']::-moz-range-track {
  height: 4px;
  border-radius: 4px;
  background: rgba(99, 179, 237, 0.3);
}

input[type='range']::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0c1219;
  border: 2px solid var(--accent);
}

.detail {
  padding: 10px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.detail-head .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.detail-head em {
  margin-left: auto;
  font-style: normal;
  font-size: 10.5px;
  color: var(--fg-faint);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--fg-faint);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper button {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.08);
  color: var(--fg-dim);
  cursor: pointer;
}

.stepper b {
  min-width: 66px;
  text-align: center;
  color: var(--fg);
  font-size: 12px;
}

.detail-note {
  margin: 8px 0 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--fg-faint);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg {
  margin: 0;
  font-size: 11px;
  padding: 6px 9px;
  border-radius: 8px;
  border-left: 2px solid var(--line-strong);
  background: rgba(120, 160, 200, 0.07);
  color: var(--fg-dim);
  line-height: 1.45;
}

.msg.warn {
  border-left-color: var(--warn);
  color: #ffd9a3;
}

.msg.error {
  border-left-color: var(--danger);
  color: #ffb9b9;
}

.msg.info {
  border-left-color: var(--accent-2);
}

.assembly-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--fg-faint);
}

/* ----------------------------- travel ----------------------------- */
.travel-scale {
  padding: 10px 11px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
}

.scale-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-faint);
  margin-bottom: 4px;
}

.scale-head .mono {
  color: var(--accent);
  font-size: 13px;
}

.scale-wrap {
  position: relative;
}

.scale-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 6px;
  height: 6px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(99, 179, 237, 0.22), rgba(246, 173, 85, 0.18));
  pointer-events: none;
}

.scale-zero {
  position: absolute;
  top: -2px;
  width: 1px;
  height: 10px;
  background: rgba(230, 238, 248, 0.6);
}

.scale-preload {
  position: absolute;
  top: -2px;
  width: 1px;
  height: 10px;
  background: var(--accent-3);
  box-shadow: 0 0 8px var(--accent-3);
}

.scale-input {
  position: relative;
  height: 18px;
}

.scale-legend {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--fg-faint);
  margin-top: 2px;
}

.scale-legend .mid {
  color: var(--fg-dim);
}

.scale-note {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: var(--fg-faint);
}

.scale-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.scale-buttons button {
  flex: 1;
  padding: 4px 0;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.07);
  color: var(--fg-dim);
  font-size: 11px;
  cursor: pointer;
}

.scale-buttons button:hover {
  color: var(--fg);
  border-color: var(--line-strong);
}

.slider-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-dim);
}

.slider-label em {
  font-style: normal;
  color: var(--accent-3);
  font-size: 11px;
}

.dims {
  padding-top: 4px;
}

.dims-head {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-faint);
  border-bottom: 1px solid var(--line);
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.dim-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dim-row {
  display: grid;
  grid-template-columns: 78px 1fr 46px;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--fg-dim);
}

.dim-row b {
  text-align: right;
  color: var(--fg);
  font-size: 11px;
}

.dim-more summary {
  cursor: pointer;
  font-size: 11px;
  color: var(--fg-faint);
  padding: 5px 0 3px;
}

.dim-more[open] summary {
  color: var(--accent-2);
}

.charts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
  font-size: 10.5px;
  color: var(--fg-faint);
}

.metric b {
  color: var(--fg);
  font-size: 12px;
}

.metric.warn b {
  color: var(--warn);
}

.presets {
  display: flex;
  gap: 6px;
}

.preset {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
  color: var(--fg-dim);
  cursor: pointer;
  text-align: left;
}

.preset strong {
  font-size: 12px;
  color: var(--fg);
}

.preset span {
  font-size: 10px;
  color: var(--fg-faint);
  line-height: 1.35;
}

.preset:hover {
  border-color: var(--line-strong);
}

.preset.active {
  border-color: rgba(79, 209, 197, 0.44);
  background: rgba(79, 209, 197, 0.1);
}

/* ----------------------------- preview ---------------------------- */
.preview-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.preview-block {
  padding: 10px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
}

.layer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.layer-list li {
  display: grid;
  grid-template-columns: 16px 8px 1fr auto auto;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(9, 13, 19, 0.55);
  border: 1px solid var(--line);
  font-size: 12px;
}

.layer-list .rank {
  color: var(--fg-faint);
  font-size: 10px;
}

.layer-list .tone,
.occlusion-list .tone,
.conn-list i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--tone);
  box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 60%, transparent);
}

.layer-state {
  font-size: 10px;
  color: var(--ok);
}

.layer-state.off {
  color: var(--fg-faint);
}

.move {
  display: flex;
  gap: 3px;
}

.move button {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--fg-dim);
  cursor: pointer;
  font-size: 10px;
}

.move button:disabled {
  opacity: 0.3;
  cursor: default;
}

.move button:not(:disabled):hover {
  color: var(--accent);
  border-color: rgba(79, 209, 197, 0.4);
}

.hint {
  margin: 7px 0 0;
  font-size: 10.5px;
  color: var(--fg-faint);
  line-height: 1.5;
}

.hint.ok {
  color: var(--ok);
}

.occlusion-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.occlusion-list li {
  display: grid;
  grid-template-columns: 8px 60px 1fr 40px 34px;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--fg-dim);
}

.meter {
  height: 5px;
  border-radius: 4px;
  background: rgba(120, 160, 200, 0.12);
  overflow: hidden;
}

.meter span {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--accent), var(--accent-3));
  transition: width 0.18s;
}

.clearance-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--line);
}

.clearance-line {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--fg-dim);
}

.clearance-line b {
  color: var(--ok);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.clearance-line b.bad {
  color: var(--danger);
}

.contact-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--fg-dim);
}

.contact-list li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-list b {
  margin-left: auto;
  color: var(--danger);
}

.pill {
  font-size: 9.5px;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--line);
}

.pill.bad {
  color: #ffb9b9;
  border-color: rgba(245, 101, 101, 0.4);
  background: rgba(245, 101, 101, 0.1);
}

.visibility-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.vis-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.06);
  color: var(--fg-faint);
  font-size: 11px;
  cursor: pointer;
}

.vis-btn i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--fg-faint);
}

.vis-btn.on {
  color: var(--fg);
  border-color: color-mix(in srgb, var(--tone) 44%, transparent);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
}

.vis-btn.on i {
  background: var(--tone);
  box-shadow: 0 0 8px var(--tone);
}

.diag {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.diag-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-faint);
  padding: 3px 0;
  border-bottom: 1px dashed rgba(122, 158, 199, 0.1);
}

.diag-row b {
  color: var(--fg-dim);
}

.layer-note p {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--fg-faint);
}

/* ------------------------------ export ---------------------------- */
.sig {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(79, 209, 197, 0.34);
  color: var(--accent);
  background: rgba(79, 209, 197, 0.08);
}

.export-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-block {
  padding: 10px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: rgba(120, 160, 200, 0.05);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10.5px;
  color: var(--fg-faint);
  margin-bottom: 7px;
}

.field input,
.field textarea,
.import-text {
  width: 100%;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(7, 10, 15, 0.7);
  color: var(--fg);
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.import-text:focus {
  outline: none;
  border-color: rgba(79, 209, 197, 0.5);
  box-shadow: 0 0 0 2px rgba(79, 209, 197, 0.12);
}

.export-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.file-name {
  margin: 8px 0 0;
  font-size: 10.5px;
  color: var(--fg-faint);
  word-break: break-all;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-faint);
  padding: 2px 0;
}

.summary-row b {
  color: var(--fg-dim);
}

.conn-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.conn-list li {
  display: grid;
  grid-template-columns: 8px 74px 1fr auto;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--fg-dim);
  padding: 3px 0;
}

.conn-list li.missing {
  opacity: 0.55;
}

.conn-list b.bad {
  color: var(--danger);
}

.dim-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 10px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--line);
}

.dim-cell {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--fg-faint);
}

.dim-cell b {
  color: var(--fg-dim);
}

.json-preview {
  margin: 0;
  max-height: 220px;
  overflow: auto;
  padding: 9px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(5, 8, 12, 0.8);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10.5px;
  line-height: 1.5;
  color: #a9c1d8;
  white-space: pre;
}

.import-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.hidden-input {
  display: none;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.import-error {
  font-size: 11px;
  color: var(--danger);
}

.import-log {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10.5px;
  color: var(--fg-faint);
}

.import-log li.warn {
  color: var(--warn);
}

.import-log li.error {
  color: var(--danger);
}

.validation ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.validation li {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--fg-faint);
}

.validation li i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ok);
}

.validation li.warn {
  color: var(--warn);
}

.validation li.warn i {
  background: var(--warn);
  box-shadow: 0 0 8px var(--warn);
}

/* ----------------------------- bottombar --------------------------- */
.bottombar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 20px;
  border-top: 1px solid var(--line);
  background: rgba(10, 14, 20, 0.8);
  font-size: 11px;
  color: var(--fg-faint);
}

.flow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.flow-node {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
  background: color-mix(in srgb, var(--tone) 10%, transparent);
  color: color-mix(in srgb, var(--tone) 82%, white);
  font-size: 11px;
}

.flow-arrow {
  color: var(--fg-faint);
}

.flow-empty {
  color: var(--fg-faint);
}

.kbd-hints {
  display: flex;
  gap: 14px;
}

kbd {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 5px;
  border: 1px solid var(--line-strong);
  background: rgba(120, 160, 200, 0.1);
  color: var(--fg-dim);
}

/* ---------------------------- responsive --------------------------- */
@media (max-width: 1500px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr) 330px;
  }
  /* The tab bar is the only module switcher, so compress it instead of hiding it. */
  .tabs button {
    padding: 6px 10px;
  }
  .tab-hint {
    display: none;
  }
  .tab-index {
    font-size: 9px;
  }
  .brand-text p {
    display: none;
  }
}

@media (max-width: 640px) {
  /* The 3D stage is small on a phone, so the overlays have to give way to it. */
  .viewport-hud {
    top: 8px;
    left: 8px;
    width: auto;
    max-width: 46%;
    padding: 7px 9px;
  }
  .hud-title {
    display: none;
  }
  .hud-line.sub {
    display: none;
  }
  .viewport-hud {
    width: 128px;
    max-width: 128px;
  }
  .hud-key {
    font-size: 10px;
  }
  .hud-val {
    font-size: 10.5px;
  }
  .viewport-corner {
    top: 8px;
    right: 8px;
    max-width: 46%;
    gap: 4px;
  }
  .mini {
    padding: 3px 7px;
    font-size: 10px;
  }
  .viewport-tip {
    display: none;
  }
  .viewport-stats {
    right: 8px;
    bottom: 8px;
  }
  .stat {
    font-size: 10px;
    padding: 3px 7px;
  }
  .clearance-badges {
    left: 8px;
    bottom: 8px;
    max-width: 46%;
  }
  .hud-line {
    justify-content: flex-start;
    gap: 6px;
  }
  .hud-val {
    font-variant-numeric: tabular-nums;
  }
  .clearance-badge {
    font-size: 10px;
    padding: 3px 7px;
  }
  .bottombar {
    padding: 6px 10px;
  }
  .topbar {
    padding: 9px 12px;
  }
  .workspace {
    padding: 9px 10px;
    gap: 10px;
  }
  .dock {
    padding-right: 0;
  }
  .panel {
    padding: 11px;
  }
  .metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  body {
    overflow: auto;
  }
  .app-shell {
    grid-template-rows: auto auto auto auto;
    height: auto;
  }
  .topbar {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .stage {
    height: 62vh;
    min-height: 380px;
  }
  .dock {
    overflow: visible;
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
  .kbd-hints {
    display: none;
  }
}
</style>
