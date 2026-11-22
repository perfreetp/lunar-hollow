import { sharedCss } from './styles.js';
import { LOD_LABELS, type LODLevel } from '../core/types.js';

export interface StatusInfo {
  zoom: number;
  lod: LODLevel;
  featureCount: number;
  runwayCount: number;
  fps: number;
  cursor: { lng: number; lat: number } | null;
}

/**
 * <status-bar>：缩放级别 / LOD 状态 / 要素总数 / FPS / 鼠标坐标
 */
export class StatusBar extends HTMLElement {
  private root: ShadowRoot;
  private info: StatusInfo = {
    zoom: 0,
    lod: 0,
    featureCount: 0,
    runwayCount: 0,
    fps: 0,
    cursor: null
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
  }

  update(patch: Partial<StatusInfo>): void {
    this.info = { ...this.info, ...patch };
    this.render();
  }

  private render(): void {
    const i = this.info;
    this.root.innerHTML = `
      <style>${sharedCss}
        :host { display: block; }
        .bar {
          display: flex; gap: 18px; align-items: center;
          padding: 6px 14px; font-size: 11.5px; color: var(--text-dim);
          font-variant-numeric: tabular-nums; flex-wrap: wrap;
        }
        b { color: var(--text); font-weight: 600; }
        .lod0 { color: #7ee787; }
        .lod1 { color: var(--warn); }
        .lod2 { color: var(--danger); }
      </style>
      <div class="bar panel">
        <span>缩放 <b>${typeof i.zoom === 'number' ? i.zoom.toFixed(2) : '—'}</b></span>
        <span>LOD <b class="lod${i.lod}">${LOD_LABELS[i.lod] ?? '—'}</b></span>
        <span>跑道 <b>${i.runwayCount}</b></span>
        <span>标线要素 <b>${(i.featureCount ?? 0).toLocaleString()}</b></span>
        <span>FPS <b class="${i.fps > 0 && i.fps < 24 ? 'lod2' : 'lod0'}">${i.fps ? i.fps : '—'}</b></span>
        <span style="margin-left:auto">${
          i.cursor ? `经度 ${i.cursor.lng.toFixed(6)} · 纬度 ${i.cursor.lat.toFixed(6)}` : '移动鼠标查看坐标'
        }</span>
      </div>`;
  }
}

customElements.define('status-bar', StatusBar);
