<script>
  import { onMount, onDestroy } from 'svelte';
  import { store, setPlaying, setProgress, setWindTurns, resetPlayback } from './lib/store.js';
  import { GearScene } from './lib/GearScene.js';
  import GearLibrary from './components/GearLibrary.svelte';
  import TransmissionPanel from './components/TransmissionPanel.svelte';
  import PlaybackBar from './components/PlaybackBar.svelte';
  import ExportPanel from './components/ExportPanel.svelte';
  import IssueList from './components/IssueList.svelte';
  import {
    addGear, moveGear, selectGear, removeGear,
    setTeeth, renameGear, setDriver, serializeConfig, importConfig
  } from './lib/store.js';

  // 调试钩子：?progress=0.5 预置播放进度，用于无交互截图验证运动中啮合；
  // ?capture=1 时把 WebGL 画布帧通过 title 暴露（需 preserveDrawingBuffer）
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search);
    const pv = Number(params.get('progress'));
    if (pv > 0 && pv <= 1) setProgress(pv);
  }

  let viewportEl;
  let scene;
  let state;
  let rafId;
  let lastTs = 0;

  const unsub = store.subscribe((s) => {
    state = s;
    scene?.sync(s);
  });

  onMount(() => {
    scene = new GearScene(viewportEl, {
      onSelect: (id) => selectGear(id),
      onMove: (id, gx, gy) => moveGear(id, gx, gy),
      onDropLibrary: (teeth, gx, gy) => {
        const id = addGear(teeth, gx, gy);
        selectGear(id);
      }
    });
    scene.sync(state);
    if (new URLSearchParams(location.search).has('capture')) {
      window.__scene = scene;
      window.__appStore = store; // 同一 store 实例，供 CDP 诊断/自动化
      window.__storeActions = {
        addGear, moveGear, removeGear, selectGear, setTeeth,
        renameGear, setDriver, setPlaying, setProgress,
        setWindTurns, resetPlayback,
        serializeConfig: () => serializeConfig(),
        importConfig: (text) => importConfig(text)
      };
    }

    // 播放时钟：每帧推进 progress；结构变更在事件中同步重算，
    // 因此这里读到的 snapshot 永远是最新的（下一帧前完成全链重算）
    const tick = (ts) => {
      const s = store;
      const cur = $store;
      if (cur.playing) {
        const dt = lastTs ? (ts - lastTs) / 1000 : 0;
        // windTurns 圈在约 windTurns*1.2 秒内走完（速率可调）
        const duration = Math.max(2, cur.windTurns * 1.2) / cur.speed;
        let p = cur.progress + dt / duration;
        if (p >= 1) { p = 1; setPlaying(false); }
        setProgress(p);
      }
      lastTs = ts;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
    unsub();
    scene?.dispose();
  });

  function onKey(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ($store.selectedId) removeGear($store.selectedId);
    }
  }

  $: selected = $store.gears.find((g) => g.id === $store.selectedId) || null;
</script>

<svelte:window on:keydown={onKey} />

<div class="app">
  <header>
    <div class="brand">⚙ 发条齿轮预演工作室 <span class="sub">Clockwork Studio</span></div>
  </header>

  <div class="layout">
    <aside class="left">
      <GearLibrary />
      <TransmissionPanel
        {selected}
        onTeeth={(t) => selected && setTeeth(selected.id, t)}
        onRename={(v) => selected && renameGear(selected.id, v)}
        onSetDriver={(id) => setDriver(id)}
        onRemove={(id) => removeGear(id)}
      />
    </aside>

    <main class="center">
      <div class="viewport" bind:this={viewportEl}></div>
      <IssueList />
      <PlaybackBar />
    </main>

    <aside class="right">
      <ExportPanel />
    </aside>
  </div>
</div>

<style>
  .app { display: flex; flex-direction: column; height: 100vh; }
  header {
    height: 46px; flex: none;
    display: flex; align-items: center; padding: 0 16px;
    background: linear-gradient(90deg, #1a2331, #222d3e);
    border-bottom: 1px solid var(--line);
  }
  .brand { font-weight: 700; letter-spacing: 0.04em; }
  .sub { color: var(--muted); font-weight: 400; font-size: 11px; margin-left: 8px; letter-spacing: 0.12em; }
  .layout { flex: 1; display: grid; grid-template-columns: 280px 1fr 300px; min-height: 0; }
  .left, .right {
    overflow-y: auto; padding: 12px;
    background: var(--panel);
    display: flex; flex-direction: column; gap: 14px;
  }
  .left { border-right: 1px solid var(--line); }
  .right { border-left: 1px solid var(--line); }
  .center { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
  .viewport { flex: 1; min-height: 0; position: relative; }
  .viewport :global(canvas) { display: block; }
</style>
