<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Sim } from './lib/sim'
  import { samplePlan } from './lib/samplePlan'
  import Panel from './components/Panel.svelte'
  import { pickMode } from './lib/stores'

  let canvas: HTMLCanvasElement
  let sim: Sim
  let ready = false

  onMount(() => {
    sim = new Sim(canvas)
    sim.loadPlan(samplePlan())
    ready = true
  })

  onDestroy(() => sim?.dispose())
</script>

<main>
  <canvas
    bind:this={canvas}
    class:pick={$pickMode !== 'none'}
  ></canvas>
  {#if ready}
    <Panel {sim} />
  {/if}
</main>

<style>
  :global(html, body, #app) {
    margin: 0;
    height: 100%;
    overflow: hidden;
    font-family: 'Segoe UI', 'Microsoft YaHei', system-ui, sans-serif;
  }
  main {
    display: flex;
    height: 100%;
  }
  canvas {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: block;
  }
  canvas.pick {
    cursor: crosshair;
  }
</style>
