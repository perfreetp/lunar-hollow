<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLabStore } from '../stores/lab';
import { PART_INFO, PART_ORDER, PART_PREREQUISITES, SOCKETS } from '../core/rigSpec';
import type { PartKind } from '../core/model';

const store = useLabStore();
const emit = defineEmits<{ (e: 'drag-part', part: PartKind, evt: PointerEvent): void }>();

const hovered = ref<PartKind | null>(null);
const selected = ref<PartKind | null>('lowerArm');

const SOCKET_BY_PART = new Map(SOCKETS.map((s) => [s.accepts, s] as const));

const items = computed(() =>
  PART_ORDER.map((part) => {
    const info = PART_INFO[part];
    const installed = store.isInstalled(part);
    const conn = store.assembly.connections[part];
    const over = conn ? conn.dropDeviation > store.assembly.toleranceMm && !conn.forced : false;
    const forced = conn ? conn.forced && conn.dropDeviation > store.assembly.toleranceMm : false;
    const missing = PART_PREREQUISITES[part].filter((p) => !store.isInstalled(p));
    return {
      part,
      info,
      installed,
      over,
      forced,
      missing,
      socket: SOCKET_BY_PART.get(part),
      deviation: conn?.dropDeviation ?? 0,
      canInstall: store.canInstall(part),
    };
  }),
);

const detail = computed(() => {
  const part = selected.value;
  if (!part) return null;
  const info = PART_INFO[part];
  const conn = store.assembly.connections[part];
  return {
    part,
    info,
    installed: store.isInstalled(part),
    conn,
    length: store.dims[info.dimKey],
  };
});

function onDown(part: PartKind, evt: PointerEvent) {
  selected.value = part;
  if (store.isInstalled(part)) return;
  emit('drag-part', part, evt);
}

function detach(part: PartKind, evt: MouseEvent) {
  evt.stopPropagation();
  store.detachPart(part);
}

function adjustLength(delta: number) {
  const part = selected.value;
  if (!part) return;
  const key = PART_INFO[part].dimKey;
  store.setDim(key, store.dims[key] + delta);
}

function socketLabel(id?: string) {
  if (!id) return '未连接';
  return SOCKETS.find((s) => s.id === id)?.label ?? '未连接';
}

function useTravelAsAngle() {
  store.setArmAngle(store.armAngleFromTravel());
}
</script>

<template>
  <section class="panel assembly-panel" data-testid="assembly-panel">
    <header class="panel-head">
      <div>
        <h2>连杆装配</h2>
        <p>把零件从库拖到画面中的轴位标记，偏差超阈值会标红</p>
      </div>
      <div class="head-actions">
        <button class="ghost-btn" data-testid="reset-assembly" @click="store.resetAssembly()">重新装配</button>
        <button class="ghost-btn" @click="store.clearAssembly()">清空</button>
      </div>
    </header>

    <div class="library" role="list">
      <div
        v-for="item in items"
        :key="item.part"
        class="part-card"
        :class="{
          installed: item.installed,
          over: item.over,
          forced: item.forced,
          locked: !item.canInstall && !item.installed,
          selected: selected === item.part,
          dragging: store.dragState.part === item.part,
        }"
        role="listitem"
        :data-testid="`part-${item.part}`"
        :data-installed="item.installed ? 'true' : 'false'"
        :style="{ '--tone': item.info.tone }"
        @pointerdown="onDown(item.part, $event)"
        @mouseenter="hovered = item.part"
        @mouseleave="hovered = null"
      >
        <div class="part-glyph" :class="`glyph-${item.part}`">
          <span class="glyph-core" />
        </div>
        <div class="part-body">
          <div class="part-title">
            <strong>{{ item.info.label }}</strong>
            <em>{{ item.info.english }}</em>
          </div>
          <p class="part-blurb">{{ item.info.blurb }}</p>
          <div class="part-meta">
            <span v-if="item.installed" class="tag ok">已装配</span>
            <span v-else-if="item.missing.length" class="tag lock">
              需先装 {{ item.missing.map((m) => PART_INFO[m].label).join('、') }}
            </span>
            <span v-else class="tag ready">可安装</span>
            <span v-if="item.installed" class="tag mono">偏差 {{ item.deviation.toFixed(1) }} mm</span>
          </div>
        </div>
        <button
          v-if="item.installed"
          class="detach"
          title="拆下"
          :data-testid="`detach-${item.part}`"
          @pointerdown.stop
          @click="detach(item.part, $event)"
        >
          ×
        </button>
      </div>
    </div>

    <div class="socket-map">
      <div class="socket-map-head">
        <span>轴位</span>
        <span class="mono">阈值 {{ store.assembly.toleranceMm.toFixed(1) }} mm</span>
      </div>
      <ul>
        <li v-for="s in SOCKETS" :key="s.id" :class="{ filled: store.isInstalled(s.accepts) }">
          <i class="socket-dot" />
          <span class="socket-name">{{ s.label }}</span>
          <span class="socket-hint">{{ s.hint }}</span>
          <b v-if="store.assembly.connections[s.accepts]" class="mono">
            {{ store.assembly.connections[s.accepts]?.dropDeviation.toFixed(1) }} mm
          </b>
        </li>
      </ul>
      <div class="tolerance-row">
        <label>
          吸附阈值
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            :value="store.assembly.toleranceMm"
            data-testid="tolerance"
            @input="store.setTolerance(Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <span class="mono">{{ store.assembly.toleranceMm.toFixed(1) }} mm</span>
      </div>
    </div>

    <div v-if="detail" class="detail">
      <div class="detail-head">
        <span class="dot" :style="{ background: detail.info.tone }" />
        <strong>{{ detail.info.label }}</strong>
        <em>{{ socketLabel(detail.conn?.socket) }}</em>
      </div>
      <div class="detail-row">
        <span>主尺寸</span>
        <div class="stepper">
          <button @click="adjustLength(-0.5)">−</button>
          <b class="mono">{{ detail.length.toFixed(1) }} mm</b>
          <button @click="adjustLength(0.5)">+</button>
        </div>
      </div>
      <p class="detail-note">
        改动任一摆臂长度后，整条连杆链（上摆臂 → 主销 → 拉杆 → 轮心）会在同一帧内重算。
      </p>
    </div>

    <div v-if="store.messages.length" class="messages">
      <p v-for="(m, i) in store.messages.slice(0, 3)" :key="i" :class="['msg', m.level]">{{ m.message }}</p>
    </div>

    <div class="assembly-footer">
      <span class="mono">{{ store.assembly.order.length }}/4 零件</span>
      <button class="ghost-btn" @click="useTravelAsAngle">用当前行程锁定摆臂角</button>
    </div>
  </section>
</template>
