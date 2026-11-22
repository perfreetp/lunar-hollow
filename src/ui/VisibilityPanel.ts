import { sharedCss } from './styles.js';
import { ALL_VISIBLE, MARKING_LABELS, MARKING_TYPES, type MarkingType, type Visibility } from '../core/types.js';

/**
 * <visibility-panel>：五类标线单独开关
 */
export class VisibilityPanel extends HTMLElement {
  private root: ShadowRoot;
  private state: Visibility = { ...ALL_VISIBLE };

  constructor(state?: Visibility) {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    if (state) this.state = { ...state };
  }

  connectedCallback(): void {
    this.root.innerHTML = `
      <style>${sharedCss}</style>
      <div class="panel" style="padding:12px 14px">
        <p class="section-title">标线图层开关</p>
        ${MARKING_TYPES.map(
          (t) => `
          <label class="switch" style="margin-bottom:7px">
            <input type="checkbox" data-type="${t}" ${this.state[t] ? 'checked' : ''}>
            <span>${MARKING_LABELS[t]}</span>
          </label>`
        ).join('')}
        <div class="divider"></div>
        <div style="display:flex;gap:8px">
          <button id="btn-all" class="ghost" style="flex:1">全部开启</button>
          <button id="btn-none" class="ghost" style="flex:1">全部关闭</button>
        </div>
      </div>`;
    this.root.querySelectorAll('input[type=checkbox]').forEach((el) => {
      el.addEventListener('change', () => {
        const type = (el as HTMLInputElement).dataset.type as MarkingType;
        this.state[type] = (el as HTMLInputElement).checked;
        this.dispatchEvent(
          new CustomEvent('visibility-change', { detail: { ...this.state }, bubbles: true, composed: true })
        );
      });
    });
    this.root.getElementById('btn-all')!.addEventListener('click', () => this.setAll(true));
    this.root.getElementById('btn-none')!.addEventListener('click', () => this.setAll(false));
  }

  private setAll(v: boolean): void {
    for (const t of MARKING_TYPES) this.state[t] = v;
    this.root.querySelectorAll('input[type=checkbox]').forEach((el) => {
      (el as HTMLInputElement).checked = v;
    });
    this.dispatchEvent(
      new CustomEvent('visibility-change', { detail: { ...this.state }, bubbles: true, composed: true })
    );
  }

  update(state: Visibility): void {
    this.state = { ...state };
    this.root.querySelectorAll('input[type=checkbox]').forEach((el) => {
      const type = (el as HTMLInputElement).dataset.type as MarkingType;
      (el as HTMLInputElement).checked = this.state[type];
    });
  }
}

customElements.define('visibility-panel', VisibilityPanel);
