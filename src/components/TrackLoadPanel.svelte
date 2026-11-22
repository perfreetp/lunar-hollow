<script lang="ts">
  import type { RoamState } from '../lib/state/roam';
  import { SEGMENT_COUNT } from '../lib/track/centerline';

  interface Props {
    state: RoamState;
    loading: boolean;
    onEnter: () => void;
    onJumpSegment: (k: number) => void;
  }
  let { state, loading, onEnter, onJumpSegment }: Props = $props();
</script>

<section class="panel">
  <h2><span class="step">1</span>赛道加载与路段跳转</h2>

  {#if !state.ready}
    <button class="primary" onclick={onEnter} disabled={loading}>
      {loading ? '正在构建赛道几何…' : '进入赛道'}
    </button>
    <p class="muted" style="margin: 8px 0 0">
      闭合 Catmull-Rom 中心线 · 弧长重采样 · 平行移动标架
    </p>
  {:else}
    <div class="kv"><span>赛道总长</span><b>{state.totalLength.toFixed(0)} m</b></div>
    <div class="kv"><span>场景分块</span><b>{state.chunkCount} 块 / 每块 50m</b></div>
    <div class="kv">
      <span>当前路段</span>
      <b>第 {state.segment} / {SEGMENT_COUNT} 路段</b>
    </div>
    <div class="kv">
      <span>加载中分块</span>
      <span class="geo-pill {state.loadingCount > 0 ? 'loading' : 'ready'}">
        {state.loadingCount > 0 ? `${state.loadingCount} 块加载中(占位衔接)` : '流式加载已稳定'}
      </span>
    </div>

    <div class="seg-grid">
      {#each Array(SEGMENT_COUNT) as _, k (k)}
        <button
          class={state.segment === k + 1 ? 'active' : ''}
          onclick={() => onJumpSegment(k + 1)}
          title={`跳转到路段 ${k + 1}`}
        >
          路段{k + 1}
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .seg-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-top: 10px;
  }
  .seg-grid button {
    padding: 6px 4px;
    font-size: 12px;
  }
</style>
