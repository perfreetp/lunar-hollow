<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useLabStore } from '../stores/lab';
import TravelChart from './TravelChart.vue';
import { DIM_META, PRESETS, TRAVEL_META } from '../core/rigSpec';
import type { SuspensionDims, TravelSettings } from '../core/model';

const store = useLabStore();

type DimKey = keyof SuspensionDims;
type TravelKey = keyof TravelSettings;

const armDims = DIM_META.filter((d) => d.group === 'arm');
const wheelDims = DIM_META.filter((d) => d.group === 'wheel');
const travelKeys: TravelKey[] = ['up', 'down', 'preload', 'rackTravel'];

const scrubbing = ref(false);
const scrubTravel = ref(0);
let raf = 0;
let scrubStart = 0;
let scrubPhase = 0;
let lastT = 0;

const curve = computed(() => store.curve);
const travelAxis = computed(() => curve.value.samples.map((s) => s.travel));
const camberSeries = computed(() => [
  { label: '外倾 (°)', color: '#63b3ed', points: curve.value.samples.map((s) => s.camberDeg), unit: '°' },
]);
const toeSeries = computed(() => [
  { label: '前束 (°)', color: '#f6ad55', points: curve.value.samples.map((s) => s.toeDeg), unit: '°' },
]);
const trackSeries = computed(() => [
  { label: '半轮距 (mm)', color: '#4fd1c5', points: curve.value.samples.map((s) => s.halfTrack), unit: 'mm' },
]);
const shockSeries = computed(() => [
  { label: '避震长度 (mm)', color: '#b794f4', points: curve.value.samples.map((s) => s.shockLength), unit: 'mm' },
]);

const sliderValue = computed(() => store.previewTravel);
const staticAngle = computed(() => store.staticAngle);

const limitText = computed(() => {
  const b = store.travelBounds;
  return `预压下压 ${b.preloadShift.toFixed(1)} mm → 可压缩 ${b.bump.toFixed(1)} mm · 可下坠 ${b.droop.toFixed(1)} mm`;
});

const sliderMax = computed(() => Math.max(0.5, store.travelBounds.bump));
const sliderMin = computed(() => -Math.max(0.5, store.travelBounds.droop));

function onSlider(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  store.setPreviewTravel(v);
}

function nudge(delta: number) {
  store.setPreviewTravel(store.previewTravel + delta);
}

function resetTravel() {
  store.setPreviewTravel(0);
  store.setArmAngle(null);
}

function toggleScrub() {
  if (scrubbing.value) {
    stopScrub();
    return;
  }
  scrubbing.value = true;
  scrubPhase = 0;
  scrubStart = performance.now();
  lastT = scrubStart;
  store.setPreviewTravel(-store.travel.down * 0.4);
  const tick = () => {
    if (!scrubbing.value) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    scrubPhase += dt;
    const up = store.travel.up;
    const down = store.travel.down;
    // Ease between droop and bump at ~0.55 Hz, avoiding the hard stops.
    const s = Math.sin(scrubPhase * Math.PI * 2 * 0.55);
    const v = s > 0 ? s * up * 0.88 : s * down * 0.88;
    scrubTravel.value = v;
    store.setPreviewTravel(v);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function stopScrub() {
  scrubbing.value = false;
  cancelAnimationFrame(raf);
  store.setPreviewTravel(0);
}

onBeforeUnmount(stopScrub);

const cursor = computed(() => store.previewTravel);

function fmt(v: number, unit: string) {
  return `${v.toFixed(unit === '°' ? 2 : 1)}${unit}`;
}

/** Apply a preset without letting the panel scroll jump under the pointer. */
function applyPreset(id: string) {
  const dock = document.querySelector('.dock') as HTMLElement | null;
  const scroll = dock?.scrollTop ?? 0;
  store.applyPreset(id);
  if (dock) requestAnimationFrame(() => (dock.scrollTop = scroll));
}

const presetCards = computed(() =>
  PRESETS.map((p) => ({ ...p, active: isPresetActive(p.id) })),
);

function isPresetActive(id: string): boolean {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return false;
  for (const [k, v] of Object.entries(p.dims)) {
    if (typeof v === 'number' && Math.abs((store.dims as any)[k] - v) > 0.35) return false;
  }
  for (const [k, v] of Object.entries(p.travel ?? {})) {
    if (typeof v === 'number' && Math.abs((store.travel as any)[k] - v) > 0.35) return false;
  }
  return true;
}

</script>

<template>
  <section class="panel travel-panel" data-testid="travel-panel">
    <header class="panel-head">
      <div>
        <h2>行程调节</h2>
        <p>设定上下行程与预压量，任一摆臂长度改动都会联动重算整条链</p>
      </div>
      <div class="head-actions">
        <button class="ghost-btn" :class="{ active: scrubbing }" data-testid="scrub" @click="toggleScrub">
          {{ scrubbing ? '停止扫掠' : '自动扫掠' }}
        </button>
        <button class="ghost-btn" data-testid="reset-travel" @click="resetTravel">回中</button>
      </div>
    </header>

    <div class="travel-scale">
      <div class="scale-head">
        <span>轮跳行程</span>
        <span class="mono">{{ sliderValue.toFixed(1) }} mm</span>
      </div>
      <div class="scale-wrap">
        <div class="scale-track">
          <span
            class="scale-zero"
            :style="{ left: ((0 - sliderMin) / (sliderMax - sliderMin)) * 100 + '%' }"
          />
          <span
            class="scale-preload"
            :style="{ left: ((store.travelBounds.preloadShift - sliderMin) / (sliderMax - sliderMin)) * 100 + '%' }"
          />
        </div>
        <input
          class="scale-input"
          type="range"
          :min="sliderMin"
          :max="sliderMax"
          step="0.5"
          :value="sliderValue"
          data-testid="travel-slider"
          @input="onSlider"
        />
      </div>
      <div class="scale-legend">
        <span>下坠 −{{ Math.abs(sliderMin).toFixed(0) }}</span>
        <span class="mid">静态</span>
        <span>可压缩 +{{ sliderMax.toFixed(0) }}</span>
      </div>
      <p class="scale-note">{{ limitText }}</p>
      <div class="scale-buttons">
        <button @click="nudge(-5)">−5</button>
        <button @click="nudge(-1)">−1</button>
        <button @click="nudge(1)">+1</button>
        <button @click="nudge(5)">+5</button>
        <button @click="nudge(sliderMax)">到底</button>
      </div>
    </div>

    <div class="slider-grid">
      <label v-for="key in travelKeys" :key="key" class="slider-row">
        <span class="slider-label">
          {{ TRAVEL_META[key].label }}
          <em class="mono">{{ store.travel[key].toFixed(TRAVEL_META[key].step < 1 ? 1 : 0) }} {{ TRAVEL_META[key].unit }}</em>
        </span>
        <input
          type="range"
          :min="TRAVEL_META[key].min"
          :max="TRAVEL_META[key].max"
          :step="TRAVEL_META[key].step"
          :value="store.travel[key]"
          :data-testid="`travel-${key}`"
          @input="store.setTravel(key as TravelKey, Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </div>

    <div class="dims">
      <div class="dims-head">
        <span>连杆尺寸</span>
        <span class="mono">改动即联动</span>
      </div>
      <div class="dim-grid">
        <label v-for="d in armDims" :key="d.key" class="dim-row">
          <span class="dim-label">{{ d.label }}</span>
          <input
            type="range"
            :min="d.min"
            :max="d.max"
            :step="d.step"
            :value="store.dims[d.key]"
            :data-testid="`dim-${d.key}`"
            @input="store.setDim(d.key, Number(($event.target as HTMLInputElement).value))"
          />
          <b class="mono">{{ store.dims[d.key].toFixed(1) }}</b>
        </label>
        <details class="dim-more">
          <summary>轮毂 / 轮胎尺寸</summary>
          <label v-for="d in wheelDims" :key="d.key" class="dim-row">
            <span class="dim-label">{{ d.label }}</span>
            <input
              type="range"
              :min="d.min"
              :max="d.max"
              :step="d.step"
              :value="store.dims[d.key]"
              :data-testid="`dim-${d.key}`"
              @input="store.setDim(d.key, Number(($event.target as HTMLInputElement).value))"
            />
            <b class="mono">{{ store.dims[d.key].toFixed(1) }}</b>
          </label>
        </details>
      </div>
    </div>

    <div class="charts">
      <div class="chart-row">
        <TravelChart title="外倾角随行程" :xs="travelAxis" :series="camberSeries" :cursor="cursor" />
        <TravelChart title="前束角随行程" :xs="travelAxis" :series="toeSeries" :cursor="cursor" />
      </div>
      <div class="chart-row">
        <TravelChart title="半轮距随行程" :xs="travelAxis" :series="trackSeries" :cursor="cursor" />
        <TravelChart title="避震长度随行程" :xs="travelAxis" :series="shockSeries" :cursor="cursor" />
      </div>
    </div>

    <div class="metrics">
      <div class="metric">
        <span>静态摆臂角</span>
        <b class="mono">{{ staticAngle.toFixed(2) }}°</b>
      </div>
      <div class="metric">
        <span>当前摆臂角</span>
        <b class="mono">{{ store.pose.lowerAngleDeg.toFixed(2) }}°</b>
      </div>
      <div class="metric">
        <span>运动比</span>
        <b class="mono">{{ store.rigRef.motionRatio.toFixed(3) }}</b>
      </div>
      <div class="metric">
        <span>弹簧压缩</span>
        <b class="mono">{{ store.pose.shock.compression.toFixed(1) }} mm</b>
      </div>
      <div class="metric" :class="{ warn: store.curve.issues.length }">
        <span>曲线异常</span>
        <b class="mono">{{ store.curve.issues.length ? store.curve.issues.join(' / ') : '无' }}</b>
      </div>
    </div>

    <div class="presets">
      <button
        v-for="p in presetCards"
        :key="p.id"
        class="preset"
        :class="{ active: p.active }"
        :data-testid="`preset-${p.id}`"
        @click="applyPreset(p.id)"
      >
        <strong>{{ p.name }}</strong>
        <span>{{ p.blurb }}</span>
      </button>
    </div>
  </section>
</template>
