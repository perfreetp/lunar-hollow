<script lang="ts">
  import type { RoamState, CameraMode } from '../lib/state/roam';
  import { SPEED_GEARS } from '../lib/state/roam';

  interface Props {
    state: RoamState;
    onSetMode: (m: CameraMode) => void;
    onSetGear: (g: number) => void;
  }
  let { state, onSetMode, onSetGear }: Props = $props();

  const modeHint: Record<CameraMode, string> = {
    cruise: '沿中心线自动前进 · ← → 变道 · 鼠标拖拽环视',
    free: '自由飞行 · W/A/S/D 平移 · Q/E 升降 · Shift 加速'
  };
</script>

<section class="panel" class:disabled={!state.ready}>
  <h2><span class="step">2</span>漫游相机与速度控制</h2>

  <div class="row mode-switch">
    <button
      class={state.mode === 'cruise' ? 'active' : ''}
      disabled={!state.ready}
      onclick={() => onSetMode('cruise')}
    >
      自动巡航
    </button>
    <button
      class={state.mode === 'free' ? 'active' : ''}
      disabled={!state.ready}
      onclick={() => onSetMode('free')}
    >
      自由飞行
    </button>
    <span class="key-hint">F 切换</span>
  </div>

  <p class="muted hint">{modeHint[state.mode]}</p>

  <div class="gear-row">
    {#each SPEED_GEARS as kmh, i (i)}
      <button
        class={state.speedGear === i + 1 ? 'active' : ''}
        disabled={!state.ready}
        onclick={() => onSetGear(i + 1)}
        title={`${kmh} km/h`}
      >
        <span class="gear-num">{i + 1}</span>
        <span class="gear-kmh">{kmh}</span>
      </button>
    {/each}
  </div>

  <div class="kv"><span>当前速度</span><b>{(state.speed * 3.6).toFixed(1)} km/h</b></div>
  <div class="kv"><span>弧长位置</span><b>{state.s.toFixed(1)} m</b></div>
  <div class="kv">
    <span>朝向(航向角)</span><b>{((state.heading * 180) / Math.PI).toFixed(0)}°</b>
  </div>
  <div class="kv"><span>累计行驶</span><b>{state.odometer.toFixed(0)} m</b></div>
  <div class="kv"><span>渲染帧率</span><b>{state.fps} FPS</b></div>
</section>

<style>
  .disabled {
    opacity: 0.75;
  }
  .mode-switch {
    margin-bottom: 6px;
  }
  .key-hint {
    font-size: 11px;
    color: var(--muted);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 2px 7px;
  }
  .hint {
    margin: 4px 0 10px;
    min-height: 16px;
  }
  .gear-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    margin-bottom: 10px;
  }
  .gear-row button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 2px;
    line-height: 1.25;
  }
  .gear-num {
    font-weight: 700;
    font-size: 14px;
  }
  .gear-kmh {
    font-size: 10px;
    color: var(--muted);
  }
</style>
