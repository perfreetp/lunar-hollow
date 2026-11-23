import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { WallEngine } from './WallEngine';
import type { FrameStats } from './types';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import StatsBar from './components/StatsBar';

export default function App() {
  let viewport: HTMLDivElement | undefined;
  const [stats, setStats] = createSignal<FrameStats | null>(null);
  const [isolatedId, setIsolatedId] = createSignal<number | null>(null);
  let engine: WallEngine | null = null;

  onMount(() => {
    if (!viewport) return;
    engine = new WallEngine(viewport, (s) => setStats(s));
  });

  onCleanup(() => engine?.dispose());

  function handleIsolate(id: number | null) {
    setIsolatedId(id);
    engine?.setIsolated(id);
  }

  return (
    <div class="app-shell">
      <Toolbar />
      <div class="main-area">
        <main class="viewport" ref={viewport}>
          {/* 屏幕中心十字线：视线射线锚点 */}
          <div class="crosshair" aria-hidden="true">
            <span class="ch h" />
            <span class="ch v" />
          </div>
          <div class="viewport-hint">左键旋转 · 右键平移 · 滚轮缩放 · 中心十字线为视线方向</div>
          <Show when={(stats()?.clippedLayers ?? 0) > 0}>
            <div class="clip-warning">
              ⚠ {stats()!.clippedLayers} 层被光学/硬裁剪：深层透射已低于分辨阈值或超出渲染上限
            </div>
          </Show>
        </main>
        <LayerPanel isolatedId={isolatedId()} onIsolate={handleIsolate} />
      </div>
      <StatsBar stats={stats()} />
    </div>
  );
}
