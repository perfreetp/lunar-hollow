import { sharedCss } from './styles.js';
import type { MeasureState } from '../map/RunwayApp.js';
import { MARKING_LABELS } from '../core/types.js';
import type { MarkingFeature } from '../core/types.js';

/**
 * <measure-panel>：标线间距测量。进入测量模式后依次点击两条标线。
 */
export class MeasurePanel extends HTMLElement {
  private root: ShadowRoot;
  private mode = false;
  private state: MeasureState = { first: null, second: null, result: null, crossGeo: null };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }
  connectedCallback(): void {
    this.render();
  }

  setMode(on: boolean): void {
    this.mode = on;
    this.render();
  }

  update(state: MeasureState): void {
    this.state = state;
    this.render();
  }

  private describe(f: MarkingFeature | null): string {
    if (!f) return '（待选择）';
    const seg = f.meta?.segment;
    const end = f.meta?.end;
    const pair = f.meta?.pair;
    const extras: string[] = [MARKING_LABELS[f.type]];
    if (seg !== undefined) extras.push(`#${seg}`);
    if (end !== undefined) extras.push(`${Number(end) === 0 ? '0' : '1'}号端`);
    if (pair !== undefined) extras.push(`第${Number(pair) + 1}组`);
    return extras.join(' · ');
  }

  private render(): void {
    const { first, second, result } = this.state;
    this.root.innerHTML = `
      <style>${sharedCss}</style>
      <div class="panel" style="padding:12px 14px">
        <p class="section-title">标线间距测量</p>
        <button id="btn-mode" class="${this.mode ? 'active' : ''}" style="width:100%;margin-bottom:10px">
          ${this.mode ? '测量模式：开（点击地图选线）' : '开启测量模式'}
        </button>
        <div style="font-size:12px;line-height:1.7">
          <div>第一条：<span class="tag">${this.describe(first)}</span></div>
          <div style="margin-top:4px">第二条：<span class="tag">${this.describe(second)}</span></div>
        </div>
        ${
          result
            ? `
          <div class="divider"></div>
          <div style="background:rgba(77,159,255,0.1);border:1px solid rgba(77,159,255,0.35);
                      border-radius:6px;padding:10px;text-align:center">
            <div style="color:var(--text-dim);font-size:11px;margin-bottom:2px">实际间距（边缘净距）</div>
            <div style="font-size:22px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums">
              ${result.distance.toFixed(2)} m
            </div>
            <div style="color:var(--text-dim);font-size:11px;margin-top:4px">
              含坡度三维距离 · 点 A 高程 ${result.pointA.z.toFixed(2)}m · 点 B 高程 ${result.pointB.z.toFixed(2)}m
            </div>
          </div>`
            : ''
        }
        <div class="divider"></div>
        <div style="display:flex;gap:8px">
          <button id="btn-reset" class="ghost" style="flex:1">清除选择</button>
        </div>
        <p style="color:var(--text-dim);font-size:11px;line-height:1.5;margin-bottom:0">
          提示：在测量模式下点击两条标线，自动读取最近边缘间距；再次点击已选标线可取消。
        </p>
      </div>`;

    this.root.getElementById('btn-mode')!.addEventListener('click', () => {
      this.dispatchEvent(
        new CustomEvent('measure-toggle', { detail: { on: !this.mode }, bubbles: true, composed: true })
      );
    });
    this.root.getElementById('btn-reset')!.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('measure-reset', { bubbles: true, composed: true }));
    });
  }
}

customElements.define('measure-panel', MeasurePanel);
