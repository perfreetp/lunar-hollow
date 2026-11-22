<script>
  import { store, selectGear } from '../lib/store.js';
  $: issues = $store.snapshot.issues;

  const cls = { error: 'err', warn: 'warn', info: 'info' };
  const icon = { error: '⛔', warn: '⚠', info: 'ℹ' };
</script>

{#if issues.length > 0}
  <div class="issues">
    {#each issues as issue (issue.type + (issue.ids?.join('-') ?? ''))}
      <div
        class="item {cls[issue.level]}"
        role="button"
        tabindex="0"
        on:click={() => issue.ids?.[0] && selectGear(issue.ids[0])}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && issue.ids?.[0] && selectGear(issue.ids[0])}
      >
        <span class="ic">{icon[issue.level]}</span>
        <span>{issue.msg}</span>
      </div>
    {/each}
  </div>
{:else}
  <div class="ok-line">✓ 全部齿轮啮合正常，无穿透与间隙告警</div>
{/if}

<style>
  .issues {
    flex: none; max-height: 118px; overflow-y: auto;
    background: rgba(12,17,25,0.92);
    border-top: 1px solid var(--line);
    padding: 6px 14px;
    display: flex; flex-direction: column; gap: 3px;
  }
  .item {
    display: flex; gap: 8px; align-items: baseline;
    font-size: 11.5px; padding: 3px 6px; border-radius: 5px; cursor: pointer;
  }
  .item:hover { background: rgba(255,255,255,0.05); }
  .item.err { color: #ff9b9b; }
  .item.warn { color: var(--warn); }
  .item.info { color: var(--info); }
  .ic { flex: none; }
  .ok-line {
    flex: none; padding: 6px 16px; font-size: 11.5px;
    color: var(--ok); background: rgba(12,17,25,0.92);
    border-top: 1px solid var(--line);
  }
</style>
