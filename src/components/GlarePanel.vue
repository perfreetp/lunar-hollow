<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/useStore';
import { GlassType } from '../core/types';

const store = useStore();
const glare = computed(() => store.state.glare);
const hovered = computed(() => store.state.hovered);

const TYPE_LABEL: Record<GlassType, string> = {
  [GlassType.Clear]: '透明',
  [GlassType.Coated]: '镀膜',
  [GlassType.Fritted]: '彩釉',
};

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
</script>

<template>
  <section class="panel-block">
    <h3>室内眩光读数</h3>
    <div v-if="glare" class="readout-grid">
      <div class="metric">
        <span class="metric-label">总可见光通量</span>
        <span class="metric-value">{{ glare.totalFlux.toFixed(2) }}</span>
        <small>相对单位（孔径面积 × 有效透射）</small>
      </div>
      <div class="metric">
        <span class="metric-label">面积加权平均透射比</span>
        <span class="metric-value">{{ pct(glare.averageTransmittance) }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">透光分格数</span>
        <span class="metric-value">{{ glare.litCells }}</span>
      </div>
      <div class="metric breakdown">
        <span class="metric-label">分类型通量</span>
        <ul>
          <li><i class="dot clear"></i>透明：{{ glare.byType[GlassType.Clear].toFixed(2) }}</li>
          <li><i class="dot coated"></i>镀膜：{{ glare.byType[GlassType.Coated].toFixed(2) }}</li>
          <li><i class="dot fritted"></i>彩釉：{{ glare.byType[GlassType.Fritted].toFixed(2) }}</li>
        </ul>
      </div>
    </div>

    <div class="hover-box" :class="{ empty: !hovered }">
      <h4>悬停分格读数</h4>
      <template v-if="hovered">
        <div class="hover-row"><span>位置</span><b>第 {{ hovered.row + 1 }} 行 / 第 {{ hovered.col + 1 }} 列</b></div>
        <div class="hover-row"><span>玻璃类型</span><b>{{ TYPE_LABEL[hovered.type] }}</b></div>
        <div class="hover-row"><span>玻璃透射率</span><b>{{ pct(hovered.transmittance) }}</b></div>
        <div class="hover-row"><span>遮罩开孔率</span><b>{{ pct(hovered.openFraction) }}</b></div>
        <div class="hover-row emphasis">
          <span>叠加后可见光比例</span>
          <b>{{ pct(hovered.stackedVisibleRatio) }}</b>
        </div>
      </template>
      <p v-else>鼠标指向幕墙任一格，显示该格透射率与多层叠加后的可见光比例</p>
    </div>
  </section>
</template>
