<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';
import { defaultCells } from '../core/grid';

const store = useStore();
const grid = computed(() => store.config.grid);

function commit(): void {
  // cols/rows 变化会改变 cells 长度，需要重排分格数据，尽量保留已有分格参数
  const g = store.config.grid;
  const target = g.cols * g.rows;
  const cells = store.config.cells;
  if (cells.length !== target) {
    const fresh = defaultCells(g);
    for (let i = 0; i < Math.min(target, cells.length); i++) fresh[i] = { ...cells[i] };
    store.config.cells.splice(0, cells.length, ...fresh);
  }
  store.rebuildAll();
}
</script>

<template>
  <section class="panel-block">
    <h3>幕墙分格</h3>
    <label class="field">
      <span>水平分格（列）<b>{{ grid.cols }}</b></span>
      <input
        type="range"
        min="2"
        max="24"
        step="1"
        :value="grid.cols"
        @input="grid.cols = Number(($event.target as HTMLInputElement).value); commit()"
      />
    </label>
    <label class="field">
      <span>竖直分格（行）<b>{{ grid.rows }}</b></span>
      <input
        type="range"
        min="2"
        max="16"
        step="1"
        :value="grid.rows"
        @input="grid.rows = Number(($event.target as HTMLInputElement).value); commit()"
      />
    </label>
    <label class="field">
      <span>幕墙总宽（m）<b>{{ grid.width.toFixed(1) }}</b></span>
      <input
        type="range"
        min="6"
        max="40"
        step="0.5"
        :value="grid.width"
        @input="grid.width = Number(($event.target as HTMLInputElement).value); commit()"
      />
    </label>
    <label class="field">
      <span>幕墙总高（m）<b>{{ grid.height.toFixed(1) }}</b></span>
      <input
        type="range"
        min="4"
        max="20"
        step="0.5"
        :value="grid.height"
        @input="grid.height = Number(($event.target as HTMLInputElement).value); commit()"
      />
    </label>
    <label class="field">
      <span>框条宽度（m）<b>{{ grid.barWidth.toFixed(2) }}</b></span>
      <input
        type="range"
        min="0.04"
        max="0.6"
        step="0.02"
        :value="grid.barWidth"
        @input="grid.barWidth = Number(($event.target as HTMLInputElement).value); commit()"
      />
    </label>
  </section>
</template>
