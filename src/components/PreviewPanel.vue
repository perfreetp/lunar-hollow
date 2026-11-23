<script setup lang="ts">
import { computed } from 'vue';
import { useLabStore } from '../stores/lab';
import { LAYER_IDS, LAYER_LABELS, LAYER_TONES } from '../core/model';

const store = useLabStore();

const order = computed(() => store.render.layerOrder);

const visibility = computed(() => [
  { key: 'chassis', label: '车架', on: store.visible.chassis !== false, tone: LAYER_TONES.chassis },
  { key: 'shock', label: '避震器', on: store.visible.shock !== false, tone: LAYER_TONES.shock },
  { key: 'wheel', label: '轮毂', on: store.visible.wheel !== false, tone: LAYER_TONES.wheel },
]);

const touches = computed(() => {
  const list = store.contactList;
  return list.slice(0, 4);
});

function toggle(key: string) {
  store.setVisible(key, !store.visible[key]);
}

function layerStatus(layer: (typeof LAYER_IDS)[number]) {
  const o = store.occlusion;
  if (!o) return { label: '—', ratio: 0 };
  const g = o.byGroup[layer];
  if (!g || g.total === 0) return { label: '无采样', ratio: 0 };
  return {
    label: `${g.hidden}/${g.total}`,
    ratio: g.hidden / g.total,
  };
}

const occlusionRows = computed(() =>
  LAYER_IDS.map((layer) => {
    const status = layerStatus(layer);
    return {
      layer,
      label: LAYER_LABELS[layer],
      tone: LAYER_TONES[layer],
      labelText: status.label,
      ratio: status.ratio,
    };
  }),
);
</script>

<template>
  <section class="panel preview-panel" data-testid="preview-panel">
    <header class="panel-head">
      <div>
        <h2>姿态预览</h2>
        <p>每帧重算整条链并按相机做遮挡判断，穿插处高亮</p>
      </div>
      <div class="head-actions">
        <button class="ghost-btn" :class="{ active: store.render.showOcclusionProbes }" @click="store.setRender('showOcclusionProbes', !store.render.showOcclusionProbes)">
          遮挡探针
        </button>
      </div>
    </header>

    <div class="preview-grid">
      <div class="preview-block">
        <div class="block-head">
          <span>层级顺序（后 → 前）</span>
          <span class="mono">渲染组 + 多边形偏移</span>
        </div>
        <ol class="layer-list" data-testid="layer-list">
          <li v-for="(layer, i) in order" :key="layer" :style="{ '--tone': LAYER_TONES[layer] }">
            <span class="rank mono">{{ i + 1 }}</span>
            <i class="tone" />
            <strong>{{ LAYER_LABELS[layer] }}</strong>
            <span class="layer-state" :class="{ off: store.visible[layer] === false }">
              {{ store.visible[layer] === false ? '隐藏' : '显示' }}
            </span>
            <span class="move">
              <button :disabled="i === 0" :aria-label="`${LAYER_LABELS[layer]} 后移`" @click="store.moveLayer(layer, -1)">↑</button>
              <button :disabled="i === order.length - 1" :aria-label="`${LAYER_LABELS[layer]} 前移`" @click="store.moveLayer(layer, 1)">↓</button>
            </span>
          </li>
        </ol>
        <p class="hint">调整顺序后渲染组与 zOffset 立即更新，共面处不会出现闪烁。</p>
      </div>

      <div class="preview-block">
        <div class="block-head">
          <span>遮挡与穿插</span>
          <span class="mono">相机射线</span>
        </div>
        <ul class="occlusion-list">
          <li v-for="row in occlusionRows" :key="row.layer" :style="{ '--tone': row.tone }">
            <i class="tone" />
            <strong>{{ row.label }}</strong>
            <div class="meter">
              <span :style="{ width: Math.round(row.ratio * 100) + '%' }" />
            </div>
            <span class="mono count">{{ row.labelText }}</span>
            <b class="mono">{{ row.ratio > 0 ? (row.ratio * 100).toFixed(0) + '%' : '—' }}</b>
          </li>
        </ul>
        <div class="clearance-summary" data-testid="clearance-summary">
          <div class="clearance-line">
            <span>轮毂 ↔ 车架</span>
            <b :class="{ bad: store.clearance.chassis < 0 }">
              {{ store.contactText.chassis }}
            </b>
          </div>
          <div class="clearance-line">
            <span>轮毂 ↔ 避震器</span>
            <b :class="{ bad: store.clearance.shock < 0 }">{{ store.contactText.shock }}</b>
          </div>
        </div>
        <ul v-if="touches.length" class="contact-list" data-testid="contact-list">
          <li v-for="c in touches" :key="c.target + c.probe">
            <span class="pill bad">{{ c.probe === 'wheel' ? '轮毂' : c.probe === 'knuckle' ? '转向节' : c.probe }}</span>
            ↔ {{ c.targetLabel }}
            <b class="mono">{{ c.depth.toFixed(1) }} mm</b>
          </li>
        </ul>
        <p v-else class="hint ok">当前姿态无穿插。</p>
      </div>
    </div>

    <div class="preview-block">
      <div class="block-head">
        <span>可见性</span>
        <span class="mono">仅影响显示，不影响解算</span>
      </div>
      <div class="visibility-row">
        <button
          v-for="v in visibility"
          :key="v.key"
          class="vis-btn"
          :class="{ on: v.on }"
          :style="{ '--tone': v.tone }"
          @click="toggle(v.key)"
        >
          <i />
          {{ v.label }}
        </button>
      </div>
    </div>

    <div class="diag">
      <div class="diag-row">
        <span>帧率</span><b class="mono">{{ store.diagnostics?.fps ?? 0 }} fps</b>
      </div>
      <div class="diag-row">
        <span>帧时间</span><b class="mono">{{ store.diagnostics?.frameMs ?? 0 }} ms</b>
      </div>
      <div class="diag-row">
        <span>链解算</span><b class="mono">{{ store.diagnostics?.solveMs ?? 0 }} ms / 帧</b>
      </div>
      <div class="diag-row">
        <span>穿插检测</span><b class="mono">{{ store.diagnostics?.collisionMs ?? 0 }} ms</b>
      </div>
      <div class="diag-row">
        <span>遮挡射线</span><b class="mono">{{ store.diagnostics?.occlusionMs ?? 0 }} ms</b>
      </div>
      <div class="diag-row">
        <span>累计解算</span><b class="mono">{{ store.diagnostics?.solves ?? 0 }} 次</b>
      </div>
      <div class="diag-row">
        <span>渲染组</span>
        <b class="mono">{{ order.map((l) => LAYER_LABELS[l]).join(' → ') }}</b>
      </div>
    </div>

    <div class="layer-note">
      <p>
        渲染时按顺序把三层放进不同 renderingGroup，并对共面几何施加 zOffset 偏移；
        深度缓冲共用，因此遮挡关系始终按真实几何判定，不会出现错误穿透或闪烁。
      </p>
    </div>
  </section>
</template>
