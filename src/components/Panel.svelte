<script lang="ts">
  import type { Sim } from '../lib/sim'
  import {
    blockages, endPt, hasPath, hasPlan, params, pickMode,
    roaming, selected, startPt, stats, status, viewMode,
  } from '../lib/stores'
  import type { ExportData, Plan } from '../lib/types'

  export let sim: Sim

  let fileInput: HTMLInputElement

  function onParamChange() {
    sim.updateParams($params)
  }

  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const j = JSON.parse(reader.result as string)
        let err: string
        if (j.version === 1 && j.plan) err = sim.importData(j as ExportData)
        else if (j.walls) err = sim.importPlanOnly(j as Plan)
        else err = '无法识别的文件格式'
        status.set(err || `已载入文件：${f.name}`)
      } catch (ex) {
        status.set('文件解析失败：' + (ex as Error).message)
      }
    }
    reader.readAsText(f)
    ;(e.target as HTMLInputElement).value = ''
  }

  function doExport() {
    const data = sim.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'accessible-route.json'
    a.click()
    URL.revokeObjectURL(a.href)
    status.set('已导出路径与卡点清单（含平面、参数，可再次载入）')
  }

  function fmtW(w: number): string {
    return w === Infinity ? '—' : w.toFixed(2) + ' m'
  }
</script>

<aside class="panel">
  <h1>无障碍通行仿真</h1>

  <section>
    <h2>轮椅参数</h2>
    <label>宽度 (m)<input type="number" step="0.01" min="0.5" max="1" bind:value={$params.width} on:change={onParamChange} /></label>
    <label>长度 (m)<input type="number" step="0.05" min="0.8" max="1.6" bind:value={$params.length} on:change={onParamChange} /></label>
    <label>最小转弯半径 (m)<input type="number" step="0.1" min="0.3" max="3" bind:value={$params.turnRadius} on:change={onParamChange} /></label>
    <label>净宽阈值 (m)<input type="number" step="0.05" min="0.6" max="1.5" bind:value={$params.threshold} on:change={onParamChange} /></label>
  </section>

  <section>
    <h2>平面与路径</h2>
    <div class="row">
      <button on:click={() => fileInput.click()}>载入平面/结果文件</button>
      <input bind:this={fileInput} type="file" accept=".json,application/json" on:change={onFile} hidden />
    </div>
    <div class="row">
      <button class:active={$pickMode === 'start'} disabled={!$hasPlan} on:click={() => sim.setPickMode('start')}>设置起点</button>
      <button class:active={$pickMode === 'end'} disabled={!$hasPlan} on:click={() => sim.setPickMode('end')}>设置终点</button>
    </div>
    <div class="row">
      <button disabled={!$startPt || !$endPt} on:click={() => sim.solve()}>重新求解</button>
      <button disabled={!$hasPath} on:click={doExport}>导出结果</button>
    </div>
    <p class="hint">提示：橙色方块为门宽拖柄，蓝色方块为坡道长度拖柄；拖动后自动重新求解。</p>
  </section>

  <section>
    <h2>视角漫游</h2>
    <div class="row">
      <button class:active={$viewMode === 'free'} on:click={() => sim.setViewMode('free')}>自由视角</button>
      <button class:active={$viewMode === 'top'} disabled={!$hasPath} on:click={() => sim.setViewMode('top')}>俯视漫游</button>
      <button class:active={$viewMode === 'fps'} disabled={!$hasPath} on:click={() => sim.setViewMode('fps')}>第一人称</button>
    </div>
    {#if $viewMode !== 'free'}
      <div class="row">
        <button on:click={() => roaming.update((r) => !r)}>{$roaming ? '暂停' : '播放'}</button>
      </div>
    {/if}
  </section>

  <section>
    <h2>状态</h2>
    <p class="status">{$status}</p>
    <p class="meta">碰撞体：{$stats.colliders} 个 · FPS：{$stats.fps}{#if $stats.pathLen} · 路径长：{$stats.pathLen} m{/if}</p>
  </section>

  <section class="grow">
    <h2>卡点清单（{$blockages.length}）</h2>
    {#if $blockages.length === 0}
      <p class="hint">暂无卡点</p>
    {:else}
      <ul class="list">
        {#each $blockages as b (b.id)}
          <li>
            <button class:sel={$selected?.id === b.id} on:click={() => sim.focusBlockage(b)}>
              <strong>#{b.id}</strong> ({b.x.toFixed(1)}, {b.z.toFixed(1)}) 净宽 {fmtW(b.clearWidth)}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    {#if $selected}
      <div class="detail">
        <h3>卡点 #{$selected.id} 详情</h3>
        <p>位置：({$selected.x.toFixed(2)}, {$selected.z.toFixed(2)})</p>
        <p>有效净宽：{fmtW($selected.clearWidth)}</p>
        {#if $selected.slope > 0}<p>最大坡度：{($selected.slope * 100).toFixed(1)}%</p>{/if}
        <ul>
          {#each $selected.reasons as r}
            <li>{r}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </section>
</aside>

<style>
  .panel {
    width: 320px;
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
    background: #16202e;
    color: #dde6f0;
    padding: 14px 16px;
    box-sizing: border-box;
    font-size: 13px;
  }
  h1 {
    font-size: 17px;
    margin: 0 0 10px;
  }
  h2 {
    font-size: 13px;
    margin: 0 0 8px;
    color: #8fb8dd;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  h3 {
    font-size: 13px;
    margin: 0 0 6px;
  }
  section {
    border-top: 1px solid #2a3a50;
    padding: 10px 0;
  }
  section.grow {
    min-height: 120px;
  }
  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  input[type='number'] {
    width: 80px;
    background: #0e1622;
    color: #dde6f0;
    border: 1px solid #2a3a50;
    border-radius: 4px;
    padding: 3px 6px;
  }
  .row {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  button {
    background: #24405e;
    color: #dde6f0;
    border: 1px solid #35597f;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  button:hover:not(:disabled) {
    background: #2e5278;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button.active {
    background: #1f7a5c;
    border-color: #2ea67f;
  }
  .hint {
    color: #7d8fa5;
    font-size: 11px;
    margin: 4px 0 0;
  }
  .status {
    margin: 0 0 4px;
    line-height: 1.5;
  }
  .meta {
    color: #7d8fa5;
    font-size: 11px;
    margin: 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 180px;
    overflow-y: auto;
  }
  .list li {
    margin-bottom: 4px;
  }
  .list button {
    width: 100%;
    text-align: left;
    background: #1a2a3e;
  }
  .list button.sel {
    border-color: #e74c3c;
    background: #3a1f1f;
  }
  .detail {
    margin-top: 8px;
    background: #1a2a3e;
    border: 1px solid #e74c3c;
    border-radius: 6px;
    padding: 8px 10px;
  }
  .detail p {
    margin: 2px 0;
  }
  .detail ul {
    margin: 4px 0 0;
    padding-left: 18px;
    color: #ff9d8f;
  }
</style>
