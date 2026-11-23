<template>
  <div class="replay-page" v-if="store.result">
    <div class="main-col">
      <SceneView />
      <div class="panel timeline">
        <div class="row">
          <button class="ghost" @click="store.playing = !store.playing">{{ store.playing ? '暂停' : '播放' }}</button>
          <button class="ghost" @click="store.time = 0">⏮</button>
          <div class="speed-btns">
            <button v-for="s in [0.5, 1, 2, 4, 8]" :key="s" :class="{ active: store.speed === s }" @click="store.speed = s">{{ s }}×</button>
          </div>
          <span class="clock">{{ fmt(store.time) }} / {{ fmt(store.result.duration) }}</span>
        </div>
        <div class="track" ref="trackRef" @pointerdown="onScrub">
          <div class="fill" :style="{ width: pct + '%' }"></div>
          <div
            v-for="(m, i) in markers" :key="i"
            class="marker" :class="m.type"
            :style="{ left: m.pct + '%' }"
            :title="`${fmt(m.t)} ${m.message}`"
          ></div>
          <div class="knob" :style="{ left: pct + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="side-col scroll">
      <div class="panel">
        <h3>当前时刻数据 t = {{ store.time.toFixed(1) }} s</h3>
        <div class="stat"><span>阶段</span><b>{{ phaseName }}</b></div>
        <div class="stat"><span>闸室水位</span><b>{{ frame!.header[H_WATER].toFixed(2) }} m</b></div>
        <div class="stat"><span>上游闸门开度</span><b>{{ frame!.header[H_UP_GATE].toFixed(1) }}°</b></div>
        <div class="stat"><span>下游闸门开度</span><b>{{ frame!.header[H_DOWN_GATE].toFixed(1) }}°</b></div>
      </div>
      <div class="panel">
        <h3>船舶逐船数据</h3>
        <table class="data">
          <thead><tr><th>船名</th><th>状态</th><th>x</th><th>z</th><th>v(m/s)</th></tr></thead>
          <tbody>
            <tr v-for="(s, i) in store.result.ships" :key="s.id">
              <td>{{ s.name }}</td>
              <td>{{ SHIP_STATE_NAMES[shipState(i)] }}</td>
              <td>{{ shipVal(i, 0).toFixed(1) }}</td>
              <td>{{ shipVal(i, 1).toFixed(1) }}</td>
              <td>{{ shipVal(i, 2).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="empty panel" v-else>
    <h3>暂无仿真数据</h3>
    <p>请先到「过闸流程控制」运行仿真。</p>
    <button @click="$router.push('/control')">前往流程控制</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import SceneView from '../components/SceneView.vue';
import { store } from '../store';
import { Sampler, PHASE_NAMES, SHIP_STATE_NAMES } from '../sim/simulate';
import { H_WATER, H_UP_GATE, H_DOWN_GATE, H_PHASE, SHIP_STRIDE } from '../sim/types';
import type { SimResult } from '../sim/types';

const trackRef = ref<HTMLElement | null>(null);

let cached: { res: SimResult; sampler: Sampler } | null = null;
const frame = computed(() => {
  const r = store.result;
  if (!r) return null;
  if (!cached || cached.res !== r) cached = { res: r, sampler: new Sampler(r) };
  return cached.sampler.sample(store.time);
});

const phaseName = computed(() => (frame.value ? PHASE_NAMES[Math.round(frame.value.header[H_PHASE])] : ''));
const pct = computed(() => (store.result ? (store.time / store.result.duration) * 100 : 0));

const markers = computed(() => {
  const r = store.result;
  if (!r) return [];
  return r.events
    .filter((e) => e.type === 'phase' || e.type === 'collision')
    .map((e) => ({ t: e.t, type: e.type, message: e.message, pct: (e.t / r.duration) * 100 }));
});

function shipState(i: number) {
  return Math.round(frame.value!.ships[i * SHIP_STRIDE + 3]);
}
function shipVal(i: number, k: number) {
  return frame.value!.ships[i * SHIP_STRIDE + k];
}

function onScrub(e: PointerEvent) {
  const el = trackRef.value;
  if (!el || !store.result) return;
  store.playing = false;
  const seek = (ev: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    store.time = ratio * store.result!.duration;
  };
  seek(e);
  const move = (ev: PointerEvent) => seek(ev);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<style scoped>
.replay-page { display: grid; grid-template-columns: 1fr 340px; gap: 12px; height: 100%; }
.main-col { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.main-col > :first-child { flex: 1; min-height: 0; }
.timeline { display: flex; flex-direction: column; gap: 10px; }
.row { display: flex; align-items: center; gap: 10px; }
.clock { margin-left: auto; font-variant-numeric: tabular-nums; color: var(--muted); font-size: 13px; }
.track {
  position: relative; height: 22px; border-radius: 6px;
  background: var(--panel2); border: 1px solid var(--border);
  cursor: pointer; overflow: hidden;
}
.fill { position: absolute; inset: 0 auto 0 0; background: rgba(47, 127, 208, 0.35); }
.marker {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: #4f7fbf; opacity: 0.8;
}
.marker.collision { background: var(--danger); width: 3px; opacity: 1; }
.knob {
  position: absolute; top: 2px; bottom: 2px; width: 4px; margin-left: -2px;
  background: #fff; border-radius: 2px;
}
.side-col { display: flex; flex-direction: column; gap: 10px; }
.stat { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
.stat span { color: var(--muted); }
.stat b { font-variant-numeric: tabular-nums; }
.empty { max-width: 420px; margin: 60px auto; text-align: center; }
.empty p { color: var(--muted); }
</style>
