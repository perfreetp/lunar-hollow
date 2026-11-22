<script lang="ts">
  import TrackLoadPanel from './components/TrackLoadPanel.svelte';
  import CameraPanel from './components/CameraPanel.svelte';
  import MaterialPanel from './components/MaterialPanel.svelte';
  import MinimapPanel from './components/MinimapPanel.svelte';
  import { TrackEngine } from './lib/track/engine';
  import { roamStore } from './lib/state/roam';
  import type { CameraMode } from './lib/state/roam';

  // 引擎不走 rune(避免复杂导入类型触发 svelte-check 的 rune 解析问题)
  let engine: TrackEngine | null = null;
  let canvasEl: HTMLCanvasElement | undefined = $state();
  let entering = $state(false);
  let toast = $state('');
  const mapData = $state({
    polyline: [] as Array<{ x: number; z: number }>,
    segmentPoints: [] as Array<{ x: number; z: number; segment: number }>
  });

  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  function showToast(msg: string) {
    toast = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 2600);
  }

  async function enterTrack() {
    if (engine || entering || !canvasEl) return;
    entering = true;
    // 让按钮先渲染出 loading 文案,再执行重型几何构建
    await new Promise((r) => setTimeout(r, 30));
    try {
      engine = new TrackEngine(canvasEl);
      await engine.init();
      mapData.polyline = engine.minimapPolyline();
      mapData.segmentPoints = engine.segmentLabelPoints();
      showToast('赛道加载完成,开始漫游');
    } catch (err) {
      console.error(err);
      showToast('赛道初始化失败,请查看控制台');
    } finally {
      entering = false;
    }
  }

  function jumpSegment(k: number) {
    engine?.jumpToSegment(k);
    showToast(`已跳转至路段 ${k},分块流式范围联动更新`);
  }

  function setMode(m: CameraMode) {
    engine?.setMode(m);
  }

  function setGear(g: number) {
    engine?.setGear(g);
  }

  function resetMarks() {
    engine?.resetTireMarks();
    showToast('轮胎痕迹已清除');
  }

  function pickMinimap(x: number, z: number) {
    engine?.jumpToWorldPoint(x, z);
    showToast(`小地图跳转:世界坐标 (${x.toFixed(0)}, ${z.toFixed(0)})`);
  }

  function exportPose() {
    if (!engine) return;
    const { filename, content } = engine.exportPose();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${filename}`);
  }
</script>

<canvas bind:this={canvasEl} class="render-canvas"></canvas>

{#if !$roamStore.ready}
  <div class="splash">
    <h1>赛道三维漫游工具</h1>
    <p>TypeScript · Svelte 5 · Babylon.js</p>
    <ul>
      <li>中心线弧长驱动的路面 / 红白路肩曲面,条纹按米均匀映射不拉伸</li>
      <li>8 路段跳转 · 300m 流式分块 · 三级 LOD · 占位几何无缝衔接</li>
      <li>自动巡航 / 自由飞行 · 5 档速度 · 实例化护栏看台</li>
      <li>轮胎痕迹贴花随里程加深 · 小地图点击跳转 · 姿态 JSON 导出</li>
    </ul>
  </div>
{/if}

<div class="hud">
  <TrackLoadPanel
    state={$roamStore}
    loading={entering}
    onEnter={enterTrack}
    onJumpSegment={jumpSegment}
  />
  <CameraPanel state={$roamStore} onSetMode={setMode} onSetGear={setGear} />
  <MaterialPanel state={$roamStore} onResetMarks={resetMarks} />
  <MinimapPanel
    state={$roamStore}
    polyline={mapData.polyline}
    segmentPoints={mapData.segmentPoints}
    onPick={pickMinimap}
    onExport={exportPose}
  />
</div>

{#if toast}
  <div class="toast">{toast}</div>
{/if}

<style>
  .render-canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    outline: none;
    touch-action: none;
  }

  .hud {
    position: fixed;
    top: 16px;
    left: 16px;
    width: 300px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 4px;
  }
  .hud::-webkit-scrollbar {
    width: 6px;
  }
  .hud::-webkit-scrollbar-thumb {
    background: rgba(120, 170, 220, 0.3);
    border-radius: 3px;
  }

  .splash {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% 35%, #16243a, #0a0f16 75%);
    text-align: center;
    padding: 24px;
    pointer-events: none;
  }
  .splash h1 {
    margin: 0 0 6px;
    font-size: 34px;
    letter-spacing: 0.06em;
    background: linear-gradient(90deg, #38bdf8, #22d3ee);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .splash p {
    color: var(--muted);
    margin: 0 0 22px;
  }
  .splash ul {
    text-align: left;
    color: #b8c7d6;
    font-size: 13px;
    line-height: 1.9;
    max-width: 560px;
    padding-left: 18px;
  }

  .toast {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 18, 28, 0.92);
    border: 1px solid var(--accent);
    color: var(--text);
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    z-index: 20;
  }
</style>
