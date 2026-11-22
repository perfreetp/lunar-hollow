<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';
import { GlassType } from '../core/types';
import { COATING_TINTS } from '../core/optics';
import { effectiveCellTransmittance } from '../core/optics';

const store = useStore();
const grid = computed(() => store.config.grid);

/** 分格缩略色：透明=灰阶透射，镀膜=色偏，彩釉=带点纹的暖白 */
function cellStyle(index: number): Record<string, string> {
  const cell = store.config.cells[index];
  const tau = effectiveCellTransmittance(cell);
  const light = 12 + tau * 78;
  if (cell.type === GlassType.Coated) {
    const [r, g, b] = COATING_TINTS[cell.tint].rgb;
    return {
      background: `rgb(${r * light + 30}, ${g * light + 30}, ${b * light + 30})`,
    };
  }
  if (cell.type === GlassType.Fritted) {
    return {
      background: `radial-gradient(circle at 30% 30%, #e8e2d2 ${(1 - cell.frit.coverage) * 40}%, #6b5d48 ${(1 - cell.frit.coverage) * 40 + 12}%)`,
    };
  }
  return { background: `hsl(210 12% ${light}%)` };
}

function pick(index: number): void {
  store.selectCell(index);
}
</script>

<template>
  <section class="panel-block">
    <h3>分格总览（点击选中）</h3>
    <div
      class="cell-grid"
      :style="{
        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
        aspectRatio: `${grid.width} / ${grid.height}`,
      }"
    >
      <button
        v-for="(_, i) in store.config.cells"
        :key="i"
        class="cell-chip"
        :class="{ selected: store.state.selectedCell === i }"
        :style="cellStyle(i)"
        :title="`第 ${i + 1} 格`"
        @click="pick(i)"
      ></button>
    </div>
    <div class="legend">
      <span><i class="lg clear"></i>透明</span>
      <span><i class="lg coated"></i>镀膜</span>
      <span><i class="lg fritted"></i>彩釉</span>
    </div>
  </section>
</template>
