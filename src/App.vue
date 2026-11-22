<script setup lang="ts">
import { computed } from 'vue';
import SceneCanvas from './components/SceneCanvas.vue';
import GridControls from './components/GridControls.vue';
import SunControls from './components/SunControls.vue';
import CellControls from './components/CellControls.vue';
import CellGrid from './components/CellGrid.vue';
import GlarePanel from './components/GlarePanel.vue';
import SchemeIO from './components/SchemeIO.vue';
import { useStore } from './store/useStore';

const store = useStore();
const engineLabel = computed(() => {
  switch (store.state.engineKind) {
    case 'webgpu':
      return 'WebGPU 引擎';
    case 'webgl2':
      return 'WebGL2 回退';
    default:
      return '引擎初始化中…';
  }
});
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>航站楼玻璃幕墙透射效果渲染工具</h1>
      <span class="engine-badge" :class="store.state.engineKind">{{ engineLabel }}</span>
    </header>
    <main class="app-main">
      <div class="viewport">
        <SceneCanvas />
        <div class="viewport-tip">左键旋转 · 右键平移 · 滚轮缩放 · 悬停分格查看读数</div>
      </div>
      <aside class="side-panel">
        <SunControls />
        <GridControls />
        <CellGrid />
        <CellControls />
        <SchemeIO />
        <GlarePanel />
      </aside>
    </main>
  </div>
</template>
