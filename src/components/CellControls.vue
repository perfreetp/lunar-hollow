<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';
import { GlassType, CoatingTint, FritPattern } from '../core/types';
import { COATING_TINTS } from '../core/optics';
import { FRIT_PATTERN_LABEL } from '../render/maskTexture';

const store = useStore();
const selected = computed(() => store.state.selectedCell);
const cell = computed(() =>
  selected.value === null ? null : store.config.cells[selected.value],
);

const GLASS_OPTIONS = [
  { value: GlassType.Clear, label: '透明玻璃' },
  { value: GlassType.Coated, label: '镀膜玻璃' },
  { value: GlassType.Fritted, label: '彩釉玻璃' },
];

const TINT_OPTIONS = Object.values(CoatingTint).map((t) => ({
  value: t,
  label: COATING_TINTS[t].label,
  css: COATING_TINTS[t].css,
}));

const PATTERN_OPTIONS = Object.values(FritPattern).map((p) => ({
  value: p,
  label: FRIT_PATTERN_LABEL[p],
}));

function commit(): void {
  store.rebuildGlass();
}

function applyToAll(): void {
  if (!cell.value) return;
  const snapshot = JSON.parse(JSON.stringify(cell.value)) as typeof cell.value;
  for (const c of store.config.cells) Object.assign(c, snapshot);
  commit();
}
</script>

<template>
  <section class="panel-block">
    <h3>分格玻璃参数</h3>
    <p v-if="!cell" class="hint">在 3D 视图或右侧分格图中点击任一格进行设置</p>
    <template v-else>
      <div class="cell-tag">
        当前选中：第 <b>{{ selected! + 1 }}</b> 格
      </div>

      <label class="field">
        <span>玻璃类型</span>
        <select :value="cell.type" @change="cell.type = ($event.target as HTMLSelectElement).value as GlassType; commit()">
          <option v-for="o in GLASS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>

      <label class="field">
        <span>透射率 <b>{{ (cell.transmittance * 100).toFixed(0) }}%</b></span>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.01"
          :value="cell.transmittance"
          @input="cell.transmittance = Number(($event.target as HTMLInputElement).value); commit()"
        />
        <small>调节范围 10% ~ 90%</small>
      </label>

      <template v-if="cell.type === GlassType.Coated">
        <label class="field">
          <span>镀膜反射色偏</span>
          <div class="tint-row">
            <button
              v-for="o in TINT_OPTIONS"
              :key="o.value"
              class="tint-chip"
              :class="{ active: cell.tint === o.value }"
              @click="cell.tint = o.value; commit()"
            >
              <span class="swatch" :style="{ background: o.css }"></span>{{ o.label }}
            </button>
          </div>
        </label>
      </template>

      <template v-if="cell.type === GlassType.Fritted">
        <label class="field">
          <span>遮罩图案</span>
          <select
            :value="cell.frit.pattern"
            @change="cell.frit.pattern = ($event.target as HTMLSelectElement).value as FritPattern; commit()"
          >
            <option v-for="o in PATTERN_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="field">
          <span>彩釉覆盖率 <b>{{ (cell.frit.coverage * 100).toFixed(0) }}%</b></span>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.01"
            :value="cell.frit.coverage"
            @input="cell.frit.coverage = Number(($event.target as HTMLInputElement).value); commit()"
          />
          <small>透光面积占比 {{ ((1 - cell.frit.coverage) * 100).toFixed(0) }}%</small>
        </label>
        <label class="field">
          <span>图案周期（m）<b>{{ cell.frit.scale.toFixed(2) }}</b></span>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.01"
            :value="cell.frit.scale"
            @input="cell.frit.scale = Number(($event.target as HTMLInputElement).value); commit()"
          />
        </label>
      </template>

      <button class="ghost-btn" @click="applyToAll">应用到全部分格</button>
    </template>
  </section>
</template>
