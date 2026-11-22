<script lang="ts">
  import type { RoamState } from '../lib/state/roam';

  interface Props {
    state: RoamState;
    onResetMarks: () => void;
  }
  let { state, onResetMarks }: Props = $props();

  const pct = $derived(Math.round(state.tireIntensity * 100));
</script>

<section class="panel" class:disabled={!state.ready}>
  <h2><span class="step">3</span>路面路肩材质与轮胎痕迹</h2>

  <div class="kv"><span>路面宽度</span><b>14 m(双车道)+ 双侧路肩 1.2m</b></div>
  <div class="kv"><span>路肩条纹</span><b>红白各 1m · 按弧长均匀映射</b></div>
  <div class="kv"><span>映射方式</span><b>UV.u = 弧长(米),无拉伸</b></div>
  <div class="kv"><span>贴花层</span><b>双轮迹 ribbon · 叠加混合</b></div>

  <div class="mark-block">
    <div class="mark-head">
      <span class="muted">轮胎痕迹强度(随行驶距离加深)</span>
      <b>{pct}%</b>
    </div>
    <div class="bar">
      <div class="bar-fill" style="width: {pct}%"></div>
    </div>
  </div>

  <button disabled={!state.ready} onclick={onResetMarks} style="margin-top: 10px">
    清除轮胎痕迹
  </button>
</section>

<style>
  .disabled {
    opacity: 0.75;
  }
  .mark-block {
    margin-top: 10px;
  }
  .mark-head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 5px;
  }
  .bar {
    height: 10px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.15);
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #475569, #0f172a);
    border-radius: 999px;
    transition: width 0.2s ease;
  }
</style>
