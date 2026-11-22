import * as maplibregl from 'maplibre-gl';
import { MarkingRenderer } from './map/MarkingRenderer.js';
import { runwayView } from './core/geo.js';

// MapLibre v6 的 worker 默认按 import.meta.url 推断，在部分打包/部署路径下会 404，
// 显式指向 public/ 中随应用分发的 worker
maplibregl.setWorkerUrl(new URL('./maplibre-gl-worker.mjs', document.baseURI).href);

// 全局错误浮层：任何未捕获异常都显示在界面上，避免静默白屏
window.addEventListener('error', (e) => {
  let host = document.getElementById('global-error');
  if (!host) {
    host = document.createElement('div');
    host.id = 'global-error';
    host.style.cssText =
      'position:fixed;left:12px;bottom:48px;z-index:9999;max-width:60vw;max-height:40vh;overflow:auto;' +
      'background:rgba(120,20,20,0.95);color:#fff;padding:10px 14px;border-radius:8px;' +
      'font:12px monospace;white-space:pre-wrap;';
    document.body.appendChild(host);
  }
  host.textContent = `${e.message}\n${e.error?.stack ?? ''}`;
});
import { RunwayApp } from './map/RunwayApp.js';
import { ALL_VISIBLE, DEFAULT_BUILD_OPTIONS, type MarkingExportFile } from './core/types.js';
import { demoRunways, stressRunways } from './core/scenarios.js';
import './ui/ToolBar.js';
import './ui/VisibilityPanel.js';
import './ui/RunwayEditor.js';
import './ui/MarkingParamsPanel.js';
import './ui/MeasurePanel.js';
import './ui/StatusBar.js';
import type { RunwayEditor } from './ui/RunwayEditor.js';
import type { VisibilityPanel } from './ui/VisibilityPanel.js';
import type { MarkingParamsPanel } from './ui/MarkingParamsPanel.js';
import type { MeasurePanel } from './ui/MeasurePanel.js';
import type { StatusBar, StatusInfo } from './ui/StatusBar.js';

/**
 * <runway-app>：应用根组件，负责装配渲染器、控制器与各面板，
 * 以及面板自定义事件 <-> RunwayApp 的双向绑定。
 */
export class RunwayAppElement extends HTMLElement {
  private root!: ShadowRoot;
  private renderer!: MarkingRenderer;
  private app!: RunwayApp;
  private statusBar!: StatusBar;
  private fps = 0;
  private frameCount = 0;
  private lastFpsTime = performance.now();

  connectedCallback(): void {
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
      <style>
        :host { display:block; width:100%; height:100vh; position:relative; overflow:hidden; }
        #map { position:absolute; inset:0; }
        .maplibregl-ctrl-attrib { font-size:10px; }
        .left-panel, .right-panel {
          position:absolute; top:70px; z-index:5; width:288px;
          max-height: calc(100vh - 130px); overflow-y:auto;
          display:flex; flex-direction:column; gap:10px;
        }
        .left-panel { left:12px; }
        .right-panel { right:12px; }
        .left-panel::-webkit-scrollbar, .right-panel::-webkit-scrollbar { width:6px; }
        .left-panel::-webkit-scrollbar-thumb, .right-panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2); border-radius:3px;
        }
        tool-bar { position:absolute; top:10px; left:12px; right:12px; z-index:6; }
        status-bar { position:absolute; bottom:10px; left:12px; right:12px; z-index:6; }
        .hint {
          position:absolute; z-index:5; left:50%; top:76px; transform:translateX(-50%);
          background:rgba(18,22,28,0.85); border:1px solid rgba(255,255,255,0.12);
          color:#9aa6b2; font-size:11.5px; padding:5px 14px; border-radius:99px;
          pointer-events:none; transition:opacity .4s;
        }
        @media (max-width: 900px) {
          .left-panel, .right-panel { width: 240px; }
        }
      </style>
      <div id="map"></div>
      <tool-bar></tool-bar>
      <div class="left-panel">
        <runway-editor></runway-editor>
        <visibility-panel></visibility-panel>
      </div>
      <div class="right-panel">
        <marking-params-panel></marking-params-panel>
        <measure-panel></measure-panel>
      </div>
      <div class="hint" id="hint">滚轮缩放 · 拖拽平移 · 右键旋转/倾斜 · 开启测量后点击两条标线读间距</div>
      <status-bar></status-bar>`;

    const mapEl = this.root.getElementById('map')!;
    const demo = demoRunways()[0];
    const view = runwayView(demo);
    this.renderer = new MarkingRenderer(
      {
        container: mapEl as HTMLElement,
        center: view.center,
        zoom: view.zoom,
        bearing: view.bearing,
        pitch: 50
      },
      ALL_VISIBLE,
      [DEFAULT_BUILD_OPTIONS.lodFullBelow, DEFAULT_BUILD_OPTIONS.lodSimplifyBelow]
    );
    this.app = new RunwayApp(this.renderer);
    this.statusBar = this.root.querySelector('status-bar')!;

    this.bindPanels();
    this.bindMapEvents();
    this.startFpsLoop();

    // 默认载入示例（兼容地图已 load 与未 load 两种时序）
    const loadDemo = () => {
      if (this.app.sets.length > 0) return;
      for (const rw of demoRunways()) this.app.addRunway(rw);
      this.syncRunwayEditor();
      setTimeout(() => {
        const hint = this.root.getElementById('hint');
        if (hint) hint.style.opacity = '0';
      }, 7000);
    };
    if (this.renderer.isReady) loadDemo();
    else this.renderer.map.once('load', loadDemo);
  }

  private bindPanels(): void {
    // 工具条
    this.root.querySelector('tool-bar')!.addEventListener('load-demo', () => {
      for (const s of [...this.app.sets]) this.app.removeRunway(s.runway.id);
      for (const rw of demoRunways()) this.app.addRunway(rw);
      this.syncRunwayEditor();
      this.flyToRunway();
    });
    this.root.querySelector('tool-bar')!.addEventListener('load-stress', () => {
      for (const s of [...this.app.sets]) this.app.removeRunway(s.runway.id);
      const runways = stressRunways();
      for (const rw of runways) this.app.addRunway(rw);
      this.syncRunwayEditor();
      // 聚焦局部网格（中距简化级），视野内仅少量跑道，兼顾细节与流畅
      const target = runways[Math.floor(runways.length / 2)];
      this.renderer.map.flyTo({
        center: [target.origin.lng, target.origin.lat],
        zoom: 13.4,
        essential: true
      });
    });
    this.root.querySelector('tool-bar')!.addEventListener('clear-all', () => {
      for (const s of [...this.app.sets]) this.app.removeRunway(s.runway.id);
      this.syncRunwayEditor();
    });
    this.root.querySelector('tool-bar')!.addEventListener('export-file', () => this.exportFile());
    this.root.querySelector('tool-bar')!.addEventListener('import-file', (e) => {
      const file = (e as CustomEvent).detail.file as File;
      this.importFile(file);
    });

    // 跑道编辑
    const editor = this.root.querySelector<RunwayEditor>('runway-editor')!;
    editor.addEventListener('runway-add', () => {
      const id = `RWY-${this.app.runwayCount + 1}`;
      const last = this.app.sets.at(-1)?.runway;
      this.app.addRunway({
        id,
        origin: last
          ? { lng: last.origin.lng + 0.006, lat: last.origin.lat - 0.004 }
          : { lng: 116.4, lat: 39.5 },
        length: 3000,
        width: 45,
        bearing: 90,
        slopePct: 0,
        suffix0: '',
        suffix1: ''
      });
      this.syncRunwayEditor(id);
    });
    editor.addEventListener('runway-remove', (e) => {
      this.app.removeRunway((e as CustomEvent).detail.id);
      this.syncRunwayEditor();
    });
    editor.addEventListener('runway-patch', (e) => {
      const { id, patch } = (e as CustomEvent).detail;
      this.app.updateRunway(id, patch);
      this.syncRunwayEditor(patch.id ?? id);
    });

    // 显隐
    this.root
      .querySelector<VisibilityPanel>('visibility-panel')!
      .addEventListener('visibility-change', (e) => {
        this.app.setVisibility((e as CustomEvent).detail);
      });

    // 标线参数（input 事件高频触发，渲染器内部合并刷新）
    this.root
      .querySelector<MarkingParamsPanel>('marking-params-panel')!
      .addEventListener('options-change', (e) => {
        this.app.updateOptions((e as CustomEvent).detail.patch);
        this.updateStatus();
      });

    // 测量
    const measurePanel = this.root.querySelector<MeasurePanel>('measure-panel')!;
    measurePanel.addEventListener('measure-toggle', (e) => {
      const on = (e as CustomEvent).detail.on as boolean;
      this.app.setMeasureMode(on);
      measurePanel.setMode(on);
      measurePanel.update(this.app.measure);
    });
    measurePanel.addEventListener('measure-reset', () => {
      this.app.resetMeasure();
      measurePanel.update(this.app.measure);
    });
    this.app.onChange((event) => {
      if (event === 'measure') measurePanel.update(this.app.measure);
      this.updateStatus();
    });
  }

  private bindMapEvents(): void {
    const map = this.renderer.map;
    map.on('zoom', () => this.updateStatus());
    map.on('move', () => this.updateStatus());
    map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      this.statusBar.update({ cursor: { lng: e.lngLat.lng, lat: e.lngLat.lat } });
    });
    map.on('lodchange' as never, () => this.updateStatus());
  }

  private syncRunwayEditor(selectedId?: string): void {
    const editor = this.root.querySelector<RunwayEditor>('runway-editor')!;
    editor.setRunways(this.app.sets.map((s) => s.runway), selectedId);
    this.updateStatus();
  }

  private flyToRunway(): void {
    const rw = this.app.sets[0]?.runway;
    if (!rw) return;
    const view = runwayView(rw);
    this.renderer.map.flyTo({
      center: view.center,
      zoom: view.zoom,
      bearing: view.bearing,
      pitch: 50,
      essential: true
    });
  }

  private exportFile(): void {
    const data = this.app.exportFile();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runway-markings-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async importFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as MarkingExportFile;
      this.app.loadFile(data);
      this.syncRunwayEditor();
      this.root.querySelector<VisibilityPanel>('visibility-panel')!.update(this.app.visibility);
      this.root.querySelector<MarkingParamsPanel>('marking-params-panel')!.update(this.app.options);
      const first = data.runways[0];
      if (first) {
        this.renderer.map.flyTo({ center: [first.origin.lng, first.origin.lat], zoom: 15, essential: true });
      }
    } catch (err) {
      console.error('导入失败', err);
      alert(`导入失败：${(err as Error).message}`);
    }
  }

  private startFpsLoop(): void {
    const tick = () => {
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
        this.frameCount = 0;
        this.lastFpsTime = now;
        this.updateStatus();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private updateStatus(): void {
    if (!this.renderer.isReady) return;
    const info: Partial<StatusInfo> = {
      zoom: this.renderer.map.getZoom(),
      lod: this.renderer.currentLOD,
      featureCount: this.app.totalFeatureCount,
      runwayCount: this.app.runwayCount,
      fps: this.fps
    };
    this.statusBar.update(info);
  }

  disconnectedCallback(): void {
    this.renderer.remove();
  }
}

customElements.define('runway-app', RunwayAppElement);
