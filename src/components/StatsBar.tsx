import { Show } from 'solid-js';
import type { FrameStats } from '../types';
import { FRAME_BUDGET_MS } from '../WallEngine';

interface Props {
  stats: FrameStats | null;
}

function Bar(props: { ratio: number; warn: boolean }) {
  return (
    <div class="meter">
      <div
        classList={{ fill: true, warn: props.warn }}
        style={{ width: `${Math.min(100, props.ratio * 100)}%` }}
      />
    </div>
  );
}

export default function StatsBar(props: Props) {
  const s = () => props.stats;

  return (
    <footer class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">视线穿层数</span>
        <Show when={s()} fallback={<span class="stat-value dim">—</span>}>
          <span class="stat-value">{s()!.onWall ? s()!.hitCount : 0}</span>
          <span class="stat-sub">/ {s()!.visibleCount} 可见层</span>
        </Show>
      </div>

      <div class="stat-item wide">
        <span class="stat-label">总透射估算</span>
        <Show when={s()?.onWall} fallback={<span class="stat-value dim">视线未命中幕墙</span>}>
          <span class="stat-value">{(s()!.totalTransmission * 100).toFixed(2)}%</span>
          <Bar ratio={s()!.totalTransmission} warn={s()!.totalTransmission < 0.05} />
        </Show>
      </div>

      <div class="stat-item">
        <span class="stat-label">入射角</span>
        <Show when={s()} fallback={<span class="stat-value dim">—</span>}>
          <span class="stat-value">{s()!.incidenceDeg}°</span>
          <span class="stat-sub">相对幕墙法线</span>
        </Show>
      </div>

      <div class="stat-item">
        <span class="stat-label">光学裁剪</span>
        <Show when={s()} fallback={<span class="stat-value dim">—</span>}>
          <span classList={{ 'stat-value': true, warn: s()!.clippedLayers > 0 }}>
            {s()!.clippedLayers} 层
          </span>
          <span class="stat-sub">透射低于 2% 不可分辨</span>
        </Show>
      </div>

      <div class="stat-item">
        <span class="stat-label">排序+求交耗时</span>
        <Show when={s()} fallback={<span class="stat-value dim">—</span>}>
          <span classList={{ 'stat-value': true, warn: s()!.frameCostMs > FRAME_BUDGET_MS }}>
            {s()!.frameCostMs.toFixed(2)}ms
          </span>
          <span class="stat-sub">
            预算 {FRAME_BUDGET_MS}ms · 交换 {s()!.sortSwaps} 次
          </span>
        </Show>
      </div>
    </footer>
  );
}
