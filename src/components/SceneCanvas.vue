<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createEngine } from '../render/engine';
import { SceneManager } from '../render/SceneManager';
import { useStore } from '../store/useStore';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const store = useStore();
let mgr: SceneManager | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const handle = await createEngine(canvas);
  store.setEngineKind(handle.kind);

  mgr = new SceneManager(handle.engine, store.config, {
    onHover: (r) => store.setHovered(r),
    onGlare: (g) => store.setGlare(g),
  });
  store.setSceneManager(mgr);
  // 暴露到画布元素，供调试与自动化冒烟测试核对内部渲染状态
  canvas.__sceneManager = mgr;

  resizeObserver = new ResizeObserver(() => handle.engine.resize());
  resizeObserver.observe(canvas);
  handle.engine.runRenderLoop(() => mgr?.scene.render());
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mgr?.dispose();
  store.setSceneManager(null);
});
</script>

<template>
  <canvas ref="canvasRef" class="scene-canvas"></canvas>
</template>

<style scoped>
.scene-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}
</style>
