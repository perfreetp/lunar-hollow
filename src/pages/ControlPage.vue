<template>
  <div class="control-page">
    <div class="main-col">
      <SceneView />
      <div class="panel transport">
        <button :disabled="store.running" @click="runSimulation()">{{ store.result ? '重新仿真' : '开始仿真' }}</button>
        <button class="ghost" :disabled="!store.result" @click="store.playing = !store.playing">
          {{ store.playing ? '暂停' : '播放' }}
        </button>
        <button class="ghost" :disabled="!store.result" @click="resetSimulation()">重置</button>
        <div class="speed-btns">
          <button v-for="s in [0.5, 1, 2, 4, 8]" :key="s" :class="{ active: store.speed === s }" @click="store.speed = s">
            {{ s }}×
          </button>
        </div>
        <input
          v-if="store.result" class="scrub" type="range"
          :max="store.result.duration" :step="0.1"
          v-model.number="store.time"
        />
        <span v-if="store.result" class="time">{{ fmt(store.time) }} / {{ fmt(store.result.duration) }}</span>
        <span v-if="store.running" class="tag warn">仿真计算中…</span>
      </div>
    </div>

    <div class="side-col scroll">
      <div class="panel status" v-if="frame">
        <h3>实时状态</h3>
        <div class="stat"><span>当前阶段</span><b class="ok">{{ phaseName }}</b></div>
        <div class="stat"><span>闸室水位</span><b>{{ frame.header[H_WATER].toFixed(2) }} m</b></div>
        <div class="stat"><span>上游闸门</span><b>{{ frame.header[H_UP_GATE].toFixed(0) }}°</b></div>
        <div class="stat"><span>下游闸门</span><b>{{ frame.header[H_DOWN_GATE].toFixed(0) }}°</b></div>
        <div class="stat"><span>碰撞次数</span><b :class="{ danger: store.result!.collisions > 0 }">{{ store.result!.collisions }}</b></div>
      </div>

      <div class="panel" v-if="frame">
        <h3>船舶状态</h3>
        <table class="data">
          <thead><tr><th>船名</th><th>状态</th><th>位置z</th><th>速度</th></tr></thead>
          <tbody>
            <tr v-for="(s, i) in store.result!.ships" :key="s.id">
              <td>{{ s.name }}</td>
              <td><span class="tag" :class="stateClass(shipState(i))">{{ SHIP_STATE_NAMES[shipState(i)] }}</span></td>
              <td>{{ shipZ(i).toFixed(1) }}</td>
              <td>{{ shipV(i).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel" v-if="visibleEvents.length">
        <h3>事件日志</h3>
        <div class="events scroll" ref="eventBox">
          <div v-for="(e, i) in visibleEvents" :key="i" class="event" :class="e.type">
            <span class="t">{{ fmt(e.t) }}</span>
            <span>{{ e.message }}</span>
          </div>
        </div>
      </div>

      <div class="panel" v-if="!store.result">
        <h3>提示</h3>
        <p class="hint">点击「开始仿真」计算全部过闸轨迹;仿真完成后可播放、调速,或到「时间轴回放」逐帧查看。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import SceneView from '../components/SceneView.vue';
import { store, runSimulation, resetSimulation } from '../store';
import { Sampler, PHASE_NAMES, SHIP_STATE_NAMES } from '../sim/simulate';
import { H_WATER, H_UP_GATE, H_DOWN_GATE, H_PHASE, SHIP_STRIDE } from '../sim/types';
import type { SimResult } from '../sim/types';

const eventBox = ref<HTMLElement | null>(null);

let cached: { res: SimResult; sampler: Sampler } | null = null;
const frame = computed(() => {
  const r = store.result;
  if (!r) return null;
  if (!cached || cached.res !== r) cached = { res: r, sampler: new Sampler(r) };
  return cached.sampler.sample(store.time);
});

const phaseName = computed(() =>
  frame.value ? PHASE_NAMES[Math.round(frame.value.header[H_PHASE])] : '',
);

function shipState(i: number) {
  return Math.round(frame.value!.ships[i * SHIP_STRIDE + 3]);
}
function shipZ(i: number) {
  return frame.value!.ships[i * SHIP_STRIDE + 1];
}
function shipV(i: number) {
  return frame.value!.ships[i * SHIP_STRIDE + 2];
}
function stateClass(s: number) {
  return s === 4 ? 'ok' : s === 2 ? 'warn' : '';
}

const visibleEvents = computed(() => {
  if (!store.result) return [];
  return store.result.events.filter((e) => e.t <= store.time + 1e-6).slice(-200);
});

watch(visibleEvents, async () => {
  await nextTick();
  if (eventBox.value) eventBox.value.scrollTop = eventBox.value.scrollHeight;
});

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
</script>

<style scoped>
.control-page {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 12px;
  height: 100%;
}
.main-col { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.main-col > :first-child { flex: 1; min-height: 0; }
.transport { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.scrub { flex: 1; min-width: 120px; accent-color: var(--accent); }
.time { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 12.5px; white-space: nowrap; }
.side-col { display: flex; flex-direction: column; gap: 10px; }
.stat { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
.stat span { color: var(--muted); }
.stat b { font-variant-numeric: tabular-nums; }
.stat b.ok { color: var(--ok); }
.stat b.danger { color: var(--danger); }
.events { max-height: 220px; display: flex; flex-direction: column; gap: 2px; }
.event { font-size: 12.5px; display: flex; gap: 8px; }
.event .t { color: var(--muted); font-variant-numeric: tabular-nums; flex: none; }
.event.collision { color: var(--danger); }
.event.phase { color: #8be89b; }
.event.gate, .event.water { color: #9fd3ff; }
.hint { color: var(--muted); font-size: 13px; }
</style>
