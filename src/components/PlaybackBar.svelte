<script>
  import { store, setPlaying, setWindTurns, setProgress, resetPlayback, setSpeed, MAX_WIND_TURNS } from '../lib/store.js';

  $: s = $store;
  $: currentTurns = (s.windTurns * s.progress).toFixed(2);
  $: driver = s.gears.find((g) => g.id === s.driverId);

  const speeds = [0.5, 1, 2, 4];
</script>

<section class="bar">
  <div class="transport">
    <button class="primary" on:click={() => setPlaying(!s.playing)} disabled={!s.driverId || s.gears.length === 0}>
      {s.playing ? '⏸ 暂停' : '▶ 播放'}
    </button>
    <button on:click={resetPlayback}>⏮ 复位</button>
  </div>

  <div class="wind">
    <label>
      <b>发条圈数</b>
      <span class="mono big">{s.windTurns} 圈</span>
    </label>
    <input
      type="range" min="0" max={MAX_WIND_TURNS} step="0.5"
      value={s.windTurns}
      on:input={(e) => setWindTurns(Number(e.target.value))}
    />
    <div class="scale muted mono"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></div>
  </div>

  <div class="progress-block">
    <label>
      <b>播放进度</b>
      <span class="mono">{(s.progress * 100).toFixed(1)}% · 当前 {currentTurns} 圈</span>
    </label>
    <input
      type="range" min="0" max="1" step="0.001"
      value={s.progress}
      on:input={(e) => setProgress(Number(e.target.value))}
    />
  </div>

  <div class="speed">
    <b>速率</b>
    {#each speeds as v}
      <button class:on={s.speed === v} on:click={() => setSpeed(v)}>{v}×</button>
    {/each}
  </div>

  <div class="driver-info muted">
    {#if driver}
      主动轮 <b>{driver.label}</b>（{driver.teeth}T）→ 当前转角 <b class="mono">{(s.progress * s.windTurns * 360).toFixed(0)}°</b>
    {:else}
      请先指定主动轮
    {/if}
  </div>
</section>

<style>
  .bar {
    flex: none;
    display: grid;
    grid-template-columns: auto 1.3fr 1.3fr auto auto;
    gap: 18px; align-items: center;
    padding: 10px 16px;
    background: var(--panel);
    border-top: 1px solid var(--line);
  }
  .transport { display: flex; gap: 8px; }
  .wind label, .progress-block label { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .big { color: var(--accent); font-size: 14px; }
  .scale { display: flex; justify-content: space-between; font-size: 10px; margin-top: 2px; }
  .speed { display: flex; align-items: center; gap: 5px; }
  .speed b { margin-right: 4px; }
  .speed button { padding: 3px 8px; font-size: 11px; }
  .speed button.on { background: var(--accent-2); border-color: var(--accent-2); color: #061018; font-weight: 700; }
  .driver-info { font-size: 11px; max-width: 210px; line-height: 1.5; }
  .driver-info b { color: var(--text); }
  @media (max-width: 1200px) {
    .bar { grid-template-columns: 1fr 1fr; }
  }
</style>
