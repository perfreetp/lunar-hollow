<template>
  <div class="scene-wrap">
    <canvas ref="cv" class="scene-canvas"></canvas>
    <div class="hud">
      <span class="badge">{{ lockScene?.engineLabel || '初始化…' }}</span>
      <span class="badge" :class="{ warn: store.fps > 0 && store.fps < 50 }">{{ store.fps.toFixed(0) }} FPS</span>
      <span class="badge" v-if="store.result">t = {{ formatTime(store.time) }}</span>
      <span class="badge phase" v-if="store.result">{{ phaseName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import { LockScene } from '../scene/LockScene';
import { Sampler, PHASE_NAMES } from '../sim/simulate';
import { H_PHASE } from '../sim/types';
import { store } from '../store';

const cv = ref<HTMLCanvasElement | null>(null);
const lockScene = ref<LockScene | null>(null);
let sampler: Sampler | null = null;
let resizeObs: ResizeObserver | null = null;

const phaseName = computed(() => {
  if (!store.result || !sampler) return '';
  const s = sampler.sample(store.time);
  return PHASE_NAMES[Math.round(s.header[H_PHASE])] ?? '';
});

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function rebuild() {
  if (!lockScene.value) return;
  lockScene.value.build(store.config, store.ships);
  sampler = store.result ? new Sampler(store.result) : null;
}

onMounted(async () => {
  const canvas = cv.value!;
  const ls = await LockScene.create(canvas);
  lockScene.value = ls;
  store.engineLabel = ls.engineLabel;
  rebuild();

  resizeObs = new ResizeObserver(() => ls.engine.resize());
  resizeObs.observe(canvas);

  let last = performance.now();
  let fpsTick = 0;
  ls.engine.runRenderLoop(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (store.result) {
      if (!sampler) sampler = new Sampler(store.result);
      if (store.playing) {
        store.time += dt * store.speed;
        if (store.time >= store.result.duration) {
          store.time = store.result.duration;
          store.playing = false;
        }
      }
      const s = sampler.sample(store.time);
      ls.applyFrame(s.header, s.ships);
    } else {
      ls.applyPreview();
    }
    ls.render();

    fpsTick += dt;
    if (fpsTick >= 0.5) {
      store.fps = ls.engine.getFps();
      fpsTick = 0;
    }
  });
});

watch(() => store.configVersion, rebuild);
watch(
  () => store.result,
  (r) => {
    sampler = r ? new Sampler(r) : null;
  },
);

onBeforeUnmount(() => {
  resizeObs?.disconnect();
  lockScene.value?.dispose();
  lockScene.value = null;
});
</script>

<style scoped>
.scene-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  border-radius: 8px;
  background: #0b0e12;
}
.scene-canvas {
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
  touch-action: none;
}
.hud {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  pointer-events: none;
}
.badge {
  background: rgba(10, 14, 20, 0.72);
  color: #9fd3ff;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
}
.badge.warn { color: #ffb04d; }
.badge.phase { color: #8be89b; }
</style>
