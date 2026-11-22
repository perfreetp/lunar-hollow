<script>
  import { store, MIN_TEETH, MAX_TEETH } from '../lib/store.js';

  export let selected;
  export let onTeeth;
  export let onRename;
  export let onSetDriver;
  export let onRemove;

  $: snap = $store.snapshot;
  $: gears = $store.gears;

  function ratioText(id) {
    const r = snap.ratios.get(id);
    if (r === 0 || r === undefined) return '静止';
    return `${r >= 0 ? '+' : ''}${r.toFixed(3)}×`;
  }
  function dirText(id) {
    const d = snap.direction.get(id);
    if (!d) return '—';
    return d > 0 ? '逆时针 ↺' : '顺时针 ↻';
  }
</script>

<section class="card">
  <h3 class="panel-title">② 传动配置</h3>

  <div class="gear-list">
    {#each gears as g (g.id)}
      {@const isSel = selected?.id === g.id}
      {@const isDriver = $store.driverId === g.id}
      <div class="row" class:sel={isSel} on:click={() => $store.selectedId = g.id}>
        <div class="row-main">
          <span class="name">{g.label}</span>
          <span class="teeth mono">{g.teeth}T</span>
        </div>
        <div class="row-sub muted mono">
          {isDriver ? '主动轮' : ratioText(g.id)} · {dirText(g.id)}
        </div>
        {#if isDriver}<span class="tag driver">发条</span>{/if}
      </div>
    {/each}
    {#if gears.length === 0}
      <p class="muted empty">画布为空，从齿轮库拖入第一个齿轮</p>
    {/if}
  </div>
</section>

{#if selected}
  <section class="card">
    <h3 class="panel-title">选中齿轮参数</h3>
    <label class="field">
      <span>名称</span>
      <input value={selected.label} on:change={(e) => onRename(e.target.value)} />
    </label>

    <label class="field">
      <span>齿数（{MIN_TEETH}–{MAX_TEETH}）</span>
      <input
        type="number" min={MIN_TEETH} max={MAX_TEETH} step="1"
        value={selected.teeth}
        on:change={(e) => onTeeth(Number(e.target.value))}
      />
    </label>
    <input
      type="range" min={MIN_TEETH} max={MAX_TEETH} step="1"
      value={selected.teeth}
      on:input={(e) => onTeeth(Number(e.target.value))}
    />
    <p class="muted note">改动齿数后整条传动链的转速与相位在同一帧内联动重算</p>

    <div class="kv">
      <span>分度圆半径</span><b class="mono">{(selected.teeth / 2).toFixed(1)}</b>
      <span>相对速比</span><b class="mono">{ratioText(selected.id)}</b>
      <span>转向</span><b>{dirText(selected.id)}</b>
      <span>所在层（深度）</span><b class="mono">L{(snap.layers.get(selected.id) ?? 0) + 1}</b>
      <span>网格坐标</span><b class="mono">({selected.gridX}, {selected.gridY})</b>
    </div>

    <div class="actions">
      {#if $store.driverId !== selected.id}
        <button on:click={() => onSetDriver(selected.id)}>设为主动轮（发条）</button>
      {:else}
        <span class="tag driver">当前主动轮</span>
      {/if}
      <button class="danger" on:click={() => onRemove(selected.id)}>删除</button>
    </div>
  </section>
{/if}

<style>
  .card { background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
  .gear-list { display: flex; flex-direction: column; gap: 5px; max-height: 220px; overflow-y: auto; }
  .row {
    position: relative;
    padding: 7px 9px; border: 1px solid var(--line); border-radius: 6px;
    background: var(--bg); cursor: pointer;
  }
  .row.sel { border-color: var(--accent-2); background: rgba(91,155,213,0.1); }
  .row-main { display: flex; justify-content: space-between; align-items: center; }
  .name { font-weight: 600; }
  .teeth { color: var(--accent); }
  .row-sub { font-size: 11px; margin-top: 2px; }
  .row .tag { position: absolute; top: 6px; right: 8px; }
  .empty { font-size: 11px; padding: 8px 4px; }
  .field { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
  .field span { color: var(--muted); flex: none; }
  .field input { width: 110px; }
  .note { font-size: 10.5px; margin: 6px 0 10px; line-height: 1.5; }
  .kv { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; margin: 10px 0; font-size: 12px; }
  .kv span { color: var(--muted); }
  .kv b { text-align: right; font-weight: 600; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .danger { border-color: var(--err); color: var(--err); }
  .danger:hover { background: rgba(224,107,107,0.15); }
</style>
