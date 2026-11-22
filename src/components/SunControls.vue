<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';

const store = useStore();
const sun = computed(() => store.config.sun);

function commit(): void {
  // 日照角度改变：整面幕墙的光斑与眩光读数整体重算（纯几何，不重建玻璃）
  store.rebuildSun();
}

// 时角转可读时间：0°=12:00，每 15° 一小时
const clockText = computed(() => {
  const h = sun.value.hourAngleDeg / 15;
  const total = 12 + h;
  const hh = Math.floor(total);
  const mm = Math.round((total - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
});
</script>

<template>
  <section class="panel-block">
    <h3>太阳位置</h3>
    <label class="field">
      <span>时角 <b>{{ sun.hourAngleDeg.toFixed(0) }}° · {{ clockText }}</b></span>
      <input
        type="range"
        min="-90"
        max="90"
        step="1"
        :value="sun.hourAngleDeg"
        @input="sun.hourAngleDeg = Number(($event.target as HTMLInputElement).value); commit()"
      />
      <small>负值上午 / 正值下午，0° 为正午</small>
    </label>
    <label class="field">
      <span>高度角 <b>{{ sun.altitudeDeg.toFixed(0) }}°</b></span>
      <input
        type="range"
        min="5"
        max="90"
        step="1"
        :value="sun.altitudeDeg"
        @input="sun.altitudeDeg = Number(($event.target as HTMLInputElement).value); commit()"
      />
      <small>太阳相对地平线的仰角，≤2° 时阳光贴地无室内光斑</small>
    </label>
  </section>
</template>
