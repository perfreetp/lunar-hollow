<script setup lang="ts">
import { computed } from 'vue';

interface Series {
  label: string;
  color: string;
  points: number[];
  unit: string;
}

const props = defineProps<{
  title: string;
  xs: number[];
  series: Series[];
  cursor?: number | null;
  height?: number;
}>();

const W = 260;
const H = 112;
const PAD = { l: 30, r: 8, t: 12, b: 18 };

const bounds = computed(() => {
  const all = props.series.flatMap((s) => s.points).filter((v) => Number.isFinite(v));
  const xmin = Math.min(...props.xs);
  const xmax = Math.max(...props.xs);
  let ymin = Math.min(...all);
  let ymax = Math.max(...all);
  if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) {
    ymin = 0;
    ymax = 1;
  }
  if (ymax - ymin < 1e-6) {
    ymin -= 1;
    ymax += 1;
  }
  const pad = (ymax - ymin) * 0.12;
  return { xmin, xmax, ymin: ymin - pad, ymax: ymax + pad };
});

const sx = (v: number) => {
  const b = bounds.value;
  return PAD.l + ((v - b.xmin) / (b.xmax - b.xmin || 1)) * (W - PAD.l - PAD.r);
};
const sy = (v: number) => {
  const b = bounds.value;
  return H - PAD.b - ((v - b.ymin) / (b.ymax - b.ymin || 1)) * (H - PAD.t - PAD.b);
};

function pathFor(points: number[]): string {
  const parts: string[] = [];
  points.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    const x = sx(props.xs[i]);
    const y = sy(v);
    parts.push(`${parts.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  });
  return parts.join(' ');
}

const zeroY = computed(() => sy(0));
const showZero = computed(() => bounds.value.ymin < 0 && bounds.value.ymax > 0);
const cursorX = computed(() => (props.cursor === null || props.cursor === undefined ? null : sx(props.cursor)));

const ticks = computed(() => {
  const b = bounds.value;
  const out: { y: number; label: string }[] = [];
  for (let i = 0; i <= 2; i++) {
    const v = b.ymin + ((b.ymax - b.ymin) * i) / 2;
    out.push({ y: sy(v), label: v.toFixed(Math.abs(v) < 10 ? 1 : 0) });
  }
  return out;
});
</script>

<template>
  <figure class="chart">
    <figcaption>{{ title }}</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="title">
      <line :x1="PAD.l" :x2="W - PAD.r" :y1="H - PAD.b" :y2="H - PAD.b" class="axis" />
      <line :x1="PAD.l" :x2="PAD.l" :y1="PAD.t" :y2="H - PAD.b" class="axis" />
      <line v-if="showZero" :x1="PAD.l" :x2="W - PAD.r" :y1="zeroY" :y2="zeroY" class="zero" />
      <g v-for="t in ticks" :key="t.label + t.y">
        <text :x="PAD.l - 4" :y="t.y + 3" class="tick">{{ t.label }}</text>
      </g>
      <path v-for="s in series" :key="s.label" :d="pathFor(s.points)" :stroke="s.color" class="line" />
      <line v-if="cursorX !== null" :x1="cursorX" :x2="cursorX" :y1="PAD.t" :y2="H - PAD.b" class="cursor" />
    </svg>
    <div class="legend">
      <span v-for="s in series" :key="s.label">
        <i :style="{ background: s.color }" />{{ s.label }}
      </span>
    </div>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
  padding: 8px 10px 6px;
  border-radius: 10px;
  background: rgba(12, 18, 26, 0.72);
  border: 1px solid rgba(120, 160, 200, 0.14);
}
figcaption {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--fg-dim);
  margin-bottom: 2px;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.axis {
  stroke: rgba(140, 170, 200, 0.24);
  stroke-width: 1;
}
.zero {
  stroke: rgba(200, 220, 240, 0.22);
  stroke-dasharray: 3 3;
}
.line {
  fill: none;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.cursor {
  stroke: rgba(255, 209, 102, 0.8);
  stroke-width: 1.2;
  stroke-dasharray: 2 2;
}
.tick {
  fill: rgba(150, 175, 200, 0.62);
  font-size: 8px;
  text-anchor: end;
}
.legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 10px;
  color: var(--fg-dim);
}
.legend i {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  margin-right: 4px;
}
</style>
