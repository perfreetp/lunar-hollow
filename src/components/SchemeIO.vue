<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';

const store = useStore();
const room = computed(() => store.config.room);
const layer = computed(() => store.config);

function commitRoom(): void {
  store.rebuildAll();
}

function commitLayer(): void {
  store.rebuildAll();
}

function downloadScheme(): void {
  const text = store.exportToFile();
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${store.config.name.replace(/[\\/:*?"<>|]/g, '_') || 'curtain-wall'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function onPickFile(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const ok = store.importFromText(String(reader.result));
    if (ok) store.rebuildAll();
  };
  reader.readAsText(file);
  input.value = '';
}
</script>

<template>
  <section class="panel-block">
    <h3>室内与玻璃层</h3>
    <label class="field">
      <span>室内进深（m）<b>{{ room.depth.toFixed(1) }}</b></span>
      <input
        type="range"
        min="6"
        max="40"
        step="0.5"
        :value="room.depth"
        @input="room.depth = Number(($event.target as HTMLInputElement).value); commitRoom()"
      />
    </label>
    <label class="field">
      <span>室内半宽（m）<b>{{ room.halfWidth.toFixed(1) }}</b></span>
      <input
        type="range"
        min="4"
        max="20"
        step="0.5"
        :value="room.halfWidth"
        @input="room.halfWidth = Number(($event.target as HTMLInputElement).value); commitRoom()"
      />
    </label>
    <label class="field switch">
      <input
        type="checkbox"
        :checked="layer.doubleLayer"
        @change="layer.doubleLayer = ($event.target as HTMLInputElement).checked; commitLayer()"
      />
      <span>启用双层玻璃（同光路两层叠加）</span>
    </label>
    <label v-if="layer.doubleLayer" class="field">
      <span>层间距（m）<b>{{ layer.layerGap.toFixed(2) }}</b></span>
      <input
        type="range"
        min="0.1"
        max="2"
        step="0.05"
        :value="layer.layerGap"
        @input="layer.layerGap = Number(($event.target as HTMLInputElement).value); commitLayer()"
      />
    </label>
  </section>

  <section class="panel-block">
    <h3>方案文件</h3>
    <label class="field">
      <span>方案名称</span>
      <input
        type="text"
        :value="store.config.name"
        @change="store.config.name = ($event.target as HTMLInputElement).value"
      />
    </label>
    <div class="io-row">
      <button class="primary-btn" @click="downloadScheme">导出方案 (.json)</button>
      <label class="ghost-btn file-btn">
        载入方案
        <input type="file" accept="application/json,.json" hidden @change="onPickFile" />
      </label>
    </div>
    <p v-if="store.state.errorMessage" class="error-box">
      载入失败：{{ store.state.errorMessage }}
    </p>
  </section>
</template>
