import { sharedCss } from './styles.js';
import type { RunwayConfig } from '../core/types.js';

/**
 * <runway-editor>：跑道列表与几何参数编辑。
 * 方位/坡度/尺寸任一变化都触发整体重建（号码随方位重排、标线沿坡面）。
 */
export class RunwayEditor extends HTMLElement {
  private root: ShadowRoot;
  private runways: RunwayConfig[] = [];
  private selectedId: string | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  setRunways(runways: RunwayConfig[], selectedId?: string): void {
    this.runways = runways;
    if (selectedId !== undefined) this.selectedId = selectedId;
    // 当前选中已不存在时回退到第一条，避免正文空白
    if ((!this.selectedId || !runways.some((r) => r.id === this.selectedId)) && runways.length) {
      this.selectedId = runways[0].id;
    }
    if (!runways.length) this.selectedId = null;
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  private current(): RunwayConfig | undefined {
    return this.runways.find((r) => r.id === this.selectedId);
  }

  private render(): void {
    const rw = this.current();
    this.root.innerHTML = `
      <style>${sharedCss}</style>
      <div class="panel" style="padding:12px 14px">
        <p class="section-title">跑道管理</p>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <select id="rw-select" style="flex:1">
            ${this.runways
              .map(
                (r) =>
                  `<option value="${r.id}" ${r.id === this.selectedId ? 'selected' : ''}>${r.id}（${r.length}m）</option>`
              )
              .join('')}
          </select>
          <button id="btn-add" title="新增跑道">＋</button>
          <button id="btn-remove" class="danger" title="删除当前跑道">✕</button>
        </div>
        ${
          rw
            ? `
        <div class="row">
          <label>跑道 ID</label>
          <input type="text" data-key="id" value="${rw.id}">
        </div>
        <div class="row">
          <label>起点经度</label>
          <input type="number" data-key="lng" step="0.0001" value="${rw.origin.lng}">
        </div>
        <div class="row">
          <label>起点纬度</label>
          <input type="number" data-key="lat" step="0.0001" value="${rw.origin.lat}">
        </div>
        <div class="row">
          <label>真方位角</label>
          <input type="number" data-key="bearing" min="0" max="360" step="0.5" value="${rw.bearing}">
          <span class="val" style="flex:0 0 22px">°</span>
        </div>
        <div class="row">
          <label>长度</label>
          <input type="number" data-key="length" min="100" max="6000" step="10" value="${rw.length}">
          <span class="val" style="flex:0 0 22px">m</span>
        </div>
        <div class="row">
          <label>宽度</label>
          <input type="number" data-key="width" min="8" max="80" step="0.5" value="${rw.width}">
          <span class="val" style="flex:0 0 22px">m</span>
        </div>
        <div class="row">
          <label>纵向坡度</label>
          <input type="number" data-key="slopePct" min="-5" max="5" step="0.1" value="${rw.slopePct}">
          <span class="val" style="flex:0 0 22px">%</span>
        </div>
        <div class="row">
          <label>0 号端后缀</label>
          <select data-key="suffix0">
            ${suffixOptions(rw.suffix0 ?? '')}
          </select>
        </div>
        <div class="row">
          <label>1 号端后缀</label>
          <select data-key="suffix1">
            ${suffixOptions(rw.suffix1 ?? '')}
          </select>
        </div>`
            : '<p style="color:var(--text-dim)">暂无跑道，点击 ＋ 新增</p>'
        }
      </div>`;

    this.root.getElementById('rw-select')?.addEventListener('change', (e) => {
      this.selectedId = (e.target as HTMLSelectElement).value;
      this.render();
    });
    this.root.getElementById('btn-add')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('runway-add', { bubbles: true, composed: true }));
    });
    this.root.getElementById('btn-remove')?.addEventListener('click', () => {
      if (this.selectedId) {
        this.dispatchEvent(
          new CustomEvent('runway-remove', { detail: { id: this.selectedId }, bubbles: true, composed: true })
        );
      }
    });
    if (!rw) return;
    this.root.querySelectorAll<HTMLInputElement>('input[data-key], select[data-key]').forEach((el) => {
      el.addEventListener('change', () => {
        const key = el.dataset.key!;
        const raw = el.value;
        if (key === 'id') {
          this.dispatchEvent(
            new CustomEvent('runway-patch', {
              detail: { id: rw.id, patch: { id: raw } },
              bubbles: true,
              composed: true
            })
          );
          this.selectedId = raw;
          return;
        }
        const numKeys = ['lng', 'lat', 'bearing', 'length', 'width', 'slopePct'];
        if (numKeys.includes(key)) {
          const v = parseFloat(raw);
          if (Number.isNaN(v)) return;
          const patch: Partial<RunwayConfig> =
            key === 'lng'
              ? { origin: { ...rw.origin, lng: v } }
              : key === 'lat'
                ? { origin: { ...rw.origin, lat: v } }
                : ({ [key]: v } as Partial<RunwayConfig>);
          this.dispatchEvent(
            new CustomEvent('runway-patch', { detail: { id: rw.id, patch }, bubbles: true, composed: true })
          );
        } else {
          this.dispatchEvent(
            new CustomEvent('runway-patch', {
              detail: { id: rw.id, patch: { [key]: raw || undefined } },
              bubbles: true,
              composed: true
            })
          );
        }
      });
    });
  }
}

function suffixOptions(current: string): string {
  const opts: Array<[string, string]> = [
    ['', '无'],
    ['L', 'L（左）'],
    ['R', 'R（右）'],
    ['C', 'C（中）'],
    ['W', 'W（水上）']
  ];
  return opts
    .map(([v, label]) => `<option value="${v}" ${v === current ? 'selected' : ''}>${label}</option>`)
    .join('');
}

customElements.define('runway-editor', RunwayEditor);
