<script>
  import { LIBRARY } from '../lib/store.js';
  import GearGlyph from './GearGlyph.svelte';

  function onDragStart(e, teeth) {
    e.dataTransfer.setData('text/gear-teeth', String(teeth));
    e.dataTransfer.effectAllowed = 'copy';
  }
</script>

<section class="card">
  <h3 class="panel-title">① 齿轮装配 · 齿轮库</h3>
  <p class="hint">拖到画布轴位放置；相邻齿轮中心距合适时自动啮合</p>
  <div class="lib">
    {#each LIBRARY as z}
      <div
        class="lib-item"
        draggable="true"
        on:dragstart={(e) => onDragStart(e, z)}
        title={`${z} 齿齿轮，拖入画布`}
      >
        <svg viewBox="-12 -12 24 24" width="38" height="38" aria-hidden="true">
          <GearGlyph {z} />
        </svg>
        <div class="meta">
          <strong>{z}T</strong>
          <span class="muted">r={z / 2}</span>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .card { background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
  .hint { color: var(--muted); margin: 0 0 10px; font-size: 11px; line-height: 1.5; }
  .lib { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lib-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border: 1px solid var(--line); border-radius: 7px;
    background: var(--bg); cursor: grab; user-select: none;
    transition: border-color 0.15s, transform 0.1s;
  }
  .lib-item:hover { border-color: var(--accent); transform: translateY(-1px); }
  .lib-item:active { cursor: grabbing; }
  .meta { display: flex; flex-direction: column; line-height: 1.25; }
  .meta strong { color: var(--accent); }
</style>
